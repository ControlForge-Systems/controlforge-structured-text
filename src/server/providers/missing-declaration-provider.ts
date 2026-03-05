/**
 * Missing Declaration Provider for Structured Text
 *
 * Provides code actions for "Undefined identifier 'X'" diagnostics:
 *  - Infers data type from usage context
 *  - Inserts a VAR declaration into the enclosing POU's first local VAR block
 *  - Creates a VAR block if none exists
 *  - Batch fix: declare all undefined variables in the file at once
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    CodeAction,
    CodeActionKind,
    Diagnostic,
    Position,
    Range,
    TextEdit,
    WorkspaceEdit
} from 'vscode-languageserver';
import { STSymbolExtended, STSymbolKind } from '../../shared/types';

// ─── Type inference ──────────────────────────────────────────────────────────

/**
 * Infer the IEC 61131-3 data type for an undefined variable from its usage context.
 *
 * Strategy (first match wins):
 *  1. Assignment RHS literal patterns (TRUE/FALSE → BOOL, 0/42 → INT, 0.0 → REAL, T#/TIME# → TIME, 'str' → STRING)
 *  2. FB call pattern: varName(IN :=  or  varName(PT :=  → TON
 *  3. Member access: varName.Q or varName.ET → TON;  varName.CV → CTU
 *  4. Comparison / logical context → BOOL
 *  5. Default → INT
 */
export function inferTypeFromContext(varName: string, lines: string[], usageLine: number): string {
    const name = varName; // keep original casing for regex matching (case-insensitive)

    // Check the usage line and a few lines around it
    const start = Math.max(0, usageLine - 2);
    const end = Math.min(lines.length - 1, usageLine + 2);

    for (let i = start; i <= end; i++) {
        const line = lines[i];
        const upper = line.toUpperCase();

        // ── Assignment RHS: name := <value> ─────────────────────────────
        const assignRegex = new RegExp(
            `\\b${escapeRegex(name)}\\s*:=\\s*([^;\\n]+)`,
            'i'
        );
        const assignMatch = line.match(assignRegex);
        if (assignMatch) {
            const rhs = assignMatch[1].trim();
            const rhsUpper = rhs.toUpperCase();

            if (/^(TRUE|FALSE)$/i.test(rhs)) return 'BOOL';
            if (/^-?\d+\.\d+/.test(rhs)) return 'REAL';
            if (/^-?\d+$/.test(rhs)) return 'INT';
            if (/^(T#|TIME#|LT#|LTIME#)/i.test(rhs)) return 'TIME';
            if (/^'/.test(rhs)) return 'STRING';
            if (/^"/.test(rhs)) return 'STRING';
            if (/^(NOT\s+|NOT$)/i.test(rhsUpper)) return 'BOOL';
        }

        // ── Assigned FROM name: <other> := name ─────────────────────────
        // If the other side of an assignment is a bool literal context, skip —
        // focus on name being on the RHS means we can't easily infer from that.

        // ── Boolean context: name used in IF/WHILE condition or logic expr ──
        // "IF name THEN" / "WHILE name DO" / "name AND ..." / "name OR ..."
        const boolCtxRegex = new RegExp(
            `(IF|ELSIF|WHILE)\\s+${escapeRegex(name)}\\s+(THEN|DO|AND|OR|\\))|` +
            `\\b${escapeRegex(name)}\\s+(AND|OR|XOR)\\b|` +
            `(AND|OR|XOR)\\s+${escapeRegex(name)}\\b`,
            'i'
        );
        if (boolCtxRegex.test(line)) return 'BOOL';

        // ── Comparison producing BOOL: name = ... / name <> ... etc ──────
        const cmpRegex = new RegExp(
            `\\b${escapeRegex(name)}\\s*(=|<>|<=|>=|<(?!>)|>(?!<))`,
            'i'
        );
        if (cmpRegex.test(line)) return 'BOOL';

        // ── FB call: name( IN := ... or PT := ... → TON ──────────────────
        const fbCallRegex = new RegExp(
            `\\b${escapeRegex(name)}\\s*\\(`,
            'i'
        );
        if (fbCallRegex.test(line)) {
            // Look at named params on this and next few lines
            const callContext = lines.slice(i, Math.min(lines.length, i + 5)).join(' ').toUpperCase();
            if (/\bPT\s*:=/.test(callContext) || /\bIN\s*:=/.test(callContext) && /\bET\b/.test(callContext)) {
                return 'TON';
            }
            if (/\bCU\s*:=/.test(callContext) || /\bCD\s*:=/.test(callContext)) {
                return callContext.includes('CD') ? 'CTD' : 'CTU';
            }
            if (/\bCLK\s*:=/.test(callContext)) return 'R_TRIG';
        }

        // ── Member access: name.Q / name.ET → TON; name.CV → CTU ─────────
        const memberRegex = new RegExp(
            `\\b${escapeRegex(name)}\\.(\\w+)`,
            'i'
        );
        const memberMatch = line.match(memberRegex);
        if (memberMatch) {
            const member = memberMatch[1].toUpperCase();
            if (member === 'Q' || member === 'ET' || member === 'IN' || member === 'PT') return 'TON';
            if (member === 'CV' || member === 'QU' || member === 'QD') return 'CTU';
            if (member === 'CLK') return 'R_TRIG';
        }
    }

    return 'INT';
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── VAR block insertion ─────────────────────────────────────────────────────

interface InsertionPoint {
    /** 0-based line to insert AFTER (i.e. insert at line+1) */
    insertAfterLine: number;
    /** Indentation string for the declaration line */
    indent: string;
    /** Whether a new VAR...END_VAR wrapper must be created */
    needsNewBlock: boolean;
    /** Whether file is global (no enclosing POU) */
    isGlobal: boolean;
}

/**
 * Locate where to insert a new variable declaration.
 *
 * Priority:
 *  1. Last line of first `VAR` (local) block inside the enclosing POU
 *  2. If no VAR block: insert a new one just before the body (after all VAR_INPUT/OUTPUT/etc blocks)
 *  3. If outside any POU: use/create a VAR_GLOBAL block at top of file
 */
export function findInsertionPoint(
    lines: string[],
    usageLine: number,
    symbols: STSymbolExtended[]
): InsertionPoint {
    // Find enclosing POU
    const pou = findEnclosingPou(lines, usageLine, symbols);

    if (!pou) {
        return findGlobalInsertionPoint(lines);
    }

    return findLocalInsertionPoint(lines, pou.startLine, pou.endLine);
}

interface PouBounds {
    startLine: number;
    endLine: number;
    name: string;
}

function findEnclosingPou(
    lines: string[],
    usageLine: number,
    symbols: STSymbolExtended[]
): PouBounds | null {
    const pouKinds = new Set([STSymbolKind.Program, STSymbolKind.Function, STSymbolKind.FunctionBlock]);
    const pous = symbols.filter(s => pouKinds.has(s.kind));

    for (const pou of pous) {
        const startLine = pou.location.range.start.line;
        // Find end line by scanning for END_PROGRAM/END_FUNCTION/END_FUNCTION_BLOCK
        const endKw = pou.kind === STSymbolKind.FunctionBlock
            ? 'END_FUNCTION_BLOCK'
            : pou.kind === STSymbolKind.Function
                ? 'END_FUNCTION'
                : 'END_PROGRAM';

        let depth = 1;
        let endLine = lines.length - 1;
        const openKw = pou.kind === STSymbolKind.FunctionBlock
            ? 'FUNCTION_BLOCK'
            : pou.kind === STSymbolKind.Function
                ? 'FUNCTION'
                : 'PROGRAM';

        for (let i = startLine + 1; i < lines.length; i++) {
            const trimmed = lines[i].trim().toUpperCase();
            if (!trimmed) continue;
            if (new RegExp(`^${openKw}\\b`).test(trimmed)) depth++;
            else if (trimmed.startsWith(endKw)) {
                depth--;
                if (depth === 0) { endLine = i; break; }
            }
        }

        if (usageLine > startLine && usageLine < endLine) {
            return { startLine, endLine, name: pou.name };
        }
    }

    return null;
}

function findLocalInsertionPoint(
    lines: string[],
    pouStart: number,
    pouEnd: number
): InsertionPoint {
    // Find first plain VAR block (not VAR_INPUT, VAR_OUTPUT etc.)
    const varRegex = /^\s*VAR\s*(CONSTANT|RETAIN|PERSISTENT|NON_RETAIN)?\s*$/i;
    const endVarRegex = /^\s*END_VAR\b/i;

    let varStart = -1;
    let varEnd = -1;

    for (let i = pouStart + 1; i < pouEnd; i++) {
        if (varRegex.test(lines[i])) {
            varStart = i;
            // Find END_VAR
            for (let j = i + 1; j < pouEnd; j++) {
                if (endVarRegex.test(lines[j])) {
                    varEnd = j;
                    break;
                }
            }
            break;
        }
    }

    if (varStart !== -1 && varEnd !== -1) {
        // Insert before END_VAR
        const endVarLine = lines[varEnd];
        const indentMatch = endVarLine.match(/^(\s*)/);
        const blockIndent = indentMatch ? indentMatch[1] : '';
        return {
            insertAfterLine: varEnd - 1,
            indent: blockIndent + '    ',
            needsNewBlock: false,
            isGlobal: false
        };
    }

    // No plain VAR block — find where to insert one (after last VAR_* block)
    let lastVarBlockEnd = pouStart;
    let anyVarStart = -1;
    let anyVarEnd = -1;

    for (let i = pouStart + 1; i < pouEnd; i++) {
        if (/^\s*VAR\b/i.test(lines[i])) {
            anyVarStart = i;
            anyVarEnd = i;
            for (let j = i + 1; j < pouEnd; j++) {
                if (endVarRegex.test(lines[j])) {
                    anyVarEnd = j;
                    break;
                }
            }
            lastVarBlockEnd = anyVarEnd;
        }
    }

    // Use POU's indentation for new block
    const pouLine = lines[pouStart];
    const pouIndentMatch = pouLine.match(/^(\s*)/);
    const pouIndent = pouIndentMatch ? pouIndentMatch[1] : '';

    return {
        insertAfterLine: lastVarBlockEnd,
        indent: pouIndent + '    ',
        needsNewBlock: true,
        isGlobal: false
    };
}

function findGlobalInsertionPoint(lines: string[]): InsertionPoint {
    const varGlobalRegex = /^\s*VAR_GLOBAL\b/i;
    const endVarRegex = /^\s*END_VAR\b/i;

    for (let i = 0; i < lines.length; i++) {
        if (varGlobalRegex.test(lines[i])) {
            for (let j = i + 1; j < lines.length; j++) {
                if (endVarRegex.test(lines[j])) {
                    return {
                        insertAfterLine: j - 1,
                        indent: '    ',
                        needsNewBlock: false,
                        isGlobal: true
                    };
                }
            }
        }
    }

    // No VAR_GLOBAL — insert at top of file
    return {
        insertAfterLine: -1,
        indent: '    ',
        needsNewBlock: true,
        isGlobal: true
    };
}

// ─── Code action builders ────────────────────────────────────────────────────

/**
 * Build a single "Declare variable 'X' as TYPE" code action for one diagnostic.
 */
export function provideMissingDeclarationAction(
    document: TextDocument,
    diagnostic: Diagnostic,
    symbols: STSymbolExtended[]
): CodeAction | null {
    const match = diagnostic.message.match(/^Undefined identifier '(\w+)'$/);
    if (!match) return null;
    const varName = match[1];

    const lines = document.getText().split('\n');
    const usageLine = diagnostic.range.start.line;
    const inferredType = inferTypeFromContext(varName, lines, usageLine);
    const insertion = findInsertionPoint(lines, usageLine, symbols);

    const edit = buildInsertEdit(document.uri, lines, varName, inferredType, insertion);
    if (!edit) return null;

    return {
        title: `Declare '${varName}' as ${inferredType}`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

/**
 * Build a batch "Declare all undefined variables" code action for multiple diagnostics.
 * Only produced when there are 2+ undefined-identifier diagnostics.
 */
export function provideAddAllMissingDeclarationsAction(
    document: TextDocument,
    diagnostics: Diagnostic[],
    symbols: STSymbolExtended[]
): CodeAction | null {
    const undefinedDiags = diagnostics.filter(d =>
        d.source === 'ControlForge ST' &&
        d.message.startsWith("Undefined identifier '")
    );

    if (undefinedDiags.length < 2) return null;

    const lines = document.getText().split('\n');
    const allEdits: TextEdit[] = [];
    const seen = new Set<string>();

    // Group by insertion point (key = insertAfterLine) so we can merge edits
    // Process in reverse order of insertion line so earlier line insertions don't shift positions
    const groups = new Map<number, { insertion: InsertionPoint; declarations: string[] }>();

    for (const diag of undefinedDiags) {
        const m = diag.message.match(/^Undefined identifier '(\w+)'$/);
        if (!m) continue;
        const varName = m[1];
        const key = varName.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const usageLine = diag.range.start.line;
        const inferredType = inferTypeFromContext(varName, lines, usageLine);
        const insertion = findInsertionPoint(lines, usageLine, symbols);

        const groupKey = insertion.insertAfterLine;
        if (!groups.has(groupKey)) {
            groups.set(groupKey, { insertion, declarations: [] });
        }
        groups.get(groupKey)!.declarations.push(`${varName} : ${inferredType};`);
    }

    // Build edits per group
    const linesCopy = [...lines]; // track virtual line shifts for same-doc edits
    let lineShift = 0;

    // Sort groups by insertAfterLine ascending so we can track shift
    const sortedGroups = [...groups.entries()].sort((a, b) => a[0] - b[0]);

    for (const [, { insertion, declarations }] of sortedGroups) {
        const edit = buildBatchInsertEdit(
            linesCopy,
            declarations,
            insertion,
            lineShift
        );
        if (edit) {
            allEdits.push(...edit.edits);
            lineShift += edit.linesAdded;
        }
    }

    if (allEdits.length === 0) return null;

    return {
        title: `Declare all ${undefinedDiags.length} undefined variables`,
        kind: CodeActionKind.QuickFix,
        diagnostics: undefinedDiags,
        edit: {
            changes: { [document.uri]: allEdits }
        }
    };
}

// ─── Edit construction ───────────────────────────────────────────────────────

function buildInsertEdit(
    uri: string,
    lines: string[],
    varName: string,
    inferredType: string,
    insertion: InsertionPoint
): WorkspaceEdit | null {
    const declarationLine = `${insertion.indent}${varName} : ${inferredType};\n`;

    let insertText: string;
    let insertPosition: Position;

    if (insertion.needsNewBlock) {
        const blockKw = insertion.isGlobal ? 'VAR_GLOBAL' : 'VAR';
        const blockIndent = insertion.indent.slice(0, Math.max(0, insertion.indent.length - 4));
        insertText = `${blockIndent}${blockKw}\n${declarationLine}${blockIndent}END_VAR\n`;
        insertPosition = Position.create(insertion.insertAfterLine + 1, 0);
    } else {
        insertText = declarationLine;
        insertPosition = Position.create(insertion.insertAfterLine + 1, 0);
    }

    return {
        changes: {
            [uri]: [TextEdit.insert(insertPosition, insertText)]
        }
    };
}

interface BatchEditResult {
    edits: TextEdit[];
    linesAdded: number;
}

function buildBatchInsertEdit(
    lines: string[],
    declarations: string[],
    insertion: InsertionPoint,
    lineShift: number
): BatchEditResult | null {
    const adjustedLine = insertion.insertAfterLine + lineShift;

    if (insertion.needsNewBlock) {
        const blockKw = insertion.isGlobal ? 'VAR_GLOBAL' : 'VAR';
        const blockIndent = insertion.indent.slice(0, Math.max(0, insertion.indent.length - 4));
        const declLines = declarations.map(d => `${insertion.indent}${d}`).join('\n');
        const insertText = `${blockIndent}${blockKw}\n${declLines}\n${blockIndent}END_VAR\n`;
        const insertPosition = Position.create(adjustedLine + 1, 0);
        return {
            edits: [TextEdit.insert(insertPosition, insertText)],
            linesAdded: declarations.length + 2 // VAR + decls + END_VAR
        };
    } else {
        const insertText = declarations.map(d => `${insertion.indent}${d}\n`).join('');
        const insertPosition = Position.create(adjustedLine + 1, 0);
        return {
            edits: [TextEdit.insert(insertPosition, insertText)],
            linesAdded: declarations.length
        };
    }
}

/**
 * Diagnostics Provider for Structured Text
 *
 * Publishes LSP Diagnostic[] for a given TextDocument. Integrated into the
 * server's onDidChangeContent / onDidOpen flow so that errors appear in VS
 * Code's Problems panel in real time.
 *
 * Phase 1 — syntax-level checks:
 *  - Unmatched block keywords (PROGRAM/END_PROGRAM, FUNCTION/END_FUNCTION, etc.)
 *  - Unmatched VAR section keywords (VAR/END_VAR, VAR_INPUT/END_VAR, etc.)
 *  - Unclosed string literals (single and double quotes)
 *  - Unmatched parentheses (cross-line aware)
 *  - ELSE IF should be ELSIF (IEC 61131-3 §3.3.2)
 *  - Missing THEN after IF/ELSIF, missing DO after FOR/WHILE
 *
 * Phase 2 — semantic checks (require parsed symbols):
 *  - Missing semicolons on statement lines
 *  - Duplicate variable declarations in same scope
 *  - Undefined variable usage
 *  - Unused variable warnings
 *  - Type mismatch on assignment
 *  - FB member access validation (invalid members, closest-match suggestion)
 *  - FB call duplicate named parameter detection
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode-languageserver';
import { STSymbolExtended, STSymbolKind, STScope, STDeclaration } from '../../shared/types';
import { IEC61131Specification, isKeyword, isDataType } from '../../iec61131_specification';
import { MemberAccessProvider } from './member-access-provider';

// ─── Block keyword pairs ────────────────────────────────────────────────────

/**
 * Pairs of opening/closing keywords for top-level POU and control-flow blocks.
 * Order matters for matching: we scan for openers, push onto a stack, then
 * match against the expected closer.
 */
interface BlockKeywordPair {
    open: string;
    close: string;
}

const BLOCK_KEYWORD_PAIRS: BlockKeywordPair[] = [
    { open: 'FUNCTION_BLOCK', close: 'END_FUNCTION_BLOCK' },
    { open: 'FUNCTION', close: 'END_FUNCTION' },
    { open: 'PROGRAM', close: 'END_PROGRAM' },
    { open: 'IF', close: 'END_IF' },
    { open: 'CASE', close: 'END_CASE' },
    { open: 'FOR', close: 'END_FOR' },
    { open: 'WHILE', close: 'END_WHILE' },
    { open: 'REPEAT', close: 'END_REPEAT' },
    { open: 'STRUCT', close: 'END_STRUCT' },
    { open: 'TYPE', close: 'END_TYPE' },
];

/**
 * VAR section openers all close with END_VAR.
 */
const VAR_SECTION_OPENERS: string[] = [
    'VAR_GLOBAL',
    'VAR_INPUT',
    'VAR_OUTPUT',
    'VAR_IN_OUT',
    'VAR_TEMP',
    'VAR_CONFIG',
    'VAR_ACCESS',
    'VAR_EXTERNAL',
    'VAR',
];

// ─── Comment / string stripping utilities ───────────────────────────────────

interface CleanLine {
    /** Line text with comments removed (block + single-line) */
    text: string;
    /** Original 0-based line index */
    lineIndex: number;
}

/**
 * Strip all comments from the document and return per-line clean text.
 *
 * Handles:
 *  - Block comments (* ... *) spanning multiple lines, including nested (* (* *) *)
 *  - Single-line comments //
 */
function stripAllComments(lines: string[]): CleanLine[] {
    const result: CleanLine[] = [];
    let blockDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let cleaned = '';
        let j = 0;

        while (j < line.length) {
            if (blockDepth > 0) {
                if (j < line.length - 1 && line[j] === '(' && line[j + 1] === '*') {
                    blockDepth++;
                    j += 2;
                } else if (j < line.length - 1 && line[j] === '*' && line[j + 1] === ')') {
                    blockDepth--;
                    j += 2;
                } else {
                    j++;
                }
            } else {
                if (j < line.length - 1 && line[j] === '(' && line[j + 1] === '*') {
                    blockDepth++;
                    j += 2;
                } else if (j < line.length - 1 && line[j] === '/' && line[j + 1] === '/') {
                    break;
                } else {
                    cleaned += line[j];
                    j++;
                }
            }
        }

        result.push({ text: cleaned, lineIndex: i });
    }

    return result;
}

// ─── Diagnostic check: unmatched block keywords ─────────────────────────────

interface BlockStackEntry {
    keyword: string;
    expectedClose: string;
    line: number;
    column: number;
}

/**
 * Check for unmatched opening/closing block keywords.
 *
 * Strategy: scan each cleaned line for keyword tokens. When we see an opener,
 * push it onto a stack. When we see a closer, pop the stack and verify the
 * match. Leftover openers or unexpected closers produce diagnostics.
 *
 * IMPORTANT: FUNCTION_BLOCK must be checked before FUNCTION so that
 * "FUNCTION_BLOCK Foo" doesn't match as "FUNCTION" first. The pairs array
 * is ordered accordingly, and we match longest first.
 */
function checkUnmatchedBlocks(cleanLines: CleanLine[], rawLines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const stack: BlockStackEntry[] = [];

    // Build lookup for close → open
    const closeToOpen = new Map<string, string>();
    for (const pair of BLOCK_KEYWORD_PAIRS) {
        closeToOpen.set(pair.close, pair.open);
    }
    // All VAR sections close with END_VAR
    for (const opener of VAR_SECTION_OPENERS) {
        closeToOpen.set('END_VAR', opener); // just for the set of close keywords
    }

    // Set of all close keywords
    const allCloseKeywords = new Set<string>(closeToOpen.keys());
    // Map open → close for block pairs
    const openToClose = new Map<string, string>();
    for (const pair of BLOCK_KEYWORD_PAIRS) {
        openToClose.set(pair.open, pair.close);
    }

    // All openers: block pairs + VAR sections
    const allOpenKeywords: string[] = [
        ...BLOCK_KEYWORD_PAIRS.map(p => p.open),
        ...VAR_SECTION_OPENERS,
    ];
    // Sort by length descending so FUNCTION_BLOCK matches before FUNCTION, VAR_GLOBAL before VAR, etc.
    allOpenKeywords.sort((a, b) => b.length - a.length);

    const allCloseKeywordsSorted = Array.from(allCloseKeywords);
    allCloseKeywordsSorted.sort((a, b) => b.length - a.length);

    for (const cl of cleanLines) {
        const lineUpper = cl.text.toUpperCase();
        const trimmedUpper = lineUpper.trim();
        if (!trimmedUpper) continue;

        // Tokenize the line to find keywords. We look at word boundaries.
        // Use a simple approach: extract all "word" tokens and check against keywords.
        // But we need position info, so we scan with regex.
        const tokens = extractKeywordTokens(lineUpper);

        for (const token of tokens) {
            // Check close keywords first (longer first)
            let matchedClose = false;
            for (const closeKw of allCloseKeywordsSorted) {
                if (token.text === closeKw) {
                    matchedClose = true;

                    if (closeKw === 'END_VAR') {
                        // Pop from stack; should find a VAR-section opener
                        const top = findLastVarOpener(stack);
                        if (top === null) {
                            diagnostics.push(createDiagnostic(
                                cl.lineIndex, token.start, closeKw.length,
                                `'END_VAR' without matching VAR section opener`,
                                DiagnosticSeverity.Error
                            ));
                        } else {
                            // Remove it from the stack
                            stack.splice(stack.indexOf(top), 1);
                        }
                    } else {
                        const expectedOpen = closeToOpen.get(closeKw)!;
                        // Pop from stack; should match
                        const top = findLastMatchingOpener(stack, expectedOpen);
                        if (top === null) {
                            diagnostics.push(createDiagnostic(
                                cl.lineIndex, token.start, closeKw.length,
                                `'${closeKw}' without matching '${expectedOpen}'`,
                                DiagnosticSeverity.Error
                            ));
                        } else {
                            stack.splice(stack.indexOf(top), 1);
                        }
                    }
                    break;
                }
            }

            if (matchedClose) continue;

            // Check open keywords (longer first)
            for (const openKw of allOpenKeywords) {
                if (token.text === openKw) {
                    const expectedClose = openToClose.get(openKw) || 'END_VAR';
                    stack.push({
                        keyword: openKw,
                        expectedClose,
                        line: cl.lineIndex,
                        column: token.start,
                    });
                    break;
                }
            }
        }
    }

    // Anything left on the stack is an unclosed opener
    for (const entry of stack) {
        diagnostics.push(createDiagnostic(
            entry.line, entry.column, entry.keyword.length,
            `'${entry.keyword}' is missing closing '${entry.expectedClose}'`,
            DiagnosticSeverity.Error
        ));
    }

    return diagnostics;
}

/**
 * Extract keyword-like tokens from an uppercased line with their positions.
 */
function extractKeywordTokens(lineUpper: string): { text: string; start: number }[] {
    const results: { text: string; start: number }[] = [];
    const regex = /\b([A-Z_][A-Z0-9_]*)\b/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineUpper)) !== null) {
        results.push({ text: match[1], start: match.index });
    }

    return results;
}

// ─── Phase 2: Semantic checks ───────────────────────────────────────────────

// ─── Build set of all known identifiers (keywords, types, functions, FBs) ───

/** All known non-variable identifiers that should not trigger "undefined" warnings. */
const ALL_KNOWN_IDENTIFIERS: Set<string> = (() => {
    const s = new Set<string>();
    for (const kw of IEC61131Specification.controlKeywords) s.add(kw);
    for (const kw of IEC61131Specification.declarationKeywords) s.add(kw);
    for (const kw of IEC61131Specification.otherKeywords) s.add(kw);
    for (const kw of IEC61131Specification.logicalOperators) s.add(kw);
    for (const kw of IEC61131Specification.dataTypes) s.add(kw);
    for (const kw of IEC61131Specification.standardFunctionBlocks) s.add(kw);
    for (const kw of IEC61131Specification.standardFunctions) s.add(kw);
    // Additional tokens that appear in code but are not identifiers
    s.add('REF');   // REF= syntax
    s.add('ADR');   // Address-of operator
    s.add('SIZEOF');
    s.add('OF');
    s.add('TO');
    s.add('BY');
    s.add('DO');
    s.add('THEN');
    s.add('ON');
    s.add('WITH');
    s.add('INTERVAL');
    s.add('PRIORITY');
    s.add('SINGLE');
    return s;
})();

/**
 * Keywords that introduce lines not requiring a trailing semicolon.
 * Includes block openers/closers, control flow starts, and label-like patterns.
 */
const NO_SEMICOLON_KEYWORDS: Set<string> = new Set([
    // Block openers/closers
    'PROGRAM', 'END_PROGRAM', 'FUNCTION', 'END_FUNCTION',
    'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',
    'TYPE', 'END_TYPE', 'STRUCT', 'END_STRUCT',
    'CLASS', 'END_CLASS', 'METHOD', 'END_METHOD',
    'INTERFACE', 'END_INTERFACE', 'NAMESPACE', 'END_NAMESPACE',
    'CONFIGURATION', 'END_CONFIGURATION', 'RESOURCE', 'END_RESOURCE',
    // VAR sections
    'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_TEMP',
    'VAR_GLOBAL', 'VAR_CONFIG', 'VAR_ACCESS', 'VAR_EXTERNAL', 'END_VAR',
    // Control flow that uses THEN/DO/OF terminators
    'IF', 'ELSIF', 'ELSE', 'END_IF',
    'CASE', 'END_CASE',
    'FOR', 'END_FOR',
    'WHILE', 'END_WHILE',
    'REPEAT', 'END_REPEAT',
    'UNTIL',
]);

// ─── POU body range extraction ──────────────────────────────────────────────

interface PouRange {
    name: string;
    /** Line of PROGRAM/FUNCTION/FUNCTION_BLOCK keyword */
    startLine: number;
    /** Line of END_PROGRAM/END_FUNCTION/END_FUNCTION_BLOCK keyword */
    endLine: number;
    /** Symbols (members) declared in this POU */
    members: STSymbolExtended[];
    /** Parameters for functions/FBs */
    parameters: STSymbolExtended[];
    /** POU kind */
    kind: STSymbolKind;
    /** Return type for functions */
    returnType?: string;
}

/**
 * Build POU ranges from symbols and raw lines.
 * Each POU range covers the full extent from keyword to END_keyword.
 */
function buildPouRanges(symbols: STSymbolExtended[], rawLines: string[]): PouRange[] {
    const ranges: PouRange[] = [];
    const pouSymbols = symbols.filter(s =>
        s.kind === STSymbolKind.Program ||
        s.kind === STSymbolKind.Function ||
        s.kind === STSymbolKind.FunctionBlock
    );

    for (const pou of pouSymbols) {
        const startLine = pou.location.range.start.line;
        const endKeyword = pou.kind === STSymbolKind.FunctionBlock
            ? 'END_FUNCTION_BLOCK'
            : pou.kind === STSymbolKind.Function
                ? 'END_FUNCTION'
                : 'END_PROGRAM';

        let endLine = rawLines.length - 1;
        let depth = 1;
        const openKw = pou.kind === STSymbolKind.FunctionBlock
            ? 'FUNCTION_BLOCK'
            : pou.kind === STSymbolKind.Function
                ? 'FUNCTION'
                : 'PROGRAM';

        for (let i = startLine + 1; i < rawLines.length; i++) {
            const trimmed = stripInlineComments(rawLines[i]).trim().toUpperCase();
            if (!trimmed) continue;
            const kwRegex = new RegExp(`^${openKw}\\b`);
            if (kwRegex.test(trimmed)) depth++;
            else if (trimmed.startsWith(endKeyword)) {
                depth--;
                if (depth === 0) { endLine = i; break; }
            }
        }

        // Collect members and params from the flat symbol list
        const members = symbols.filter(s =>
            s.parentSymbol === pou.name &&
            (s.kind === STSymbolKind.Variable || s.kind === STSymbolKind.FunctionBlockInstance)
        );

        const parameters = pou.parameters
            ? symbols.filter(s =>
                s.parentSymbol === pou.name &&
                (s.scope === STScope.Input || s.scope === STScope.Output || s.scope === STScope.InOut))
            : [];

        ranges.push({
            name: pou.name,
            startLine,
            endLine,
            members,
            parameters,
            kind: pou.kind,
            returnType: pou.returnType,
        });
    }

    return ranges;
}

// ─── VAR section range detection ────────────────────────────────────────────

interface VarSectionRange {
    startLine: number;
    endLine: number;
}

/**
 * Find all VAR section ranges (VAR...END_VAR) within a line range.
 */
function findVarSections(cleanLines: CleanLine[], fromLine: number, toLine: number): VarSectionRange[] {
    const sections: VarSectionRange[] = [];
    const varRegex = /^\s*VAR(_INPUT|_OUTPUT|_IN_OUT|_GLOBAL|_TEMP|_CONFIG|_ACCESS|_EXTERNAL)?\s*(CONSTANT|RETAIN|PERSISTENT|NON_RETAIN)?\s*$/i;

    for (const cl of cleanLines) {
        if (cl.lineIndex < fromLine || cl.lineIndex > toLine) continue;
        if (!varRegex.test(cl.text)) continue;

        const start = cl.lineIndex;
        let end = toLine;
        for (const cl2 of cleanLines) {
            if (cl2.lineIndex <= start) continue;
            if (cl2.lineIndex > toLine) break;
            if (cl2.text.trim().toUpperCase().startsWith('END_VAR')) {
                end = cl2.lineIndex;
                break;
            }
        }
        sections.push({ startLine: start, endLine: end });
    }

    return sections;
}

/**
 * Check if a line is inside any VAR section.
 */
function isInVarSection(lineIndex: number, varSections: VarSectionRange[]): boolean {
    return varSections.some(s => lineIndex >= s.startLine && lineIndex <= s.endLine);
}

// ─── Strip inline comments (single-line only, for quick checks) ─────────

function stripInlineComments(line: string): string {
    let result = '';
    let inString = false;
    let stringChar = '';
    let i = 0;

    while (i < line.length) {
        const ch = line[i];

        if (inString) {
            result += ch;
            if (ch === stringChar) {
                if (i + 1 < line.length && line[i + 1] === stringChar) {
                    result += line[i + 1];
                    i += 2;
                    continue;
                }
                inString = false;
            }
            i++;
            continue;
        }

        if (ch === "'" || ch === '"') {
            inString = true;
            stringChar = ch;
            result += ch;
            i++;
            continue;
        }

        if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
            break; // rest is comment
        }

        if (ch === '(' && i + 1 < line.length && line[i + 1] === '*') {
            const endIdx = line.indexOf('*)', i + 2);
            if (endIdx !== -1) {
                i = endIdx + 2;
                continue;
            }
            break; // block comment to end of line
        }

        result += ch;
        i++;
    }

    return result;
}

// ─── Missing semicolons ────────────────────────────────────────────────────

/**
 * Detect lines inside POU bodies (outside VAR sections) that appear to be
 * statements but are missing a trailing semicolon.
 *
 * Skips: blank lines, comment-only lines, block opener/closer keywords,
 * control flow keywords (IF/THEN, FOR/DO, etc.), CASE branch labels,
 * multi-line continuations (unbalanced parens).
 */
function checkMissingSemicolons(cleanLines: CleanLine[], rawLines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Find POU boundaries
    const pouBoundaries = findPouBoundaries(cleanLines);

    for (const pou of pouBoundaries) {
        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);
        let parenDepth = 0;

        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;

            const trimmed = cl.text.trim();
            if (!trimmed) continue;

            // Track multi-line paren continuations (FB calls etc.)
            for (const ch of trimmed) {
                if (ch === '(') parenDepth++;
                else if (ch === ')') parenDepth--;
            }
            if (parenDepth < 0) parenDepth = 0;

            // If we're inside an open paren group, skip semicolon check
            if (parenDepth > 0) continue;

            // Get the leading keyword token
            const firstToken = getFirstKeywordToken(trimmed);

            // Skip lines starting with block/control keywords
            if (firstToken && NO_SEMICOLON_KEYWORDS.has(firstToken)) continue;

            // Skip CASE branch labels: patterns like "1:", "1..10:", "STOPPED:", "'a':"
            if (isCaseBranchLabel(trimmed)) continue;

            // Skip lines that end with THEN, DO, OF (control flow terminators)
            const upperTrimmed = trimmed.toUpperCase();
            if (upperTrimmed.endsWith('THEN') || upperTrimmed.endsWith('DO') ||
                upperTrimmed.endsWith('OF')) continue;

            // At this point, line should be a statement. Check for semicolon.
            if (!trimmed.endsWith(';')) {
                // Point squiggle at end of cleaned text (after comments stripped),
                // not end of raw line which may include trailing comments.
                const cleanedEnd = cl.text.trimEnd().length;
                diagnostics.push(createDiagnostic(
                    cl.lineIndex, cleanedEnd, 0,
                    'Missing semicolon at end of statement',
                    DiagnosticSeverity.Error
                ));
            }
        }
    }

    return diagnostics;
}

/**
 * Get the first keyword-like token from a line (uppercase).
 */
function getFirstKeywordToken(trimmedLine: string): string | null {
    const match = trimmedLine.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    return match ? match[1].toUpperCase() : null;
}

/**
 * Check if a line looks like a CASE branch label.
 * Patterns: `0:`, `1..10:`, `STOPPED:`, `'a':`, `ELSE`, standalone numbers with colon.
 */
function isCaseBranchLabel(trimmedLine: string): boolean {
    const upper = trimmedLine.toUpperCase();
    if (upper === 'ELSE') return false; // ELSE is handled by NO_SEMICOLON_KEYWORDS

    // Numeric or range label: "0:", "1..10:", "16#FF:"
    if (/^[0-9]/.test(trimmedLine) && trimmedLine.endsWith(':')) return true;

    // Enum/identifier label: "STOPPED:", "RUNNING:"
    if (/^[A-Za-z_]\w*\s*:$/.test(trimmedLine)) return true;

    // String label: "'A':"
    if (/^'[^']*'\s*:$/.test(trimmedLine)) return true;

    // Range with identifiers: "1..10:" with possible spaces
    if (/^[\w#]+\s*\.\.\s*[\w#]+\s*:$/.test(trimmedLine)) return true;

    // Multiple comma-separated labels: "1, 2, 3:"
    if (/^[\w#']+(\s*,\s*[\w#']+)*\s*:$/.test(trimmedLine)) return true;

    return false;
}

interface PouBoundary {
    startLine: number;
    endLine: number;
}

/**
 * Find POU boundaries from clean lines (PROGRAM...END_PROGRAM, etc.)
 */
function findPouBoundaries(cleanLines: CleanLine[]): PouBoundary[] {
    const boundaries: PouBoundary[] = [];
    const pouStartRegex = /^\s*(PROGRAM|FUNCTION_BLOCK|FUNCTION)\b/i;

    for (const cl of cleanLines) {
        const match = cl.text.match(pouStartRegex);
        if (!match) continue;

        const keyword = match[1].toUpperCase();
        const endKeyword = `END_${keyword}`;
        let depth = 1;
        let endLine = -1;

        for (const cl2 of cleanLines) {
            if (cl2.lineIndex <= cl.lineIndex) continue;
            const trimmed = cl2.text.trim().toUpperCase();
            if (!trimmed) continue;

            // Check for nested same POU type
            const nestRegex = new RegExp(`^${keyword}\\b`);
            if (nestRegex.test(trimmed)) depth++;
            else if (trimmed.startsWith(endKeyword)) {
                depth--;
                if (depth === 0) { endLine = cl2.lineIndex; break; }
            }
        }

        if (endLine > 0) {
            boundaries.push({ startLine: cl.lineIndex, endLine });
        }
    }

    return boundaries;
}

// ─── Duplicate declarations ─────────────────────────────────────────────────

/**
 * Detect duplicate variable declarations within the same scope (POU).
 * IEC 61131-3 identifiers are case-insensitive, so "myVar" and "MYVAR"
 * in the same POU are duplicates.
 */
function checkDuplicateDeclarations(symbols: STSymbolExtended[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Group vars by parent POU (null parent = global scope)
    const byParent = new Map<string, STSymbolExtended[]>();

    for (const sym of symbols) {
        if (sym.kind !== STSymbolKind.Variable &&
            sym.kind !== STSymbolKind.FunctionBlockInstance) continue;

        const parent = sym.parentSymbol || '__global__';
        if (!byParent.has(parent)) byParent.set(parent, []);
        byParent.get(parent)!.push(sym);
    }

    for (const [_parent, vars] of byParent) {
        const seen = new Map<string, STSymbolExtended>();

        for (const v of vars) {
            const normalized = v.name.toLowerCase();
            const existing = seen.get(normalized);

            if (existing) {
                diagnostics.push(createDiagnostic(
                    v.location.range.start.line,
                    v.location.range.start.character,
                    v.name.length,
                    `Duplicate declaration '${v.name}' (already declared as '${existing.name}')`,
                    DiagnosticSeverity.Error
                ));
            } else {
                seen.set(normalized, v);
            }
        }
    }

    return diagnostics;
}

// ─── Undefined variable detection ───────────────────────────────────────────

/**
 * Scan POU body lines for identifier tokens not declared in the POU's scope.
 *
 * Excluded from "undefined" checks:
 *  - All IEC keywords, data types, standard FBs, standard functions
 *  - The POU's own name (PROGRAM Foo — "Foo" is known)
 *  - CASE branch labels (enum values may be user-defined types)
 *  - Member access targets after dot (instance.Member — "Member" checked elsewhere)
 *  - Numeric literals, hex literals
 *  - Function/FB names used as calls
 *  - Other POUs visible in the same file (cross-POU references)
 *  - Global variables
 */
function checkUndefinedVariables(
    cleanLines: CleanLine[],
    rawLines: string[],
    symbols: STSymbolExtended[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pouRanges = buildPouRanges(symbols, rawLines);

    // Build cross-file POU name set (all programs, functions, FBs in file)
    const pouNames = new Set<string>();
    const globalVarNames = new Set<string>();
    for (const sym of symbols) {
        if (sym.kind === STSymbolKind.Program ||
            sym.kind === STSymbolKind.Function ||
            sym.kind === STSymbolKind.FunctionBlock) {
            pouNames.add(sym.name.toUpperCase());
        }
        if (!sym.parentSymbol && (sym.kind === STSymbolKind.Variable || sym.kind === STSymbolKind.FunctionBlockInstance)) {
            globalVarNames.add(sym.name.toUpperCase());
        }
    }

    // Build set of all user-defined TYPE names (TYPE...END_TYPE)
    const userTypeNames = new Set<string>();
    for (const cl of cleanLines) {
        const typeMatch = cl.text.match(/^\s*TYPE\s+(\w+)/i);
        if (typeMatch) {
            userTypeNames.add(typeMatch[1].toUpperCase());
        }
    }

    for (const pou of pouRanges) {
        // Build declared identifiers set for this POU
        const declaredNames = new Set<string>();
        declaredNames.add(pou.name.toUpperCase()); // POU's own name

        for (const member of pou.members) {
            declaredNames.add(member.name.toUpperCase());
        }
        for (const param of pou.parameters) {
            declaredNames.add(param.name.toUpperCase());
        }

        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);

        // Track CASE statement context to allow enum values
        let inCaseOf = false;

        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;

            const trimmed = cl.text.trim();
            if (!trimmed) continue;

            // Leading whitespace offset so token columns map back to raw line
            const lineIndent = cl.text.length - cl.text.trimStart().length;

            const upperTrimmed = trimmed.toUpperCase();
            if (/^CASE\b/i.test(trimmed)) inCaseOf = true;
            if (upperTrimmed.startsWith('END_CASE')) inCaseOf = false;

            // Skip CASE branch labels entirely — they reference enum values
            // which may be from user-defined types
            if (inCaseOf && isCaseBranchLabel(trimmed)) continue;

            // Extract identifier tokens, skipping members after dots
            const tokens = extractBodyIdentifiers(trimmed);

            for (const token of tokens) {
                const upper = token.name.toUpperCase();

                // Skip known identifiers
                if (ALL_KNOWN_IDENTIFIERS.has(upper)) continue;
                if (declaredNames.has(upper)) continue;
                if (pouNames.has(upper)) continue;
                if (globalVarNames.has(upper)) continue;
                if (userTypeNames.has(upper)) continue;

                // Skip numeric-looking tokens (hex literals like 16#FF produce "FF" after stripping)
                if (/^\d/.test(token.name)) continue;

                // Skip enum member values that look like identifiers in CASE branches
                if (inCaseOf) continue;

                diagnostics.push(createDiagnostic(
                    cl.lineIndex,
                    lineIndent + token.column,
                    token.name.length,
                    `Undefined identifier '${token.name}'`,
                    DiagnosticSeverity.Warning
                ));
            }
        }
    }

    return diagnostics;
}

interface BodyToken {
    name: string;
    column: number;
}

/**
 * Extract identifier tokens from a body line, skipping:
 *  - members after dots (instance.member — skip "member")
 *  - string contents
 *  - numeric literals and hex prefix parts
 *  - named parameter assigns in FB calls (paramName :=)
 */
function extractBodyIdentifiers(line: string): BodyToken[] {
    const tokens: BodyToken[] = [];
    const noStrings = stripStringLiterals(line);

    // Find all identifier-like tokens
    const regex = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(noStrings)) !== null) {
        const name = match[1];
        const col = match.index;

        // Skip if preceded by dot (member access)
        if (col > 0 && noStrings[col - 1] === '.') continue;

        // Skip if preceded by # (typed literal: TIME#, T#, etc.)
        if (col > 0 && noStrings[col - 1] === '#') continue;

        // Skip typed literal prefixes followed by # (T#, TIME#, D#, DATE#, DT#, TOD#, LTIME#, etc.)
        if (col + name.length < noStrings.length && noStrings[col + name.length] === '#') continue;

        // Skip named parameter assigns in FB calls: "IN :=" — "IN" is a param name, not a variable
        const afterToken = noStrings.slice(col + name.length).trimStart();
        if (afterToken.startsWith(':=')) continue;

        // Skip named output parameter assigns in FB calls: "Q =>" — "Q" is a param name, not a variable
        if (afterToken.startsWith('=>')) continue;

        tokens.push({ name, column: col });
    }

    return tokens;
}

// ─── Unused variable warnings ───────────────────────────────────────────────

/**
 * Detect variables declared in a POU but never referenced in its body.
 * Only checks local variables (not Input/Output/InOut which have external callers).
 */
function checkUnusedVariables(
    cleanLines: CleanLine[],
    rawLines: string[],
    symbols: STSymbolExtended[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pouRanges = buildPouRanges(symbols, rawLines);

    for (const pou of pouRanges) {
        // Only check local-scoped variables (not params visible to callers)
        const localVars = pou.members.filter(m => m.scope === STScope.Local);

        if (localVars.length === 0) continue;

        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);

        // Collect all body text (outside VAR sections) into a single string for scanning
        let bodyText = '';
        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;
            bodyText += ' ' + cl.text;
        }
        const bodyUpper = bodyText.toUpperCase();

        for (const v of localVars) {
            const nameUpper = v.name.toUpperCase();
            // Check for whole-word occurrence in body
            const regex = new RegExp(`\\b${escapeRegex(nameUpper)}\\b`);
            if (!regex.test(bodyUpper)) {
                diagnostics.push(createDiagnostic(
                    v.location.range.start.line,
                    v.location.range.start.character,
                    v.name.length,
                    `Variable '${v.name}' is declared but never used`,
                    DiagnosticSeverity.Warning
                ));
            }
        }
    }

    return diagnostics;
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── FB call validation ──────────────────────────────────────────────────────

/**
 * Build a Map<string, STDeclaration> of custom FB types from the symbol list.
 * Used by FB call validation checks.
 */
function buildCustomFBTypes(symbols: STSymbolExtended[]): Map<string, STDeclaration> {
    const map = new Map<string, STDeclaration>();
    for (const sym of symbols) {
        if (sym.kind !== STSymbolKind.FunctionBlock) continue;
        const decl: STDeclaration = {
            type: 'function_block' as never,
            location: sym.location.range,
            name: sym.name,
            parameters: sym.parameters,
            variables: sym.members as STDeclaration['variables'],
        };
        map.set(sym.name.toUpperCase(), decl);
    }
    return map;
}

/**
 * Detect accesses to non-existent members on FB instances.
 *
 * For each `instance.member` token pair found in POU body lines:
 *  - Resolve the instance to an FB type via the symbol list
 *  - Look up available members via MemberAccessProvider
 *  - If the member is unknown, emit an error with a closest-match suggestion
 *
 * Message format: "'MEMBER' is not a member of 'FBTYPE' (did you mean 'CLOSEST'?)"
 * or             "'MEMBER' is not a member of 'FBTYPE'"
 */
function checkFBCallInvalidMembers(
    cleanLines: CleanLine[],
    rawLines: string[],
    symbols: STSymbolExtended[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const memberProvider = new MemberAccessProvider();
    const customFBTypes = buildCustomFBTypes(symbols);
    const pouRanges = buildPouRanges(symbols, rawLines);

    // Build instance→type map: variable name (upper) → dataType (upper)
    // Include both FunctionBlockInstance and Variable — standard FBs (TON, CTU, etc.)
    // are classified as Variable by the parser since they're in KNOWN_TYPES.
    const instanceTypeMap = new Map<string, string>();
    for (const sym of symbols) {
        if (!sym.dataType) continue;
        if (sym.kind === STSymbolKind.FunctionBlockInstance ||
            sym.kind === STSymbolKind.Variable) {
            const typeUpper = sym.dataType.toUpperCase();
            // Only register if the type has known FB members
            if (memberProvider.getAvailableMembers(typeUpper, customFBTypes).length > 0) {
                instanceTypeMap.set(sym.name.toUpperCase(), typeUpper);
            }
        }
    }

    for (const pou of pouRanges) {
        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);

        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;

            const noStrings = stripStringLiterals(cl.text);
            const regex = /\b([A-Za-z_]\w*)\s*\.\s*([A-Za-z_]\w*)\b/g;
            let match: RegExpExecArray | null;

            while ((match = regex.exec(noStrings)) !== null) {
                const instanceName = match[1];
                const memberName = match[2];
                const fbType = instanceTypeMap.get(instanceName.toUpperCase());
                if (!fbType) continue; // not a known FB instance

                const available = memberProvider.getAvailableMembers(fbType, customFBTypes);
                if (available.length === 0) continue; // unknown FB type — skip

                const validNames = available.map(m => m.name);
                const validNamesUpper = validNames.map(n => n.toUpperCase());
                if (validNamesUpper.includes(memberName.toUpperCase())) continue; // valid

                // Compute column: find actual match position in raw line
                const lineText = cl.text;
                const dotIndex = lineText.indexOf(instanceName + '.');
                const memberCol = dotIndex >= 0
                    ? dotIndex + instanceName.length + 1
                    : match.index + instanceName.length + 1;

                const closest = findClosestMatch(memberName, validNames);
                const suggestion = closest ? ` (did you mean '${closest}'?)` : '';
                diagnostics.push(createDiagnostic(
                    cl.lineIndex,
                    memberCol,
                    memberName.length,
                    `'${memberName}' is not a member of '${fbType}'${suggestion}`,
                    DiagnosticSeverity.Error
                ));
            }
        }
    }

    return diagnostics;
}

/**
 * Detect duplicate named parameter assignments in FB call expressions.
 *
 * Scans body lines for `instance(... param := ..., param := ...)` patterns.
 * Handles multi-line calls via paren-depth tracking.
 * Comparison is case-insensitive per IEC 61131-3.
 *
 * Message format: "Duplicate parameter 'PARAM' in call to 'INSTANCE'"
 */
function checkFBCallDuplicateParams(
    cleanLines: CleanLine[],
    rawLines: string[],
    symbols: STSymbolExtended[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pouRanges = buildPouRanges(symbols, rawLines);
    const memberProvider = new MemberAccessProvider();
    const customFBTypes = buildCustomFBTypes(symbols);

    // Build set of FB instance names (upper) for quick lookup.
    // Include both FunctionBlockInstance and Variable kinds — standard FBs (TON, etc.)
    // are classified as Variable by the parser since they're in KNOWN_TYPES.
    const fbInstanceNames = new Set<string>();
    for (const sym of symbols) {
        if (!sym.dataType) continue;
        if (sym.kind === STSymbolKind.FunctionBlockInstance ||
            sym.kind === STSymbolKind.Variable) {
            const typeUpper = sym.dataType.toUpperCase();
            if (memberProvider.getAvailableMembers(typeUpper, customFBTypes).length > 0) {
                fbInstanceNames.add(sym.name.toUpperCase());
            }
        }
    }

    for (const pou of pouRanges) {
        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);

        // Accumulate multi-line FB calls
        let currentCallInstance: string | null = null;
        let callAccum = '';
        let callStartLine = -1;
        let parenDepth = 0;
        // Track which lines contributed to the accumulated call
        const callLines: Array<{ lineIndex: number; text: string }> = [];

        const flushCall = () => {
            if (!currentCallInstance) return;
            // Parse paramName := from accumulated call text
            const seen = new Map<string, { lineIndex: number; col: number; original: string }>();
            // We need per-line positions; re-scan callLines
            for (const { lineIndex, text: lineText } of callLines) {
                const noStr = stripStringLiterals(lineText);
                // Match named param pattern: word followed by :=
                const paramRegex = /\b([A-Za-z_]\w*)\s*:=/g;
                let pm: RegExpExecArray | null;
                while ((pm = paramRegex.exec(noStr)) !== null) {
                    const paramName = pm[1];
                    const paramUpper = paramName.toUpperCase();
                    const col = pm.index;
                    const existing = seen.get(paramUpper);
                    if (existing) {
                        diagnostics.push(createDiagnostic(
                            lineIndex,
                            col,
                            paramName.length,
                            `Duplicate parameter '${paramName}' in call to '${currentCallInstance}'`,
                            DiagnosticSeverity.Error
                        ));
                    } else {
                        seen.set(paramUpper, { lineIndex, col, original: paramName });
                    }
                }
            }
            currentCallInstance = null;
            callAccum = '';
            callStartLine = -1;
            parenDepth = 0;
            callLines.length = 0;
        };

        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;

            const noStrings = stripStringLiterals(cl.text);

            if (currentCallInstance) {
                // Inside a multi-line call — accumulate
                callLines.push({ lineIndex: cl.lineIndex, text: noStrings });
                for (const ch of noStrings) {
                    if (ch === '(') parenDepth++;
                    else if (ch === ')') {
                        parenDepth--;
                        if (parenDepth <= 0) { flushCall(); break; }
                    }
                }
                continue;
            }

            // Look for `instanceName(` on this line
            const callRegex = /\b([A-Za-z_]\w*)\s*\(/g;
            let cm: RegExpExecArray | null;
            while ((cm = callRegex.exec(noStrings)) !== null) {
                const name = cm[1];
                if (!fbInstanceNames.has(name.toUpperCase())) continue;

                // Found an FB call — collect from the opening paren onwards
                const openIdx = cm.index + cm[0].length - 1; // index of '('
                const restOfLine = noStrings.slice(openIdx);
                currentCallInstance = name;
                callStartLine = cl.lineIndex;
                parenDepth = 0;
                callLines.length = 0;
                // Include from '(' to end-of-line in this line's accumulation
                callLines.push({ lineIndex: cl.lineIndex, text: noStrings.slice(openIdx + 1) });
                for (const ch of restOfLine) {
                    if (ch === '(') parenDepth++;
                    else if (ch === ')') {
                        parenDepth--;
                        if (parenDepth <= 0) { flushCall(); break; }
                    }
                }
                break; // only handle first FB call per line
            }
        }
        // Flush any unclosed call at end of POU
        if (currentCallInstance) flushCall();
    }

    return diagnostics;
}

// ─── Type mismatch detection ────────────────────────────────────────────────

/**
 * Type compatibility matrix for basic IEC 61131-3 types.
 * Groups types into compatible families for assignment checking.
 */
const TYPE_FAMILIES: Map<string, string> = new Map([
    // Boolean family
    ['BOOL', 'BOOL'],
    // Integer family
    ['SINT', 'INT'], ['USINT', 'INT'], ['INT', 'INT'], ['UINT', 'INT'],
    ['DINT', 'INT'], ['UDINT', 'INT'], ['LINT', 'INT'], ['ULINT', 'INT'],
    ['BYTE', 'INT'], ['WORD', 'INT'], ['DWORD', 'INT'], ['LWORD', 'INT'],
    // Real family
    ['REAL', 'REAL'], ['LREAL', 'REAL'],
    // String family
    ['STRING', 'STRING'], ['WSTRING', 'WSTRING'],
    ['CHAR', 'STRING'], ['WCHAR', 'WSTRING'],
    // Time family
    ['TIME', 'TIME'], ['LTIME', 'TIME'],
    // Date family
    ['DATE', 'DATE'], ['LDATE', 'DATE'],
    ['TIME_OF_DAY', 'TOD'], ['TOD', 'TOD'],
    ['DATE_AND_TIME', 'DT'], ['DT', 'DT'],
]);

/**
 * Check if two types are assignment-compatible.
 * INT family types are compatible with each other.
 * REAL family types are compatible with each other and with INT family.
 * Everything else must match families exactly.
 */
function areTypesCompatible(lhsType: string, rhsType: string): boolean {
    const lhs = lhsType.toUpperCase();
    const rhs = rhsType.toUpperCase();

    if (lhs === rhs) return true;

    const lhsFamily = TYPE_FAMILIES.get(lhs);
    const rhsFamily = TYPE_FAMILIES.get(rhs);

    // Unknown types (user-defined) — assume compatible
    if (!lhsFamily || !rhsFamily) return true;

    if (lhsFamily === rhsFamily) return true;

    // REAL can accept INT (implicit widening)
    if (lhsFamily === 'REAL' && rhsFamily === 'INT') return true;

    return false;
}

/**
 * Detect type mismatches on assignment statements (`:=`).
 * Only checks assignments where both LHS and RHS types can be determined:
 *  - LHS: variable with known dataType from symbol table
 *  - RHS: literal value or known-type variable
 */
function checkTypeMismatches(
    cleanLines: CleanLine[],
    symbols: STSymbolExtended[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Build symbol lookup by normalized name
    const symByName = new Map<string, STSymbolExtended>();
    for (const sym of symbols) {
        if (sym.kind === STSymbolKind.Variable ||
            sym.kind === STSymbolKind.FunctionBlockInstance) {
            const key = (sym.parentSymbol || '') + '::' + sym.name.toUpperCase();
            if (!symByName.has(key)) symByName.set(key, sym);
            // Also store without parent for global lookup
            const globalKey = sym.name.toUpperCase();
            if (!symByName.has(globalKey)) symByName.set(globalKey, sym);
        }
    }

    // Simple assignment pattern: identifier := value;
    const assignRegex = /^\s*([A-Za-z_]\w*)\s*:=\s*(.+?)\s*;\s*$/;

    for (const cl of cleanLines) {
        const match = cl.text.match(assignRegex);
        if (!match) continue;

        const lhsName = match[1];
        const rhsExpr = match[2].trim();

        // Find LHS type
        const lhsKey = lhsName.toUpperCase();
        const lhsSym = symByName.get(lhsKey);
        if (!lhsSym || !lhsSym.dataType) continue;

        const lhsType = lhsSym.dataType.toUpperCase();

        // Determine RHS type from literals or known variables
        const rhsType = inferExpressionType(rhsExpr, symByName);
        if (!rhsType) continue;

        if (!areTypesCompatible(lhsType, rhsType)) {
            // Point squiggle at the RHS expression only
            const assignIdx = cl.text.indexOf(':=');
            const rhsStart = assignIdx + 2;
            const rhsCol = cl.text.indexOf(rhsExpr, rhsStart);
            diagnostics.push(createDiagnostic(
                cl.lineIndex,
                rhsCol >= 0 ? rhsCol : assignIdx,
                rhsExpr.length,
                `Type mismatch: cannot assign '${rhsType}' to '${lhsType}'`,
                DiagnosticSeverity.Error
            ));
        }
    }

    return diagnostics;
}

/**
 * Infer the type of a simple RHS expression.
 * Handles: literals, single variables, typed literals.
 * Returns null if type cannot be determined (complex expressions).
 */
function inferExpressionType(expr: string, symByName: Map<string, STSymbolExtended>): string | null {
    const trimmed = expr.trim();
    const upper = trimmed.toUpperCase();

    // Boolean literals
    if (upper === 'TRUE' || upper === 'FALSE') return 'BOOL';

    // String literals
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.length === 3 ? 'CHAR' : 'STRING';
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return 'WSTRING';

    // Typed literals: TIME#, T#, DATE#, etc.
    if (upper.startsWith('LTIME#') || upper.startsWith('LT#')) return 'LTIME';
    if (upper.startsWith('TIME#') || upper.startsWith('T#')) return 'TIME';
    if (upper.startsWith('LDATE#') || upper.startsWith('LD#')) return 'LDATE';
    if (upper.startsWith('DATE#') || upper.startsWith('D#')) return 'DATE';
    if (upper.startsWith('DT#') || upper.startsWith('DATE_AND_TIME#')) return 'DATE_AND_TIME';
    if (upper.startsWith('TOD#') || upper.startsWith('TIME_OF_DAY#')) return 'TIME_OF_DAY';

    // Real literal (contains decimal point, no prefix)
    if (/^[+-]?[0-9]+\.[0-9]+$/.test(trimmed)) return 'REAL';

    // Integer literal (plain digits, no prefix)
    if (/^[+-]?[0-9]+$/.test(trimmed)) return 'INT';

    // Hex literal: 16#FF
    if (/^16#[0-9A-Fa-f]+$/.test(trimmed)) return 'INT';

    // Single identifier — look up type
    if (/^[A-Za-z_]\w*$/.test(trimmed)) {
        const sym = symByName.get(upper);
        if (sym && sym.dataType) return sym.dataType.toUpperCase();
    }

    // NOT <expr> — result is BOOL
    if (upper.startsWith('NOT ')) return 'BOOL';

    // Complex expressions — cannot determine type
    return null;
}

// ─── Array bounds checking ───────────────────────────────────────────────────

/**
 * Detect out-of-bounds array access with constant/literal indices.
 *
 * Scans POU body lines and global-scope lines for subscript expressions of the
 * form  <ident>[<intLiteral>]  (single-dim) and  <ident>[<int>,<int>,...]
 * (multi-dim).  Only checks dimensions where both bounds were parsed from the
 * declaration.  Variable indices are ignored (not constant-foldable here).
 *
 * Case-insensitive per IEC 61131-3.
 * Message format: "Array index <N> is out of bounds [<L>..<U>] for '<NAME>'"
 */
function checkArrayBoundsAccess(
    cleanLines: CleanLine[],
    rawLines: string[],
    symbols: STSymbolExtended[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Build lookup: normalised name → arrayDimensions
    const arraySymbols = new Map<string, { name: string; dims: { lower: number; upper: number }[] }>();
    for (const sym of symbols) {
        if (sym.arrayDimensions && sym.arrayDimensions.length > 0) {
            arraySymbols.set(sym.name.toUpperCase(), { name: sym.name, dims: sym.arrayDimensions });
        }
    }
    if (arraySymbols.size === 0) return diagnostics;

    const pouRanges = buildPouRanges(symbols, rawLines);

    function checkLine(cl: CleanLine): void {
        const noStrings = stripStringLiterals(cl.text);

        // Match: identifier followed by '['
        // We then manually collect the bracket content to handle nested brackets correctly.
        const identRegex = /\b([A-Za-z_]\w*)\s*\[/g;
        let m: RegExpExecArray | null;

        while ((m = identRegex.exec(noStrings)) !== null) {
            const symInfo = arraySymbols.get(m[1].toUpperCase());
            if (!symInfo) continue;

            // Collect bracket content starting after the '[' we already matched
            const bracketStart = m.index + m[0].length; // index just inside '['
            let depth = 1;
            let i = bracketStart;
            while (i < noStrings.length && depth > 0) {
                if (noStrings[i] === '[') depth++;
                else if (noStrings[i] === ']') depth--;
                i++;
            }
            if (depth !== 0) continue; // unmatched bracket — syntax error handled elsewhere

            const bracketContent = noStrings.substring(bracketStart, i - 1); // exclude closing ']'

            // Split by top-level commas (for multi-dim arrays)
            const indexStrs = splitTopLevelCommas(bracketContent);

            for (let d = 0; d < indexStrs.length; d++) {
                const dimBounds = symInfo.dims[d];
                if (!dimBounds) continue; // more indices than declared dims — not our problem here

                const trimmed = indexStrs[d].trim();
                // Only check pure integer literals (optionally signed)
                if (!/^-?\d+$/.test(trimmed)) continue;

                const idx = parseInt(trimmed, 10);
                if (idx < dimBounds.lower || idx > dimBounds.upper) {
                    // Find column of the literal in the raw line
                    const rawLine = rawLines[cl.lineIndex] || '';
                    // Search for the index literal within the bracket region
                    const literalCol = rawLine.indexOf(trimmed, m.index);
                    const col = literalCol >= 0 ? literalCol : m.index;

                    diagnostics.push(createDiagnostic(
                        cl.lineIndex,
                        col,
                        trimmed.length,
                        `Array index ${idx} is out of bounds [${dimBounds.lower}..${dimBounds.upper}] for '${symInfo.name}'`,
                        DiagnosticSeverity.Error
                    ));
                }
            }
        }
    }

    // Check inside POUs (body only, skip var sections)
    for (const pou of pouRanges) {
        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);
        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;
            checkLine(cl);
        }
    }

    // Check global scope (outside any POU)
    const pouLineRanges = pouRanges.map(p => ({ start: p.startLine, end: p.endLine }));
    for (const cl of cleanLines) {
        if (pouLineRanges.some(r => cl.lineIndex >= r.start && cl.lineIndex <= r.end)) continue;
        checkLine(cl);
    }

    return diagnostics;
}

/**
 * Split a string by top-level commas (not inside brackets or parens).
 */
function splitTopLevelCommas(s: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '(' || c === '[') depth++;
        else if (c === ')' || c === ']') depth--;
        else if (c === ',' && depth === 0) {
            parts.push(s.substring(start, i));
            start = i + 1;
        }
    }
    parts.push(s.substring(start));
    return parts;
}

// ─── Constant assignment detection ──────────────────────────────────────────

/**
 * Detect assignments to variables declared with the CONSTANT qualifier.
 *
 * Scans POU body lines (outside VAR sections) and global-scope lines for
 * assignment statements whose LHS identifier is a known constant symbol.
 * Case-insensitive per IEC 61131-3.
 *
 * Message format: "Cannot assign to constant '<NAME>'"
 */
function checkConstantAssignment(
    cleanLines: CleanLine[],
    rawLines: string[],
    symbols: STSymbolExtended[]
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Build set of constant names (upper-case) — includes globals and locals
    const constantNames = new Set<string>();
    for (const sym of symbols) {
        if (sym.isConstant) {
            constantNames.add(sym.name.toUpperCase());
        }
    }
    if (constantNames.size === 0) return diagnostics;

    // Simple assignment LHS pattern: optional whitespace, identifier, optional
    // whitespace, := (not preceded by another :, i.e. not a named-param assign
    // at start of line — which is impossible, but guarded anyway).
    // We only check the outermost (not inside parens) LHS to avoid flagging
    // named-parameter assigns like  FB(IN := MAX_TEMP).
    const pouRanges = buildPouRanges(symbols, rawLines);

    // ── Check inside POUs ──
    for (const pou of pouRanges) {
        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);

        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;

            checkLineForConstantAssign(cl, constantNames, diagnostics);
        }
    }

    // ── Check global scope (outside any POU) ──
    // Build set of all POU line ranges so we can skip them
    const pouLineRanges = pouRanges.map(p => ({ start: p.startLine, end: p.endLine }));

    for (const cl of cleanLines) {
        if (pouLineRanges.some(r => cl.lineIndex >= r.start && cl.lineIndex <= r.end)) continue;
        checkLineForConstantAssign(cl, constantNames, diagnostics);
    }

    return diagnostics;
}

/**
 * Check a single clean line for a top-level (depth-0) assignment to a constant.
 */
function checkLineForConstantAssign(
    cl: CleanLine,
    constantNames: Set<string>,
    diagnostics: Diagnostic[]
): void {
    const noStrings = stripStringLiterals(cl.text);

    // Walk character-by-character tracking paren depth.
    // At depth 0, look for:  <identifier> <whitespace>* :=
    const identRegex = /\b([A-Za-z_]\w*)\s*:=/g;
    let match: RegExpExecArray | null;

    while ((match = identRegex.exec(noStrings)) !== null) {
        const colonEqIdx = match.index + match[0].lastIndexOf(':=');

        // Verify paren depth at the position of ':='
        let depth = 0;
        for (let k = 0; k < colonEqIdx; k++) {
            if (noStrings[k] === '(') depth++;
            else if (noStrings[k] === ')') depth--;
        }
        if (depth !== 0) continue; // inside a parenthesised expression — named param

        const name = match[1];
        if (!constantNames.has(name.toUpperCase())) continue;

        diagnostics.push(createDiagnostic(
            cl.lineIndex,
            match.index,
            name.length,
            `Cannot assign to constant '${name}'`,
            DiagnosticSeverity.Error
        ));
    }
}



/**
 * Compute Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,       // deletion
                dp[i][j - 1] + 1,       // insertion
                dp[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return dp[m][n];
}

/**
 * Find the closest matching identifier for a given name.
 * Used by code actions to provide "Did you mean?" suggestions.
 *
 * @param name The unrecognized identifier
 * @param candidates Available identifiers to match against
 * @param maxDistance Maximum edit distance to consider (default: 3)
 * @returns Best match or null if none within distance threshold
 */
export function findClosestMatch(
    name: string,
    candidates: string[],
    maxDistance: number = 3
): string | null {
    const upper = name.toUpperCase();
    let best: string | null = null;
    let bestDist = maxDistance + 1;

    for (const candidate of candidates) {
        // Quick length filter — edit distance >= length difference
        const lenDiff = Math.abs(upper.length - candidate.length);
        if (lenDiff > maxDistance) continue;

        const dist = levenshteinDistance(upper, candidate.toUpperCase());
        if (dist < bestDist) {
            bestDist = dist;
            best = candidate;
        }
    }

    return bestDist <= maxDistance ? best : null;
}

/**
 * Find the last VAR-section opener on the stack.
 */
function findLastVarOpener(stack: BlockStackEntry[]): BlockStackEntry | null {
    const varOpenersSet = new Set(VAR_SECTION_OPENERS);
    for (let i = stack.length - 1; i >= 0; i--) {
        if (varOpenersSet.has(stack[i].keyword)) {
            return stack[i];
        }
    }
    return null;
}

/**
 * Find the last matching opener on the stack for a given open keyword.
 */
function findLastMatchingOpener(stack: BlockStackEntry[], openKeyword: string): BlockStackEntry | null {
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].keyword === openKeyword) {
            return stack[i];
        }
    }
    return null;
}

// ─── Diagnostic check: unclosed strings ─────────────────────────────────────

/**
 * Check for unclosed string literals on each line.
 *
 * In IEC 61131-3, single-quoted strings are STRING literals and
 * double-quoted strings are WSTRING literals. Both must open and close
 * on the same line (ST does not support multi-line string literals).
 *
 * We scan character-by-character to properly handle escaped quotes ('' inside
 * single-quoted strings, "" inside double-quoted strings).
 */
function checkUnclosedStrings(cleanLines: CleanLine[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    for (const cl of cleanLines) {
        const line = cl.text;
        let i = 0;

        while (i < line.length) {
            const ch = line[i];

            if (ch === "'") {
                // Start of single-quoted string
                const startCol = i;
                i++; // skip opening quote
                let closed = false;
                while (i < line.length) {
                    if (line[i] === "'") {
                        // Check for escaped quote ''
                        if (i + 1 < line.length && line[i + 1] === "'") {
                            i += 2; // skip ''
                            continue;
                        }
                        closed = true;
                        i++; // skip closing quote
                        break;
                    }
                    i++;
                }
                if (!closed) {
                    diagnostics.push(createDiagnostic(
                        cl.lineIndex, startCol, line.length - startCol,
                        'Unclosed string literal (single quote)',
                        DiagnosticSeverity.Error
                    ));
                }
            } else if (ch === '"') {
                // Start of double-quoted string (WSTRING)
                const startCol = i;
                i++; // skip opening quote
                let closed = false;
                while (i < line.length) {
                    if (line[i] === '"') {
                        // Check for escaped quote ""
                        if (i + 1 < line.length && line[i + 1] === '"') {
                            i += 2; // skip ""
                            continue;
                        }
                        closed = true;
                        i++; // skip closing quote
                        break;
                    }
                    i++;
                }
                if (!closed) {
                    diagnostics.push(createDiagnostic(
                        cl.lineIndex, startCol, line.length - startCol,
                        'Unclosed string literal (double quote)',
                        DiagnosticSeverity.Error
                    ));
                }
            } else {
                i++;
            }
        }
    }

    return diagnostics;
}

// ─── Diagnostic check: unmatched parentheses ────────────────────────────────

/**
 * Check for unmatched parentheses within each line (after stripping comments
 * and strings).
 *
 * We strip string literals from the cleaned line first, then count parens.
 * This avoids false positives for parens inside strings.
 */
function checkUnmatchedParentheses(cleanLines: CleanLine[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    let crossLineDepth = 0; // tracks open parens spanning multiple lines
    let crossLineOpenLineIndex = -1;
    let crossLineOpenCol = -1;

    for (const cl of cleanLines) {
        const lineNoStrings = stripStringLiterals(cl.text);

        let lineDepth = crossLineDepth;
        let firstOpenCol = crossLineDepth > 0 ? crossLineOpenCol : -1;

        for (let i = 0; i < lineNoStrings.length; i++) {
            if (lineNoStrings[i] === '(') {
                if (lineDepth === 0) {
                    firstOpenCol = i;
                    crossLineOpenLineIndex = cl.lineIndex;
                    crossLineOpenCol = i;
                }
                lineDepth++;
            } else if (lineNoStrings[i] === ')') {
                lineDepth--;
                if (lineDepth < 0) {
                    diagnostics.push(createDiagnostic(
                        cl.lineIndex, i, 1,
                        'Unmatched closing parenthesis',
                        DiagnosticSeverity.Error
                    ));
                    lineDepth = 0;
                }
            }
        }

        crossLineDepth = lineDepth;

        // Unclosed parens on a statement line (ends with ;) — multi-line FB
        // calls don't end with ; so we only flag genuine errors here.
        if (lineDepth > 0 && cl.text.trimEnd().endsWith(';')) {
            diagnostics.push(createDiagnostic(
                cl.lineIndex,
                firstOpenCol >= 0 ? firstOpenCol : 0,
                1,
                `Unmatched opening parenthesis (${lineDepth} unclosed)`,
                DiagnosticSeverity.Error
            ));
            crossLineDepth = 0;
        }
    }

    return diagnostics;
}

/**
 * Strip string literals from a line, replacing them with spaces
 * to preserve character positions.
 */
function stripStringLiterals(line: string): string {
    const chars = line.split('');
    let i = 0;

    while (i < chars.length) {
        if (chars[i] === "'") {
            chars[i] = ' ';
            i++;
            while (i < chars.length) {
                if (chars[i] === "'") {
                    if (i + 1 < chars.length && chars[i + 1] === "'") {
                        chars[i] = ' ';
                        chars[i + 1] = ' ';
                        i += 2;
                        continue;
                    }
                    chars[i] = ' ';
                    i++;
                    break;
                }
                chars[i] = ' ';
                i++;
            }
        } else if (chars[i] === '"') {
            chars[i] = ' ';
            i++;
            while (i < chars.length) {
                if (chars[i] === '"') {
                    if (i + 1 < chars.length && chars[i + 1] === '"') {
                        chars[i] = ' ';
                        chars[i + 1] = ' ';
                        i += 2;
                        continue;
                    }
                    chars[i] = ' ';
                    i++;
                    break;
                }
                chars[i] = ' ';
                i++;
            }
        } else {
            i++;
        }
    }

    return chars.join('');
}

// ─── ELSE IF → ELSIF check ───────────────────────────────────────────────────

/**
 * Detect `ELSE IF` (two separate keywords) which is invalid in IEC 61131-3.
 * The correct keyword is `ELSIF`. Common mistake from C/Python/JavaScript devs.
 *
 * Detects the pattern on a single clean line: the token ELSE immediately
 * followed (as the next token) by IF. Case-insensitive.
 */
function checkElseIfShouldBeElsif(cleanLines: CleanLine[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    // Matches ELSE <optional whitespace> IF at a word boundary
    const elseIfRegex = /\b(else)\s+(if)\b/i;

    for (const cl of cleanLines) {
        const noStrings = stripStringLiterals(cl.text);
        const match = elseIfRegex.exec(noStrings);
        if (match) {
            diagnostics.push(createDiagnostic(
                cl.lineIndex,
                match.index,
                match[0].length,
                "'ELSE IF' is not valid IEC 61131-3 syntax; use 'ELSIF'",
                DiagnosticSeverity.Error
            ));
        }
    }

    return diagnostics;
}

// ─── Missing THEN / DO check ─────────────────────────────────────────────────

/**
 * Detect missing THEN after IF/ELSIF conditions and missing DO after
 * FOR/WHILE headers.
 *
 * Strategy: within POU bodies (outside VAR sections), find lines where:
 *  - The first token is IF or ELSIF, and the last token is not THEN
 *  - The first token is FOR or WHILE, and the last token is not DO
 *
 * Multi-line conditions (open parens) are skipped until the paren closes,
 * then the closing line is checked for THEN/DO.
 */
function checkMissingThenDo(cleanLines: CleanLine[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pouBoundaries = findPouBoundaries(cleanLines);

    for (const pou of pouBoundaries) {
        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);

        // Track accumulated condition lines for multi-line IF/FOR/WHILE headers
        let accumulatingFor: 'IF' | 'FOR' | 'WHILE' | null = null;
        let accStartLine = -1;
        let parenDepth = 0;

        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;

            const trimmed = cl.text.trim();
            if (!trimmed) continue;

            const noStrings = stripStringLiterals(trimmed);
            const upperTrimmed = noStrings.toUpperCase().trim();

            if (accumulatingFor) {
                // Count parens on this continuation line
                for (const ch of noStrings) {
                    if (ch === '(') parenDepth++;
                    else if (ch === ')') parenDepth--;
                }
                if (parenDepth < 0) parenDepth = 0;

                if (parenDepth > 0) continue; // still in open paren

                // Parens balanced — check terminal keyword
                const expectedTerminal = accumulatingFor === 'IF' ? 'THEN' : 'DO';
                const lastToken = getLastKeywordToken(upperTrimmed);

                if (lastToken !== expectedTerminal) {
                    diagnostics.push(createDiagnostic(
                        cl.lineIndex,
                        cl.text.trimEnd().length,
                        0,
                        `'${accumulatingFor}' condition is missing '${expectedTerminal}'`,
                        DiagnosticSeverity.Error
                    ));
                }
                accumulatingFor = null;
                accStartLine = -1;
                continue;
            }

            // Check for IF / ELSIF / FOR / WHILE header start
            const firstToken = getFirstKeywordToken(upperTrimmed);
            if (firstToken !== 'IF' && firstToken !== 'ELSIF' &&
                firstToken !== 'FOR' && firstToken !== 'WHILE') continue;

            const keyword = firstToken as 'IF' | 'ELSIF' | 'FOR' | 'WHILE';
            const expectedTerminal = (keyword === 'IF' || keyword === 'ELSIF')
                ? 'THEN' : 'DO';

            // Count parens on this line
            parenDepth = 0;
            for (const ch of noStrings) {
                if (ch === '(') parenDepth++;
                else if (ch === ')') parenDepth--;
            }
            if (parenDepth < 0) parenDepth = 0;

            if (parenDepth > 0) {
                // Multi-line condition — accumulate
                accumulatingFor = (keyword === 'FOR' || keyword === 'WHILE') ? keyword : 'IF';
                accStartLine = cl.lineIndex;
                continue;
            }

            // Single-line header — check last token
            const lastToken = getLastKeywordToken(upperTrimmed);
            if (lastToken !== expectedTerminal) {
                diagnostics.push(createDiagnostic(
                    cl.lineIndex,
                    cl.text.trimEnd().length,
                    0,
                    `'${firstToken}' is missing '${expectedTerminal}'`,
                    DiagnosticSeverity.Error
                ));
            }
        }
    }

    return diagnostics;
}

/**
 * Get the last keyword-like token from an uppercased trimmed line.
 */
function getLastKeywordToken(upperTrimmed: string): string | null {
    const matches = [...upperTrimmed.matchAll(/\b([A-Z_][A-Z0-9_]*)\b/g)];
    if (matches.length === 0) return null;
    return matches[matches.length - 1][1];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createDiagnostic(
    line: number,
    character: number,
    length: number,
    message: string,
    severity: DiagnosticSeverity
): Diagnostic {
    return {
        severity,
        range: {
            start: Position.create(line, character),
            end: Position.create(line, character + length),
        },
        message,
        source: 'ControlForge ST',
    };
}

// ─── FOR loop bounds validation ──────────────────────────────────────────────

/**
 * Parsed components of a FOR loop header.
 * Only populated when the component is a pure integer literal.
 */
interface ForLoopBounds {
    /** Start value (constant integer) */
    start: number | null;
    /** End value (constant integer) */
    end: number | null;
    /** BY step value (constant integer); null when BY clause is absent */
    by: number | null;
    /** Whether BY clause was explicitly present in source */
    hasByClause: boolean;
}

/**
 * Parse a FOR loop header line (cleaned, comments stripped) into its bounds.
 *
 * Matches:  FOR <ident> := <expr> TO <expr> [BY <expr>] DO
 * Returns null if the line is not a FOR header or bounds aren't constant integers.
 *
 * Per IEC 61131-3 §3.3.2.4 the default BY step is +1 when omitted.
 */
function parseForLoopHeader(line: string): ForLoopBounds | null {
    // Case-insensitive. Capture the three numeric expressions.
    // We allow optional whitespace and accept signed integers.
    const forRegex = /^\s*FOR\s+\w+\s*:=\s*(.+?)\s+TO\s+(.+?)(?:\s+BY\s+(.+?))?\s+DO\s*$/i;
    const match = line.match(forRegex);
    if (!match) return null;

    const parseConstant = (s: string): number | null => {
        const trimmed = s.trim();
        // Accept plain integer literals with optional leading sign
        if (/^[+-]?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
        return null;
    };

    return {
        start: parseConstant(match[1]),
        end: parseConstant(match[2]),
        by: match[3] !== undefined ? parseConstant(match[3]) : null,
        hasByClause: match[3] !== undefined,
    };
}

/**
 * Detect FOR loops with statically-provable bound problems.
 *
 * Checks (only when all relevant bounds are integer literals):
 *  - BY 0          → error   (infinite loop)
 *  - start > end with BY > 0 → warning (loop body never executes)
 *  - start < end with BY < 0 → warning (loop body never executes)
 *  - start === end           → info/hint (single iteration, likely unintended)
 *
 * Non-constant bounds (variables, expressions) are silently skipped.
 */
function checkForLoopBounds(cleanLines: CleanLine[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pouBoundaries = findPouBoundaries(cleanLines);

    for (const pou of pouBoundaries) {
        const varSections = findVarSections(cleanLines, pou.startLine, pou.endLine);

        for (const cl of cleanLines) {
            if (cl.lineIndex <= pou.startLine || cl.lineIndex >= pou.endLine) continue;
            if (isInVarSection(cl.lineIndex, varSections)) continue;

            const trimmed = cl.text.trim();
            if (!trimmed) continue;

            // Quick pre-filter: must start with FOR (case-insensitive)
            if (!/^FOR\b/i.test(trimmed)) continue;

            const bounds = parseForLoopHeader(trimmed);
            if (!bounds) continue;

            const { start, end, by, hasByClause } = bounds;

            // ── BY 0: always an error ────────────────────────────────
            if (hasByClause && by === 0) {
                // Point squiggle at the BY keyword
                const byIdx = cl.text.toUpperCase().indexOf(' BY ');
                const col = byIdx >= 0 ? byIdx + 1 : 0; // +1: skip the leading space
                diagnostics.push(createDiagnostic(
                    cl.lineIndex, col, 2,
                    'FOR loop step BY 0 causes an infinite loop',
                    DiagnosticSeverity.Error
                ));
                continue; // don't stack more diagnostics on same line
            }

            // ── Range checks (only when start and end are constants) ──
            if (start === null || end === null) continue;

            // Effective step: explicit BY, or default +1
            const step = by !== null ? by : 1;

            if (start === end) {
                // Single-iteration loop: start == end, body runs exactly once
                const forCol = cl.text.search(/\bFOR\b/i);
                diagnostics.push(createDiagnostic(
                    cl.lineIndex, forCol >= 0 ? forCol : 0, 3,
                    `FOR loop executes exactly once (start equals end: ${start})`,
                    DiagnosticSeverity.Hint
                ));
            } else if (start > end && step > 0) {
                // Descending range with positive step: body never executes
                const forCol = cl.text.search(/\bFOR\b/i);
                diagnostics.push(createDiagnostic(
                    cl.lineIndex, forCol >= 0 ? forCol : 0, 3,
                    `FOR loop body never executes: counting up (BY ${step}) but start (${start}) > end (${end}); use BY -1 or swap bounds`,
                    DiagnosticSeverity.Warning
                ));
            } else if (start < end && step < 0) {
                // Ascending range with negative step: body never executes
                const forCol = cl.text.search(/\bFOR\b/i);
                diagnostics.push(createDiagnostic(
                    cl.lineIndex, forCol >= 0 ? forCol : 0, 3,
                    `FOR loop body never executes: counting down (BY ${step}) but start (${start}) < end (${end}); use BY 1 or swap bounds`,
                    DiagnosticSeverity.Warning
                ));
            }
        }
    }

    return diagnostics;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute diagnostics for a Structured Text document.
 *
 * When `symbols` is provided (from STASTParser), semantic checks run
 * in addition to syntax checks: missing semicolons, duplicate declarations,
 * undefined variables, unused variables, type mismatches, FB call validation.
 *
 * @param document The text document
 * @param symbols Optional parsed symbols from STASTParser for semantic analysis
 */
export function computeDiagnostics(document: TextDocument, symbols?: STSymbolExtended[]): Diagnostic[] {
    const text = document.getText();
    const rawLines = text.split('\n');
    const cleanLines = stripAllComments(rawLines);

    const diagnostics: Diagnostic[] = [];

    // Phase 1: syntax checks
    diagnostics.push(...checkUnmatchedBlocks(cleanLines, rawLines));
    diagnostics.push(...checkUnclosedStrings(cleanLines));
    diagnostics.push(...checkUnmatchedParentheses(cleanLines));
    diagnostics.push(...checkElseIfShouldBeElsif(cleanLines));
    diagnostics.push(...checkMissingThenDo(cleanLines));

    // Phase 2: semantic checks (only when symbols available)
    if (symbols && symbols.length > 0) {
        diagnostics.push(...checkMissingSemicolons(cleanLines, rawLines));
        diagnostics.push(...checkDuplicateDeclarations(symbols));
        diagnostics.push(...checkUndefinedVariables(cleanLines, rawLines, symbols));
        diagnostics.push(...checkUnusedVariables(cleanLines, rawLines, symbols));
        diagnostics.push(...checkTypeMismatches(cleanLines, symbols));
        diagnostics.push(...checkFBCallInvalidMembers(cleanLines, rawLines, symbols));
        diagnostics.push(...checkFBCallDuplicateParams(cleanLines, rawLines, symbols));
        diagnostics.push(...checkConstantAssignment(cleanLines, rawLines, symbols));
        diagnostics.push(...checkArrayBoundsAccess(cleanLines, rawLines, symbols));
        diagnostics.push(...checkForLoopBounds(cleanLines));
    }

    return diagnostics;
}

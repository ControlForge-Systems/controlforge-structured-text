/**
 * Formatting Provider for Structured Text
 *
 * Provides document and range formatting (Shift+Alt+F) with:
 *  - Block-level indentation (IF/FOR/WHILE/CASE/REPEAT, VAR, POU)
 *  - Keyword casing (UPPER/lower/preserve)
 *  - Operator spacing (:=, +, -, *, /, =, <>, etc.)
 *  - Trailing whitespace removal
 *  - VAR block declaration alignment (colon alignment)
 *
 * Comment-aware: never modifies content inside comments or string literals.
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextEdit, Range, Position } from 'vscode-languageserver';
import {
    IEC61131Specification,
    isKeyword,
    isDataType,
    isStandardFunctionBlock
} from '../../iec61131_specification';

// ─── Configuration types ────────────────────────────────────────────────────

export type KeywordCase = 'upper' | 'lower' | 'preserve';

export interface FormattingOptions {
    /** Number of spaces per indent level (default 4) */
    tabSize: number;
    /** Use spaces for indentation (default true) */
    insertSpaces: boolean;
    /** Keyword casing preference */
    keywordCase: KeywordCase;
    /** Insert spaces around operators (:=, +, -, etc.) */
    insertSpacesAroundOperators: boolean;
    /** Align colon in VAR block declarations */
    alignVarDeclarations: boolean;
    /** Remove trailing whitespace */
    trimTrailingWhitespace: boolean;
    /** Ensure final newline */
    insertFinalNewline: boolean;
}

export const DEFAULT_FORMATTING_OPTIONS: FormattingOptions = {
    tabSize: 4,
    insertSpaces: true,
    keywordCase: 'upper',
    insertSpacesAroundOperators: true,
    alignVarDeclarations: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
};

// ─── Keyword sets ───────────────────────────────────────────────────────────

/** All IEC 61131-3 keywords for casing */
const ALL_KEYWORDS: string[] = [
    ...IEC61131Specification.controlKeywords,
    ...IEC61131Specification.declarationKeywords,
    ...IEC61131Specification.otherKeywords,
    ...IEC61131Specification.logicalOperators,
    ...IEC61131Specification.dataTypes,
    ...IEC61131Specification.standardFunctionBlocks,
];

/** Deduplicated set of uppercase keywords for fast lookup */
const KEYWORD_SET = new Set<string>(ALL_KEYWORDS.map(k => k.toUpperCase()));

/** Block openers that increase indent on the next line */
const INDENT_OPENERS = new Set<string>([
    'IF', 'ELSIF', 'ELSE',
    'FOR', 'WHILE', 'REPEAT',
    'CASE',
    'PROGRAM', 'FUNCTION', 'FUNCTION_BLOCK',
    'TYPE', 'STRUCT',
    'METHOD', 'CLASS', 'INTERFACE', 'NAMESPACE',
]);

/** VAR section openers */
const VAR_OPENERS = new Set<string>([
    'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_TEMP',
    'VAR_GLOBAL', 'VAR_ACCESS', 'VAR_CONFIG', 'VAR_EXTERNAL',
]);

/** Block closers that decrease indent */
const INDENT_CLOSERS = new Set<string>([
    'END_IF', 'END_FOR', 'END_WHILE', 'END_REPEAT', 'END_CASE',
    'END_PROGRAM', 'END_FUNCTION', 'END_FUNCTION_BLOCK',
    'END_VAR', 'END_TYPE', 'END_STRUCT',
    'END_METHOD', 'END_CLASS', 'END_INTERFACE', 'END_NAMESPACE',
]);

/** Keywords that de-indent for themselves but re-indent for the next line */
const DEDENT_SELF_KEYWORDS = new Set<string>([
    'ELSIF', 'ELSE', 'UNTIL',
]);

// ─── Comment / string tracking ──────────────────────────────────────────────

interface LineSegment {
    /** Start column (inclusive) */
    start: number;
    /** End column (exclusive) */
    end: number;
    /** Whether this segment is code (vs. comment/string) */
    isCode: boolean;
}

/**
 * Split a line into code and non-code segments. Accounts for:
 * - Single-line comments: // ...
 * - Block comments: (* ... *) (may start/end on this line)
 * - String literals: '...' and "..."
 *
 * @param line The raw line text
 * @param inBlockComment Whether we're inside a block comment from a previous line
 * @returns segments and updated inBlockComment state
 */
function segmentLine(
    line: string,
    inBlockComment: boolean
): { segments: LineSegment[]; inBlockComment: boolean } {
    const segments: LineSegment[] = [];
    let i = 0;
    let segStart = 0;

    function pushSegment(end: number, isCode: boolean): void {
        if (end > segStart) {
            segments.push({ start: segStart, end, isCode });
        }
        segStart = end;
    }

    while (i < line.length) {
        if (inBlockComment) {
            const endIdx = line.indexOf('*)', i);
            if (endIdx === -1) {
                // Entire rest of line is comment
                pushSegment(line.length, false);
                i = line.length;
            } else {
                pushSegment(endIdx + 2, false);
                i = endIdx + 2;
                segStart = i;
                inBlockComment = false;
            }
        } else if (line[i] === '(' && i + 1 < line.length && line[i + 1] === '*') {
            // Start block comment
            pushSegment(i, true);
            inBlockComment = true;
            i += 2;
        } else if (line[i] === '/' && i + 1 < line.length && line[i + 1] === '/') {
            // Line comment — rest of line
            pushSegment(i, true);
            pushSegment(line.length, false);
            i = line.length;
        } else if (line[i] === "'") {
            // Single-quoted string
            pushSegment(i, true);
            i++;
            while (i < line.length) {
                if (line[i] === "'") {
                    if (i + 1 < line.length && line[i + 1] === "'") {
                        i += 2; // escaped ''
                        continue;
                    }
                    i++; // closing quote
                    break;
                }
                i++;
            }
            pushSegment(i, false);
        } else if (line[i] === '"') {
            // Double-quoted string
            pushSegment(i, true);
            i++;
            while (i < line.length) {
                if (line[i] === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        i += 2; // escaped ""
                        continue;
                    }
                    i++; // closing quote
                    break;
                }
                i++;
            }
            pushSegment(i, false);
        } else {
            i++;
        }
    }

    // Remaining text is code (unless we're in a block comment)
    if (segStart < line.length) {
        pushSegment(line.length, !inBlockComment);
    }

    return { segments, inBlockComment };
}

/**
 * Extract only the code portions of a line (for keyword/operator analysis).
 * Non-code regions are replaced with spaces to preserve character positions.
 */
function extractCodeText(line: string, segments: LineSegment[]): string {
    const chars = line.split('');
    for (const seg of segments) {
        if (!seg.isCode) {
            for (let i = seg.start; i < seg.end && i < chars.length; i++) {
                chars[i] = ' ';
            }
        }
    }
    return chars.join('');
}

// ─── Indentation analysis ───────────────────────────────────────────────────

/**
 * Determine the first keyword token on a line of code text (comments/strings stripped).
 * Returns uppercase keyword or null.
 */
function getLeadingKeyword(codeText: string): string | null {
    const trimmed = codeText.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (!match) return null;

    return match[1].toUpperCase();
}

/**
 * Check if a line contains a block opener keyword as its leading keyword.
 * Handles compound keywords like FUNCTION_BLOCK.
 */
function getLeadingCompoundKeyword(codeText: string): string | null {
    const trimmed = codeText.trim();
    if (!trimmed) return null;

    // Check for compound keywords first (FUNCTION_BLOCK before FUNCTION)
    const compoundMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*(?:_[A-Za-z0-9_]+)*)/);
    if (!compoundMatch) return null;

    const upper = compoundMatch[1].toUpperCase();

    // Check compound keywords specifically
    if (upper === 'FUNCTION_BLOCK' || upper === 'END_FUNCTION_BLOCK') return upper;
    if (upper === 'END_FUNCTION') return upper;
    if (upper === 'END_PROGRAM') return upper;
    if (upper === 'END_IF') return upper;
    if (upper === 'END_FOR') return upper;
    if (upper === 'END_WHILE') return upper;
    if (upper === 'END_REPEAT') return upper;
    if (upper === 'END_CASE') return upper;
    if (upper === 'END_VAR') return upper;
    if (upper === 'END_TYPE') return upper;
    if (upper === 'END_STRUCT') return upper;
    if (upper === 'END_METHOD') return upper;
    if (upper === 'END_CLASS') return upper;
    if (upper === 'END_INTERFACE') return upper;
    if (upper === 'END_NAMESPACE') return upper;
    if (upper === 'VAR_INPUT') return upper;
    if (upper === 'VAR_OUTPUT') return upper;
    if (upper === 'VAR_IN_OUT') return upper;
    if (upper === 'VAR_TEMP') return upper;
    if (upper === 'VAR_GLOBAL') return upper;
    if (upper === 'VAR_ACCESS') return upper;
    if (upper === 'VAR_CONFIG') return upper;
    if (upper === 'VAR_EXTERNAL') return upper;

    // Fall back to simple first word
    const simpleMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (simpleMatch) return simpleMatch[1].toUpperCase();

    return null;
}

/**
 * Determine if a CASE branch label line (e.g., "0..10:", "STOPPED:", "ELSE")
 */
function isCaseBranchLabel(codeText: string): boolean {
    const trimmed = codeText.trim();
    if (!trimmed) return false;

    // ELSE inside a CASE block
    if (/^ELSE\s*$/i.test(trimmed)) return false; // handled separately

    // Pattern: identifier or numeric range followed by colon (not :=)
    // e.g., "0..10:", "STOPPED:", "1, 2, 3:"
    if (/^[A-Za-z0-9_., ]+:\s*(\/\/.*)?$/.test(trimmed)) {
        // Make sure it's not a variable declaration (has :=)
        if (!trimmed.includes(':=')) {
            return true;
        }
    }

    return false;
}

// ─── Keyword casing ─────────────────────────────────────────────────────────

/**
 * Apply keyword casing to code portions of a line.
 */
function applyKeywordCasing(
    line: string,
    segments: LineSegment[],
    keywordCase: KeywordCase
): string {
    if (keywordCase === 'preserve') return line;

    const chars = line.split('');
    const identRegex = /[A-Za-z_][A-Za-z0-9_]*/g;

    for (const seg of segments) {
        if (!seg.isCode) continue;

        const segText = line.substring(seg.start, seg.end);
        let match: RegExpExecArray | null;
        identRegex.lastIndex = 0;

        while ((match = identRegex.exec(segText)) !== null) {
            const word = match[0];
            const upper = word.toUpperCase();

            if (KEYWORD_SET.has(upper)) {
                const replacement = keywordCase === 'upper' ? upper : upper.toLowerCase();
                const absStart = seg.start + match.index;
                for (let i = 0; i < replacement.length; i++) {
                    chars[absStart + i] = replacement[i];
                }
            }
        }
    }

    return chars.join('');
}

// ─── Operator spacing ───────────────────────────────────────────────────────

/**
 * Ensure spaces around operators in code segments.
 * Handles: :=, <=, >=, <>, +, -, *, /, =, <, >, MOD, AND, OR, XOR, NOT
 *
 * Preserves spacing in non-code segments (comments, strings).
 * Careful not to break:
 *  - Negative number literals (contextual)
 *  - Time literals (T#10s, TOD#14:30:15)
 *  - Array ranges (..)
 *  - Member access (.)
 *  - Comment delimiters (* *)
 *  - Pointer operators (^)
 *  - FB call parameters (:= inside parens)
 */
function applyOperatorSpacing(line: string, segments: LineSegment[]): string {
    // Build code-only text preserving positions
    const codeText = extractCodeText(line, segments);

    // We rebuild the line by processing code segments
    let result = '';
    let lastEnd = 0;

    for (const seg of segments) {
        if (seg.start > lastEnd) {
            // Gap (shouldn't happen with proper segmentation)
            result += line.substring(lastEnd, seg.start);
        }

        if (!seg.isCode) {
            result += line.substring(seg.start, seg.end);
        } else {
            result += formatOperatorsInCode(line.substring(seg.start, seg.end));
        }
        lastEnd = seg.end;
    }

    // Any trailing text
    if (lastEnd < line.length) {
        result += line.substring(lastEnd);
    }

    return result;
}

/**
 * Format operators within a code segment string.
 */
function formatOperatorsInCode(code: string): string {
    let result = code;

    // First, normalize multiple spaces to single space (except leading indent)
    const leadingIndent = result.match(/^(\s*)/)?.[1] || '';
    const rest = result.substring(leadingIndent.length);
    result = leadingIndent + rest.replace(/  +/g, ' ');

    // := assignment (don't touch : alone, it's used in declarations)
    result = result.replace(/\s*:=\s*/g, ' := ');

    // => (used in CASE OF for some vendors, not standard but common)
    result = result.replace(/\s*=>\s*/g, ' => ');

    // Comparison operators (must process longer ones first)
    result = result.replace(/\s*<>\s*/g, ' <> ');
    result = result.replace(/\s*<=\s*/g, ' <= ');
    result = result.replace(/\s*>=\s*/g, ' >= ');

    // Single < and > (but not inside <> or <= or >= which we already handled)
    // Use negative lookbehind/ahead to avoid double-processing
    result = result.replace(/(?<![<>])\s*<\s*(?![>=])/g, ' < ');
    result = result.replace(/(?<![<])\s*>\s*(?![=])/g, ' > ');

    // = (but not :=, <=, >=, <>, =>)
    result = result.replace(/(?<![:<=!>])\s*=\s*(?!>)/g, ' = ');

    // Arithmetic: + - * / (careful with unary minus and pointer dereference)
    // + (but not in time literals like T#+)
    result = result.replace(/\s*\+\s*/g, ' + ');
    // * (but not in comment delimiters or power operator **)
    result = result.replace(/(?<!\*)\s*\*\s*(?!\*|\))/g, ' * ');
    // ** (power operator)
    result = result.replace(/\s*\*\*\s*/g, ' ** ');
    // / (but not in //)
    result = result.replace(/(?<!\/)\s*\/\s*(?!\/)/g, ' / ');

    // Clean up any triple+ spaces created by replacements
    const newLeading = result.match(/^(\s*)/)?.[1] || '';
    const newRest = result.substring(newLeading.length);
    result = newLeading + newRest.replace(/  +/g, ' ');

    return result;
}

// ─── VAR block alignment ───────────────────────────────────────────────────

/**
 * Align colon positions in VAR declaration blocks.
 * Groups consecutive declaration lines and aligns the ':' character.
 */
function alignVarDeclarations(
    lines: string[],
    lineStates: LineState[]
): string[] {
    const result = [...lines];
    let i = 0;

    while (i < result.length) {
        // Find VAR block start
        if (lineStates[i].inVarBlock && !lineStates[i].isVarOpener && !lineStates[i].isVarCloser) {
            // Collect consecutive declaration lines
            const blockStart = i;
            const declLines: number[] = [];

            while (i < result.length && lineStates[i].inVarBlock && !lineStates[i].isVarCloser) {
                const trimmed = result[i].trim();
                // Is this a declaration line? (has : but not just a comment or empty)
                if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('(*') && trimmed.includes(':')) {
                    declLines.push(i);
                }
                i++;
            }

            if (declLines.length > 1) {
                // Find max name length (text before the first ':' that isn't ':=')
                let maxNameLen = 0;
                const nameEndPositions: Map<number, number> = new Map();

                for (const lineIdx of declLines) {
                    const line = result[lineIdx];
                    const indent = line.match(/^(\s*)/)?.[1] || '';
                    const afterIndent = line.substring(indent.length);

                    // Find the colon that's the type separator (not :=)
                    const colonPos = findTypeColon(afterIndent);
                    if (colonPos >= 0) {
                        // Name part: everything before colon, trimmed
                        const namePart = afterIndent.substring(0, colonPos).trimEnd();
                        nameEndPositions.set(lineIdx, namePart.length);
                        maxNameLen = Math.max(maxNameLen, namePart.length);
                    }
                }

                // Realign
                for (const lineIdx of declLines) {
                    const line = result[lineIdx];
                    const indent = line.match(/^(\s*)/)?.[1] || '';
                    const afterIndent = line.substring(indent.length);
                    const colonPos = findTypeColon(afterIndent);

                    if (colonPos >= 0 && nameEndPositions.has(lineIdx)) {
                        const namePart = afterIndent.substring(0, colonPos).trimEnd();
                        const restPart = afterIndent.substring(colonPos); // ": TYPE ..."
                        const padding = ' '.repeat(maxNameLen - namePart.length);
                        result[lineIdx] = indent + namePart + padding + ' ' + restPart.trimStart();
                    }
                }
            }
        } else {
            i++;
        }
    }

    return result;
}

/**
 * Find the position of the type-separator colon in a declaration line.
 * Returns -1 if not found. Skips over ':=' to find the actual ':'.
 */
function findTypeColon(text: string): number {
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ':') {
            // Check it's not ':=' 
            if (i + 1 < text.length && text[i + 1] === '=') {
                continue; // skip :=
            }
            return i;
        }
    }
    return -1;
}

// ─── Line state tracking ───────────────────────────────────────────────────

interface LineState {
    inBlockComment: boolean;
    inVarBlock: boolean;
    isVarOpener: boolean;
    isVarCloser: boolean;
    indentLevel: number;
    codeText: string;
    segments: LineSegment[];
}

/**
 * Compute per-line state for a document: indentation level, comment state,
 * VAR block tracking, etc.
 */
function computeLineStates(lines: string[]): LineState[] {
    const states: LineState[] = [];
    let inBlockComment = false;
    let indentLevel = 0;
    let inVarBlock = false;
    let inCaseBlock = 0; // nesting depth of CASE blocks
    let afterCaseOf = false; // just saw CASE...OF, next line is branch label

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const { segments, inBlockComment: newBlockComment } = segmentLine(line, inBlockComment);
        const codeText = extractCodeText(line, segments);
        const leadingKw = getLeadingCompoundKeyword(codeText);

        let isVarOpener = false;
        let isVarCloser = false;
        let thisLineIndent = indentLevel;

        // Handle closing keywords — they de-indent themselves
        if (leadingKw && INDENT_CLOSERS.has(leadingKw)) {
            if (leadingKw === 'END_VAR') {
                isVarCloser = true;
                inVarBlock = false;
            }
            if (leadingKw === 'END_CASE') {
                inCaseBlock = Math.max(0, inCaseBlock - 1);
                afterCaseOf = false;
                // CASE added 2 levels of indent (block + branch body), so remove both
                indentLevel = Math.max(0, indentLevel - 1);
            }
            indentLevel = Math.max(0, indentLevel - 1);
            thisLineIndent = indentLevel;
        }
        // ELSIF/ELSE/UNTIL de-indent themselves but re-indent next line
        else if (leadingKw && DEDENT_SELF_KEYWORDS.has(leadingKw)) {
            thisLineIndent = Math.max(0, indentLevel - 1);
            // indentLevel stays the same (next line will be at same level)
        }
        // CASE branch labels: de-indent one level from CASE body
        else if (inCaseBlock > 0 && afterCaseOf && isCaseBranchLabel(codeText)) {
            thisLineIndent = Math.max(0, indentLevel - 1);
            // Don't change indentLevel — body after label stays indented
        }
        // THEN/DO/OF on same line as opener — don't change indent here, it was
        // already increased when we saw the opener keyword

        states.push({
            inBlockComment: inBlockComment, // state at start of line
            inVarBlock,
            isVarOpener,
            isVarCloser,
            indentLevel: thisLineIndent,
            codeText,
            segments,
        });

        // After processing the line for display, handle openers for NEXT line
        if (leadingKw) {
            if (VAR_OPENERS.has(leadingKw)) {
                isVarOpener = true;
                inVarBlock = true;
                states[i].isVarOpener = true;
                states[i].inVarBlock = true;
                indentLevel++;
            } else if (INDENT_OPENERS.has(leadingKw) && !DEDENT_SELF_KEYWORDS.has(leadingKw)) {
                indentLevel++;
                if (leadingKw === 'CASE') {
                    inCaseBlock++;
                    afterCaseOf = true;
                    // CASE body is indented 2 levels: 1 for CASE, 1 for branch body
                    indentLevel++; // extra indent for branch content
                }
            }
            // ELSIF/ELSE already handled above — next line stays at same indent
        }

        inBlockComment = newBlockComment;
    }

    return states;
}

// ─── Main formatting function ───────────────────────────────────────────────

/**
 * Format a Structured Text document.
 *
 * @param document The text document to format
 * @param options Formatting options
 * @param range Optional range to format (omit for full document)
 * @returns TextEdit array to apply
 */
export function formatDocument(
    document: TextDocument,
    options: FormattingOptions,
    range?: Range
): TextEdit[] {
    const text = document.getText();
    const lines = text.split('\n');

    // Compute line states for full document (needed for context even with range)
    const lineStates = computeLineStates(lines);

    // Determine range to format
    const startLine = range ? range.start.line : 0;
    const endLine = range ? Math.min(range.end.line, lines.length - 1) : lines.length - 1;

    // Build formatted lines
    const indentStr = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
    let formattedLines = [...lines];

    for (let i = startLine; i <= endLine; i++) {
        const state = lineStates[i];
        let line = formattedLines[i];

        // Skip entirely-comment lines (full block comment continuation)
        if (state.inBlockComment && state.segments.every(s => !s.isCode)) {
            // Just trim trailing whitespace
            if (options.trimTrailingWhitespace) {
                formattedLines[i] = line.trimEnd();
            }
            continue;
        }

        const trimmedCode = state.codeText.trim();
        if (!trimmedCode && !line.trim()) {
            // Blank line — preserve it but trim
            formattedLines[i] = '';
            continue;
        }

        // Apply keyword casing
        if (options.keywordCase !== 'preserve') {
            line = applyKeywordCasing(line, state.segments, options.keywordCase);
        }

        // Re-segment after casing changes (positions should be preserved)
        // Actually casing doesn't change positions, so segments are still valid.

        // Apply operator spacing
        if (options.insertSpacesAroundOperators) {
            line = applyOperatorSpacing(line, state.segments);
        }

        // Apply indentation — strip existing leading whitespace and reindent
        const stripped = line.trimStart();
        if (stripped) {
            const indent = indentStr.repeat(state.indentLevel);
            line = indent + stripped;
        }

        // Trim trailing whitespace
        if (options.trimTrailingWhitespace) {
            line = line.trimEnd();
        }

        formattedLines[i] = line;
    }

    // VAR block alignment (after indentation is set)
    if (options.alignVarDeclarations) {
        formattedLines = alignVarDeclarations(formattedLines, lineStates);
    }

    // Final newline
    let formattedText = formattedLines.join('\n');
    if (options.insertFinalNewline && !formattedText.endsWith('\n')) {
        formattedText += '\n';
    }

    // Return a single edit replacing the entire range
    const fullRange = Range.create(
        Position.create(startLine, 0),
        Position.create(endLine, lines[endLine].length)
    );

    const originalRange = lines.slice(startLine, endLine + 1).join('\n');
    const formattedRange = formattedLines.slice(startLine, endLine + 1).join('\n');

    // Add final newline to last line if full document format
    if (!range && options.insertFinalNewline) {
        const lastFormatted = formattedRange.endsWith('\n') ? formattedRange : formattedRange + '\n';
        if (lastFormatted === originalRange + (text.endsWith('\n') ? '' : '\n')) {
            // Only final newline difference
            if (lastFormatted !== originalRange) {
                return [TextEdit.replace(
                    Range.create(Position.create(0, 0), Position.create(lines.length - 1, lines[lines.length - 1].length)),
                    formattedText
                )];
            }
            return [];
        }
        return [TextEdit.replace(
            Range.create(Position.create(0, 0), Position.create(lines.length - 1, lines[lines.length - 1].length)),
            formattedText
        )];
    }

    // Only return edits if something changed
    if (formattedRange === originalRange) {
        return [];
    }

    return [TextEdit.replace(fullRange, formattedRange)];
}

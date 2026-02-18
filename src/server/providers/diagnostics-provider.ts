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
 *  - Unmatched parentheses within lines
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode-languageserver';

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
 *  - Block comments (* ... *) spanning multiple lines
 *  - Single-line comments //
 *
 * Does NOT handle nested block comments (consistent with the AST parser).
 */
function stripAllComments(lines: string[]): CleanLine[] {
    const result: CleanLine[] = [];
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let cleaned = '';
        let j = 0;

        while (j < line.length) {
            if (inBlockComment) {
                const endIdx = line.indexOf('*)', j);
                if (endIdx === -1) {
                    // Rest of line is inside block comment
                    j = line.length;
                } else {
                    j = endIdx + 2;
                    inBlockComment = false;
                }
            } else {
                // Check for block comment start
                if (j < line.length - 1 && line[j] === '(' && line[j + 1] === '*') {
                    inBlockComment = true;
                    j += 2;
                }
                // Check for single-line comment
                else if (j < line.length - 1 && line[j] === '/' && line[j + 1] === '/') {
                    // Rest of line is comment
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
 * Extract keyword-like tokens from an uppercased line.
 * Returns tokens that could be ST keywords (word characters including underscores).
 */
function extractKeywordTokens(lineUpper: string): { text: string; start: number }[] {
    const results: { text: string; start: number }[] = [];
    const regex = /\b([A-Z_][A-Z0-9_]*)\b/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineUpper)) !== null) {
        results.push({ text: match[1], start: match.index });
    }

    // Merge adjacent tokens that form compound keywords like FUNCTION_BLOCK, END_FUNCTION_BLOCK, etc.
    // Actually our regex already handles underscores, so FUNCTION_BLOCK is one token. Good.

    return results;
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

    for (const cl of cleanLines) {
        // Strip string literals to avoid counting parens inside them
        const lineNoStrings = stripStringLiterals(cl.text);

        let depth = 0;
        let firstUnmatchedOpen = -1;

        for (let i = 0; i < lineNoStrings.length; i++) {
            if (lineNoStrings[i] === '(') {
                if (depth === 0) {
                    firstUnmatchedOpen = i;
                }
                depth++;
            } else if (lineNoStrings[i] === ')') {
                depth--;
                if (depth < 0) {
                    diagnostics.push(createDiagnostic(
                        cl.lineIndex, i, 1,
                        'Unmatched closing parenthesis',
                        DiagnosticSeverity.Error
                    ));
                    depth = 0; // reset to continue scanning
                }
            }
        }

        if (depth > 0) {
            const col = firstUnmatchedOpen >= 0 ? firstUnmatchedOpen : 0;
            diagnostics.push(createDiagnostic(
                cl.lineIndex, col, 1,
                `Unmatched opening parenthesis (${depth} unclosed)`,
                DiagnosticSeverity.Error
            ));
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

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute diagnostics for a Structured Text document.
 *
 * Returns an array of LSP Diagnostic objects ready to be sent via
 * `connection.sendDiagnostics()`.
 */
export function computeDiagnostics(document: TextDocument): Diagnostic[] {
    const text = document.getText();
    const rawLines = text.split('\n');
    const cleanLines = stripAllComments(rawLines);

    const diagnostics: Diagnostic[] = [];

    diagnostics.push(...checkUnmatchedBlocks(cleanLines, rawLines));
    diagnostics.push(...checkUnclosedStrings(cleanLines));
    diagnostics.push(...checkUnmatchedParentheses(cleanLines));

    return diagnostics;
}

/**
 * Code Action Provider for Structured Text
 *
 * Provides quick fixes for diagnostics produced by the diagnostics provider:
 *  - Insert missing END_* keywords for unmatched blocks
 *  - Remove orphaned END_* keywords without matching openers
 *  - Close unclosed string literals
 *  - Fix unmatched parentheses
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    Diagnostic,
    Position,
    Range,
    TextEdit,
    WorkspaceEdit
} from 'vscode-languageserver';

// ─── POU keywords (top-level blocks) ────────────────────────────────────────

const POU_KEYWORDS = new Set(['PROGRAM', 'FUNCTION', 'FUNCTION_BLOCK']);

// ─── Control flow keywords ──────────────────────────────────────────────────

const CONTROL_FLOW_KEYWORDS = new Set(['IF', 'FOR', 'WHILE', 'CASE', 'REPEAT', 'STRUCT', 'TYPE']);

// ─── VAR section keywords ───────────────────────────────────────────────────

const VAR_SECTION_KEYWORDS = new Set([
    'VAR',
    'VAR_INPUT',
    'VAR_OUTPUT',
    'VAR_IN_OUT',
    'VAR_TEMP',
    'VAR_GLOBAL',
    'VAR_CONFIG',
    'VAR_ACCESS',
    'VAR_EXTERNAL',
]);

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Provide code actions for the given diagnostics.
 *
 * @param document The text document
 * @param params Code action request params (includes diagnostics)
 * @returns Array of code actions (quick fixes)
 */
export function provideCodeActions(
    document: TextDocument,
    params: CodeActionParams
): CodeAction[] {
    const actions: CodeAction[] = [];

    for (const diagnostic of params.context.diagnostics) {
        // Only handle diagnostics from our provider
        if (diagnostic.source !== 'ControlForge ST') {
            continue;
        }

        const message = diagnostic.message;

        // Handle missing END_* blocks
        if (message.includes('is missing closing')) {
            const action = createInsertClosingKeywordAction(document, diagnostic);
            if (action) {
                actions.push(action);
            }
        }
        // Handle orphaned END_* without opener
        else if (message.includes('without matching')) {
            const action = createRemoveOrphanedKeywordAction(document, diagnostic);
            if (action) {
                actions.push(action);
            }
        }
        // Handle unclosed string literals
        else if (message.includes('Unclosed string literal')) {
            const action = createCloseStringLiteralAction(document, diagnostic);
            if (action) {
                actions.push(action);
            }
        }
        // Handle unmatched parentheses
        else if (message.includes('Unmatched opening parenthesis')) {
            const action = createCloseParenthesisAction(document, diagnostic);
            if (action) {
                actions.push(action);
            }
        } else if (message.includes('Unmatched closing parenthesis')) {
            const action = createRemoveClosingParenthesisAction(document, diagnostic);
            if (action) {
                actions.push(action);
            }
        }
    }

    return actions;
}

// ─── Action creators ────────────────────────────────────────────────────────

/**
 * Create action to insert missing closing keyword (END_*).
 *
 * Message format: "'KEYWORD' is missing closing 'END_KEYWORD'"
 */
function createInsertClosingKeywordAction(
    document: TextDocument,
    diagnostic: Diagnostic
): CodeAction | null {
    const match = diagnostic.message.match(/'([A-Z_]+)' is missing closing '([A-Z_]+)'/);
    if (!match) {
        return null;
    }

    const openKeyword = match[1];
    const closeKeyword = match[2];
    const openLine = diagnostic.range.start.line;

    // Determine insertion position and indentation based on keyword type
    let insertPosition: Position;
    let indentLevel = 0;

    const text = document.getText();
    const lines = text.split('\n');
    const openLineText = lines[openLine];

    // Extract indentation from the opening line
    const openIndentMatch = openLineText.match(/^(\s*)/);
    const openIndent = openIndentMatch ? openIndentMatch[1] : '';

    if (POU_KEYWORDS.has(openKeyword)) {
        // POU blocks: insert before end of document or before next POU
        const nextPouLine = findNextPouStart(lines, openLine + 1);
        if (nextPouLine !== -1) {
            insertPosition = Position.create(nextPouLine, 0);
        } else {
            // Insert at end of document
            insertPosition = Position.create(lines.length, 0);
        }
        // Use same indentation as opening
        indentLevel = openIndent.length;
    } else if (VAR_SECTION_KEYWORDS.has(openKeyword)) {
        // VAR sections: insert on next line with same indentation
        insertPosition = Position.create(openLine + 1, 0);
        indentLevel = openIndent.length;
    } else if (CONTROL_FLOW_KEYWORDS.has(openKeyword)) {
        // Control flow: insert on next line with same indentation
        insertPosition = Position.create(openLine + 1, 0);
        indentLevel = openIndent.length;
    } else {
        // Default: insert on next line with same indentation
        insertPosition = Position.create(openLine + 1, 0);
        indentLevel = openIndent.length;
    }

    const indent = ' '.repeat(indentLevel);
    const insertText = `${indent}${closeKeyword}\n`;

    const edit: WorkspaceEdit = {
        changes: {
            [document.uri]: [
                TextEdit.insert(insertPosition, insertText)
            ]
        }
    };

    return {
        title: `Insert ${closeKeyword}`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

/**
 * Create action to remove orphaned END_* keyword.
 *
 * Message format: "'END_KEYWORD' without matching 'KEYWORD'"
 */
function createRemoveOrphanedKeywordAction(
    document: TextDocument,
    diagnostic: Diagnostic
): CodeAction | null {
    const match = diagnostic.message.match(/'([A-Z_]+)' without matching/);
    if (!match) {
        return null;
    }

    const keyword = match[1];
    const line = diagnostic.range.start.line;

    const text = document.getText();
    const lines = text.split('\n');
    const lineText = lines[line];

    // Remove the entire line
    const range: Range = {
        start: Position.create(line, 0),
        end: Position.create(line + 1, 0)
    };

    const edit: WorkspaceEdit = {
        changes: {
            [document.uri]: [
                TextEdit.del(range)
            ]
        }
    };

    return {
        title: `Remove orphaned ${keyword}`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

/**
 * Create action to close unclosed string literal.
 *
 * Message format: "Unclosed string literal (single quote)" or "(double quote)"
 */
function createCloseStringLiteralAction(
    document: TextDocument,
    diagnostic: Diagnostic
): CodeAction | null {
    const isSingleQuote = diagnostic.message.includes('single quote');
    const quoteChar = isSingleQuote ? "'" : '"';
    const line = diagnostic.range.start.line;

    const text = document.getText();
    const lines = text.split('\n');
    const lineText = lines[line];

    // Find the end position (before semicolon if present, otherwise at end of line)
    let insertPos = lineText.length;
    const semicolonIdx = lineText.indexOf(';');
    if (semicolonIdx !== -1 && semicolonIdx > diagnostic.range.start.character) {
        insertPos = semicolonIdx;
    }

    const insertPosition = Position.create(line, insertPos);

    const edit: WorkspaceEdit = {
        changes: {
            [document.uri]: [
                TextEdit.insert(insertPosition, quoteChar)
            ]
        }
    };

    return {
        title: 'Close string literal',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

/**
 * Create action to close unmatched opening parenthesis.
 *
 * Message format: "Unmatched opening parenthesis (N unclosed)"
 */
function createCloseParenthesisAction(
    document: TextDocument,
    diagnostic: Diagnostic
): CodeAction | null {
    const match = diagnostic.message.match(/Unmatched opening parenthesis \((\d+) unclosed\)/);
    if (!match) {
        return null;
    }

    const unclosedCount = parseInt(match[1], 10);
    const line = diagnostic.range.start.line;

    const text = document.getText();
    const lines = text.split('\n');
    const lineText = lines[line];

    // Insert at end of line
    const insertPosition = Position.create(line, lineText.length);
    const closeParens = ')'.repeat(unclosedCount);

    const edit: WorkspaceEdit = {
        changes: {
            [document.uri]: [
                TextEdit.insert(insertPosition, closeParens)
            ]
        }
    };

    const title = unclosedCount === 1 ? 'Add closing parenthesis' : `Add ${unclosedCount} closing parentheses`;

    return {
        title,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

/**
 * Create action to remove unmatched closing parenthesis.
 *
 * Message format: "Unmatched closing parenthesis"
 */
function createRemoveClosingParenthesisAction(
    document: TextDocument,
    diagnostic: Diagnostic
): CodeAction | null {
    const range = diagnostic.range;

    const edit: WorkspaceEdit = {
        changes: {
            [document.uri]: [
                TextEdit.del(range)
            ]
        }
    };

    return {
        title: 'Remove extra closing parenthesis',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find the line number of the next POU start (PROGRAM, FUNCTION, FUNCTION_BLOCK)
 * after the given line.
 *
 * @returns Line number or -1 if not found
 */
function findNextPouStart(lines: string[], startLine: number): number {
    const pouRegex = /^\s*(PROGRAM|FUNCTION_BLOCK|FUNCTION)\b/i;

    for (let i = startLine; i < lines.length; i++) {
        if (pouRegex.test(lines[i])) {
            return i;
        }
    }

    return -1;
}

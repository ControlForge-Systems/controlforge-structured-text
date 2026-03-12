/**
 * Rename Provider for Structured Text
 * Supports F2 rename across single and multiple files with IEC 61131-3 validation.
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    Position,
    Range,
    WorkspaceEdit,
    TextEdit,
    ResponseError
} from 'vscode-languageserver';
import { WorkspaceIndexer } from '../workspace-indexer';
import { SymbolIndex, STSymbolExtended } from '../../shared/types';
import {
    isKeyword,
    isDataType,
    IEC61131Specification
} from '../../iec61131_specification';

/** IEC 61131-3 identifier pattern */
const IDENTIFIER_REGEX = /[A-Za-z_][A-Za-z0-9_]*/g;

/** Valid IEC identifier (full match) */
const VALID_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Result from prepareRename — the current word range and placeholder text.
 */
export interface PrepareRenameResult {
    range: Range;
    placeholder: string;
}

/**
 * Check if a name is a standard function (ABS, LEN, etc.)
 */
function isStandardFunction(name: string): boolean {
    return IEC61131Specification.standardFunctions
        .some(f => f.toLowerCase() === name.toLowerCase());
}

/**
 * Check if the name refers to any built-in / non-renameable symbol.
 */
function isBuiltIn(name: string): boolean {
    return isKeyword(name) || isDataType(name) || isStandardFunction(name);
}

/**
 * Extract the word (identifier) at a given position in a line of text.
 * Returns the word and its character range, or null if cursor is not on an identifier.
 */
export function getWordAtPosition(
    lineText: string,
    character: number
): { word: string; start: number; end: number } | null {
    const regex = new RegExp(IDENTIFIER_REGEX.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (character >= start && character < end) {
            return { word: match[0], start, end };
        }
    }
    return null;
}

/**
 * Validate a new name against IEC 61131-3 rules.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateNewName(newName: string): string | null {
    if (!VALID_IDENTIFIER.test(newName)) {
        return `"${newName}" is not a valid IEC 61131-3 identifier`;
    }
    if (isKeyword(newName)) {
        return `"${newName}" is a reserved keyword`;
    }
    if (isDataType(newName)) {
        return `"${newName}" is a reserved data type`;
    }
    if (isStandardFunction(newName)) {
        return `"${newName}" is a standard function name`;
    }
    return null;
}

/**
 * Find all occurrences of `symbolName` as a whole-word identifier in document text.
 * Case-insensitive per IEC 61131-3. Skips occurrences inside comments.
 */
export function findAllOccurrences(
    text: string,
    symbolName: string
): { line: number; start: number; end: number }[] {
    const results: { line: number; start: number; end: number }[] = [];
    const lines = text.split('\n');
    const lowerName = symbolName.toLowerCase();

    // Build comment ranges for the whole text (line-level granularity)
    const commentRanges = buildCommentRanges(text);

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const regex = new RegExp(IDENTIFIER_REGEX.source, 'g');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(line)) !== null) {
            if (match[0].toLowerCase() === lowerName) {
                const charStart = match.index;
                const charEnd = charStart + match[0].length;

                // Skip if inside a comment
                if (!isInComment(lineIdx, charStart, charEnd, commentRanges)) {
                    results.push({ line: lineIdx, start: charStart, end: charEnd });
                }
            }
        }
    }
    return results;
}

/**
 * Comment range: line-start/char-start to line-end/char-end.
 */
interface CommentRange {
    startLine: number;
    startChar: number;
    endLine: number;
    endChar: number;
}

/**
 * Build all comment ranges in a document. Handles:
 * - Line comments: // ... to end of line
 * - Block comments: (* ... *) including nested
 */
function buildCommentRanges(text: string): CommentRange[] {
    const ranges: CommentRange[] = [];
    const lines = text.split('\n');
    let blockDepth = 0;
    let blockStartLine = 0;
    let blockStartChar = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        let i = 0;

        while (i < line.length) {
            if (blockDepth > 0) {
                if (i + 1 < line.length && line[i] === '(' && line[i + 1] === '*') {
                    blockDepth++;
                    i += 2;
                } else if (i + 1 < line.length && line[i] === '*' && line[i + 1] === ')') {
                    blockDepth--;
                    if (blockDepth === 0) {
                        ranges.push({
                            startLine: blockStartLine,
                            startChar: blockStartChar,
                            endLine: lineIdx,
                            endChar: i + 2
                        });
                    }
                    i += 2;
                } else {
                    i++;
                }
            } else {
                // Check for line comment
                if (i + 1 < line.length && line[i] === '/' && line[i + 1] === '/') {
                    ranges.push({
                        startLine: lineIdx,
                        startChar: i,
                        endLine: lineIdx,
                        endChar: line.length
                    });
                    break;
                }
                // Check for block comment start
                if (i + 1 < line.length && line[i] === '(' && line[i + 1] === '*') {
                    blockStartLine = lineIdx;
                    blockStartChar = i;
                    blockDepth++;
                    i += 2;
                    continue;
                }
                i++;
            }
        }
    }

    // If still in block comment at EOF, close it
    if (blockDepth > 0) {
        const lastLine = lines.length - 1;
        ranges.push({
            startLine: blockStartLine,
            startChar: blockStartChar,
            endLine: lastLine,
            endChar: lines[lastLine].length
        });
    }

    return ranges;
}

/**
 * Check if a character range falls inside any comment range.
 */
function isInComment(
    line: number,
    charStart: number,
    charEnd: number,
    commentRanges: CommentRange[]
): boolean {
    for (const cr of commentRanges) {
        // Is the occurrence entirely within this comment?
        const afterStart = line > cr.startLine ||
            (line === cr.startLine && charStart >= cr.startChar);
        const beforeEnd = line < cr.endLine ||
            (line === cr.endLine && charEnd <= cr.endChar);
        if (afterStart && beforeEnd) {
            return true;
        }
    }
    return false;
}

/**
 * Prepare rename: validate cursor is on a renameable identifier.
 * Returns the word range + placeholder, or throws ResponseError if not renameable.
 */
export function prepareRename(
    document: TextDocument,
    position: Position,
    workspaceIndexer: WorkspaceIndexer,
    symbolIndex: SymbolIndex
): PrepareRenameResult {
    const lineText = document.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: Number.MAX_VALUE }
    });

    const wordInfo = getWordAtPosition(lineText, position.character);
    if (!wordInfo) {
        throw new ResponseError(0, 'Cannot rename at this position');
    }

    // Reject built-in identifiers
    if (isBuiltIn(wordInfo.word)) {
        throw new ResponseError(0, `Cannot rename built-in "${wordInfo.word}"`);
    }

    // Verify symbol is known (exists in workspace or local index)
    const lowerWord = wordInfo.word.toLowerCase();
    const inWorkspace = workspaceIndexer.findSymbolsByName(wordInfo.word).length > 0;
    let inLocal = false;
    for (const [name] of symbolIndex.symbolsByName.entries()) {
        if (name.toLowerCase() === lowerWord) {
            inLocal = true;
            break;
        }
    }
    if (!inWorkspace && !inLocal) {
        throw new ResponseError(0, `Symbol "${wordInfo.word}" not found`);
    }

    // Check if inside a comment
    const fullText = document.getText();
    const commentRanges = buildCommentRanges(fullText);
    if (isInComment(position.line, wordInfo.start, wordInfo.end, commentRanges)) {
        throw new ResponseError(0, 'Cannot rename inside a comment');
    }

    return {
        range: Range.create(
            position.line, wordInfo.start,
            position.line, wordInfo.end
        ),
        placeholder: wordInfo.word
    };
}

/**
 * Provide rename edits: compute WorkspaceEdit replacing all occurrences
 * of the symbol across all indexed files.
 *
 * @param textResolver - Called with a URI to obtain that file's raw text.
 *   Must return `undefined` for URIs whose content is unavailable (skipped).
 *   The active document's text is always obtained directly and does not need
 *   to be covered by this resolver.
 */
export function provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
    workspaceIndexer: WorkspaceIndexer,
    symbolIndex: SymbolIndex,
    textResolver?: (uri: string) => string | undefined
): WorkspaceEdit {
    // Validate new name
    const nameError = validateNewName(newName);
    if (nameError) {
        throw new ResponseError(0, nameError);
    }

    // Get original symbol name
    const lineText = document.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: Number.MAX_VALUE }
    });
    const wordInfo = getWordAtPosition(lineText, position.character);
    if (!wordInfo) {
        throw new ResponseError(0, 'Cannot rename at this position');
    }

    const originalName = wordInfo.word;

    // No-op if same name (case-insensitive)
    if (originalName.toLowerCase() === newName.toLowerCase()) {
        return { changes: {} };
    }

    const changes: { [uri: string]: TextEdit[] } = {};

    // Collect all file URIs to scan: current doc + all indexed files
    const urisToScan = new Set<string>();
    urisToScan.add(document.uri);

    // Add all workspace-indexed file URIs
    for (const uri of workspaceIndexer.getIndexedUris()) {
        urisToScan.add(uri);
    }

    // Also add files from local symbol index
    for (const [, fileSymbols] of symbolIndex.files.entries()) {
        urisToScan.add(fileSymbols.uri);
    }

    // Scan each file for occurrences
    for (const uri of urisToScan) {
        let text: string | undefined;
        if (uri === document.uri) {
            text = document.getText();
        } else {
            // Try resolver (covers both open documents and disk-cached files)
            text = textResolver ? textResolver(uri) : workspaceIndexer.getFileContent(uri);
        }

        if (text === undefined) {
            continue;
        }

        const occurrences = findAllOccurrences(text, originalName);
        if (occurrences.length > 0) {
            changes[uri] = occurrences.map(occ =>
                TextEdit.replace(
                    Range.create(occ.line, occ.start, occ.line, occ.end),
                    newName
                )
            );
        }
    }

    return { changes };
}

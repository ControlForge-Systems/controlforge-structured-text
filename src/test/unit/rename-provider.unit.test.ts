import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Range } from 'vscode-languageserver';
import { WorkspaceIndexer } from '../../server/workspace-indexer';
import { SymbolIndex } from '../../shared/types';
import {
    prepareRename,
    provideRenameEdits,
    getWordAtPosition,
    validateNewName,
    findAllOccurrences,
    PrepareRenameResult
} from '../../server/providers/rename-provider';

/**
 * Helper: create TextDocument from ST source
 */
function doc(content: string, uri: string = 'file:///test.st'): TextDocument {
    return TextDocument.create(uri, 'structured-text', 1, content);
}

/**
 * Helper: create fresh WorkspaceIndexer + SymbolIndex, index the document
 */
function createIndexed(document: TextDocument): { indexer: WorkspaceIndexer; symbolIndex: SymbolIndex } {
    const indexer = new WorkspaceIndexer();
    indexer.updateFileIndex(document);
    const symbolIndex: SymbolIndex = {
        files: new Map(),
        symbolsByName: new Map()
    };
    return { indexer, symbolIndex };
}

/**
 * Helper: prepare rename at line/char, expecting success
 */
function doPrepare(
    content: string,
    line: number,
    character: number
): PrepareRenameResult {
    const d = doc(content);
    const { indexer, symbolIndex } = createIndexed(d);
    return prepareRename(d, Position.create(line, character), indexer, symbolIndex);
}

/**
 * Helper: prepare rename expecting failure (throws)
 */
function expectPrepareFailure(
    content: string,
    line: number,
    character: number,
    messageSubstring: string
): void {
    const d = doc(content);
    const { indexer, symbolIndex } = createIndexed(d);
    assert.throws(
        () => prepareRename(d, Position.create(line, character), indexer, symbolIndex),
        (err: Error) => err.message.includes(messageSubstring),
        `Expected error containing "${messageSubstring}"`
    );
}

/**
 * Helper: perform rename and return changes for the document URI
 */
function doRename(
    content: string,
    line: number,
    character: number,
    newName: string
) {
    const d = doc(content);
    const { indexer, symbolIndex } = createIndexed(d);
    return provideRenameEdits(d, Position.create(line, character), newName, indexer, symbolIndex);
}

suite('Rename Provider Unit Tests', () => {

    // ─── getWordAtPosition ───────────────────────────────────────────

    suite('getWordAtPosition', () => {
        test('should find identifier at cursor', () => {
            const result = getWordAtPosition('    counter := counter + 1;', 4);
            assert.ok(result);
            assert.strictEqual(result.word, 'counter');
            assert.strictEqual(result.start, 4);
            assert.strictEqual(result.end, 11);
        });

        test('should find identifier at start of line', () => {
            const result = getWordAtPosition('MyVar := 10;', 0);
            assert.ok(result);
            assert.strictEqual(result.word, 'MyVar');
        });

        test('should return null on whitespace', () => {
            const result = getWordAtPosition('    counter := 1;', 2);
            assert.strictEqual(result, null);
        });

        test('should return null on operator', () => {
            const result = getWordAtPosition('a := b + c;', 3);
            assert.strictEqual(result, null);
        });

        test('should find identifier with underscores', () => {
            const result = getWordAtPosition('my_long_var := 0;', 5);
            assert.ok(result);
            assert.strictEqual(result.word, 'my_long_var');
        });

        test('should find identifier starting with underscore', () => {
            const result = getWordAtPosition('_private := 1;', 0);
            assert.ok(result);
            assert.strictEqual(result.word, '_private');
        });

        test('should return null on empty line', () => {
            const result = getWordAtPosition('', 0);
            assert.strictEqual(result, null);
        });

        test('should handle cursor at last char of identifier', () => {
            // Character 4 is the last char of "count" (0-indexed: c=0,o=1,u=2,n=3,t=4)
            // but "counter" is 7 chars so char 6 is last valid position
            const result = getWordAtPosition('counter := 1;', 6);
            assert.ok(result);
            assert.strictEqual(result.word, 'counter');
        });
    });

    // ─── validateNewName ─────────────────────────────────────────────

    suite('validateNewName', () => {
        test('should accept valid identifier', () => {
            assert.strictEqual(validateNewName('newCounter'), null);
        });

        test('should accept underscore-prefixed', () => {
            assert.strictEqual(validateNewName('_myVar'), null);
        });

        test('should accept identifier with digits', () => {
            assert.strictEqual(validateNewName('var123'), null);
        });

        test('should reject name starting with digit', () => {
            const err = validateNewName('123var');
            assert.ok(err);
            assert.ok(err.includes('not a valid'));
        });

        test('should reject empty string', () => {
            const err = validateNewName('');
            assert.ok(err);
        });

        test('should reject name with spaces', () => {
            const err = validateNewName('my var');
            assert.ok(err);
        });

        test('should reject reserved keyword IF', () => {
            const err = validateNewName('IF');
            assert.ok(err);
            assert.ok(err.includes('reserved keyword'));
        });

        test('should reject reserved keyword case-insensitive', () => {
            const err = validateNewName('then');
            assert.ok(err);
            assert.ok(err.includes('reserved keyword'));
        });

        test('should reject declaration keyword VAR', () => {
            const err = validateNewName('VAR');
            assert.ok(err);
            assert.ok(err.includes('reserved keyword'));
        });

        test('should reject data type BOOL', () => {
            const err = validateNewName('BOOL');
            assert.ok(err);
            assert.ok(err.includes('data type'));
        });

        test('should reject data type case-insensitive', () => {
            const err = validateNewName('int');
            assert.ok(err);
            assert.ok(err.includes('data type'));
        });

        test('should reject standard function ABS', () => {
            const err = validateNewName('ABS');
            assert.ok(err);
            assert.ok(err.includes('standard function'));
        });

        test('should reject standard function case-insensitive', () => {
            const err = validateNewName('len');
            assert.ok(err);
            assert.ok(err.includes('standard function'));
        });

        test('should reject standard FB TON as data type', () => {
            const err = validateNewName('TON');
            assert.ok(err);
            assert.ok(err.includes('data type'));
        });
    });

    // ─── findAllOccurrences ──────────────────────────────────────────

    suite('findAllOccurrences', () => {
        test('should find single occurrence', () => {
            const text = 'counter := 0;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 1);
            assert.strictEqual(hits[0].line, 0);
            assert.strictEqual(hits[0].start, 0);
        });

        test('should find multiple occurrences on same line', () => {
            const text = 'counter := counter + 1;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 2);
        });

        test('should find occurrences across lines', () => {
            const text = 'VAR\n    counter : INT;\nEND_VAR\ncounter := 0;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 2);
            assert.strictEqual(hits[0].line, 1);
            assert.strictEqual(hits[1].line, 3);
        });

        test('should be case-insensitive', () => {
            const text = 'Counter := COUNTER + counter;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 3);
        });

        test('should not match partial identifiers', () => {
            const text = 'mycounter := counterMax + counter;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 1);
            assert.strictEqual(hits[0].start, 26);
        });

        test('should skip line comments', () => {
            const text = 'counter := 0; // counter is reset';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 1);
            assert.strictEqual(hits[0].start, 0);
        });

        test('should skip block comments', () => {
            const text = '(* counter is important *)\ncounter := 0;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 1);
            assert.strictEqual(hits[0].line, 1);
        });

        test('should skip multi-line block comments', () => {
            const text = '(*\n  counter docs\n*)\ncounter := 0;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 1);
            assert.strictEqual(hits[0].line, 3);
        });

        test('should handle code after block comment on same line', () => {
            const text = '(* comment *) counter := 0;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 1);
        });

        test('should return empty for no matches', () => {
            const text = 'x := 1;';
            const hits = findAllOccurrences(text, 'counter');
            assert.strictEqual(hits.length, 0);
        });
    });

    // ─── prepareRename ───────────────────────────────────────────────

    suite('prepareRename', () => {
        const SIMPLE_PROGRAM = `PROGRAM Main
VAR
    counter : INT := 0;
END_VAR
    counter := counter + 1;
END_PROGRAM`;

        test('should return range and placeholder for variable', () => {
            const result = doPrepare(SIMPLE_PROGRAM, 2, 8);
            assert.strictEqual(result.placeholder, 'counter');
            assert.strictEqual(result.range.start.line, 2);
            assert.strictEqual(result.range.start.character, 4);
            assert.strictEqual(result.range.end.character, 11);
        });

        test('should return range for variable usage', () => {
            const result = doPrepare(SIMPLE_PROGRAM, 4, 6);
            assert.strictEqual(result.placeholder, 'counter');
        });

        test('should return range for program name', () => {
            const result = doPrepare(SIMPLE_PROGRAM, 0, 10);
            assert.strictEqual(result.placeholder, 'Main');
        });

        test('should reject keyword IF', () => {
            const code = `PROGRAM Main
VAR
    x : BOOL;
END_VAR
    IF x THEN
        x := FALSE;
    END_IF;
END_PROGRAM`;
            expectPrepareFailure(code, 4, 5, 'built-in');
        });

        test('should reject data type INT', () => {
            expectPrepareFailure(SIMPLE_PROGRAM, 2, 16, 'built-in');
        });

        test('should reject cursor on whitespace', () => {
            expectPrepareFailure(SIMPLE_PROGRAM, 2, 1, 'Cannot rename at this position');
        });

        test('should reject cursor inside comment', () => {
            const code = `PROGRAM Main
VAR
    counter : INT; // counter is the main var
END_VAR
    counter := 0;
END_PROGRAM`;
            // "counter" inside comment at approx char 22
            expectPrepareFailure(code, 2, 22, 'Cannot rename inside a comment');
        });

        test('should work for function block name', () => {
            const code = `FUNCTION_BLOCK MyFB
VAR_INPUT
    x : INT;
END_VAR
END_FUNCTION_BLOCK`;
            const result = doPrepare(code, 0, 17);
            assert.strictEqual(result.placeholder, 'MyFB');
        });

        test('should work for function name', () => {
            const code = `FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    Add := a + b;
END_FUNCTION`;
            const result = doPrepare(code, 0, 11);
            assert.strictEqual(result.placeholder, 'Add');
        });
    });

    // ─── provideRenameEdits ──────────────────────────────────────────

    suite('provideRenameEdits', () => {
        const SIMPLE_PROGRAM = `PROGRAM Main
VAR
    counter : INT := 0;
END_VAR
    counter := counter + 1;
END_PROGRAM`;

        test('should rename variable in declaration and usage', () => {
            const result = doRename(SIMPLE_PROGRAM, 2, 8, 'count');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // declaration + 2 usages on line 4
            assert.strictEqual(edits.length, 3);
            edits.forEach(edit => {
                assert.strictEqual(edit.newText, 'count');
            });
        });

        test('should reject invalid new name', () => {
            assert.throws(
                () => doRename(SIMPLE_PROGRAM, 2, 8, '123bad'),
                (err: Error) => err.message.includes('not a valid')
            );
        });

        test('should reject keyword as new name', () => {
            assert.throws(
                () => doRename(SIMPLE_PROGRAM, 2, 8, 'WHILE'),
                (err: Error) => err.message.includes('reserved keyword')
            );
        });

        test('should reject data type as new name', () => {
            assert.throws(
                () => doRename(SIMPLE_PROGRAM, 2, 8, 'REAL'),
                (err: Error) => err.message.includes('data type')
            );
        });

        test('should reject standard function as new name', () => {
            assert.throws(
                () => doRename(SIMPLE_PROGRAM, 2, 8, 'SQRT'),
                (err: Error) => err.message.includes('standard function')
            );
        });

        test('should return empty changes for same name', () => {
            const result = doRename(SIMPLE_PROGRAM, 2, 8, 'counter');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(!edits || edits.length === 0);
        });

        test('should rename program name', () => {
            const result = doRename(SIMPLE_PROGRAM, 0, 10, 'MyProgram');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // "Main" appears on PROGRAM line and END_PROGRAM doesn't reference it
            assert.ok(edits.length >= 1);
            assert.strictEqual(edits[0].newText, 'MyProgram');
        });

        test('should rename function block name', () => {
            const code = `FUNCTION_BLOCK MyFB
VAR_INPUT
    x : INT;
END_VAR
END_FUNCTION_BLOCK`;
            const result = doRename(code, 0, 17, 'RenamedFB');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            assert.ok(edits.length >= 1);
            assert.strictEqual(edits[0].newText, 'RenamedFB');
        });

        test('should rename function name including body assignment', () => {
            const code = `FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    Add := a + b;
END_FUNCTION`;
            const result = doRename(code, 0, 11, 'Sum');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // "Add" in declaration + "Add" in body assignment
            assert.strictEqual(edits.length, 2);
        });

        test('should not rename occurrences inside comments', () => {
            const code = `PROGRAM Main
VAR
    counter : INT; // counter tracks iterations
END_VAR
    counter := 0;
END_PROGRAM`;
            const result = doRename(code, 2, 6, 'cnt');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // declaration (line 2) + usage (line 4), NOT the one in comment
            assert.strictEqual(edits.length, 2);
        });

        test('should rename case-insensitively', () => {
            const code = `PROGRAM Main
VAR
    Counter : INT;
END_VAR
    counter := COUNTER + 1;
END_PROGRAM`;
            const result = doRename(code, 2, 8, 'cnt');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // Counter, counter, COUNTER → 3 occurrences
            assert.strictEqual(edits.length, 3);
        });

        test('should produce correct ranges for each edit', () => {
            const code = `PROGRAM Main
VAR
    x : INT;
END_VAR
    x := x + 1;
END_PROGRAM`;
            const result = doRename(code, 2, 4, 'y');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // x in declaration + 2 in usage
            assert.strictEqual(edits.length, 3);

            // Check that each edit range is exactly 1 char wide (length of "x")
            edits.forEach(edit => {
                const rangeWidth = edit.range.end.character - edit.range.start.character;
                assert.strictEqual(rangeWidth, 1);
            });
        });

        test('should not partially match longer identifiers', () => {
            const code = `PROGRAM Main
VAR
    x : INT;
    xMax : INT;
    myX : INT;
END_VAR
    x := xMax + myX;
END_PROGRAM`;
            const result = doRename(code, 2, 4, 'y');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // Only "x" (line 2 decl + line 6 usage), NOT xMax or myX
            assert.strictEqual(edits.length, 2);
        });

        test('should handle FB instance rename', () => {
            const code = `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
    myTimer(IN := TRUE, PT := T#1s);
    IF myTimer.Q THEN
        myTimer.ET;
    END_IF;
END_PROGRAM`;
            const result = doRename(code, 2, 8, 'delayTimer');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // myTimer in declaration + 3 usages (call + .Q + .ET)
            assert.strictEqual(edits.length, 4);
            edits.forEach(edit => {
                assert.strictEqual(edit.newText, 'delayTimer');
            });
        });
    });

    // ─── Edge cases ──────────────────────────────────────────────────

    suite('Edge Cases', () => {
        test('should handle underscore-only variable', () => {
            const code = `PROGRAM Main
VAR
    _ : INT;
END_VAR
    _ := 1;
END_PROGRAM`;
            const result = doRename(code, 2, 4, 'x');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            assert.strictEqual(edits.length, 2);
        });

        test('should handle block comment spanning multiple lines between usages', () => {
            const code = `PROGRAM Main
VAR
    val : INT;
END_VAR
    val := 1;
    (* val is used
       val is special *)
    val := val + 1;
END_PROGRAM`;
            const result = doRename(code, 2, 5, 'v');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // decl + line 4 + line 7 (two), NOT the two in block comment
            assert.strictEqual(edits.length, 4);
        });

        test('should handle multiple block comments on same line', () => {
            const code = `PROGRAM Main
VAR
    val : INT;
END_VAR
    (* val *) val := (* val *) val + 1;
END_PROGRAM`;
            const result = doRename(code, 2, 5, 'v');
            const edits = result.changes?.['file:///test.st'];
            assert.ok(edits);
            // decl + 2 non-comment occurrences on line 4
            assert.strictEqual(edits.length, 3);
        });
    });
});

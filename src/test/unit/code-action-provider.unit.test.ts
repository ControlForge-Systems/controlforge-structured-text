import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    CodeActionKind,
    CodeActionParams,
    CodeActionContext,
    DiagnosticSeverity,
    Diagnostic,
    Position,
    Range
} from 'vscode-languageserver';
import { provideCodeActions } from '../../server/providers/code-action-provider';

/**
 * Helper: create TextDocument from ST source code
 */
function doc(content: string): TextDocument {
    return TextDocument.create('file:///test.st', 'structured-text', 1, content);
}

/**
 * Helper: create diagnostic
 */
function createDiagnostic(
    line: number,
    character: number,
    length: number,
    message: string
): Diagnostic {
    return {
        severity: DiagnosticSeverity.Error,
        range: {
            start: Position.create(line, character),
            end: Position.create(line, character + length),
        },
        message,
        source: 'ControlForge ST',
    };
}

/**
 * Helper: create code action params
 */
function createParams(document: TextDocument, diagnostics: Diagnostic[]): CodeActionParams {
    return {
        textDocument: { uri: document.uri },
        range: Range.create(0, 0, 0, 0),
        context: {
            diagnostics,
        },
    };
}

suite('Code Action Provider Unit Tests', () => {

    suite('Missing END_* Blocks', () => {
        test('should provide fix for missing END_PROGRAM', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 7, "'PROGRAM' is missing closing 'END_PROGRAM'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_PROGRAM');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
            assert.strictEqual(actions[0].isPreferred, true);
            assert.ok(actions[0].edit);
            assert.ok(actions[0].edit!.changes);

            const edits = actions[0].edit!.changes![document.uri];
            assert.strictEqual(edits.length, 1);
            assert.ok(edits[0].newText.includes('END_PROGRAM'));
        });

        test('should provide fix for missing END_FUNCTION', () => {
            const content = `FUNCTION Add : INT
VAR_INPUT
    a : INT;
END_VAR`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 8, "'FUNCTION' is missing closing 'END_FUNCTION'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_FUNCTION');
            assert.ok(actions[0].edit!.changes![document.uri][0].newText.includes('END_FUNCTION'));
        });

        test('should provide fix for missing END_FUNCTION_BLOCK', () => {
            const content = `FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
END_VAR`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 14, "'FUNCTION_BLOCK' is missing closing 'END_FUNCTION_BLOCK'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_FUNCTION_BLOCK');
            assert.ok(actions[0].edit!.changes![document.uri][0].newText.includes('END_FUNCTION_BLOCK'));
        });

        test('should provide fix for missing END_IF', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x > 0 THEN
        x := 10;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 4, 2, "'IF' is missing closing 'END_IF'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_IF');
            assert.ok(actions[0].edit!.changes![document.uri][0].newText.includes('END_IF'));
        });

        test('should provide fix for missing END_FOR', () => {
            const content = `PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 0 TO 10 DO
        i := i;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 4, 3, "'FOR' is missing closing 'END_FOR'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_FOR');
        });

        test('should provide fix for missing END_WHILE', () => {
            const content = `PROGRAM Main
VAR
    running : BOOL;
END_VAR
    WHILE running DO
        running := FALSE;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 4, 5, "'WHILE' is missing closing 'END_WHILE'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_WHILE');
        });

        test('should provide fix for missing END_CASE', () => {
            const content = `PROGRAM Main
VAR
    state : INT;
END_VAR
    CASE state OF
        0: state := 1;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 4, 4, "'CASE' is missing closing 'END_CASE'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_CASE');
        });

        test('should provide fix for missing END_REPEAT', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR
    REPEAT
        x := x + 1;
    UNTIL x > 10
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 4, 6, "'REPEAT' is missing closing 'END_REPEAT'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_REPEAT');
        });

        test('should provide fix for missing END_VAR', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(1, 0, 3, "'VAR' is missing closing 'END_VAR'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_VAR');
        });

        test('should preserve indentation when inserting closing keyword', () => {
            const content = `    PROGRAM Main
    VAR
        x : INT;
    END_VAR`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 4, 7, "'PROGRAM' is missing closing 'END_PROGRAM'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            const edit = actions[0].edit!.changes![document.uri][0];
            assert.ok(edit.newText.startsWith('    '), 'Should preserve 4-space indentation');
        });
    });

    suite('Orphaned END_* Keywords', () => {
        test('should provide fix to remove orphaned END_PROGRAM', () => {
            const content = `END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 11, "'END_PROGRAM' without matching 'PROGRAM'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Remove orphaned END_PROGRAM');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
            assert.strictEqual(actions[0].isPreferred, true);
        });

        test('should provide fix to remove orphaned END_VAR', () => {
            const content = `PROGRAM Main
    END_VAR
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(1, 4, 7, "'END_VAR' without matching VAR section opener");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Remove orphaned END_VAR');
        });

        test('should provide fix to remove orphaned END_IF', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR
    END_IF;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 4, 6, "'END_IF' without matching 'IF'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Remove orphaned END_IF');
        });
    });

    suite('Unclosed String Literals', () => {
        test('should provide fix for unclosed single-quote string', () => {
            const content = `PROGRAM Main
VAR
    msg : STRING := 'Hello World;
END_VAR
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(2, 20, 13, 'Unclosed string literal (single quote)');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Close string literal');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
            assert.strictEqual(actions[0].isPreferred, true);

            const edit = actions[0].edit!.changes![document.uri][0];
            assert.strictEqual(edit.newText, "'");
        });

        test('should provide fix for unclosed double-quote string', () => {
            const content = `PROGRAM Main
VAR
    wmsg : WSTRING := "Hello World;
END_VAR
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(2, 22, 13, 'Unclosed string literal (double quote)');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Close string literal');

            const edit = actions[0].edit!.changes![document.uri][0];
            assert.strictEqual(edit.newText, '"');
        });

        test('should insert quote before semicolon if present', () => {
            const content = `PROGRAM Main
VAR
    msg : STRING := 'Hello;
END_VAR
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(2, 20, 7, 'Unclosed string literal (single quote)');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            const edit = actions[0].edit!.changes![document.uri][0];
            // Should insert before semicolon
            const line2 = content.split('\n')[2];
            const semicolonPos = line2.indexOf(';');
            assert.strictEqual(edit.range.start.character, semicolonPos);
        });
    });

    suite('Unmatched Parentheses', () => {
        test('should provide fix for single unmatched opening parenthesis', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR
    x := (1 + 2;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 9, 1, 'Unmatched opening parenthesis (1 unclosed)');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Add closing parenthesis');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);

            const edit = actions[0].edit!.changes![document.uri][0];
            assert.strictEqual(edit.newText, ')');
        });

        test('should provide fix for multiple unmatched opening parentheses', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR
    x := ((1 + 2;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 9, 1, 'Unmatched opening parenthesis (2 unclosed)');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Add 2 closing parentheses');

            const edit = actions[0].edit!.changes![document.uri][0];
            assert.strictEqual(edit.newText, '))');
        });

        test('should provide fix to remove unmatched closing parenthesis', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1 + 2);
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 14, 1, 'Unmatched closing parenthesis');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Remove extra closing parenthesis');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
        });
    });

    suite('Multiple Diagnostics', () => {
        test('should provide fixes for multiple diagnostics in one document', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
    msg : STRING := 'unclosed;
    x := (1 + 2;
END_PROGRAM`;
            const document = doc(content);
            const diagnostics = [
                createDiagnostic(1, 0, 3, "'VAR' is missing closing 'END_VAR'"),
                createDiagnostic(3, 20, 10, 'Unclosed string literal (single quote)'),
                createDiagnostic(4, 9, 1, 'Unmatched opening parenthesis (1 unclosed)'),
            ];
            const params = createParams(document, diagnostics);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 3);
            assert.ok(actions.find(a => a.title === 'Insert END_VAR'));
            assert.ok(actions.find(a => a.title === 'Close string literal'));
            assert.ok(actions.find(a => a.title === 'Add closing parenthesis'));
        });
    });

    suite('Non-fixable Diagnostics', () => {
        test('should return empty array for diagnostics from other sources', () => {
            const content = `PROGRAM Main
END_PROGRAM`;
            const document = doc(content);
            const diagnostic: Diagnostic = {
                severity: DiagnosticSeverity.Error,
                range: Range.create(0, 0, 0, 7),
                message: 'Some error',
                source: 'Other Provider',
            };
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 0);
        });

        test('should return empty array for unknown diagnostic message format', () => {
            const content = `PROGRAM Main
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 7, 'Unknown error type');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 0);
        });
    });

    suite('Case Insensitivity', () => {
        test('should handle lowercase keywords', () => {
            const content = `program Main
var
    x : INT;
end_var`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 7, "'PROGRAM' is missing closing 'END_PROGRAM'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_PROGRAM');
        });

        test('should handle mixed-case keywords', () => {
            const content = `Program Main
Var
    x : INT;
End_Var`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 7, "'PROGRAM' is missing closing 'END_PROGRAM'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert END_PROGRAM');
        });
    });

    suite('Edge Cases', () => {
        test('should handle POU at end of document', () => {
            const content = `FUNCTION Add : INT
VAR_INPUT
    a : INT;
END_VAR`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 8, "'FUNCTION' is missing closing 'END_FUNCTION'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.ok(actions[0].edit);
        });

        test('should handle multiple POUs', () => {
            const content = `FUNCTION Add : INT
VAR_INPUT
    a : INT;
END_VAR

FUNCTION Sub : INT
VAR_INPUT
    a : INT;
END_VAR
END_FUNCTION`;
            const document = doc(content);
            const diagnostic = createDiagnostic(0, 0, 8, "'FUNCTION' is missing closing 'END_FUNCTION'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            // Should insert before next FUNCTION
            const edit = actions[0].edit!.changes![document.uri][0];
            assert.ok(edit.range.start.line < 6); // Before line 6 (second FUNCTION)
        });

        test('should handle empty document', () => {
            const content = '';
            const document = doc(content);
            const params = createParams(document, []);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 0);
        });
    });

    suite('Action Properties', () => {
        test('all actions should have QuickFix kind', () => {
            const content = `PROGRAM Main
VAR
    x : INT;`;
            const document = doc(content);
            const diagnostics = [
                createDiagnostic(0, 0, 7, "'PROGRAM' is missing closing 'END_PROGRAM'"),
                createDiagnostic(1, 0, 3, "'VAR' is missing closing 'END_VAR'"),
            ];
            const params = createParams(document, diagnostics);

            const actions = provideCodeActions(document, params);

            for (const action of actions) {
                assert.strictEqual(action.kind, CodeActionKind.QuickFix);
            }
        });

        test('all actions should have isPreferred set to true', () => {
            const content = `PROGRAM Main
VAR
    x : INT;`;
            const document = doc(content);
            const diagnostics = [
                createDiagnostic(0, 0, 7, "'PROGRAM' is missing closing 'END_PROGRAM'"),
                createDiagnostic(1, 0, 3, "'VAR' is missing closing 'END_VAR'"),
            ];
            const params = createParams(document, diagnostics);

            const actions = provideCodeActions(document, params);

            for (const action of actions) {
                assert.strictEqual(action.isPreferred, true);
            }
        });

        test('all actions should have diagnostics property', () => {
            const content = `PROGRAM Main
VAR
    x : INT;`;
            const document = doc(content);
            const diagnostics = [
                createDiagnostic(0, 0, 7, "'PROGRAM' is missing closing 'END_PROGRAM'"),
            ];
            const params = createParams(document, diagnostics);

            const actions = provideCodeActions(document, params);

            for (const action of actions) {
                assert.ok(action.diagnostics);
                assert.strictEqual(action.diagnostics!.length, 1);
            }
        });

        test('all actions should have valid workspace edits', () => {
            const content = `PROGRAM Main
VAR
    x : INT;`;
            const document = doc(content);
            const diagnostics = [
                createDiagnostic(0, 0, 7, "'PROGRAM' is missing closing 'END_PROGRAM'"),
            ];
            const params = createParams(document, diagnostics);

            const actions = provideCodeActions(document, params);

            for (const action of actions) {
                assert.ok(action.edit);
                assert.ok(action.edit!.changes);
                assert.ok(action.edit!.changes![document.uri]);
                assert.ok(action.edit!.changes![document.uri].length > 0);
            }
        });
    });

    suite('Missing Semicolons', () => {
        test('should provide fix for missing semicolon', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 9, 1, 'Missing semicolon at end of statement');
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert semicolon');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);

            const edit = actions[0].edit!.changes![document.uri][0];
            assert.strictEqual(edit.newText, ';');
        });
    });

    suite('Duplicate Declarations', () => {
        test('should provide fix to remove duplicate declaration', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
    x : REAL;
END_VAR
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(3, 4, 1, "Duplicate declaration 'x' (already declared as 'x')");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Remove duplicate declaration');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
        });
    });

    suite('Unused Variables', () => {
        test('should provide fix to remove unused variable', () => {
            const content = `PROGRAM Main
VAR
    x : INT;
    unused : INT;
END_VAR
    x := 1;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(3, 4, 6, "Variable 'unused' is declared but never used");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Remove unused variable');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
            assert.strictEqual(actions[0].isPreferred, true);
        });
    });

    suite("ELSE IF → ELSIF (#57)", () => {
        test('replaces ELSE IF with ELSIF', () => {
            const content = `PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSE IF x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 0, 7, "'ELSE IF' is not valid IEC 61131-3 syntax; use 'ELSIF'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, "Replace 'ELSE IF' with 'ELSIF'");
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
            assert.strictEqual(actions[0].isPreferred, true);

            const edits = actions[0].edit!.changes![document.uri];
            assert.strictEqual(edits.length, 1);
            assert.strictEqual(edits[0].newText, 'ELSIF');
        });

        test('replaces lowercase else if', () => {
            const content = `PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
else if x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 0, 7, "'ELSE IF' is not valid IEC 61131-3 syntax; use 'ELSIF'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);
            assert.strictEqual(actions.length, 1);
            const edits = actions[0].edit!.changes![document.uri];
            assert.strictEqual(edits[0].newText, 'ELSIF');
        });

        test('replacement range covers exactly ELSE IF text', () => {
            const content = `PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSE IF x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 0, 7, "'ELSE IF' is not valid IEC 61131-3 syntax; use 'ELSIF'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);
            const edit = actions[0].edit!.changes![document.uri][0];
            // Range start should be at "ELSE"
            assert.strictEqual(edit.range.start.line, 4);
            assert.strictEqual(edit.range.start.character, 0);
            // Range end should be just after "IF"
            assert.strictEqual(edit.range.end.line, 4);
            assert.ok(edit.range.end.character > 0);
        });
    });

    suite("Missing THEN / DO (#58)", () => {
        test('inserts THEN for IF missing THEN', () => {
            const content = `PROGRAM Main
VAR x : INT; END_VAR
IF x > 10
    x := 1;
END_IF;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(2, 9, 0, "'IF' is missing 'THEN'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert THEN');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);
            assert.strictEqual(actions[0].isPreferred, true);

            const edits = actions[0].edit!.changes![document.uri];
            assert.strictEqual(edits[0].newText, ' THEN');
        });

        test('inserts DO for FOR missing DO', () => {
            const content = `PROGRAM Main
VAR i : INT; END_VAR
FOR i := 1 TO 10
    i := i + 1;
END_FOR;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(2, 16, 0, "'FOR' is missing 'DO'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert DO');
            assert.strictEqual(actions[0].kind, CodeActionKind.QuickFix);

            const edits = actions[0].edit!.changes![document.uri];
            assert.strictEqual(edits[0].newText, ' DO');
        });

        test('inserts DO for WHILE missing DO', () => {
            const content = `PROGRAM Main
VAR x : INT; END_VAR
WHILE x < 10
    x := x + 1;
END_WHILE;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(2, 12, 0, "'WHILE' is missing 'DO'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert DO');
            const edits = actions[0].edit!.changes![document.uri];
            assert.strictEqual(edits[0].newText, ' DO');
        });

        test('inserts THEN for ELSIF missing THEN', () => {
            const content = `PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSIF x > 5
    x := 2;
END_IF;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(4, 11, 0, "'ELSIF' is missing 'THEN'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].title, 'Insert THEN');
            const edits = actions[0].edit!.changes![document.uri];
            assert.strictEqual(edits[0].newText, ' THEN');
        });

        test('insertion is at end of trimmed line content', () => {
            const content = `PROGRAM Main
VAR x : INT; END_VAR
IF x > 10
    x := 1;
END_IF;
END_PROGRAM`;
            const document = doc(content);
            const diagnostic = createDiagnostic(2, 9, 0, "'IF' is missing 'THEN'");
            const params = createParams(document, [diagnostic]);

            const actions = provideCodeActions(document, params);
            const edit = actions[0].edit!.changes![document.uri][0];
            // Insert position on line 2: "IF x > 10" is 9 chars
            assert.strictEqual(edit.range.start.line, 2);
            assert.strictEqual(edit.range.start.character, 9);
        });
    });
});

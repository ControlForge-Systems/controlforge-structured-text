import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { computeDiagnostics, levenshteinDistance, findClosestMatch } from '../../server/providers/diagnostics-provider';
import { STASTParser } from '../../server/ast-parser';

/**
 * Helper: create TextDocument from ST source code
 */
function doc(content: string): TextDocument {
    return TextDocument.create('file:///test.st', 'structured-text', 1, content);
}

/**
 * Helper: compute diagnostics for ST source code
 */
function diagnose(content: string) {
    return computeDiagnostics(doc(content));
}

/**
 * Helper: check that no diagnostics were produced
 */
function assertNoDiagnostics(content: string, label?: string): void {
    const diags = diagnose(content);
    assert.strictEqual(diags.length, 0, `Expected no diagnostics${label ? ` for ${label}` : ''}, got: ${diags.map(d => d.message).join('; ')}`);
}

suite('Diagnostics Provider Unit Tests', () => {

    suite('Valid Code — No Diagnostics', () => {
        test('should produce no diagnostics for a simple valid program', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    counter : INT := 0;
END_VAR
    counter := counter + 1;
END_PROGRAM`);
        });

        test('should produce no diagnostics for a valid function', () => {
            assertNoDiagnostics(`
FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    Add := a + b;
END_FUNCTION`);
        });

        test('should produce no diagnostics for a valid function block', () => {
            assertNoDiagnostics(`
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
    speed : REAL;
END_VAR
VAR_OUTPUT
    running : BOOL;
END_VAR
VAR
    internal : INT;
END_VAR
    running := start;
END_FUNCTION_BLOCK`);
        });

        test('should produce no diagnostics for VAR_GLOBAL', () => {
            assertNoDiagnostics(`
VAR_GLOBAL
    systemStatus : BOOL := FALSE;
    globalCounter : DINT := 0;
END_VAR`);
        });

        test('should produce no diagnostics for VAR_GLOBAL CONSTANT', () => {
            assertNoDiagnostics(`
VAR_GLOBAL CONSTANT
    MAX_TEMP : REAL := 100.0;
    VERSION : STRING := 'v1.0';
END_VAR`);
        });

        test('should produce no diagnostics for nested IF blocks', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x > 0 THEN
        IF x > 10 THEN
            x := 10;
        END_IF;
    END_IF;
END_PROGRAM`);
        });

        test('should produce no diagnostics for CASE statement', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    state : INT;
END_VAR
    CASE state OF
        0: state := 1;
        1: state := 2;
    END_CASE;
END_PROGRAM`);
        });

        test('should produce no diagnostics for FOR loop', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 0 TO 10 BY 1 DO
        i := i;
    END_FOR;
END_PROGRAM`);
        });

        test('should produce no diagnostics for WHILE loop', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    running : BOOL := TRUE;
END_VAR
    WHILE running DO
        running := FALSE;
    END_WHILE;
END_PROGRAM`);
        });

        test('should produce no diagnostics for REPEAT loop', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT := 0;
END_VAR
    REPEAT
        x := x + 1;
    UNTIL x > 10
    END_REPEAT;
END_PROGRAM`);
        });

        test('should handle properly paired parentheses', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := (1 + (2 * 3)) + ((4 - 5) * 6);
END_PROGRAM`);
        });

        test('should handle valid string literals', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    msg : STRING := 'Hello World';
    wmsg : WSTRING := "Wide String";
END_VAR
END_PROGRAM`);
        });

        test('should handle empty document', () => {
            assertNoDiagnostics('');
        });

        test('should handle whitespace-only document', () => {
            assertNoDiagnostics('   \n\t\n   ');
        });

        test('should ignore content inside comments', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    // IF without END_IF is fine in a comment
    (* FUNCTION without END_FUNCTION also fine *)
    x : INT;
END_VAR
END_PROGRAM`);
        });

        test('should handle escaped quotes in strings', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    msg : STRING := 'It''s a test';
    wmsg : WSTRING := "She said ""hello""";
END_VAR
END_PROGRAM`);
        });

        test('should produce no diagnostics for multiple POUs', () => {
            assertNoDiagnostics(`
FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    Add := a + b;
END_FUNCTION

PROGRAM Main
VAR
    result : INT;
END_VAR
    result := Add(1, 2);
END_PROGRAM`);
        });
    });

    suite('Unmatched Block Keywords', () => {
        test('should detect missing END_PROGRAM', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR`);

            assert.ok(diags.length > 0, 'Should have diagnostics');
            const progDiag = diags.find(d => d.message.includes('PROGRAM') && d.message.includes('END_PROGRAM'));
            assert.ok(progDiag, 'Should report missing END_PROGRAM');
            assert.strictEqual(progDiag!.severity, DiagnosticSeverity.Error);
        });

        test('should detect missing END_FUNCTION', () => {
            const diags = diagnose(`
FUNCTION Add : INT
VAR_INPUT
    a : INT;
END_VAR`);

            const funcDiag = diags.find(d => d.message.includes('FUNCTION') && d.message.includes('END_FUNCTION'));
            assert.ok(funcDiag, 'Should report missing END_FUNCTION');
        });

        test('should detect missing END_FUNCTION_BLOCK', () => {
            const diags = diagnose(`
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
END_VAR`);

            const fbDiag = diags.find(d => d.message.includes('FUNCTION_BLOCK') && d.message.includes('END_FUNCTION_BLOCK'));
            assert.ok(fbDiag, 'Should report missing END_FUNCTION_BLOCK');
        });

        test('should detect missing END_IF', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x > 0 THEN
        x := 10;
END_PROGRAM`);

            const ifDiag = diags.find(d => d.message.includes('IF') && d.message.includes('END_IF'));
            assert.ok(ifDiag, 'Should report missing END_IF');
        });

        test('should detect missing END_FOR', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 0 TO 10 DO
        i := i;
END_PROGRAM`);

            const forDiag = diags.find(d => d.message.includes('FOR') && d.message.includes('END_FOR'));
            assert.ok(forDiag, 'Should report missing END_FOR');
        });

        test('should detect missing END_WHILE', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    running : BOOL;
END_VAR
    WHILE running DO
        running := FALSE;
END_PROGRAM`);

            const whileDiag = diags.find(d => d.message.includes('WHILE') && d.message.includes('END_WHILE'));
            assert.ok(whileDiag, 'Should report missing END_WHILE');
        });

        test('should detect missing END_CASE', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    state : INT;
END_VAR
    CASE state OF
        0: state := 1;
END_PROGRAM`);

            const caseDiag = diags.find(d => d.message.includes('CASE') && d.message.includes('END_CASE'));
            assert.ok(caseDiag, 'Should report missing END_CASE');
        });

        test('should detect unexpected END_PROGRAM without opener', () => {
            const diags = diagnose(`
END_PROGRAM`);

            const diag = diags.find(d => d.message.includes('END_PROGRAM') && d.message.includes('without matching'));
            assert.ok(diag, 'Should report END_PROGRAM without matching PROGRAM');
        });

        test('should detect missing END_VAR', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_PROGRAM`);

            const varDiag = diags.find(d => d.message.includes('VAR') && d.message.includes('END_VAR'));
            assert.ok(varDiag, 'Should report missing END_VAR');
        });

        test('should detect unexpected END_VAR without opener', () => {
            const diags = diagnose(`
PROGRAM Main
    END_VAR
END_PROGRAM`);

            const diag = diags.find(d => d.message.includes('END_VAR') && d.message.includes('without matching'));
            assert.ok(diag, 'Should report END_VAR without matching VAR opener');
        });

        test('should detect missing END_REPEAT', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT := 0;
END_VAR
    REPEAT
        x := x + 1;
    UNTIL x > 10
END_PROGRAM`);

            const repeatDiag = diags.find(d => d.message.includes('REPEAT') && d.message.includes('END_REPEAT'));
            assert.ok(repeatDiag, 'Should report missing END_REPEAT');
        });
    });

    suite('Unclosed String Literals', () => {
        test('should detect unclosed single-quote string', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    msg : STRING := 'Hello World;
END_VAR
END_PROGRAM`);

            const strDiag = diags.find(d => d.message.includes('Unclosed string literal') && d.message.includes('single'));
            assert.ok(strDiag, 'Should report unclosed single-quote string');
            assert.strictEqual(strDiag!.severity, DiagnosticSeverity.Error);
        });

        test('should detect unclosed double-quote string', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    wmsg : WSTRING := "Hello World;
END_VAR
END_PROGRAM`);

            const strDiag = diags.find(d => d.message.includes('Unclosed string literal') && d.message.includes('double'));
            assert.ok(strDiag, 'Should report unclosed double-quote string');
        });

        test('should not false-positive on escaped quotes', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    msg : STRING := 'It''s OK';
END_VAR
END_PROGRAM`);
        });
    });

    suite('Unmatched Parentheses', () => {
        test('should detect unmatched opening parenthesis', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := (1 + 2;
END_PROGRAM`);

            const parenDiag = diags.find(d => d.message.includes('Unmatched opening parenthesis'));
            assert.ok(parenDiag, 'Should report unmatched opening paren');
        });

        test('should detect unmatched closing parenthesis', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1 + 2);
END_PROGRAM`);

            const parenDiag = diags.find(d => d.message.includes('Unmatched closing parenthesis'));
            assert.ok(parenDiag, 'Should report unmatched closing paren');
        });

        test('should not false-positive on parentheses inside strings', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    msg : STRING := 'some (text';
END_VAR
END_PROGRAM`);
        });

        test('should not false-positive on parentheses inside comments', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    // x := (unmatched
    (* also (unmatched *)
    x := 1;
END_PROGRAM`);
        });
    });

    suite('Case Insensitivity', () => {
        test('should match lowercase keywords', () => {
            assertNoDiagnostics(`
program Main
var
    x : INT;
end_var
end_program`);
        });

        test('should match mixed-case keywords', () => {
            assertNoDiagnostics(`
Program Main
Var
    x : INT;
End_Var
End_Program`);
        });

        test('should detect mismatched case-insensitive block errors', () => {
            const diags = diagnose(`
program Main
var
    x : INT;
end_var`);

            const progDiag = diags.find(d => d.message.includes('PROGRAM') && d.message.includes('END_PROGRAM'));
            assert.ok(progDiag, 'Should detect missing END_PROGRAM even with lowercase opener');
        });
    });

    suite('Multi-line Block Comments', () => {
        test('should not false-positive on keywords inside multi-line block comments', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    (*
    IF x > 0 THEN
        This IF has no END_IF but it's in a comment
    *)
    x := 1;
END_PROGRAM`);
        });
    });

    suite('Complex Scenarios', () => {
        test('should handle nested control flow correctly', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    i : INT;
    x : INT;
    state : INT;
END_VAR
    FOR i := 0 TO 10 DO
        IF i > 5 THEN
            CASE state OF
                0: x := 1;
                1: x := 2;
            END_CASE;
        END_IF;
    END_FOR;
END_PROGRAM`);
        });

        test('should report multiple errors in one document', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
    msg : STRING := 'unclosed;
    x := (1 + 2;
END_PROGRAM`);

            // Should have at least: missing END_VAR, unclosed string, unmatched paren
            assert.ok(diags.length >= 3, `Expected at least 3 diagnostics, got ${diags.length}: ${diags.map(d => d.message).join('; ')}`);
        });

        test('should handle multiple VAR sections in a function block', () => {
            assertNoDiagnostics(`
FUNCTION_BLOCK FB_Test
VAR_INPUT
    a : INT;
END_VAR
VAR_OUTPUT
    b : INT;
END_VAR
VAR_IN_OUT
    c : INT;
END_VAR
VAR
    d : INT;
END_VAR
    b := a + c + d;
END_FUNCTION_BLOCK`);
        });

        test('should handle TYPE/END_TYPE blocks', () => {
            assertNoDiagnostics(`
TYPE MyStruct :
STRUCT
    field1 : INT;
    field2 : REAL;
END_STRUCT
END_TYPE`);
        });

        test('should detect missing END_STRUCT', () => {
            const diags = diagnose(`
TYPE MyStruct :
STRUCT
    field1 : INT;
END_TYPE`);

            const structDiag = diags.find(d => d.message.includes('STRUCT') && d.message.includes('END_STRUCT'));
            assert.ok(structDiag, 'Should report missing END_STRUCT');
        });

        test('all diagnostics should have source set to ControlForge ST', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;`);

            assert.ok(diags.length > 0, 'Should produce diagnostics');
            for (const d of diags) {
                assert.strictEqual(d.source, 'ControlForge ST');
            }
        });
    });
});

// ─── Phase 2: Semantic Diagnostics ──────────────────────────────────────────

/**
 * Helper: parse symbols + compute diagnostics (semantic checks enabled)
 */
function diagnoseWithSymbols(content: string) {
    const document = TextDocument.create('file:///test.st', 'structured-text', 1, content);
    const symbols = new STASTParser(document).parseSymbols();
    return computeDiagnostics(document, symbols);
}

/**
 * Helper: assert no diagnostics with semantic checks
 */
function assertNoDiagnosticsWithSymbols(content: string, label?: string): void {
    const diags = diagnoseWithSymbols(content);
    assert.strictEqual(diags.length, 0, `Expected no diagnostics${label ? ` for ${label}` : ''}, got: ${diags.map(d => d.message).join('; ')}`);
}

suite('Diagnostics Provider — Phase 2 Semantic Checks', () => {

    suite('Missing Semicolons', () => {
        test('should detect missing semicolon on assignment', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1
END_PROGRAM`);
            const semi = diags.find(d => d.message.includes('Missing semicolon'));
            assert.ok(semi, 'Should detect missing semicolon');
            assert.strictEqual(semi!.severity, DiagnosticSeverity.Error);
        });

        test('should not flag lines with semicolons', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1;
END_PROGRAM`);
            const semi = diags.filter(d => d.message.includes('Missing semicolon'));
            assert.strictEqual(semi.length, 0);
        });

        test('should not flag control flow keywords', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x > 0 THEN
        x := 1;
    ELSE
        x := 2;
    END_IF;
END_PROGRAM`);
            const semi = diags.filter(d => d.message.includes('Missing semicolon'));
            assert.strictEqual(semi.length, 0);
        });

        test('should not flag CASE branch labels', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    state : INT;
    x : INT;
END_VAR
    CASE state OF
        0:
            x := 1;
        1:
            x := 2;
    END_CASE;
END_PROGRAM`);
            const semi = diags.filter(d => d.message.includes('Missing semicolon'));
            assert.strictEqual(semi.length, 0);
        });

        test('should not flag lines ending with THEN/DO/OF', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
    x : INT;
END_VAR
    FOR i := 0 TO 10 DO
        x := i;
    END_FOR;
END_PROGRAM`);
            const semi = diags.filter(d => d.message.includes('Missing semicolon'));
            assert.strictEqual(semi.length, 0);
        });

        test('should not flag VAR section lines', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    y : REAL;
END_VAR
    x := 1;
END_PROGRAM`);
            const semi = diags.filter(d => d.message.includes('Missing semicolon'));
            assert.strictEqual(semi.length, 0);
        });
    });

    suite('Duplicate Declarations', () => {
        test('should detect duplicate variable (same case)', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    x : REAL;
END_VAR
    x := 1;
END_PROGRAM`);
            const dups = diags.filter(d => d.message.includes('Duplicate declaration'));
            assert.strictEqual(dups.length, 1);
            assert.ok(dups[0].message.includes("'x'"));
        });

        test('should detect duplicate variable (case-insensitive)', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    MyVar : INT;
    myvar : REAL;
END_VAR
    MyVar := 1;
END_PROGRAM`);
            const dups = diags.filter(d => d.message.includes('Duplicate declaration'));
            assert.strictEqual(dups.length, 1);
        });

        test('should not flag variables in different POUs', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main1
VAR
    x : INT;
END_VAR
    x := 1;
END_PROGRAM

PROGRAM Main2
VAR
    x : INT;
END_VAR
    x := 2;
END_PROGRAM`);
            const dups = diags.filter(d => d.message.includes('Duplicate declaration'));
            assert.strictEqual(dups.length, 0);
        });
    });

    suite('Undefined Variables', () => {
        test('should detect undefined identifier', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := undeclaredVar;
END_PROGRAM`);
            const undef = diags.filter(d => d.message.includes('Undefined identifier'));
            assert.ok(undef.length > 0, 'Should detect undefined identifier');
            assert.ok(undef.some(d => d.message.includes('undeclaredVar')));
        });

        test('should not flag declared variables', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    y : INT;
END_VAR
    x := y;
END_PROGRAM`);
            const undef = diags.filter(d => d.message.includes('Undefined identifier'));
            assert.strictEqual(undef.length, 0);
        });

        test('should not flag IEC keywords', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : BOOL;
END_VAR
    x := TRUE;
END_PROGRAM`);
            const undef = diags.filter(d => d.message.includes('Undefined identifier'));
            assert.strictEqual(undef.length, 0);
        });

        test('should not flag standard functions', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    y : INT;
END_VAR
    y := ABS(x);
END_PROGRAM`);
            const undef = diags.filter(d => d.message.includes("Undefined identifier 'ABS'"));
            assert.strictEqual(undef.length, 0);
        });

        test('should not flag cross-POU references in same file', () => {
            const diags = diagnoseWithSymbols(`
FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    Add := a + b;
END_FUNCTION

PROGRAM Main
VAR
    result : INT;
END_VAR
    result := Add(a := 1, b := 2);
END_PROGRAM`);
            const undef = diags.filter(d => d.message.includes("Undefined identifier 'Add'"));
            assert.strictEqual(undef.length, 0);
        });

        test('should not flag member access after dot', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    timer : TON;
END_VAR
    timer.IN := TRUE;
END_PROGRAM`);
            // "IN" after dot should not be flagged; "timer" is declared
            const undef = diags.filter(d => d.message.includes("Undefined identifier 'IN'"));
            assert.strictEqual(undef.length, 0);
        });

        test('should not flag identifiers inside CASE branches', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    state : INT;
    x : INT;
END_VAR
    CASE state OF
        0:
            x := 1;
        1:
            x := 2;
    END_CASE;
END_PROGRAM`);
            const undef = diags.filter(d => d.message.includes('Undefined identifier'));
            assert.strictEqual(undef.length, 0);
        });
    });

    suite('Unused Variables', () => {
        test('should detect unused local variable', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    unused : INT;
END_VAR
    x := 1;
END_PROGRAM`);
            const unused = diags.filter(d => d.message.includes('never used'));
            assert.ok(unused.length > 0);
            assert.ok(unused.some(d => d.message.includes("'unused'")));
        });

        test('should not flag used variables', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1;
END_PROGRAM`);
            const unused = diags.filter(d => d.message.includes('never used'));
            assert.strictEqual(unused.length, 0);
        });

        test('should not flag VAR_INPUT/OUTPUT/IN_OUT parameters', () => {
            const diags = diagnoseWithSymbols(`
FUNCTION_BLOCK FB_Test
VAR_INPUT
    inputVar : INT;
END_VAR
VAR_OUTPUT
    outputVar : INT;
END_VAR
    outputVar := 0;
END_FUNCTION_BLOCK`);
            // inputVar is a parameter — should not be flagged as unused
            const unused = diags.filter(d => d.message.includes("'inputVar'") && d.message.includes('never used'));
            assert.strictEqual(unused.length, 0);
        });
    });

    suite('Type Mismatches', () => {
        test('should detect assigning string to integer', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 'hello';
END_PROGRAM`);
            const typeMismatch = diags.filter(d => d.message.includes('Type mismatch'));
            assert.ok(typeMismatch.length > 0, 'Should detect type mismatch');
        });

        test('should not flag compatible numeric assignment', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 42;
END_PROGRAM`);
            const typeMismatch = diags.filter(d => d.message.includes('Type mismatch'));
            assert.strictEqual(typeMismatch.length, 0);
        });

        test('should allow REAL from INT (widening)', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : REAL;
END_VAR
    x := 42;
END_PROGRAM`);
            const typeMismatch = diags.filter(d => d.message.includes('Type mismatch'));
            assert.strictEqual(typeMismatch.length, 0);
        });

        test('should detect boolean to integer mismatch', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := TRUE;
END_PROGRAM`);
            const typeMismatch = diags.filter(d => d.message.includes('Type mismatch'));
            assert.ok(typeMismatch.length > 0, 'Should detect BOOL to INT mismatch');
        });

        test('should allow same-type assignment', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : BOOL;
END_VAR
    x := FALSE;
END_PROGRAM`);
            const typeMismatch = diags.filter(d => d.message.includes('Type mismatch'));
            assert.strictEqual(typeMismatch.length, 0);
        });
    });

    suite('Levenshtein Distance', () => {
        test('should return 0 for identical strings', () => {
            assert.strictEqual(levenshteinDistance('abc', 'abc'), 0);
        });

        test('should return length for empty vs non-empty', () => {
            assert.strictEqual(levenshteinDistance('', 'abc'), 3);
            assert.strictEqual(levenshteinDistance('abc', ''), 3);
        });

        test('should compute single edit distance', () => {
            assert.strictEqual(levenshteinDistance('cat', 'bat'), 1);
        });

        test('should compute multiple edits', () => {
            assert.strictEqual(levenshteinDistance('kitten', 'sitting'), 3);
        });
    });

    suite('Find Closest Match', () => {
        test('should find close match', () => {
            const result = findClosestMatch('cout', ['counter', 'count', 'timer']);
            assert.strictEqual(result, 'count');
        });

        test('should return null if no match within distance', () => {
            const result = findClosestMatch('xyz', ['counter', 'timer'], 2);
            assert.strictEqual(result, null);
        });

        test('should find exact match (distance 0)', () => {
            const result = findClosestMatch('timer', ['timer', 'counter']);
            assert.strictEqual(result, 'timer');
        });

        test('should respect maxDistance parameter', () => {
            const result = findClosestMatch('ab', ['abcdef'], 1);
            assert.strictEqual(result, null);
        });
    });

    suite('Valid Code — No Phase 2 Diagnostics', () => {
        test('complete valid program should have no semantic diagnostics', () => {
            assertNoDiagnosticsWithSymbols(`
PROGRAM Main
VAR
    counter : INT := 0;
    running : BOOL := FALSE;
END_VAR
    IF NOT running THEN
        counter := counter + 1;
        running := TRUE;
    ELSE
        counter := 0;
        running := FALSE;
    END_IF;
END_PROGRAM`);
        });

        test('function with return value should have no diagnostics', () => {
            assertNoDiagnosticsWithSymbols(`
FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    Add := a + b;
END_FUNCTION`);
        });

        test('FOR loop should have no false positives', () => {
            assertNoDiagnosticsWithSymbols(`
PROGRAM Main
VAR
    i : INT;
    sum : INT := 0;
END_VAR
    FOR i := 1 TO 10 DO
        sum := sum + i;
    END_FOR;
END_PROGRAM`);
        });

        test('WHILE loop should have no false positives', () => {
            assertNoDiagnosticsWithSymbols(`
PROGRAM Main
VAR
    x : INT := 10;
END_VAR
    WHILE x > 0 DO
        x := x - 1;
    END_WHILE;
END_PROGRAM`);
        });

        test('CASE statement should have no false positives', () => {
            assertNoDiagnosticsWithSymbols(`
PROGRAM Main
VAR
    state : INT := 0;
    result : INT;
END_VAR
    CASE state OF
        0:
            result := 1;
        1:
            result := 2;
        2:
            result := 3;
    END_CASE;
END_PROGRAM`);
        });
    });

    suite('Phase 2 Source and Severity', () => {
        test('all Phase 2 diagnostics should have source set to ControlForge ST', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    unused : REAL;
END_VAR
    x := 'hello'
END_PROGRAM`);
            assert.ok(diags.length > 0, 'Should produce diagnostics');
            for (const d of diags) {
                assert.strictEqual(d.source, 'ControlForge ST');
            }
        });

        test('missing semicolons should be Error severity', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1
END_PROGRAM`);
            const semi = diags.find(d => d.message.includes('Missing semicolon'));
            assert.ok(semi);
            assert.strictEqual(semi!.severity, DiagnosticSeverity.Error);
        });

        test('duplicate declarations should be Error severity', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    x : REAL;
END_VAR
    x := 1;
END_PROGRAM`);
            const dup = diags.find(d => d.message.includes('Duplicate declaration'));
            assert.ok(dup);
            assert.strictEqual(dup!.severity, DiagnosticSeverity.Error);
        });

        test('undefined identifiers should be Warning severity', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := notDeclared;
END_PROGRAM`);
            const undef = diags.find(d => d.message.includes('Undefined identifier'));
            assert.ok(undef);
            assert.strictEqual(undef!.severity, DiagnosticSeverity.Warning);
        });

        test('unused variables should be Warning severity', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    unused : INT;
END_VAR
    x := 1;
END_PROGRAM`);
            const unused = diags.find(d => d.message.includes('never used'));
            assert.ok(unused);
            assert.strictEqual(unused!.severity, DiagnosticSeverity.Warning);
        });

        test('type mismatches should be Error severity', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 'hello';
END_PROGRAM`);
            const tm = diags.find(d => d.message.includes('Type mismatch'));
            assert.ok(tm);
            assert.strictEqual(tm!.severity, DiagnosticSeverity.Error);
        });
    });
});

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

        test('should not false-positive on multi-line FB call closing paren', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    MyTimer : TON;
    StartSig : BOOL;
END_VAR
    MyTimer(
        IN := StartSig,
        PT := T#10s
    );
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

        test('should not false-positive on unmatched parens in nested block comments', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    (* outer (* inner *) outer *)
    x := 1;
END_PROGRAM`);
        });

        test('should not false-positive on 3-level nested block comments', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    (* level1 (* level2 (* level3 *) level2 *) level1 *)
    x := 1;
END_PROGRAM`);
        });

        test('should not false-positive on nested comment with keywords inside', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    (* outer (* IF x > 0 THEN *) outer *)
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

        test('should not flag output named parameters (=>) in FB calls', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR
    MyTimer   : TON;
    MyCounter : CTU;
    StartSig  : BOOL;
    StopSig   : BOOL;
    Result    : BOOL;
    CountOut  : INT;
END_VAR
    MyTimer(IN := StartSig, PT := T#5s, Q => Result, ET => CountOut);
    MyCounter(CU := StartSig, RESET := StopSig, PV := 10, CV => CountOut);
END_PROGRAM`);
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

    // ─── ELSE IF → ELSIF ─────────────────────────────────────────────────────

    suite('ELSE IF should be ELSIF', () => {
        test('detects bare ELSE IF on same line', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSE IF x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("'ELSE IF' is not valid"));
            assert.ok(d, 'Expected ELSE IF diagnostic');
        });

        test('detects lowercase else if', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
else if x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("'ELSE IF' is not valid"));
            assert.ok(d);
        });

        test('detects mixed case Else If', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
Else If x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("'ELSE IF' is not valid"));
            assert.ok(d);
        });

        test('no diagnostic for correct ELSIF', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSIF x > 5 THEN
    x := 2;
ELSE
    x := 3;
END_IF;
END_PROGRAM`);
        });

        test('no diagnostic for ELSE alone', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSE
    x := 2;
END_IF;
END_PROGRAM`);
        });

        test('no false positive for ELSE IF in a comment', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR x : INT; END_VAR
(* ELSE IF this is just a comment *)
IF x > 10 THEN
    x := 1;
END_IF;
END_PROGRAM`);
        });

        test('no false positive for ELSE IF in string literal', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR s : STRING; END_VAR
s := 'use ELSIF not ELSE_IF';
END_PROGRAM`);
        });

        test('diagnostic is Error severity', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSE IF x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("'ELSE IF' is not valid"));
            assert.ok(d);
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('squiggle range covers ELSE IF span', () => {
            const src = `PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSE IF x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`;
            const diags = diagnose(src);
            const d = diags.find(d => d.message.includes("'ELSE IF' is not valid"));
            assert.ok(d);
            // line 4 (0-indexed): "ELSE IF x > 5 THEN"
            assert.strictEqual(d!.range.start.line, 4);
            // should start at column 0 (ELSE is at start)
            assert.strictEqual(d!.range.start.character, 0);
        });

        test('multiple ELSE IF occurrences each get a diagnostic', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSE IF x > 8 THEN
    x := 2;
ELSE IF x > 5 THEN
    x := 3;
END_IF;
END_PROGRAM`);
            const found = diags.filter(d => d.message.includes("'ELSE IF' is not valid"));
            assert.strictEqual(found.length, 2);
        });
    });

    // ─── Missing THEN / DO ───────────────────────────────────────────────────

    suite('Missing THEN / DO', () => {
        test('detects missing THEN after IF condition', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10
    x := 1;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is missing 'THEN'"));
            assert.ok(d, 'Expected missing THEN diagnostic');
        });

        test('detects missing THEN after ELSIF condition', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSIF x > 5
    x := 2;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is missing 'THEN'"));
            assert.ok(d, 'Expected missing THEN on ELSIF');
        });

        test('detects missing DO after FOR loop header', () => {
            const diags = diagnose(`
PROGRAM Main
VAR i : INT; END_VAR
FOR i := 1 TO 10
    i := i + 1;
END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is missing 'DO'"));
            assert.ok(d, 'Expected missing DO diagnostic');
        });

        test('detects missing DO after WHILE condition', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
WHILE x < 10
    x := x + 1;
END_WHILE;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is missing 'DO'"));
            assert.ok(d, 'Expected missing DO on WHILE');
        });

        test('no diagnostic for correct IF...THEN', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
END_IF;
END_PROGRAM`);
        });

        test('no diagnostic for correct FOR...DO', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR i : INT; END_VAR
FOR i := 1 TO 10 DO
    i := i + 1;
END_FOR;
END_PROGRAM`);
        });

        test('no diagnostic for correct WHILE...DO', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR x : INT; END_VAR
WHILE x < 10 DO
    x := x + 1;
END_WHILE;
END_PROGRAM`);
        });

        test('no diagnostic for correct ELSIF...THEN', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10 THEN
    x := 1;
ELSIF x > 5 THEN
    x := 2;
END_IF;
END_PROGRAM`);
        });

        test('missing THEN diagnostic is Error severity', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
IF x > 10
    x := 1;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is missing 'THEN'"));
            assert.ok(d);
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('missing DO diagnostic is Error severity', () => {
            const diags = diagnose(`
PROGRAM Main
VAR i : INT; END_VAR
FOR i := 1 TO 10
    i := i + 1;
END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is missing 'DO'"));
            assert.ok(d);
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('no false positive for IF in comment', () => {
            assertNoDiagnostics(`
PROGRAM Main
VAR x : INT; END_VAR
(* IF x > 10 -- this is just a comment, no THEN needed *)
IF x > 10 THEN
    x := 1;
END_IF;
END_PROGRAM`);
        });

        test('case-insensitive detection for missing THEN', () => {
            const diags = diagnose(`
PROGRAM Main
VAR x : INT; END_VAR
if x > 10
    x := 1;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is missing 'THEN'"));
            assert.ok(d);
        });
    });

    suite('FB Call Validation — Invalid Member Access', () => {

        test('flags access to non-existent member on standard FB', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
IF myTimer.INVALID THEN
    myTimer.Q := FALSE;
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is not a member of 'TON'"));
            assert.ok(d, 'Should flag invalid member access');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('does not flag valid standard FB member', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
IF myTimer.Q THEN
    myTimer(IN := TRUE, PT := T#5s);
END_IF;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes("is not a member of 'TON'"));
            assert.strictEqual(d.length, 0, 'Should not flag valid members');
        });

        test('suggests closest match in message', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
IF myTimer.QQ THEN
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("is not a member of 'TON'"));
            assert.ok(d, 'Should flag invalid member');
            assert.ok(d!.message.includes('did you mean'), 'Should include suggestion');
        });

        test('case-insensitive member comparison', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
IF myTimer.q THEN
END_IF;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes("is not a member of 'TON'"));
            assert.strictEqual(d.length, 0, 'Lowercase member should be valid');
        });

        test('does not flag member access on non-FB variable', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 1;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('is not a member of'));
            assert.strictEqual(d.length, 0);
        });

        test('does not flag member on unknown FB type', () => {
            // If FB type is not in standard or custom, skip validation (no false positives)
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myDrive : SOME_VENDOR_FB;
END_VAR
IF myDrive.Running THEN
END_IF;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('is not a member of'));
            assert.strictEqual(d.length, 0);
        });

        test('flags invalid member on custom FB', () => {
            const diags = diagnoseWithSymbols(`
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    Enable : BOOL;
END_VAR
VAR_OUTPUT
    Running : BOOL;
END_VAR
END_FUNCTION_BLOCK

PROGRAM Main
VAR
    motor : FB_Motor;
END_VAR
IF motor.NONEXISTENT THEN
END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('is not a member of'));
            assert.ok(d, 'Should flag invalid member on custom FB');
        });

        test('does not flag valid member on custom FB', () => {
            const diags = diagnoseWithSymbols(`
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    Enable : BOOL;
END_VAR
VAR_OUTPUT
    Running : BOOL;
END_VAR
END_FUNCTION_BLOCK

PROGRAM Main
VAR
    motor : FB_Motor;
END_VAR
IF motor.Running THEN
END_IF;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('is not a member of'));
            assert.strictEqual(d.length, 0);
        });
    });

    suite('FB Call Validation — Duplicate Parameters', () => {

        test('flags duplicate named parameter in FB call', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
myTimer(IN := TRUE, PT := T#5s, IN := FALSE);
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Duplicate parameter 'IN'"));
            assert.ok(d, 'Should flag duplicate parameter');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('does not flag unique parameters', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
myTimer(IN := TRUE, PT := T#5s);
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('Duplicate parameter'));
            assert.strictEqual(d.length, 0);
        });

        test('duplicate detection is case-insensitive', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
myTimer(IN := TRUE, PT := T#5s, in := FALSE);
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('Duplicate parameter'));
            assert.ok(d, 'Case-insensitive duplicate should be flagged');
        });

        test('flags duplicate on second occurrence', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
myTimer(IN := TRUE, PT := T#5s, IN := FALSE);
END_PROGRAM`);
            // Should only flag the second IN, not both
            const dups = diags.filter(d => d.message.includes("Duplicate parameter 'IN'"));
            assert.strictEqual(dups.length, 1, 'Only second occurrence flagged');
        });

        test('does not flag non-FB call param assignments', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    x : INT;
    y : INT;
END_VAR
x := 1;
y := 2;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('Duplicate parameter'));
            assert.strictEqual(d.length, 0);
        });

        test('handles multi-duplicate parameters', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    myTimer : TON;
END_VAR
myTimer(IN := TRUE, PT := T#5s, IN := FALSE, PT := T#10s);
END_PROGRAM`);
            const ins = diags.filter(d => d.message.includes("Duplicate parameter 'IN'"));
            const pts = diags.filter(d => d.message.includes("Duplicate parameter 'PT'"));
            assert.strictEqual(ins.length, 1);
            assert.strictEqual(pts.length, 1);
        });
    });

    suite('Constant Assignment Detection', () => {

        test('flags assignment to VAR_GLOBAL CONSTANT', () => {
            const diags = diagnoseWithSymbols(`
VAR_GLOBAL CONSTANT
    MAX_TEMP : REAL := 100.0;
END_VAR

PROGRAM Main
VAR
    temp : REAL;
END_VAR
    MAX_TEMP := 200.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Cannot assign to constant 'MAX_TEMP'"));
            assert.ok(d, 'Should flag assignment to VAR_GLOBAL CONSTANT');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('flags assignment to VAR CONSTANT', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR CONSTANT
    PI : REAL := 3.14159;
END_VAR
VAR
    result : REAL;
END_VAR
    PI := 3.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Cannot assign to constant 'PI'"));
            assert.ok(d, 'Should flag assignment to VAR CONSTANT');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('does not flag assignment to non-constant variable', () => {
            const diags = diagnoseWithSymbols(`
VAR_GLOBAL
    counter : INT := 0;
END_VAR

PROGRAM Main
VAR
    x : INT;
END_VAR
    counter := 1;
    x := counter + 1;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('Cannot assign to constant'));
            assert.strictEqual(d.length, 0);
        });

        test('does not flag constant used as named FB parameter (depth > 0)', () => {
            const diags = diagnoseWithSymbols(`
VAR_GLOBAL CONSTANT
    MAX_TIME : TIME := T#10s;
END_VAR

PROGRAM Main
VAR
    myTimer : TON;
END_VAR
    myTimer(IN := TRUE, PT := MAX_TIME);
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('Cannot assign to constant'));
            assert.strictEqual(d.length, 0);
        });

        test('constant assignment check is case-insensitive', () => {
            const diags = diagnoseWithSymbols(`
VAR_GLOBAL CONSTANT
    MAX_TEMP : REAL := 100.0;
END_VAR

PROGRAM Main
VAR
    x : REAL;
END_VAR
    max_temp := 50.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.toLowerCase().includes("cannot assign to constant 'max_temp'"));
            assert.ok(d, 'Case-insensitive constant check should flag lowercase usage');
        });

        test('flags multiple assignments to same constant', () => {
            const diags = diagnoseWithSymbols(`
VAR_GLOBAL CONSTANT
    MAX_TEMP : REAL := 100.0;
END_VAR

PROGRAM Main
VAR
    x : REAL;
END_VAR
    MAX_TEMP := 200.0;
    MAX_TEMP := 300.0;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes("Cannot assign to constant 'MAX_TEMP'"));
            assert.strictEqual(d.length, 2, 'Both assignments should be flagged');
        });

        test('flags assignments to multiple different constants', () => {
            const diags = diagnoseWithSymbols(`
VAR_GLOBAL CONSTANT
    MAX_TEMP : REAL := 100.0;
    MIN_TEMP : REAL := 0.0;
END_VAR

PROGRAM Main
VAR
    x : REAL;
END_VAR
    MAX_TEMP := 200.0;
    MIN_TEMP := -10.0;
END_PROGRAM`);
            const maxD = diags.find(d => d.message.includes("Cannot assign to constant 'MAX_TEMP'"));
            const minD = diags.find(d => d.message.includes("Cannot assign to constant 'MIN_TEMP'"));
            assert.ok(maxD, 'MAX_TEMP assignment should be flagged');
            assert.ok(minD, 'MIN_TEMP assignment should be flagged');
        });

        test('does not flag VAR_GLOBAL without CONSTANT qualifier', () => {
            const diags = diagnoseWithSymbols(`
VAR_GLOBAL
    MAX_TEMP : REAL := 100.0;
END_VAR

PROGRAM Main
VAR
    x : REAL;
END_VAR
    MAX_TEMP := 200.0;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('Cannot assign to constant'));
            assert.strictEqual(d.length, 0);
        });
    });

    suite('Array Bounds Checking', () => {
        test('flags index above upper bound', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    temps : ARRAY[1..10] OF REAL;
END_VAR
    temps[15] := 25.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds') && d.message.includes('15'));
            assert.ok(d, 'index 15 out of [1..10] should be flagged');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('flags index below lower bound', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    temps : ARRAY[1..10] OF REAL;
END_VAR
    temps[0] := 10.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds') && d.message.includes('0'));
            assert.ok(d, 'index 0 below [1..10] should be flagged');
        });

        test('does not flag valid in-bounds access', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    temps : ARRAY[1..10] OF REAL;
END_VAR
    temps[1] := 0.0;
    temps[5] := 12.5;
    temps[10] := 99.9;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('out of bounds'));
            assert.strictEqual(d.length, 0, 'valid accesses should not be flagged');
        });

        test('does not flag variable (non-literal) index', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    temps : ARRAY[1..10] OF REAL;
    i : INT;
END_VAR
    temps[i] := 0.0;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('out of bounds'));
            assert.strictEqual(d.length, 0, 'variable index should not be flagged');
        });

        test('flags out-of-bounds on zero-based array', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    buf : ARRAY[0..7] OF BYTE;
END_VAR
    buf[8] := 255;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds') && d.message.includes('8'));
            assert.ok(d, 'index 8 out of [0..7] should be flagged');
        });

        test('flags negative-lower-bound array: below lower', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    offsets : ARRAY[-5..5] OF INT;
END_VAR
    offsets[-6] := 0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds') && d.message.includes('-6'));
            assert.ok(d, 'index -6 below [-5..5] should be flagged');
        });

        test('does not flag valid access on negative-lower-bound array', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    offsets : ARRAY[-5..5] OF INT;
END_VAR
    offsets[-5] := 0;
    offsets[0] := 1;
    offsets[5] := 2;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('out of bounds'));
            assert.strictEqual(d.length, 0);
        });

        test('flags out-of-bounds in second dimension of multi-dim array', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    matrix : ARRAY[1..4, 1..4] OF REAL;
END_VAR
    matrix[2, 5] := 1.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds') && d.message.includes('5'));
            assert.ok(d, 'column index 5 out of [1..4] should be flagged');
        });

        test('flags out-of-bounds in first dimension of multi-dim array', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    matrix : ARRAY[1..4, 1..4] OF REAL;
END_VAR
    matrix[0, 2] := 1.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds') && d.message.includes('0'));
            assert.ok(d, 'row index 0 out of [1..4] should be flagged');
        });

        test('does not flag valid multi-dim access', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    matrix : ARRAY[1..4, 1..4] OF REAL;
END_VAR
    matrix[1, 1] := 0.0;
    matrix[4, 4] := 0.0;
END_PROGRAM`);
            const d = diags.filter(d => d.message.includes('out of bounds'));
            assert.strictEqual(d.length, 0);
        });

        test('flags read (RHS) as well as write (LHS)', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    arr : ARRAY[1..5] OF INT;
    x : INT;
END_VAR
    x := arr[99];
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds') && d.message.includes('99'));
            assert.ok(d, 'out-of-bounds read should also be flagged');
        });

        test('message includes array name and bounds', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    temps : ARRAY[1..10] OF REAL;
END_VAR
    temps[20] := 0.0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('out of bounds'));
            assert.ok(d);
            assert.ok(d!.message.includes('temps'), 'message should include array name');
            assert.ok(d!.message.includes('[1..10]'), 'message should include declared bounds');
            assert.ok(d!.message.includes('20'), 'message should include offending index');
        });
    });

    // ─── FOR loop bounds validation ──────────────────────────────────────────

    suite('FOR loop bounds validation', () => {

        // ── valid loops — no diagnostics ────────────────────────────────────

        test('no diagnostic for normal ascending loop (default BY)', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 1 TO 10 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.filter(d => d.message.toLowerCase().includes('for loop'));
            assert.strictEqual(d.length, 0);
        });

        test('no diagnostic for ascending loop with explicit BY 1', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 1 TO 10 BY 1 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.filter(d => d.message.toLowerCase().includes('for loop'));
            assert.strictEqual(d.length, 0);
        });

        test('no diagnostic for descending loop with BY -1', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 10 TO 1 BY -1 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.filter(d => d.message.toLowerCase().includes('for loop'));
            assert.strictEqual(d.length, 0);
        });

        test('no diagnostic for loop with variable bounds', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i, start, stop : INT;
END_VAR
    FOR i := start TO stop DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.filter(d => d.message.toLowerCase().includes('for loop'));
            assert.strictEqual(d.length, 0);
        });

        test('no diagnostic for loop where start equals end with negative BY (immediate exit, not flagged as never-executes)', () => {
            // start == end is flagged as hint regardless of step direction
            // but start < end with negative BY is a warning — test start == end below
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 5 TO 3 BY -1 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.filter(d => d.message.toLowerCase().includes('for loop'));
            assert.strictEqual(d.length, 0, 'descending with negative step should be ok');
        });

        // ── BY 0: error ──────────────────────────────────────────────────────

        test('BY 0 flagged as error', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 1 TO 10 BY 0 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('BY 0') || d.message.includes('infinite loop'));
            assert.ok(d, 'BY 0 should be flagged');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Error);
        });

        test('BY 0 message mentions infinite loop', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 1 TO 10 BY 0 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.toLowerCase().includes('infinite loop'));
            assert.ok(d, 'message should mention infinite loop');
        });

        // ── reverse range + positive step: warning ───────────────────────────

        test('start > end with positive BY flagged as warning', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 10 TO 1 BY 1 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('never executes'));
            assert.ok(d, 'reverse range with positive step should warn');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Warning);
        });

        test('start > end default BY (no BY clause, implicit +1) flagged as warning', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 10 TO 1 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('never executes'));
            assert.ok(d, 'reverse range with implicit +1 should warn');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Warning);
        });

        test('start < end with negative BY flagged as warning', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 1 TO 10 BY -1 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('never executes'));
            assert.ok(d, 'ascending range with negative step should warn');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Warning);
        });

        test('warning message includes start, end and BY values', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 10 TO 1 BY 1 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('never executes'));
            assert.ok(d);
            assert.ok(d!.message.includes('10'), 'message should include start value');
            assert.ok(d!.message.includes('1'), 'message should include end value');
        });

        // ── single iteration: hint ───────────────────────────────────────────

        test('start equals end flagged as hint', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 5 TO 5 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('exactly once') || d.message.includes('start equals end'));
            assert.ok(d, 'start==end should be flagged as hint');
            assert.strictEqual(d!.severity, DiagnosticSeverity.Hint);
        });

        test('hint message includes the repeated value', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 7 TO 7 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes('exactly once') || d.message.includes('start equals end'));
            assert.ok(d);
            assert.ok(d!.message.includes('7'), 'message should include the repeated bound value');
        });

        // ── source: only 'ControlForge ST' ──────────────────────────────────

        test('diagnostics have correct source', () => {
            const diags = diagnoseWithSymbols(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 1 TO 10 BY 0 DO
        i := i + 1;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.toLowerCase().includes('infinite loop'));
            assert.ok(d);
            assert.strictEqual(d!.source, 'ControlForge ST');
        });
    });

    suite("Assignment/Comparison Confusion — '=' in statement context", () => {

        // ── should flag ──────────────────────────────────────────────────────

        test('flags simple identifier = expr as warning', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    counter : INT;
END_VAR
    counter = counter + 1;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.ok(d, "Should flag 'counter = counter + 1'");
            assert.strictEqual(d!.severity, DiagnosticSeverity.Warning);
        });

        test('diagnostic message suggests :=', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x = 42;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.ok(d);
            assert.ok(d!.message.includes(":="), "Message should suggest ':='");
        });

        test('diagnostic points at the = character', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x = 42;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.ok(d);
            // Line 5 (0-indexed): "    x = 42;"
            // `=` is at column 6
            assert.strictEqual(d!.range.start.line, 5);
            assert.strictEqual(d!.range.start.character, 6);
            assert.strictEqual(d!.range.end.character, 7); // length 1
        });

        test('flags array element assignment confusion', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    arr : ARRAY[0..9] OF INT;
END_VAR
    arr[0] = 5;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.ok(d, "Should flag 'arr[0] = 5'");
        });

        test('flags member access assignment confusion', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    fb : TON;
END_VAR
    fb.PT = T#1s;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.ok(d, "Should flag 'fb.PT = T#1s'");
        });

        test('diagnostic has correct source', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x = 1;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.ok(d);
            assert.strictEqual(d!.source, 'ControlForge ST');
        });

        // ── should NOT flag ──────────────────────────────────────────────────

        test('no false positive for correct := assignment', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 42;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag ':='");
        });

        test('no false positive for = in IF condition', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x = 10 THEN
        x := 0;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag '=' in IF condition");
        });

        test('no false positive for <= comparison', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
    ok : BOOL;
END_VAR
    ok := x <= 10;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag '<='");
        });

        test('no false positive for >= comparison', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
    ok : BOOL;
END_VAR
    ok := x >= 5;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag '>='");
        });

        test('no false positive for <> comparison', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
    ok : BOOL;
END_VAR
    ok := x <> 0;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag '<>'");
        });

        test('no false positive for = inside VAR declaration', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT := 5;
END_VAR
    x := x + 1;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag = inside VAR section");
        });

        test('no false positive for = comparison inside parentheses in statement', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
    ok : BOOL;
END_VAR
    ok := (x = 5);
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag '=' inside parens on RHS");
        });

        test('no false positive when = is inside inline FB call (paren depth > 0)', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    tmr : TON;
END_VAR
    tmr(IN := TRUE, PT := T#1s);
    IF tmr.Q = TRUE THEN
        tmr(IN := FALSE, PT := T#1s);
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag '=' inside FB call parens or in IF condition");
        });

        test('no false positive for = in a complex BOOL expression on RHS', () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
    safeToStart : BOOL;
    emergencyStop : BOOL;
END_VAR
    safeToStart := (emergencyStop = FALSE) AND (x > 0);
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used '=' in statement context"));
            assert.strictEqual(d, undefined, "Should not flag '=' in parenthesised RHS expression");
        });
    });

    suite("Assignment/Comparison Confusion — ':=' in boolean condition context", () => {

        // ── should flag ──────────────────────────────────────────────────────

        test("flags ':=' in IF condition as warning", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x := 10 THEN
        x := 0;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.ok(d, "Should flag ':=' in IF condition");
            assert.strictEqual(d!.severity, DiagnosticSeverity.Warning);
        });

        test("diagnostic message suggests =", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x := 10 THEN
        x := 0;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.ok(d);
            assert.ok(d!.message.includes("'='"), "Message should suggest '='");
        });

        test("diagnostic points at the := token (length 2)", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x := 10 THEN
        x := 0;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.ok(d);
            // Line 5 (0-indexed): "    IF x := 10 THEN"
            // ':=' is at column 9
            assert.strictEqual(d!.range.start.line, 5);
            assert.strictEqual(d!.range.start.character, 9);
            assert.strictEqual(d!.range.end.character, 11); // length 2
        });

        test("flags ':=' in ELSIF condition", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x = 0 THEN
        x := 1;
    ELSIF x := 5 THEN
        x := 0;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.ok(d, "Should flag ':=' in ELSIF condition");
        });

        test("flags ':=' in WHILE condition", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    WHILE x := 0 DO
        x := x + 1;
    END_WHILE;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.ok(d, "Should flag ':=' in WHILE condition");
        });

        test("diagnostic has correct source", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x := 0 THEN
        x := 1;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.ok(d);
            assert.strictEqual(d!.source, 'ControlForge ST');
        });

        // ── should NOT flag ──────────────────────────────────────────────────

        test("no false positive for correct = in IF condition", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x = 10 THEN
        x := 0;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.strictEqual(d, undefined, "Should not flag '=' in IF condition");
        });

        test("no false positive for := in IF body (same line, after THEN — rare)", () => {
            // This test verifies we don't accidentally flag correct := in statement body
            const diags = diagnose(`
PROGRAM Main
VAR
    x : INT;
    y : INT;
END_VAR
    IF x = 0 THEN
        y := 1;
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.strictEqual(d, undefined, "Should not flag ':=' in IF body");
        });

        test("no false positive for named-param := inside parens in IF", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    tmr : TON;
END_VAR
    IF tmr.Q = TRUE THEN
        tmr(IN := FALSE, PT := T#1s);
    END_IF;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.strictEqual(d, undefined, "Should not flag ':=' inside parens in IF body");
        });

        test("no false positive for correct FOR loop (uses := for loop var)", () => {
            const diags = diagnose(`
PROGRAM Main
VAR
    i : INT;
END_VAR
    FOR i := 1 TO 10 DO
        i := i;
    END_FOR;
END_PROGRAM`);
            const d = diags.find(d => d.message.includes("Used ':=' in condition context"));
            assert.strictEqual(d, undefined, "Should not flag ':=' in FOR loop header");
        });
    });
});

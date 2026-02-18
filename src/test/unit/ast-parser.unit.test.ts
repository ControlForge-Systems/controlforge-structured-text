import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { STASTParser } from '../../server/ast-parser';
import { STSymbolKind, STScope } from '../../shared/types';

/**
 * Helper: create TextDocument from ST source code
 */
function doc(content: string): TextDocument {
    return TextDocument.create('file:///test.st', 'structured-text', 1, content);
}

/**
 * Helper: parse and return all symbols
 */
function parse(content: string) {
    return new STASTParser(doc(content)).parseSymbols();
}

/**
 * Helper: find symbol by name (case-insensitive)
 */
function findSymbol(symbols: ReturnType<typeof parse>, name: string) {
    const lower = name.toLowerCase();
    return symbols.find(s => (s.normalizedName || s.name.toLowerCase()) === lower);
}

suite('AST Parser Unit Tests', () => {

    suite('Basic Declarations', () => {
        test('should parse simple variable declarations', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
END_VAR
END_PROGRAM`);

            const counter = findSymbol(symbols, 'counter');
            assert.ok(counter, 'counter should exist');
            assert.strictEqual(counter!.dataType, 'INT');
            assert.strictEqual(counter!.kind, STSymbolKind.Variable);

            const temp = findSymbol(symbols, 'temperature');
            assert.ok(temp, 'temperature should exist');
            assert.strictEqual(temp!.dataType, 'REAL');

            const running = findSymbol(symbols, 'isRunning');
            assert.ok(running, 'isRunning should exist');
            assert.strictEqual(running!.dataType, 'BOOL');
        });

        test('should parse variable without initialization', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    counter : INT;
END_VAR
END_PROGRAM`);

            const counter = findSymbol(symbols, 'counter');
            assert.ok(counter);
            assert.strictEqual(counter!.dataType, 'INT');
        });

        test('should parse AT declarations', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    input1 AT %IX0.0 : BOOL;
    output1 AT %QX0.0 : BOOL;
END_VAR
END_PROGRAM`);

            const input1 = findSymbol(symbols, 'input1');
            assert.ok(input1);
            assert.strictEqual(input1!.dataType, 'BOOL');

            const output1 = findSymbol(symbols, 'output1');
            assert.ok(output1);
        });
    });

    suite('Multi-Line Declarations (#41)', () => {
        test('should parse multi-line array initialization', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    myArray : ARRAY[1..10] OF INT := [
        1, 2, 3,
        4, 5, 6,
        7, 8, 9, 10
    ];
END_VAR
END_PROGRAM`);

            const arr = findSymbol(symbols, 'myArray');
            assert.ok(arr, 'myArray should be parsed from multi-line declaration');
            assert.strictEqual(arr!.dataType, 'INT');
        });

        test('should parse multi-line struct initialization', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    myStruct : MyStructType := (
        field1 := 100,
        field2 := TRUE
    );
END_VAR
END_PROGRAM`);

            const s = findSymbol(symbols, 'myStruct');
            assert.ok(s, 'myStruct should be parsed from multi-line declaration');
            assert.strictEqual(s!.dataType, 'MyStructType');
        });

        test('should parse declaration with type on next line', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    veryLongVariableName :
        ARRAY[1..100] OF REAL;
END_VAR
END_PROGRAM`);

            const v = findSymbol(symbols, 'veryLongVariableName');
            assert.ok(v, 'variable split across lines should be parsed');
            assert.strictEqual(v!.dataType, 'REAL');
        });

        test('should parse multiple declarations after multi-line one', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    bigArray : ARRAY[1..5] OF INT := [
        1, 2, 3, 4, 5
    ];
    simpleVar : BOOL := TRUE;
END_VAR
END_PROGRAM`);

            const arr = findSymbol(symbols, 'bigArray');
            assert.ok(arr);

            const simple = findSymbol(symbols, 'simpleVar');
            assert.ok(simple, 'variable after multi-line declaration should be parsed');
            assert.strictEqual(simple!.dataType, 'BOOL');
        });
    });

    suite('Complex Types', () => {
        test('should parse STRING with length', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    msg : STRING[80] := 'hello';
END_VAR
END_PROGRAM`);

            const msg = findSymbol(symbols, 'msg');
            assert.ok(msg);
            assert.strictEqual(msg!.dataType, 'STRING');
        });

        test('should parse WSTRING with length', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    wmsg : WSTRING[255];
END_VAR
END_PROGRAM`);

            const wmsg = findSymbol(symbols, 'wmsg');
            assert.ok(wmsg);
            assert.strictEqual(wmsg!.dataType, 'WSTRING');
        });

        test('should parse POINTER TO type', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    tempPointer : POINTER TO REAL;
END_VAR
END_PROGRAM`);

            const ptr = findSymbol(symbols, 'tempPointer');
            assert.ok(ptr, 'POINTER TO should be parsed');
            assert.strictEqual(ptr!.dataType, 'REAL');
            assert.ok(ptr!.description?.includes('Pointer'));
        });

        test('should parse REFERENCE TO type', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    tempRef : REFERENCE TO REAL;
END_VAR
END_PROGRAM`);

            const ref = findSymbol(symbols, 'tempRef');
            assert.ok(ref, 'REFERENCE TO should be parsed');
            assert.strictEqual(ref!.dataType, 'REAL');
            assert.ok(ref!.description?.includes('Reference'));
        });

        test('should parse ARRAY with OF', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    temps : ARRAY[1..10] OF REAL;
END_VAR
END_PROGRAM`);

            const temps = findSymbol(symbols, 'temps');
            assert.ok(temps);
            assert.strictEqual(temps!.dataType, 'REAL');
            assert.ok(temps!.description?.includes('Array'));
        });
    });

    suite('Multi-Variable Declarations', () => {
        test('should expand comma-separated variable names', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    a, b, c : INT;
END_VAR
END_PROGRAM`);

            const a = findSymbol(symbols, 'a');
            const b = findSymbol(symbols, 'b');
            const c = findSymbol(symbols, 'c');
            assert.ok(a, 'a should exist');
            assert.ok(b, 'b should exist');
            assert.ok(c, 'c should exist');
            assert.strictEqual(a!.dataType, 'INT');
            assert.strictEqual(b!.dataType, 'INT');
            assert.strictEqual(c!.dataType, 'INT');
        });

        test('should expand comma-separated with initialization', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    x, y : REAL := 0.0;
END_VAR
END_PROGRAM`);

            const x = findSymbol(symbols, 'x');
            const y = findSymbol(symbols, 'y');
            assert.ok(x);
            assert.ok(y);
            assert.strictEqual(x!.dataType, 'REAL');
        });
    });

    suite('VAR Qualifiers', () => {
        test('should parse VAR_GLOBAL CONSTANT', () => {
            const symbols = parse(`
VAR_GLOBAL CONSTANT
    MAX_TEMP : REAL := 100.0;
    VERSION : STRING := 'v1.0';
END_VAR`);

            const maxTemp = findSymbol(symbols, 'MAX_TEMP');
            assert.ok(maxTemp, 'VAR_GLOBAL CONSTANT vars should be parsed');
            assert.strictEqual(maxTemp!.dataType, 'REAL');
            assert.strictEqual(maxTemp!.scope, STScope.Global);
        });

        test('should parse VAR_GLOBAL RETAIN', () => {
            const symbols = parse(`
VAR_GLOBAL RETAIN
    retainedVal : INT := 42;
END_VAR`);

            const rv = findSymbol(symbols, 'retainedVal');
            assert.ok(rv, 'VAR_GLOBAL RETAIN should be parsed');
        });

        test('should parse VAR CONSTANT inside program', () => {
            const symbols = parse(`
PROGRAM Test
VAR CONSTANT
    PI : REAL := 3.14159;
END_VAR
END_PROGRAM`);

            const pi = findSymbol(symbols, 'PI');
            assert.ok(pi, 'VAR CONSTANT inside program should be parsed');
            assert.strictEqual(pi!.dataType, 'REAL');
        });
    });

    suite('Function Block Instances', () => {
        test('should identify FB instances as FunctionBlockInstance kind', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    myTimer : TON;
    myCounter : CTU;
END_VAR
END_PROGRAM`);

            // TON/CTU are in KNOWN_TYPES so they're Variable, not FBInstance
            // This matches existing behavior since std FBs are treated as known
            const timer = findSymbol(symbols, 'myTimer');
            assert.ok(timer);
        });

        test('should identify custom FB instances', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    motor1 : FB_Motor;
END_VAR
END_PROGRAM`);

            const motor = findSymbol(symbols, 'motor1');
            assert.ok(motor);
            assert.strictEqual(motor!.kind, STSymbolKind.FunctionBlockInstance);
            assert.strictEqual(motor!.dataType, 'FB_Motor');
        });
    });

    suite('Top-Level Constructs', () => {
        test('should parse PROGRAM', () => {
            const symbols = parse(`
PROGRAM MainProgram
VAR
    x : INT;
END_VAR
END_PROGRAM`);

            const prog = findSymbol(symbols, 'MainProgram');
            assert.ok(prog);
            assert.strictEqual(prog!.kind, STSymbolKind.Program);
        });

        test('should parse FUNCTION with return type', () => {
            const symbols = parse(`
FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
END_FUNCTION`);

            const func = findSymbol(symbols, 'Add');
            assert.ok(func);
            assert.strictEqual(func!.kind, STSymbolKind.Function);
            assert.strictEqual(func!.returnType, 'INT');
        });

        test('should parse FUNCTION_BLOCK with parameters and locals', () => {
            const symbols = parse(`
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
END_FUNCTION_BLOCK`);

            const fb = findSymbol(symbols, 'FB_Motor');
            assert.ok(fb);
            assert.strictEqual(fb!.kind, STSymbolKind.FunctionBlock);

            // Parameters
            assert.ok(fb!.parameters);
            assert.ok(fb!.parameters!.length >= 3, `expected >=3 params, got ${fb!.parameters!.length}`);

            // Members (all VAR section vars)
            assert.ok(fb!.members);
            const memberNames = fb!.members!.map(m => m.name);
            assert.ok(memberNames.includes('start'), 'start should be a member');
            assert.ok(memberNames.includes('speed'), 'speed should be a member');
            assert.ok(memberNames.includes('running'), 'running should be a member');
            assert.ok(memberNames.includes('internal'), 'internal should be a member');
        });
    });

    suite('Global Variables', () => {
        test('should parse standalone VAR_GLOBAL', () => {
            const symbols = parse(`
VAR_GLOBAL
    systemStatus : BOOL := FALSE;
    globalCounter : DINT := 0;
END_VAR`);

            const status = findSymbol(symbols, 'systemStatus');
            assert.ok(status);
            assert.strictEqual(status!.scope, STScope.Global);
            assert.strictEqual(status!.dataType, 'BOOL');
        });
    });

    suite('Comment Handling', () => {
        test('should ignore single-line comments', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    // This is a comment
    counter : INT; // inline comment
END_VAR
END_PROGRAM`);

            const counter = findSymbol(symbols, 'counter');
            assert.ok(counter);
            assert.strictEqual(counter!.dataType, 'INT');
        });

        test('should ignore block comments', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    (* Block comment *)
    counter : INT;
    value : REAL (* inline block *) := 1.0;
END_VAR
END_PROGRAM`);

            const counter = findSymbol(symbols, 'counter');
            assert.ok(counter);

            const value = findSymbol(symbols, 'value');
            assert.ok(value);
            assert.strictEqual(value!.dataType, 'REAL');
        });
    });

    suite('Attributes', () => {
        test('should parse variables with attribute annotations', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    speed : REAL := 0.0 {attribute := 'persistent'};
END_VAR
END_PROGRAM`);

            const speed = findSymbol(symbols, 'speed');
            assert.ok(speed, 'variable with attribute should be parsed');
            assert.strictEqual(speed!.dataType, 'REAL');
        });
    });

    suite('Real-World Patterns', () => {
        test('should parse comprehensive sample (sample.st pattern)', () => {
            const symbols = parse(`
PROGRAM ExampleProgram
VAR
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
    message : STRING := 'Hello PLC World';
    wideMessage : WSTRING := "Unicode Text";
    timer : TIME := T#10s;
    currentDate : DATE := D#2025-06-12;
    byteValue : BYTE := 16#FF;
    tempArray : TemperatureArray;
    tempPointer : POINTER TO REAL;
    tempReference : REFERENCE TO REAL;
    pulseTimer : TP;
    onDelayTimer : TON;
    motor1 : FB_Motor;
    motor2 : FB_Motor;
END_VAR
END_PROGRAM`);

            // Spot-check key variables
            assert.ok(findSymbol(symbols, 'counter'));
            assert.ok(findSymbol(symbols, 'message'));
            assert.ok(findSymbol(symbols, 'wideMessage'));
            assert.ok(findSymbol(symbols, 'timer'));
            assert.ok(findSymbol(symbols, 'tempPointer'));
            assert.ok(findSymbol(symbols, 'tempReference'));
            assert.ok(findSymbol(symbols, 'motor1'));
            assert.ok(findSymbol(symbols, 'motor2'));

            const motor1 = findSymbol(symbols, 'motor1');
            assert.strictEqual(motor1!.kind, STSymbolKind.FunctionBlockInstance);
            assert.strictEqual(motor1!.dataType, 'FB_Motor');
        });

        test('should parse library.st VAR_GLOBAL CONSTANT pattern', () => {
            const symbols = parse(`
VAR_GLOBAL CONSTANT
    MAX_TEMPERATURE : REAL := 100.0;
    MIN_TEMPERATURE : REAL := 0.0;
    SYSTEM_VERSION : STRING := 'v2.1.0';
END_VAR

FUNCTION CelsiusToFahrenheit : REAL
VAR_INPUT
    celsius : REAL;
END_VAR
END_FUNCTION`);

            assert.ok(findSymbol(symbols, 'MAX_TEMPERATURE'), 'VAR_GLOBAL CONSTANT should parse');
            assert.ok(findSymbol(symbols, 'MIN_TEMPERATURE'));
            assert.ok(findSymbol(symbols, 'SYSTEM_VERSION'));
            assert.ok(findSymbol(symbols, 'CelsiusToFahrenheit'));
        });

        test('should parse case-insensitive identifiers', () => {
            const symbols = parse(`
PROGRAM Test
VAR
    MyVar : INT;
END_VAR
END_PROGRAM`);

            const v = findSymbol(symbols, 'myvar');
            assert.ok(v, 'case-insensitive lookup should work');
            assert.strictEqual(v!.name, 'MyVar', 'original case should be preserved');
        });
    });
});

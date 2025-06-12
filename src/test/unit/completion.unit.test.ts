import * as assert from 'assert';
import { extractVariables, extractFunctionBlocks, getCompletionKeywords, getCodeSnippets } from '../../parser';

// Test the parser functions that support completion functionality

suite('Completion Provider Unit Tests', () => {

    suite('Variable Extraction', () => {
        test('should extract variables from VAR block', () => {
            const code = `PROGRAM Test
VAR
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
END_VAR
END_PROGRAM`;

            const variables = extractVariables(code);

            assert.strictEqual(variables.length, 3);
            assert.strictEqual(variables[0].name, 'counter');
            assert.strictEqual(variables[0].type, 'INT');
            assert.strictEqual(variables[1].name, 'temperature');
            assert.strictEqual(variables[1].type, 'REAL');
            assert.strictEqual(variables[2].name, 'isRunning');
            assert.strictEqual(variables[2].type, 'BOOL');
        });

        test('should extract variables from VAR_INPUT block', () => {
            const code = `FUNCTION_BLOCK FB_Test
VAR_INPUT
    start : BOOL;
    setpoint : REAL;
END_VAR
END_FUNCTION_BLOCK`;

            const variables = extractVariables(code);

            assert.strictEqual(variables.length, 2);
            assert.strictEqual(variables[0].name, 'start');
            assert.strictEqual(variables[0].type, 'BOOL');
            assert.strictEqual(variables[1].name, 'setpoint');
            assert.strictEqual(variables[1].type, 'REAL');
        });

        test('should handle variables with initialization values', () => {
            const code = `VAR
    counter : INT := 0;
    message : STRING := 'Hello';
    timer : TIME := T#10s;
END_VAR`;

            const variables = extractVariables(code);

            assert.strictEqual(variables.length, 3);
            assert.strictEqual(variables[0].name, 'counter');
            assert.strictEqual(variables[0].type, 'INT');
            assert.strictEqual(variables[1].name, 'message');
            assert.strictEqual(variables[1].type, 'STRING');
            assert.strictEqual(variables[2].name, 'timer');
            assert.strictEqual(variables[2].type, 'TIME');
        });

        test('should handle empty VAR blocks', () => {
            const code = `VAR
END_VAR`;

            const variables = extractVariables(code);
            assert.strictEqual(variables.length, 0);
        });

        test('should extract from multiple VAR blocks', () => {
            const code = `FUNCTION_BLOCK FB_Test
VAR_INPUT
    input1 : BOOL;
    input2 : INT;
END_VAR

VAR_OUTPUT
    output1 : REAL;
END_VAR

VAR
    local1 : STRING;
    local2 : TIME;
END_VAR
END_FUNCTION_BLOCK`;

            const variables = extractVariables(code);

            assert.strictEqual(variables.length, 5);
            assert.strictEqual(variables[0].name, 'input1');
            assert.strictEqual(variables[0].type, 'BOOL');
            assert.strictEqual(variables[1].name, 'input2');
            assert.strictEqual(variables[1].type, 'INT');
            assert.strictEqual(variables[2].name, 'output1');
            assert.strictEqual(variables[2].type, 'REAL');
            assert.strictEqual(variables[3].name, 'local1');
            assert.strictEqual(variables[3].type, 'STRING');
            assert.strictEqual(variables[4].name, 'local2');
            assert.strictEqual(variables[4].type, 'TIME');
        });
    });

    suite('Function Block Extraction', () => {
        test('should extract function block names', () => {
            const code = `FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
END_VAR
END_FUNCTION_BLOCK

FUNCTION_BLOCK FB_PID
VAR_INPUT
    setpoint : REAL;
END_VAR
END_FUNCTION_BLOCK`;

            const functionBlocks = extractFunctionBlocks(code);

            assert.strictEqual(functionBlocks.length, 2);
            assert.strictEqual(functionBlocks[0].name, 'FB_Motor');
            assert.strictEqual(functionBlocks[1].name, 'FB_PID');
        });

        test('should handle function blocks with different naming conventions', () => {
            const code = `FUNCTION_BLOCK MyFunctionBlock
END_FUNCTION_BLOCK

FUNCTION_BLOCK FB_Test123
END_FUNCTION_BLOCK

FUNCTION_BLOCK simple
END_FUNCTION_BLOCK`;

            const functionBlocks = extractFunctionBlocks(code);

            assert.strictEqual(functionBlocks.length, 3);
            assert.strictEqual(functionBlocks[0].name, 'MyFunctionBlock');
            assert.strictEqual(functionBlocks[1].name, 'FB_Test123');
            assert.strictEqual(functionBlocks[2].name, 'simple');
        });

        test('should handle no function blocks', () => {
            const code = `PROGRAM Test
VAR
    counter : INT;
END_VAR
END_PROGRAM`;

            const functionBlocks = extractFunctionBlocks(code);
            assert.strictEqual(functionBlocks.length, 0);
        });

        test('should ignore nested or commented function blocks', () => {
            const code = `(* This is a comment with FUNCTION_BLOCK FB_Commented *)
FUNCTION_BLOCK FB_Real
    // Another comment: FUNCTION_BLOCK FB_InComment
VAR
    test : BOOL;
END_VAR
END_FUNCTION_BLOCK`;

            const functionBlocks = extractFunctionBlocks(code);

            // Should only find the real function block, not the ones in comments
            assert.strictEqual(functionBlocks.length, 1);
            assert.strictEqual(functionBlocks[0].name, 'FB_Real');
        });
    });

    suite('Completion Keywords', () => {
        test('should provide categorized keywords', () => {
            const keywords = getCompletionKeywords();

            // Test that all categories exist
            assert.ok(keywords.controlKeywords, 'Should have control keywords');
            assert.ok(keywords.declarationKeywords, 'Should have declaration keywords');
            assert.ok(keywords.dataTypes, 'Should have data types');
            assert.ok(keywords.literals, 'Should have literals');

            // Test some specific keywords
            const controlKeywordNames = keywords.controlKeywords.map(k => k.keyword);
            assert.ok(controlKeywordNames.includes('IF'), 'Should include IF keyword');
            assert.ok(controlKeywordNames.includes('FOR'), 'Should include FOR keyword');
            assert.ok(controlKeywordNames.includes('WHILE'), 'Should include WHILE keyword');

            const dataTypeNames = keywords.dataTypes.map(k => k.keyword);
            assert.ok(dataTypeNames.includes('BOOL'), 'Should include BOOL data type');
            assert.ok(dataTypeNames.includes('INT'), 'Should include INT data type');
            assert.ok(dataTypeNames.includes('REAL'), 'Should include REAL data type');
        });

        test('should provide keyword documentation', () => {
            const keywords = getCompletionKeywords();

            // Check that keywords have proper documentation
            const ifKeyword = keywords.controlKeywords.find(k => k.keyword === 'IF');
            assert.ok(ifKeyword, 'Should find IF keyword');
            assert.ok(ifKeyword!.detail, 'IF should have detail');
            assert.ok(ifKeyword!.documentation, 'IF should have documentation');
            assert.ok(ifKeyword!.documentation.includes('IF'), 'Documentation should mention IF');
        });
    });

    suite('Code Snippets', () => {
        test('should provide code snippets', () => {
            const snippets = getCodeSnippets();

            assert.ok(snippets.length > 0, 'Should have snippets');

            // Check for specific snippets
            const snippetLabels = snippets.map(s => s.label);
            assert.ok(snippetLabels.includes('if-then-end'), 'Should have IF-THEN-END snippet');
            assert.ok(snippetLabels.includes('for-loop'), 'Should have FOR loop snippet');
            assert.ok(snippetLabels.includes('function-block'), 'Should have function block snippet');
        });

        test('should provide IF-THEN-END snippet with placeholders', () => {
            const snippets = getCodeSnippets();
            const ifSnippet = snippets.find(s => s.label === 'if-then-end');

            assert.ok(ifSnippet, 'Should find IF-THEN-END snippet');
            assert.ok(ifSnippet!.insertText.includes('IF'), 'Should contain IF keyword');
            assert.ok(ifSnippet!.insertText.includes('THEN'), 'Should contain THEN keyword');
            assert.ok(ifSnippet!.insertText.includes('END_IF'), 'Should contain END_IF keyword');
            assert.ok(ifSnippet!.insertText.includes('${1:condition}'), 'Should have placeholder for condition');
        });

        test('should provide FOR loop snippet with placeholders', () => {
            const snippets = getCodeSnippets();
            const forSnippet = snippets.find(s => s.label === 'for-loop');

            assert.ok(forSnippet, 'Should find FOR loop snippet');
            assert.ok(forSnippet!.insertText.includes('FOR'), 'Should contain FOR keyword');
            assert.ok(forSnippet!.insertText.includes('TO'), 'Should contain TO keyword');
            assert.ok(forSnippet!.insertText.includes('DO'), 'Should contain DO keyword');
            assert.ok(forSnippet!.insertText.includes('END_FOR'), 'Should contain END_FOR keyword');
            assert.ok(forSnippet!.insertText.includes('${1:i}'), 'Should have placeholder for variable');
        });

        test('should provide function block template with complete structure', () => {
            const snippets = getCodeSnippets();
            const fbSnippet = snippets.find(s => s.label === 'function-block');

            assert.ok(fbSnippet, 'Should find function block snippet');
            assert.ok(fbSnippet!.insertText.includes('FUNCTION_BLOCK'), 'Should contain FUNCTION_BLOCK keyword');
            assert.ok(fbSnippet!.insertText.includes('VAR_INPUT'), 'Should contain VAR_INPUT section');
            assert.ok(fbSnippet!.insertText.includes('VAR_OUTPUT'), 'Should contain VAR_OUTPUT section');
            assert.ok(fbSnippet!.insertText.includes('VAR'), 'Should contain VAR section');
            assert.ok(fbSnippet!.insertText.includes('END_FUNCTION_BLOCK'), 'Should contain END_FUNCTION_BLOCK keyword');
        });
    });
});

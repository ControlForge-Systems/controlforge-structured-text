/**
 * Structured Text parsing utilities
 * This module contains pure functions that can be tested independently of VS Code
 */

// Helper interfaces for parsing
export interface Variable {
    name: string;
    type: string;
}

export interface FunctionBlock {
    name: string;
}

/**
 * Extracts variable declarations from Structured Text code
 * @param text The Structured Text code to parse
 * @returns Array of variables found in VAR blocks
 */
export function extractVariables(text: string): Variable[] {
    const variables: Variable[] = [];
    const lines = text.split('\n');
    let inVarBlock = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Check if we're entering a VAR block
        if (trimmedLine.match(/^VAR(?:_INPUT|_OUTPUT|_IN_OUT|_TEMP|_GLOBAL|_ACCESS|_CONFIG|_EXTERNAL)?$/)) {
            inVarBlock = true;
            continue;
        }

        // Check if we're leaving a VAR block
        if (trimmedLine === 'END_VAR') {
            inVarBlock = false;
            continue;
        }

        // If we're in a VAR block, extract variable declarations
        if (inVarBlock && trimmedLine.includes(':')) {
            const match = trimmedLine.match(/^\s*(\w+)\s*:\s*(\w+)/);
            if (match) {
                variables.push({
                    name: match[1],
                    type: match[2]
                });
            }
        }
    }

    return variables;
}

/**
 * Extracts function block declarations from Structured Text code
 * @param text The Structured Text code to parse
 * @returns Array of function blocks found
 */
export function extractFunctionBlocks(text: string): FunctionBlock[] {
    const functionBlocks: FunctionBlock[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        const match = trimmedLine.match(/^FUNCTION_BLOCK\s+(\w+)/);
        if (match) {
            functionBlocks.push({
                name: match[1]
            });
        }
    }

    return functionBlocks;
}

/**
 * Gets completion keywords categorized by type
 */
export function getCompletionKeywords() {
    return {
        controlKeywords: [
            { keyword: 'IF', detail: 'Conditional statement', documentation: 'IF condition THEN ... END_IF' },
            { keyword: 'THEN', detail: 'If condition body', documentation: 'Used after IF condition' },
            { keyword: 'ELSE', detail: 'Alternative condition', documentation: 'Alternative path in IF statement' },
            { keyword: 'ELSIF', detail: 'Additional condition', documentation: 'Additional condition in IF statement' },
            { keyword: 'END_IF', detail: 'End if statement', documentation: 'Closes IF statement' },
            { keyword: 'CASE', detail: 'Switch statement', documentation: 'CASE variable OF ... END_CASE' },
            { keyword: 'OF', detail: 'Case values', documentation: 'Used in CASE statement' },
            { keyword: 'END_CASE', detail: 'End case statement', documentation: 'Closes CASE statement' },
            { keyword: 'FOR', detail: 'For loop', documentation: 'FOR variable := start TO end DO ... END_FOR' },
            { keyword: 'TO', detail: 'Loop end value', documentation: 'Specifies end value in FOR loop' },
            { keyword: 'BY', detail: 'Loop step', documentation: 'Specifies step value in FOR loop' },
            { keyword: 'DO', detail: 'Loop body', documentation: 'Starts loop body' },
            { keyword: 'END_FOR', detail: 'End for loop', documentation: 'Closes FOR loop' },
            { keyword: 'WHILE', detail: 'While loop', documentation: 'WHILE condition DO ... END_WHILE' },
            { keyword: 'END_WHILE', detail: 'End while loop', documentation: 'Closes WHILE loop' },
            { keyword: 'REPEAT', detail: 'Repeat loop', documentation: 'REPEAT ... UNTIL condition END_REPEAT' },
            { keyword: 'UNTIL', detail: 'Repeat condition', documentation: 'End condition for REPEAT loop' },
            { keyword: 'END_REPEAT', detail: 'End repeat loop', documentation: 'Closes REPEAT loop' },
            { keyword: 'EXIT', detail: 'Exit loop', documentation: 'Exits current loop' },
            { keyword: 'RETURN', detail: 'Return from function', documentation: 'Returns from function or function block' },
            { keyword: 'CONTINUE', detail: 'Continue loop', documentation: 'Continue to next loop iteration' }
        ],
        declarationKeywords: [
            { keyword: 'VAR', detail: 'Variable declaration', documentation: 'Declares local variables' },
            { keyword: 'VAR_INPUT', detail: 'Input variables', documentation: 'Declares input parameters' },
            { keyword: 'VAR_OUTPUT', detail: 'Output variables', documentation: 'Declares output parameters' },
            { keyword: 'VAR_IN_OUT', detail: 'Input/output variables', documentation: 'Declares input/output parameters' },
            { keyword: 'VAR_TEMP', detail: 'Temporary variables', documentation: 'Declares temporary variables' },
            { keyword: 'VAR_GLOBAL', detail: 'Global variables', documentation: 'Declares global variables' },
            { keyword: 'VAR_ACCESS', detail: 'Access variables', documentation: 'Declares access variables' },
            { keyword: 'VAR_CONFIG', detail: 'Configuration variables', documentation: 'Declares configuration variables' },
            { keyword: 'VAR_EXTERNAL', detail: 'External variables', documentation: 'Declares external variables' },
            { keyword: 'END_VAR', detail: 'End variable block', documentation: 'Closes variable declaration block' },
            { keyword: 'CONSTANT', detail: 'Constant declaration', documentation: 'Declares a constant' },
            { keyword: 'RETAIN', detail: 'Retain variable', documentation: 'Variable retains value after power loss' },
            { keyword: 'NON_RETAIN', detail: 'Non-retain variable', documentation: 'Variable does not retain value' },
            { keyword: 'PERSISTENT', detail: 'Persistent variable', documentation: 'Variable persists across downloads' },
            { keyword: 'AT', detail: 'Memory location', documentation: 'Assigns variable to specific memory location' },
            { keyword: 'PROGRAM', detail: 'Program declaration', documentation: 'PROGRAM name ... END_PROGRAM' },
            { keyword: 'END_PROGRAM', detail: 'End program', documentation: 'Closes PROGRAM block' },
            { keyword: 'FUNCTION', detail: 'Function declaration', documentation: 'FUNCTION name : return_type ... END_FUNCTION' },
            { keyword: 'END_FUNCTION', detail: 'End function', documentation: 'Closes FUNCTION block' },
            { keyword: 'FUNCTION_BLOCK', detail: 'Function block declaration', documentation: 'FUNCTION_BLOCK name ... END_FUNCTION_BLOCK' },
            { keyword: 'END_FUNCTION_BLOCK', detail: 'End function block', documentation: 'Closes FUNCTION_BLOCK' },
            { keyword: 'TYPE', detail: 'Type declaration', documentation: 'TYPE name ... END_TYPE' },
            { keyword: 'END_TYPE', detail: 'End type', documentation: 'Closes TYPE declaration' },
            { keyword: 'STRUCT', detail: 'Structure declaration', documentation: 'STRUCT ... END_STRUCT' },
            { keyword: 'END_STRUCT', detail: 'End structure', documentation: 'Closes STRUCT declaration' },
            { keyword: 'ARRAY', detail: 'Array declaration', documentation: 'ARRAY[range] OF type' },
            { keyword: 'STRING', detail: 'String type', documentation: 'String data type' },
            { keyword: 'WSTRING', detail: 'Wide string type', documentation: 'Wide string data type' }
        ],
        dataTypes: [
            { keyword: 'BOOL', detail: 'Boolean type', documentation: 'Boolean data type (TRUE/FALSE)' },
            { keyword: 'BYTE', detail: '8-bit unsigned', documentation: '8-bit unsigned integer (0-255)' },
            { keyword: 'WORD', detail: '16-bit unsigned', documentation: '16-bit unsigned integer (0-65535)' },
            { keyword: 'DWORD', detail: '32-bit unsigned', documentation: '32-bit unsigned integer' },
            { keyword: 'LWORD', detail: '64-bit unsigned', documentation: '64-bit unsigned integer' },
            { keyword: 'SINT', detail: '8-bit signed', documentation: '8-bit signed integer (-128 to 127)' },
            { keyword: 'USINT', detail: '8-bit unsigned', documentation: '8-bit unsigned integer (0-255)' },
            { keyword: 'INT', detail: '16-bit signed', documentation: '16-bit signed integer (-32768 to 32767)' },
            { keyword: 'UINT', detail: '16-bit unsigned', documentation: '16-bit unsigned integer (0-65535)' },
            { keyword: 'DINT', detail: '32-bit signed', documentation: '32-bit signed integer' },
            { keyword: 'UDINT', detail: '32-bit unsigned', documentation: '32-bit unsigned integer' },
            { keyword: 'LINT', detail: '64-bit signed', documentation: '64-bit signed integer' },
            { keyword: 'ULINT', detail: '64-bit unsigned', documentation: '64-bit unsigned integer' },
            { keyword: 'REAL', detail: '32-bit float', documentation: '32-bit floating point number' },
            { keyword: 'LREAL', detail: '64-bit float', documentation: '64-bit floating point number' },
            { keyword: 'TIME', detail: 'Time duration', documentation: 'Time duration type (e.g., T#10s)' },
            { keyword: 'DATE', detail: 'Date type', documentation: 'Date type (e.g., D#2023-01-01)' },
            { keyword: 'TIME_OF_DAY', detail: 'Time of day', documentation: 'Time of day type (e.g., TOD#12:30:45)' },
            { keyword: 'TOD', detail: 'Time of day', documentation: 'Short form of TIME_OF_DAY' },
            { keyword: 'DATE_AND_TIME', detail: 'Date and time', documentation: 'Combined date and time type' },
            { keyword: 'DT', detail: 'Date and time', documentation: 'Short form of DATE_AND_TIME' },
            { keyword: 'POINTER', detail: 'Pointer type', documentation: 'Pointer to memory location' },
            { keyword: 'REFERENCE', detail: 'Reference type', documentation: 'Reference to another variable' }
        ],
        literals: [
            { keyword: 'TRUE', detail: 'Boolean true', documentation: 'Boolean true value' },
            { keyword: 'FALSE', detail: 'Boolean false', documentation: 'Boolean false value' },
            { keyword: 'NULL', detail: 'Null pointer', documentation: 'Null pointer value' },
            { keyword: 'AND', detail: 'Logical AND', documentation: 'Logical AND operator' },
            { keyword: 'OR', detail: 'Logical OR', documentation: 'Logical OR operator' },
            { keyword: 'XOR', detail: 'Logical XOR', documentation: 'Logical exclusive OR operator' },
            { keyword: 'NOT', detail: 'Logical NOT', documentation: 'Logical NOT operator' },
            { keyword: 'MOD', detail: 'Modulo operator', documentation: 'Modulo (remainder) operator' }
        ]
    };
}

/**
 * Gets code snippet templates
 */
export function getCodeSnippets() {
    return [
        {
            label: 'if-then-end',
            insertText: 'IF ${1:condition} THEN\n\t${2:// code}\nEND_IF',
            detail: 'IF-THEN-END_IF block',
            documentation: 'Creates a basic IF statement'
        },
        {
            label: 'if-then-else-end',
            insertText: 'IF ${1:condition} THEN\n\t${2:// true code}\nELSE\n\t${3:// false code}\nEND_IF',
            detail: 'IF-THEN-ELSE-END_IF block',
            documentation: 'Creates an IF-ELSE statement'
        },
        {
            label: 'for-loop',
            insertText: 'FOR ${1:i} := ${2:1} TO ${3:10} DO\n\t${4:// code}\nEND_FOR',
            detail: 'FOR loop',
            documentation: 'Creates a FOR loop'
        },
        {
            label: 'while-loop',
            insertText: 'WHILE ${1:condition} DO\n\t${2:// code}\nEND_WHILE',
            detail: 'WHILE loop',
            documentation: 'Creates a WHILE loop'
        },
        {
            label: 'case-statement',
            insertText: 'CASE ${1:variable} OF\n\t${2:value1}: ${3:// code};\n\t${4:value2}: ${5:// code};\nELSE\n\t${6:// default code};\nEND_CASE',
            detail: 'CASE statement',
            documentation: 'Creates a CASE statement'
        },
        {
            label: 'var-block',
            insertText: 'VAR\n\t${1:variable_name} : ${2:INT} := ${3:0};\nEND_VAR',
            detail: 'Variable declaration block',
            documentation: 'Creates a VAR block'
        },
        {
            label: 'function-block',
            insertText: 'FUNCTION_BLOCK ${1:FB_Name}\nVAR_INPUT\n\t${2:input_var} : ${3:BOOL};\nEND_VAR\n\nVAR_OUTPUT\n\t${4:output_var} : ${5:BOOL};\nEND_VAR\n\nVAR\n\t${6:local_var} : ${7:INT};\nEND_VAR\n\n${8:// Function block code}\n\nEND_FUNCTION_BLOCK',
            detail: 'Function block template',
            documentation: 'Creates a function block template'
        },
        {
            label: 'program',
            insertText: 'PROGRAM ${1:ProgramName}\nVAR\n\t${2:variable} : ${3:INT} := ${4:0};\nEND_VAR\n\n${5:// Program code}\n\nEND_PROGRAM',
            detail: 'Program template',
            documentation: 'Creates a program template'
        }
    ];
}

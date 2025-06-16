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

export interface FunctionBlockInstance {
    name: string;
    type: string;
}

export interface FunctionBlockMember {
    name: string;
    type: string;
    description: string;
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
            { keyword: 'WSTRING', detail: 'Wide string type', documentation: 'Wide string data type' },
            { keyword: 'CONFIGURATION', detail: 'Configuration declaration', documentation: 'CONFIGURATION name ... END_CONFIGURATION' },
            { keyword: 'END_CONFIGURATION', detail: 'End configuration', documentation: 'Closes CONFIGURATION block' },
            { keyword: 'TASK', detail: 'Task declaration', documentation: 'TASK name(INTERVAL := time)' },
            { keyword: 'INTERVAL', detail: 'Task interval', documentation: 'Specifies task execution interval' },
            { keyword: 'WITH', detail: 'Program association', documentation: 'Associates program with task' }
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
            { keyword: 'LTIME', detail: 'Long time duration', documentation: 'Extended time duration with nanosecond precision' },
            { keyword: 'DATE', detail: 'Date type', documentation: 'Date type (e.g., D#2023-01-01)' },
            { keyword: 'LDATE', detail: 'Long date type', documentation: 'Extended date type with nanosecond precision since 1970-01-01' },
            { keyword: 'TIME_OF_DAY', detail: 'Time of day', documentation: 'Time of day type (e.g., TOD#12:30:45)' },
            { keyword: 'TOD', detail: 'Time of day', documentation: 'Short form of TIME_OF_DAY' },
            { keyword: 'LTIME_OF_DAY', detail: 'Long time of day', documentation: 'Extended time of day with nanosecond precision' },
            { keyword: 'LTOD', detail: 'Long time of day', documentation: 'Short form of LTIME_OF_DAY' },
            { keyword: 'DATE_AND_TIME', detail: 'Date and time', documentation: 'Combined date and time type' },
            { keyword: 'DT', detail: 'Date and time', documentation: 'Short form of DATE_AND_TIME' },
            { keyword: 'LDATE_AND_TIME', detail: 'Long date and time', documentation: 'Extended date and time with nanosecond precision' },
            { keyword: 'LDT', detail: 'Long date and time', documentation: 'Short form of LDATE_AND_TIME' },
            { keyword: 'CHAR', detail: 'Single-byte character', documentation: 'Single-byte character (ISO/IEC 10646)' },
            { keyword: 'WCHAR', detail: 'Double-byte character', documentation: 'Double-byte character (ISO/IEC 10646)' },
            { keyword: 'STRING', detail: 'String type', documentation: 'String data type' },
            { keyword: 'WSTRING', detail: 'Wide string type', documentation: 'Wide string data type' },
            { keyword: 'POINTER', detail: 'Pointer type', documentation: 'Pointer to memory location' },
            { keyword: 'REFERENCE', detail: 'Reference type', documentation: 'Reference to another variable' },
            // Generic data types
            { keyword: 'ANY', detail: 'Generic any type', documentation: 'Generic type for any data type' },
            { keyword: 'ANY_DERIVED', detail: 'Any derived type', documentation: 'Generic type for user-defined types' },
            { keyword: 'ANY_ELEMENTARY', detail: 'Any elementary type', documentation: 'Generic type for elementary data types' },
            { keyword: 'ANY_MAGNITUDE', detail: 'Any magnitude type', documentation: 'Generic type for comparable types' },
            { keyword: 'ANY_NUM', detail: 'Any numeric type', documentation: 'Generic type for numeric data types' },
            { keyword: 'ANY_REAL', detail: 'Any real type', documentation: 'Generic type for real number types' },
            { keyword: 'ANY_INT', detail: 'Any integer type', documentation: 'Generic type for integer types' },
            { keyword: 'ANY_BIT', detail: 'Any bit string type', documentation: 'Generic type for bit string types' },
            { keyword: 'ANY_STRING', detail: 'Any string type', documentation: 'Generic type for string types' },
            { keyword: 'ANY_CHAR', detail: 'Any character type', documentation: 'Generic type for character types' },
            { keyword: 'ANY_DATE', detail: 'Any date/time type', documentation: 'Generic type for date/time types' }
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
        ],
        standardFunctionBlocks: [
            { keyword: 'TON', detail: 'Timer On-Delay', documentation: 'Timer function block for on-delay timing' },
            { keyword: 'TOF', detail: 'Timer Off-Delay', documentation: 'Timer function block for off-delay timing' },
            { keyword: 'TP', detail: 'Timer Pulse', documentation: 'Timer function block for pulse generation' },
            { keyword: 'CTU', detail: 'Counter Up', documentation: 'Counter function block for up counting' },
            { keyword: 'CTD', detail: 'Counter Down', documentation: 'Counter function block for down counting' },
            { keyword: 'CTUD', detail: 'Counter Up/Down', documentation: 'Counter function block for up/down counting' },
            { keyword: 'R_TRIG', detail: 'Rising Edge Trigger', documentation: 'Detects rising edge of boolean signal' },
            { keyword: 'F_TRIG', detail: 'Falling Edge Trigger', documentation: 'Detects falling edge of boolean signal' },
            { keyword: 'RS', detail: 'Reset-Set Flip-Flop', documentation: 'Reset-dominant bistable function block' },
            { keyword: 'SR', detail: 'Set-Reset Flip-Flop', documentation: 'Set-dominant bistable function block' }
        ],
        standardFunctions: [
            { keyword: 'ABS', detail: 'Absolute value', documentation: 'Returns absolute value of input' },
            { keyword: 'SQRT', detail: 'Square root', documentation: 'Returns square root of input' },
            { keyword: 'LN', detail: 'Natural logarithm', documentation: 'Returns natural logarithm of input' },
            { keyword: 'LOG', detail: 'Base-10 logarithm', documentation: 'Returns base-10 logarithm of input' },
            { keyword: 'EXP', detail: 'Exponential', documentation: 'Returns e raised to the power of input' },
            { keyword: 'SIN', detail: 'Sine function', documentation: 'Returns sine of input (in radians)' },
            { keyword: 'COS', detail: 'Cosine function', documentation: 'Returns cosine of input (in radians)' },
            { keyword: 'TAN', detail: 'Tangent function', documentation: 'Returns tangent of input (in radians)' },
            { keyword: 'ASIN', detail: 'Arc sine', documentation: 'Returns arc sine of input' },
            { keyword: 'ACOS', detail: 'Arc cosine', documentation: 'Returns arc cosine of input' },
            { keyword: 'ATAN', detail: 'Arc tangent', documentation: 'Returns arc tangent of input' },
            { keyword: 'MIN', detail: 'Minimum value', documentation: 'Returns minimum of input values' },
            { keyword: 'MAX', detail: 'Maximum value', documentation: 'Returns maximum of input values' },
            { keyword: 'LIMIT', detail: 'Limit value', documentation: 'Limits value between min and max bounds' },
            { keyword: 'MUX', detail: 'Multiplexer', documentation: 'Selects one of multiple inputs based on selector' },
            { keyword: 'SEL', detail: 'Binary selector', documentation: 'Selects between two inputs based on boolean' },
            // Arithmetic functions mentioned in IEC 61131-3
            { keyword: 'ADD', detail: 'Addition', documentation: 'Adds two or more values' },
            { keyword: 'SUB', detail: 'Subtraction', documentation: 'Subtracts second value from first' },
            { keyword: 'MUL', detail: 'Multiplication', documentation: 'Multiplies two or more values' },
            { keyword: 'DIV', detail: 'Division', documentation: 'Divides first value by second' },
            // Comparison functions
            { keyword: 'GT', detail: 'Greater than', documentation: 'Returns TRUE if first input > second input' },
            { keyword: 'GE', detail: 'Greater or equal', documentation: 'Returns TRUE if first input >= second input' },
            { keyword: 'LT', detail: 'Less than', documentation: 'Returns TRUE if first input < second input' },
            { keyword: 'LE', detail: 'Less or equal', documentation: 'Returns TRUE if first input <= second input' },
            { keyword: 'EQ', detail: 'Equal', documentation: 'Returns TRUE if inputs are equal' },
            { keyword: 'NE', detail: 'Not equal', documentation: 'Returns TRUE if inputs are not equal' }
        ],
        conversionFunctions: [
            { keyword: 'BOOL_TO_INT', detail: 'Boolean to Integer', documentation: 'Converts BOOL to INT' },
            { keyword: 'BOOL_TO_DINT', detail: 'Boolean to Double Integer', documentation: 'Converts BOOL to DINT' },
            { keyword: 'BOOL_TO_REAL', detail: 'Boolean to Real', documentation: 'Converts BOOL to REAL' },
            { keyword: 'INT_TO_BOOL', detail: 'Integer to Boolean', documentation: 'Converts INT to BOOL' },
            { keyword: 'INT_TO_DINT', detail: 'Integer to Double Integer', documentation: 'Converts INT to DINT' },
            { keyword: 'INT_TO_REAL', detail: 'Integer to Real', documentation: 'Converts INT to REAL' },
            { keyword: 'DINT_TO_BOOL', detail: 'Double Integer to Boolean', documentation: 'Converts DINT to BOOL' },
            { keyword: 'DINT_TO_INT', detail: 'Double Integer to Integer', documentation: 'Converts DINT to INT' },
            { keyword: 'DINT_TO_REAL', detail: 'Double Integer to Real', documentation: 'Converts DINT to REAL' },
            { keyword: 'REAL_TO_INT', detail: 'Real to Integer', documentation: 'Converts REAL to INT' },
            { keyword: 'REAL_TO_DINT', detail: 'Real to Double Integer', documentation: 'Converts REAL to DINT' },
            { keyword: 'REAL_TO_TIME', detail: 'Real to Time', documentation: 'Converts REAL to TIME' },
            { keyword: 'TIME_TO_REAL', detail: 'Time to Real', documentation: 'Converts TIME to REAL' },
            { keyword: 'STRING_TO_INT', detail: 'String to Integer', documentation: 'Converts STRING to INT' },
            { keyword: 'INT_TO_STRING', detail: 'Integer to String', documentation: 'Converts INT to STRING' }
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
        },
        {
            label: 'configuration',
            insertText: 'CONFIGURATION ${1:DefaultCfg}\nVAR_GLOBAL\n\t${2:global_var} : ${3:BOOL};\nEND_VAR\n\nTASK ${4:MainTask}(INTERVAL := ${5:t#20ms});\nPROGRAM ${6:Main} WITH ${4:MainTask} : ${7:ProgramName};\nEND_CONFIGURATION',
            detail: 'Configuration template',
            documentation: 'Creates a PLC configuration with task and program'
        },
        {
            label: 'timer-on-delay',
            insertText: '${1:myTimer} : TON;\n${1:myTimer}(\n\tIN := ${2:trigger},\n\tPT := ${3:T#1S}\n);\n${4:output} := ${1:myTimer}.Q;',
            detail: 'Timer On-Delay (TON)',
            documentation: 'Creates a timer on-delay function block instance'
        },
        {
            label: 'counter-up',
            insertText: '${1:myCounter} : CTU;\n${1:myCounter}(\n\tCU := ${2:count_trigger},\n\tR := ${3:reset},\n\tPV := ${4:100}\n);\n${5:current_value} := ${1:myCounter}.CV;',
            detail: 'Counter Up (CTU)',
            documentation: 'Creates a counter up function block instance'
        },
        {
            label: 'state-machine',
            insertText: 'CASE ${1:StateMachine} OF\n\t${2:1}: ${3:// State 1 code}\n\t\t${1:StateMachine} := ${4:2};\n\t${4:2}: ${5:// State 2 code}\n\t\t${1:StateMachine} := ${6:1};\nELSE\n\t${7:// Default case}\nEND_CASE',
            detail: 'State machine template',
            documentation: 'Creates a basic state machine structure'
        }
    ];
}

/**
 * Extracts function block instances from Structured Text code
 * @param text The Structured Text code to parse
 * @returns Array of function block instances found in VAR blocks
 */
export function extractFunctionBlockInstances(text: string): FunctionBlockInstance[] {
    const instances: FunctionBlockInstance[] = [];
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

        // If we're in a VAR block, extract function block instance declarations
        if (inVarBlock && trimmedLine.includes(':')) {
            // Match variable declarations like: myTimer : TON; or upCounter : CTU := (PV := 100);
            const match = trimmedLine.match(/^\s*(\w+)\s*:\s*(\w+)(?:\s*:=.*)?;?/);
            if (match) {
                const variableName = match[1];
                const typeName = match[2];

                // Check if the type is a known function block type
                if (isStandardFunctionBlockType(typeName)) {
                    instances.push({
                        name: variableName,
                        type: typeName
                    });
                }
            }
        }
    }

    return instances;
}

/**
 * Checks if a type name is a standard function block type
 */
function isStandardFunctionBlockType(typeName: string): boolean {
    const standardFBTypes = [
        'TON', 'TOF', 'TP', 'CTU', 'CTD', 'CTUD', 'R_TRIG', 'F_TRIG', 'RS', 'SR'
    ];
    return standardFBTypes.includes(typeName);
}

/**
 * Gets the members (outputs) for a function block type
 */
export function getFunctionBlockMembers(fbType: string): FunctionBlockMember[] {
    const memberMap: { [key: string]: FunctionBlockMember[] } = {
        'TON': [
            { name: 'Q', type: 'BOOL', description: 'Timer output - TRUE when timer is running and PT time has elapsed' },
            { name: 'ET', type: 'TIME', description: 'Elapsed Time - Current timer value' }
        ],
        'TOF': [
            { name: 'Q', type: 'BOOL', description: 'Timer output - FALSE when timer is running and PT time has elapsed' },
            { name: 'ET', type: 'TIME', description: 'Elapsed Time - Current timer value' }
        ],
        'TP': [
            { name: 'Q', type: 'BOOL', description: 'Timer output - TRUE for PT duration when IN goes TRUE' },
            { name: 'ET', type: 'TIME', description: 'Elapsed Time - Current timer value' }
        ],
        'CTU': [
            { name: 'Q', type: 'BOOL', description: 'Counter output - TRUE when CV >= PV' },
            { name: 'CV', type: 'INT', description: 'Current Value - Current counter value' }
        ],
        'CTD': [
            { name: 'Q', type: 'BOOL', description: 'Counter output - TRUE when CV <= 0' },
            { name: 'CV', type: 'INT', description: 'Current Value - Current counter value' }
        ],
        'CTUD': [
            { name: 'QU', type: 'BOOL', description: 'Count Up output - TRUE when CV >= PV' },
            { name: 'QD', type: 'BOOL', description: 'Count Down output - TRUE when CV <= 0' },
            { name: 'CV', type: 'INT', description: 'Current Value - Current counter value' }
        ],
        'R_TRIG': [
            { name: 'Q', type: 'BOOL', description: 'Rising edge output - TRUE for one cycle when CLK rises' }
        ],
        'F_TRIG': [
            { name: 'Q', type: 'BOOL', description: 'Falling edge output - TRUE for one cycle when CLK falls' }
        ],
        'RS': [
            { name: 'Q1', type: 'BOOL', description: 'Set-dominant bistable output' }
        ],
        'SR': [
            { name: 'Q1', type: 'BOOL', description: 'Reset-dominant bistable output' }
        ]
    };

    return memberMap[fbType] || [];
}

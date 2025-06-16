/**
 * IEC 61131-3 Structured Text Language Specification
 * 
 * This file contains standard definitions for the IEC 61131-3 Structured Text programming language,
 * providing a centralized reference for use throughout the ControlForge Structured Text extension.
 */

export const IEC61131Specification = {
    /**
     * Keywords used for control flow in Structured Text
     */
    controlKeywords: [
        'IF', 'THEN', 'ELSE', 'ELSIF', 'END_IF',
        'CASE', 'OF', 'END_CASE',
        'FOR', 'TO', 'BY', 'DO', 'END_FOR',
        'WHILE', 'END_WHILE',
        'REPEAT', 'UNTIL', 'END_REPEAT',
        'EXIT', 'RETURN', 'CONTINUE'
    ],

    /**
     * Keywords used for declarations in Structured Text
     */
    declarationKeywords: [
        'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_TEMP', 
        'VAR_GLOBAL', 'VAR_ACCESS', 'VAR_CONFIG', 'VAR_EXTERNAL', 'END_VAR',
        'CONSTANT', 'RETAIN', 'NON_RETAIN', 'PERSISTENT', 'AT',
        'PROGRAM', 'END_PROGRAM',
        'FUNCTION', 'END_FUNCTION',
        'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',
        'TYPE', 'END_TYPE',
        'STRUCT', 'END_STRUCT',
        'ARRAY', 'STRING', 'WSTRING',
        'CONFIGURATION', 'END_CONFIGURATION',
        'RESOURCE', 'END_RESOURCE',
        'TASK'
    ],

    /**
     * Other keywords in Structured Text
     */
    otherKeywords: [
        'TRUE', 'FALSE', 'NULL',
        'THIS', 'SUPER',
        'ABSTRACT', 'FINAL', 'IMPLEMENTS', 'EXTENDS',
        'INTERFACE', 'METHOD', 'PROPERTY',
        'NAMESPACE', 'USING', 'WITH',
        'RESOURCE', 'ON', 'PRIORITY', 'SINGLE', 'INTERVAL',
        'PROGRAM', 'WITH',
        'VAR_GLOBAL', 'VAR_ACCESS',
        'READ_WRITE', 'READ_ONLY', 'WRITE_ONLY'
    ],

    /**
     * Logical operators in Structured Text
     */
    logicalOperators: [
        'AND', 'OR', 'XOR', 'NOT'
    ],

    /**
     * Comparison operators in Structured Text
     */
    comparisonOperators: [
        '=', '<>', '<', '>', '<=', '>='
    ],

    /**
     * Arithmetic operators in Structured Text
     */
    arithmeticOperators: [
        '+', '-', '*', '/', 'MOD', '**'
    ],

    /**
     * Assignment operators in Structured Text
     */
    assignmentOperators: [
        ':='
    ],

    /**
     * Data types in Structured Text
     */
    dataTypes: [
        // Elementary data types
        'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD',
        'SINT', 'USINT', 'INT', 'UINT', 'DINT', 'UDINT', 'LINT', 'ULINT',
        'REAL', 'LREAL',
        'TIME', 'LTIME', 'DATE', 'LDATE', 'TIME_OF_DAY', 'TOD', 'DATE_AND_TIME', 'DT',
        'STRING', 'WSTRING', 'CHAR', 'WCHAR',
        
        // Generic data types
        'POINTER', 'REFERENCE',
        'ANY', 'ANY_DERIVED', 'ANY_ELEMENTARY', 'ANY_MAGNITUDE', 'ANY_NUM',
        'ANY_REAL', 'ANY_INT', 'ANY_BIT', 'ANY_STRING', 'ANY_DATE'
    ],

    /**
     * Standard function blocks in IEC 61131-3
     */
    standardFunctionBlocks: [
        // Timer function blocks
        'TON', 'TOF', 'TP',
        
        // Counter function blocks
        'CTU', 'CTD', 'CTUD',
        
        // Edge detection function blocks
        'R_TRIG', 'F_TRIG',
        
        // Bistable function blocks
        'RS', 'SR'
    ],

    /**
     * Standard functions in IEC 61131-3
     */
    standardFunctions: [
        // Type conversion functions
        'BOOL_TO_INT', 'BOOL_TO_DINT', 'BOOL_TO_REAL', 'BOOL_TO_STRING',
        'INT_TO_BOOL', 'INT_TO_DINT', 'INT_TO_REAL', 'INT_TO_STRING',
        'DINT_TO_BOOL', 'DINT_TO_INT', 'DINT_TO_REAL', 'DINT_TO_STRING',
        'REAL_TO_BOOL', 'REAL_TO_INT', 'REAL_TO_DINT', 'REAL_TO_STRING',
        'STRING_TO_BOOL', 'STRING_TO_INT', 'STRING_TO_DINT', 'STRING_TO_REAL',
        
        // Numerical functions
        'ABS', 'SQRT', 'LN', 'LOG', 'EXP',
        'SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN',
        'TRUNC', 'ROUND', 'CEIL', 'FLOOR',
        
        // String functions
        'LEN', 'LEFT', 'RIGHT', 'MID', 'CONCAT', 'INSERT', 'DELETE', 'REPLACE', 'FIND',
        
        // Date and time functions
        'ADD_TIME', 'SUB_TIME', 'CONCAT_DATE_TOD'
    ],

    /**
     * Function block instance member access pattern
     * e.g., myTimer.Q, myCounter.CV
     */
    instanceMemberPattern: /\b([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\b/,

    /**
     * Function block instance members for standard function blocks
     */
    functionBlockMembers: {
        // Timer function blocks
        'TON': ['IN', 'PT', 'Q', 'ET'],
        'TOF': ['IN', 'PT', 'Q', 'ET'],
        'TP': ['IN', 'PT', 'Q', 'ET'],
        
        // Counter function blocks
        'CTU': ['CU', 'R', 'PV', 'Q', 'CV'],
        'CTD': ['CD', 'LD', 'PV', 'Q', 'CV'],
        'CTUD': ['CU', 'CD', 'R', 'LD', 'PV', 'QU', 'QD', 'CV'],
        
        // Edge detection function blocks
        'R_TRIG': ['CLK', 'Q'],
        'F_TRIG': ['CLK', 'Q'],
        
        // Bistable function blocks
        'RS': ['S', 'R1', 'Q1'],
        'SR': ['S1', 'R', 'Q1']
    },

    /**
     * Comment patterns
     */
    commentPatterns: {
        lineComment: '//',  // Single line comment
        blockCommentStart: '(*',  // Block comment start
        blockCommentEnd: '*)'  // Block comment end
    }
};

/**
 * Helper to check if a string is a control keyword
 */
export function isControlKeyword(text: string): boolean {
    return IEC61131Specification.controlKeywords.includes(text.toUpperCase());
}

/**
 * Helper to check if a string is a declaration keyword
 */
export function isDeclarationKeyword(text: string): boolean {
    return IEC61131Specification.declarationKeywords.includes(text.toUpperCase());
}

/**
 * Helper to check if a string is any keyword
 */
export function isKeyword(text: string): boolean {
    return isControlKeyword(text) || 
           isDeclarationKeyword(text) || 
           IEC61131Specification.otherKeywords.includes(text.toUpperCase()) ||
           IEC61131Specification.logicalOperators.includes(text.toUpperCase());
}

/**
 * Helper to check if a string is a data type
 */
export function isDataType(text: string): boolean {
    return IEC61131Specification.dataTypes.includes(text.toUpperCase()) ||
           IEC61131Specification.standardFunctionBlocks.includes(text.toUpperCase());
}

/**
 * Helper to check if a string is a standard function block
 */
export function isStandardFunctionBlock(text: string): boolean {
    return IEC61131Specification.standardFunctionBlocks.includes(text.toUpperCase());
}

/**
 * Helper to get the members of a function block type
 */
export function getFunctionBlockMembers(fbType: string): string[] | undefined {
    const upperFbType = fbType.toUpperCase();
    return IEC61131Specification.functionBlockMembers[upperFbType as keyof typeof IEC61131Specification.functionBlockMembers];
}

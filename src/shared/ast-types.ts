/**
 * Structured Text AST and Symbol Type Definitions
 * 
 * This file defines the type definitions for the Abstract Syntax Tree (AST)
 * and symbol types used in the Structured Text language implementation.
 * 
 * These definitions adhere to the IEC 61131-3 standard for Structured Text.
 */

import { Position, Range, Location } from 'vscode-languageserver';

/**
 * Represents the kind of a symbol in the Structured Text language
 */
export enum STSymbolKind {
    Unknown = 0,
    Program = 1,
    Function = 2,
    FunctionBlock = 3,
    Variable = 4,
    Parameter = 5,
    FunctionBlockInstance = 6,
    Constant = 7,
    Type = 8,
    Namespace = 9,
    Method = 10,
    Class = 11,
    Interface = 12,
    Property = 13
}

/**
 * Represents the scope of a symbol in the Structured Text language
 */
export enum STScope {
    Unknown = 0,
    Global = 1,
    Program = 2,
    Function = 3,
    FunctionBlock = 4,
    Local = 5,
    Input = 6,
    Output = 7,
    InOut = 8,
    Temp = 9,
    External = 10
}

/**
 * Represents a parameter declaration in a Function or Function Block
 */
export interface STParameter {
    name: string;
    dataType: string;
    direction: 'INPUT' | 'OUTPUT' | 'IN_OUT';
    defaultValue?: string;
    location?: Location;
}

/**
 * Represents a variable declaration
 */
export interface STDeclaration {
    name: string;
    dataType: string;
    initialValue?: string;
    isConstant?: boolean;
    isRetain?: boolean;
    isPersistent?: boolean;
    atLocation?: string; // For direct addressing (AT %IX0.0)
    attributes?: Record<string, string>; // For variable attributes
}

/**
 * Represents a symbol in the Structured Text language
 */
export interface STSymbol {
    name: string;
    normalizedName?: string; // Case-insensitive name for lookup
    kind: STSymbolKind;
    location: Location;
    scope: STScope;
    dataType?: string;
    returnType?: string; // For functions
    parameters?: STParameter[]; // For functions and function blocks
    members?: STSymbol[]; // For nested symbols (e.g., variables in a program)
    description?: string;
    literalType?: string;
    references?: Location[];
    parentSymbol?: string; // For nested symbols, references parent by name
}

/**
 * Extended STSymbol interface with additional information for enhanced analysis
 */
export interface STSymbolExtended extends STSymbol {
    // Additional properties specific to the extended implementation
    isExported?: boolean;
    isImported?: boolean;
    sourceUri?: string; // For symbols defined in other files
    documentation?: string; // Additional documentation extracted from comments
    codeSnippet?: string; // Code snippet associated with the symbol
}

/**
 * Represents the type of an AST node
 */
export enum ASTNodeType {
    Unknown = 0,
    Program = 1,
    FunctionBlock = 2,
    Function = 3,
    VariableDeclaration = 4,
    VariableDeclarationSection = 5,
    Assignment = 6,
    IfStatement = 7,
    ForLoop = 8,
    WhileLoop = 9,
    RepeatLoop = 10,
    CaseStatement = 11,
    FunctionCall = 12,
    FunctionBlockCall = 13,
    Expression = 14,
    BinaryExpression = 15,
    UnaryExpression = 16,
    Literal = 17,
    Identifier = 18,
    ArrayAccess = 19,
    StructAccess = 20,
    ReturnStatement = 21,
    ExitStatement = 22,
    ContinueStatement = 23,
    Comment = 24,
    Root = 25,
    Class = 26,
    Interface = 27,
    Method = 28,
    MethodPrototype = 29,
    Property = 30
}

/**
 * Base interface for all AST nodes
 */
export interface ASTNode {
    type: ASTNodeType;
    range: Range;
    parent?: ASTNode;
    children?: ASTNode[];
}

/**
 * Program AST node
 */
export interface ProgramNode extends ASTNode {
    type: ASTNodeType.Program;
    name: string;
    variables: VariableDeclarationSectionNode[];
    body: ASTNode[];
}

/**
 * Function AST node
 */
export interface FunctionNode extends ASTNode {
    type: ASTNodeType.Function;
    name: string;
    returnType: string;
    variables: VariableDeclarationSectionNode[];
    body: ASTNode[];
}

/**
 * Function Block AST node
 */
export interface FunctionBlockNode extends ASTNode {
    type: ASTNodeType.FunctionBlock;
    name: string;
    variables: VariableDeclarationSectionNode[];
    body: ASTNode[];
}

/**
 * Variable Declaration Section AST node (VAR, VAR_INPUT, etc.)
 */
export interface VariableDeclarationSectionNode extends ASTNode {
    type: ASTNodeType.VariableDeclarationSection;
    sectionType: 'VAR' | 'VAR_INPUT' | 'VAR_OUTPUT' | 'VAR_IN_OUT' | 'VAR_GLOBAL' | 'VAR_TEMP' | 'VAR_EXTERNAL';
    qualifiers: ('CONSTANT' | 'RETAIN' | 'PERSISTENT')[];
    declarations: VariableDeclarationNode[];
}

/**
 * Variable Declaration AST node
 */
export interface VariableDeclarationNode extends ASTNode {
    type: ASTNodeType.VariableDeclaration;
    name: string;
    dataType: string;
    initialValue?: ExpressionNode;
    atLocation?: string;
    attributes?: Record<string, string>;
    isArray?: boolean;
    arrayDimensions?: { start: number; end: number }[];
}

/**
 * Assignment AST node
 */
export interface AssignmentNode extends ASTNode {
    type: ASTNodeType.Assignment;
    target: ExpressionNode;
    value: ExpressionNode;
}

/**
 * If Statement AST node
 */
export interface IfStatementNode extends ASTNode {
    type: ASTNodeType.IfStatement;
    condition: ExpressionNode;
    thenBranch: ASTNode[];
    elsifBranches?: { condition: ExpressionNode; body: ASTNode[] }[];
    elseBranch?: ASTNode[];
}

/**
 * Base Expression AST node
 */
export interface ExpressionNode extends ASTNode {
    type: ASTNodeType.Expression | ASTNodeType.BinaryExpression | ASTNodeType.UnaryExpression |
    ASTNodeType.Literal | ASTNodeType.Identifier | ASTNodeType.ArrayAccess |
    ASTNodeType.StructAccess | ASTNodeType.FunctionCall;
}

/**
 * Binary Expression AST node
 */
export interface BinaryExpressionNode extends ExpressionNode {
    type: ASTNodeType.BinaryExpression;
    operator: string; // +, -, *, /, AND, OR, etc.
    left: ExpressionNode;
    right: ExpressionNode;
}

/**
 * Unary Expression AST node
 */
export interface UnaryExpressionNode extends ExpressionNode {
    type: ASTNodeType.UnaryExpression;
    operator: string; // NOT, -, etc.
    operand: ExpressionNode;
}

/**
 * Literal AST node
 */
export interface LiteralNode extends ExpressionNode {
    type: ASTNodeType.Literal;
    value: string;
    literalType: 'INTEGER' | 'REAL' | 'BOOLEAN' | 'STRING' | 'TIME' | 'DATE' | 'DATE_AND_TIME' | 'ENUM';
}

/**
 * Identifier AST node
 */
export interface IdentifierNode extends ExpressionNode {
    type: ASTNodeType.Identifier;
    name: string;
    resolvedSymbol?: STSymbol; // Link to the symbol definition
}

/**
 * Function Call AST node
 */
export interface FunctionCallNode extends ExpressionNode {
    type: ASTNodeType.FunctionCall;
    name: string;
    arguments: { name?: string; value: ExpressionNode }[]; // For named arguments
    resolvedFunction?: STSymbol; // Link to the function definition
}

/**
 * Function Block Call AST node
 */
export interface FunctionBlockCallNode extends ASTNode {
    type: ASTNodeType.FunctionBlockCall;
    instance: string;
    arguments: { name: string; value: ExpressionNode }[]; // Always named for FB calls
    resolvedInstance?: STSymbol; // Link to the FB instance definition
}

/**
 * Class AST node
 */
export interface ClassNode extends ASTNode {
    type: ASTNodeType.Class;
    name: string;
    parentClass?: string;
    implementedInterfaces?: string[];
    variables: VariableDeclarationSectionNode[];
    methods: MethodNode[];
    properties?: PropertyNode[];
}

/**
 * Interface AST node
 */
export interface InterfaceNode extends ASTNode {
    type: ASTNodeType.Interface;
    name: string;
    extendedInterfaces?: string[];
    methodPrototypes: MethodPrototypeNode[];
}

/**
 * Method AST node
 */
export interface MethodNode extends ASTNode {
    type: ASTNodeType.Method;
    name: string;
    returnType: string;
    accessModifier: 'PUBLIC' | 'PROTECTED' | 'PRIVATE';
    isAbstract: boolean;
    isFinal: boolean;
    variables: VariableDeclarationSectionNode[];
    body: ASTNode[];
}

/**
 * Method Prototype AST node (for interfaces)
 */
export interface MethodPrototypeNode extends ASTNode {
    type: ASTNodeType.MethodPrototype;
    name: string;
    returnType: string;
    parameters: VariableDeclarationSectionNode[];
}

/**
 * Property AST node (getter/setter)
 */
export interface PropertyNode extends ASTNode {
    type: ASTNodeType.Property;
    name: string;
    dataType: string;
    accessModifier: 'PUBLIC' | 'PROTECTED' | 'PRIVATE';
    getter?: ASTNode[];
    setter?: ASTNode[];
}

/**
 * Standard Function Blocks as defined in IEC 61131-3
 */
export enum StandardFunctionBlocks {
    TON = 'TON',   // On-delay timer
    TOF = 'TOF',   // Off-delay timer
    TP = 'TP',     // Pulse timer
    CTU = 'CTU',   // Up counter
    CTD = 'CTD',   // Down counter
    CTUD = 'CTUD', // Up-down counter
    R_TRIG = 'R_TRIG', // Rising edge trigger
    F_TRIG = 'F_TRIG', // Falling edge trigger
    SR = 'SR',     // Set-dominant latch
    RS = 'RS'      // Reset-dominant latch
}

/**
 * Standard data types as defined in IEC 61131-3
 */
export enum StandardDataTypes {
    // Boolean type
    BOOL = 'BOOL',

    // Bit string types
    BYTE = 'BYTE',
    WORD = 'WORD',
    DWORD = 'DWORD',
    LWORD = 'LWORD',

    // Integer types
    SINT = 'SINT',   // Short integer (8 bits)
    USINT = 'USINT', // Unsigned short integer
    INT = 'INT',     // Integer (16 bits)
    UINT = 'UINT',   // Unsigned integer
    DINT = 'DINT',   // Double integer (32 bits)
    UDINT = 'UDINT', // Unsigned double integer
    LINT = 'LINT',   // Long integer (64 bits)
    ULINT = 'ULINT', // Unsigned long integer

    // Real types
    REAL = 'REAL',   // 32-bit floating point
    LREAL = 'LREAL', // 64-bit floating point

    // Time types
    TIME = 'TIME',
    LTIME = 'LTIME',

    // Date types
    DATE = 'DATE',
    LDATE = 'LDATE',
    TIME_OF_DAY = 'TIME_OF_DAY',
    TOD = 'TOD',     // Shorthand for TIME_OF_DAY
    DATE_AND_TIME = 'DATE_AND_TIME',
    DT = 'DT',       // Shorthand for DATE_AND_TIME

    // String types
    STRING = 'STRING',
    WSTRING = 'WSTRING',
    CHAR = 'CHAR',
    WCHAR = 'WCHAR'
}

/**
 * Generic types as defined in IEC 61131-3
 */
export enum GenericDataTypes {
    ANY = 'ANY',
    ANY_INT = 'ANY_INT',
    ANY_REAL = 'ANY_REAL',
    ANY_BIT = 'ANY_BIT',
    ANY_STRING = 'ANY_STRING',
    ANY_DATE = 'ANY_DATE',
    ANY_NUM = 'ANY_NUM',
    ANY_ELEMENTARY = 'ANY_ELEMENTARY',
    ANY_DERIVED = 'ANY_DERIVED',
    ANY_MAGNITUDE = 'ANY_MAGNITUDE',
    ANY_CHAR = 'ANY_CHARS',
    ANY_CHARS = 'ANY_CHARS'
}

/**
 * Keywords in the Structured Text language
 * These are case-insensitive according to the IEC 61131-3 standard
 */
export const KEYWORDS = [
    // Program organization units
    'PROGRAM', 'END_PROGRAM',
    'FUNCTION', 'END_FUNCTION',
    'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',

    // Variable declaration sections
    'VAR', 'END_VAR',
    'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT',
    'VAR_GLOBAL', 'VAR_TEMP', 'VAR_EXTERNAL',

    // Variable qualifiers
    'CONSTANT', 'RETAIN', 'PERSISTENT', 'AT',

    // Control structures
    'IF', 'THEN', 'ELSIF', 'ELSE', 'END_IF',
    'CASE', 'OF', 'END_CASE',
    'FOR', 'TO', 'BY', 'DO', 'END_FOR',
    'WHILE', 'END_WHILE',
    'REPEAT', 'UNTIL', 'END_REPEAT',
    'RETURN', 'EXIT', 'CONTINUE',

    // Operators
    'AND', 'OR', 'XOR', 'NOT',
    'MOD',

    // Array and type keywords
    'ARRAY', 'OF', 'STRUCT', 'END_STRUCT',
    'TYPE', 'END_TYPE',

    // Object-oriented programming
    'CLASS', 'END_CLASS', 'EXTENDS', 'IMPLEMENTS',
    'INTERFACE', 'END_INTERFACE',
    'METHOD', 'END_METHOD',
    'PROPERTY', 'END_PROPERTY', 'GET', 'SET',
    'PUBLIC', 'PROTECTED', 'PRIVATE', 'FINAL', 'ABSTRACT',
    'SUPER'
];

/**
 * Operators in the Structured Text language
 */
export const OPERATORS = {
    // Assignment
    ASSIGNMENT: ':=',

    // Arithmetic
    ADDITION: '+',
    SUBTRACTION: '-',
    MULTIPLICATION: '*',
    DIVISION: '/',
    EXPONENTIATION: '**',
    MODULO: 'MOD',

    // Comparison
    EQUALITY: '=',
    INEQUALITY: '<>',
    LESS_THAN: '<',
    LESS_THAN_OR_EQUAL: '<=',
    GREATER_THAN: '>',
    GREATER_THAN_OR_EQUAL: '>=',

    // Logical
    AND: 'AND',
    OR: 'OR',
    XOR: 'XOR',
    NOT: 'NOT',

    // Bitwise
    BITWISE_AND: '&',
    BITWISE_OR: '|',
    BITWISE_XOR: '^',
    BITWISE_NOT: 'NOT'
};

/**
 * Shared types and interfaces between LSP client and server
 */

import { Location, Position, Range } from 'vscode-languageserver';

/**
 * Represents a symbol definition in ST code
 */
export interface STSymbol {
    name: string;
    kind: STSymbolKind;
    location: Location;
    scope: STScope;
    dataType?: string;
    description?: string;
}

/**
 * Types of symbols in Structured Text
 */
export enum STSymbolKind {
    Variable = 'variable',
    Function = 'function',
    FunctionBlock = 'function_block',
    Program = 'program',
    Parameter = 'parameter',
    Constant = 'constant',
    FunctionBlockInstance = 'function_block_instance',
    Member = 'member'
}

/**
 * Scope types in Structured Text
 */
export enum STScope {
    Global = 'global',
    Local = 'local',
    Input = 'input',
    Output = 'output',
    InOut = 'inout',
    Function = 'function',
    FunctionBlock = 'function_block',
    Program = 'program'
}

/**
 * File symbol information
 */
export interface FileSymbols {
    uri: string;
    symbols: STSymbol[];
    lastModified: number;
}

/**
 * @deprecated Use WorkspaceSymbolIndex instead for a more structured and comprehensive index.
 * Workspace symbol index
 */
export interface SymbolIndex {
    files: Map<string, FileSymbols>;
    symbolsByName: Map<string, STSymbol[]>;
}

/**
 * Enhanced symbol definition with more context
 */
export interface STSymbolExtended extends STSymbol {
    parentSymbol?: string;          // Parent function/FB/program name
    parameters?: STParameter[];     // For functions and function blocks
    returnType?: string;           // For functions
    members?: STSymbolExtended[];          // For function blocks and programs
    references?: Location[];       // All reference locations
    literalType?: string;          // For literals, e.g., 'LTIME', 'WSTRING'
    normalizedName?: string;       // Lowercase name for case-insensitive lookups (IEC 61131-3 is case-insensitive)
}

/**
 * Function/FB parameter information
 */
export interface STParameter {
    name: string;
    normalizedName?: string; // For case-insensitive lookups
    dataType: string;
    direction: 'INPUT' | 'OUTPUT' | 'IN_OUT';
    defaultValue?: string;
    location: Location;
}

/**
 * AST Node types for better parsing
 */
export interface ASTNode {
    type: ASTNodeType;
    location: Range;
    children?: ASTNode[];
}

export enum ASTNodeType {
    Program = 'program',
    Function = 'function',
    FunctionBlock = 'function_block',
    VarSection = 'var_section',
    VarDeclaration = 'var_declaration',
    Assignment = 'assignment',
    FunctionCall = 'function_call',
    MemberAccess = 'member_access',
    Identifier = 'identifier',
    IfStatement = 'if_statement',
    CaseStatement = 'case_statement',
    ForLoop = 'for_loop',
    WhileLoop = 'while_loop',
    RepeatLoop = 'repeat_loop',
    ExitStatement = 'exit_statement',
    ReturnStatement = 'return_statement'
}

/**
 * Program/Function/Function Block declaration
 */
export interface STDeclaration extends ASTNode {
    name: string;
    parameters?: STParameter[];
    variables?: STSymbol[];
    returnType?: string;  // Only for functions
}

/**
 * Enhanced workspace symbol index with cross-file support
 */
export interface WorkspaceSymbolIndex {
    // Global symbol registry
    programs: Map<string, STDeclaration>;
    functions: Map<string, STDeclaration>;
    functionBlocks: Map<string, STDeclaration>;
    globalVariables: Map<string, STSymbol>;

    // File-based indexing
    fileSymbols: Map<string, FileSymbols>;

    // Reference tracking
    symbolReferences: Map<string, Location[]>;

    // Metadata
    lastUpdated: number;
}

/**
 * Member access expression (e.g., instance.member)
 */
export interface MemberAccessExpression {
    instance: string;           // FB instance name (e.g., "myTimer")
    member: string;             // Member name (e.g., "Q")
    instanceType?: string;      // FB type (e.g., "TON")
    location: Location;         // Location of the full expression
    instanceLocation: Location; // Location of the instance part
    memberLocation: Location;   // Location of the member part
}

/**
 * Function block member definition
 */
export interface FBMemberDefinition {
    name: string;               // Member name (Q, ET, etc.)
    dataType: string;           // BOOL, TIME, etc.
    direction: 'VAR_INPUT' | 'VAR_OUTPUT' | 'VAR_IN_OUT' | 'VAR' | 'VAR_TEMP' | 'VAR_GLOBAL';
    description?: string;       // Member description
    fbType: string;             // Parent FB type
}

/**
 * Enhanced symbol with member access support
 */
export interface STSymbolWithMembers extends STSymbolExtended {
    memberAccess?: MemberAccessExpression[];  // Member access expressions in this symbol
    availableMembers?: FBMemberDefinition[]; // Available members (for FB instances)
}

/**
 * Standard function block description for hover tooltips
 */
export interface StandardFBDescription {
    name: string;               // FB name (TON, CTU, etc.)
    category: string;           // Timer, Counter, Edge Detection, Bistable
    summary: string;            // One-line description
    behavior: string;           // Detailed behavior explanation
    example: string;            // Usage example in ST code
}

/**
 * Context information for semantic analysis
 */
export interface SemanticContext {
    currentScope: STScope;
    currentFunction?: string;
    currentFunctionBlock?: string;
    currentProgram?: string;
    availableSymbols: Map<string, STSymbolExtended>;
    functionBlockTypes: Map<string, STDeclaration>;
}

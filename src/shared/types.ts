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
    members?: STSymbol[];          // For function blocks
    references?: Location[];       // All reference locations
}

/**
 * Function/FB parameter information
 */
export interface STParameter {
    name: string;
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
    Identifier = 'identifier'
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
    direction: 'INPUT' | 'OUTPUT' | 'IN_OUT' | 'VAR';
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

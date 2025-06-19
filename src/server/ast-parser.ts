/**
 * Enhanced AST-based parser for Structured Text
 * Provides comprehensive symbol extraction and cross-reference analysis
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Range, Location } from 'vscode-languageserver';
import {
    STSymbol,
    STSymbolKind,
    STScope,
    STParameter,
    STDeclaration,
    ASTNode,
    ASTNodeType,
    STSymbolExtended
} from '../shared/types';

/**
 * Enhanced parser that builds an AST and extracts comprehensive symbol information
 */
export class STASTParser {
    private document: TextDocument;
    private text: string;
    private lines: string[];

    constructor(document: TextDocument) {
        this.document = document;
        this.text = document.getText();
        this.lines = this.text.split('\n');
    }

    /**
     * Create a safe wrapper for parsing operations
     * This ensures that errors in one part of the parsing don't affect others
     */
    private safeParseOperation<T>(operation: () => T[], operationName: string): T[] {
        try {
            return operation();
        } catch (error) {
            console.error(`Error in ${operationName}: ${error}`);
            return [];
        }
    }

    /**
     * Parse the document and extract all symbols with improved error handling
     */
    public parseSymbols(): STSymbolExtended[] {
        console.log(`Parsing symbols in ${this.document.uri}`);
        const symbols: STSymbolExtended[] = [];

        try {
            // Parse top-level constructs with safe wrappers
            const programs = this.safeParseOperation(() => this.parsePrograms(), 'parsePrograms');
            console.log(`Found ${programs.length} programs`);

            const functions = this.safeParseOperation(() => this.parseFunctions(), 'parseFunctions');
            console.log(`Found ${functions.length} functions`);

            const functionBlocks = this.safeParseOperation(() => this.parseFunctionBlocks(), 'parseFunctionBlocks');
            console.log(`Found ${functionBlocks.length} function blocks`);

            const globalVariables = this.safeParseOperation(() => this.parseGlobalVariables(), 'parseGlobalVariables');
            console.log(`Found ${globalVariables.length} global variables`);

            symbols.push(...programs);
            symbols.push(...functions);
            symbols.push(...functionBlocks);
            symbols.push(...globalVariables);

            // Also add local variables from programs, functions, and function blocks as individual symbols
            let localVariables = 0;

            programs.forEach(program => {
                if (program.members) {
                    program.members.forEach(member => {
                        member.parentSymbol = program.name;
                        symbols.push(member);
                        localVariables++;
                    });
                }
            });

            functions.forEach(func => {
                if (func.members) {
                    func.members.forEach(member => {
                        member.parentSymbol = func.name;
                        symbols.push(member);
                        localVariables++;
                    });
                }
            });

            functionBlocks.forEach(fb => {
                if (fb.members) {
                    fb.members.forEach(member => {
                        member.parentSymbol = fb.name;
                        symbols.push(member);
                        localVariables++;
                    });
                }
            });

            console.log(`Found ${localVariables} local variables`);
            console.log(`Total symbols extracted: ${symbols.length}`);

            return symbols;
        } catch (error) {
            console.error(`Error parsing symbols: ${error}`);
            return [];
        }
    }

    /**
     * Parse PROGRAM declarations
     */
    private parsePrograms(): STSymbolExtended[] {
        const programs: STSymbolExtended[] = [];
        const programRegex = /^\s*PROGRAM\s+(\w+)/i;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const match = line.match(programRegex);

            if (match) {
                const programName = match[1];
                const location = this.createLocation(i, line.indexOf(programName), programName.length);

                // Find END_PROGRAM
                const endLine = this.findEndKeyword(i, 'PROGRAM');

                // Parse variables within the program
                const variables = this.parseVariablesInRange(i, endLine);

                const program: STSymbolExtended = {
                    name: programName,
                    kind: STSymbolKind.Program,
                    location,
                    scope: STScope.Program,
                    members: variables,
                    references: []
                };

                programs.push(program);
            }
        }

        return programs;
    }

    /**
     * Parse FUNCTION declarations
     */
    private parseFunctions(): STSymbolExtended[] {
        const functions: STSymbolExtended[] = [];
        const functionRegex = /^\s*FUNCTION\s+(\w+)\s*:\s*(\w+)/i;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const match = line.match(functionRegex);

            if (match) {
                const functionName = match[1];
                const returnType = match[2];
                const location = this.createLocation(i, line.indexOf(functionName), functionName.length);

                // Find END_FUNCTION
                const endLine = this.findEndKeyword(i, 'FUNCTION');

                // Parse parameters and variables
                const parameters = this.parseParametersInRange(i, endLine);
                const variables = this.parseVariablesInRange(i, endLine);

                const func: STSymbolExtended = {
                    name: functionName,
                    kind: STSymbolKind.Function,
                    location,
                    scope: STScope.Function,
                    returnType,
                    parameters,
                    members: variables,
                    references: []
                };

                functions.push(func);
            }
        }

        return functions;
    }

    /**
     * Parse FUNCTION_BLOCK declarations
     */
    private parseFunctionBlocks(): STSymbolExtended[] {
        const functionBlocks: STSymbolExtended[] = [];
        const fbRegex = /^\s*FUNCTION_BLOCK\s+(\w+)/i;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const match = line.match(fbRegex);

            if (match) {
                const fbName = match[1];
                const location = this.createLocation(i, line.indexOf(fbName), fbName.length);

                // Find END_FUNCTION_BLOCK
                const endLine = this.findEndKeyword(i, 'FUNCTION_BLOCK');

                // Parse parameters and variables
                const parameters = this.parseParametersInRange(i, endLine);
                const variables = this.parseVariablesInRange(i, endLine);

                const fb: STSymbolExtended = {
                    name: fbName,
                    kind: STSymbolKind.FunctionBlock,
                    location,
                    scope: STScope.FunctionBlock,
                    parameters,
                    members: variables,
                    references: []
                };

                functionBlocks.push(fb);
            }
        }

        return functionBlocks;
    }

    /**
     * Parse variables in a given range (between start and end line)
     */
    private parseVariablesInRange(startLine: number, endLine: number): STSymbolExtended[] {
        console.log(`Parsing variables from line ${startLine} to ${endLine}`);
        const variables: STSymbolExtended[] = [];

        for (let i = startLine; i <= endLine; i++) {
            const line = this.lines[i]?.trim();
            if (!line) continue;

            // Check for VAR section start
            const varSectionMatch = line.match(/^\s*VAR(_INPUT|_OUTPUT|_IN_OUT|_GLOBAL|_TEMP)?\s*$/i);
            if (varSectionMatch) {
                const varType = varSectionMatch[1] || '';
                const scope = this.getVarScope(varType);
                console.log(`Found VAR section at line ${i}, scope: ${scope}`);

                // Parse variables until END_VAR
                for (let j = i + 1; j <= endLine; j++) {
                    const varLine = this.lines[j]?.trim();
                    if (!varLine) {
                        console.log(`  Line ${j}: Empty line, skipping`);
                        continue;
                    }

                    if (varLine.toUpperCase().startsWith('END_VAR')) {
                        console.log(`  Line ${j}: End of VAR section`);
                        i = j; // Update outer loop position
                        break;
                    }

                    // Strip comments before parsing
                    const cleanLine = this.stripComments(varLine);
                    if (!cleanLine) {
                        console.log(`  Line ${j}: Only comments, skipping`);
                        continue;
                    }

                    console.log(`  Line ${j}: Processing "${cleanLine}"`);

                    // Check for variable declarations with various formats:
                    // 1. Basic: name : type; 
                    // 2. With initialization: name : type := value;
                    // 3. Array types: name : ARRAY[0..10] OF type;
                    // 4. AT declarations: name AT %IX0.0 : type;
                    // 5. With attributes: name : type {attribute := 'value'};
                    // We need a more aggressive rewrite of the regex to reliably catch all variable declarations
                    // The key issue is not distinguishing between the variable name and its type/initialization
                    const declarationRegex = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:AT\s+%\w+[\d.]+)?\s*:\s*([A-Za-z_][A-Za-z0-9_\[\]]*(?:\s*OF\s*[A-Za-z_][A-Za-z0-9_]*)?)(?:\s*:=\s*(.*?))?(?:\s*\{.*?\})?\s*;/i;

                    const declarationMatch = cleanLine.match(declarationRegex);

                    if (declarationMatch) {
                        const [, varName, dataTypeFullText, initialValue] = declarationMatch;

                        console.log(`  MATCH! Found variable declaration: ${varName} : ${dataTypeFullText}${initialValue ? ' := ' + initialValue : ''}`);
                    } else {
                        console.log(`  NO MATCH for declaration regex on line: "${cleanLine}"`);
                        // Try a simpler regex just to check if basic pattern works
                        const basicMatch = cleanLine.match(/(\w+)\s*:\s*(\w+)/);
                        if (basicMatch) {
                            console.log(`    But basic pattern matched: ${basicMatch[1]} : ${basicMatch[2]}`);
                        }
                    }

                    if (declarationMatch) {
                        const [, varName, dataTypeFullText, initialValue] = declarationMatch;                    // Extract the base type from potentially complex type declarations
                        const dataType = this.extractBaseType(dataTypeFullText);
                        console.log(`  Extracted base type: "${dataType}" from type declaration "${dataTypeFullText}"`);

                        const isKnown = this.isKnownDataType(dataType);
                        console.log(`  Is known standard type: ${isKnown}`);

                        const isArray = dataTypeFullText.toUpperCase().startsWith('ARRAY');
                        console.log(`  Is array type: ${isArray}`);

                        // Special handling for STRING types which are often missed
                        const isString = dataType.toUpperCase() === 'STRING' || dataType.toUpperCase() === 'WSTRING';
                        if (isString) {
                            console.log(`  Special handling for STRING type: ${dataType}`);
                        }

                        // Determine symbol kind based on the type
                        const kind = isKnown
                            ? STSymbolKind.Variable
                            : STSymbolKind.FunctionBlockInstance;

                        // Prepare description
                        let description: string;
                        if (isArray) {
                            description = `Array of ${dataType}`;
                            if (initialValue) description += ` with initial value: ${initialValue.trim()}`;
                        } else if (isKnown) {
                            description = initialValue
                                ? `Initial value: ${initialValue.trim()}`
                                : `Variable of type ${dataType}`;
                        } else {
                            description = `Instance of ${dataType}`;
                        }

                        const literalType = this.getLiteralType(initialValue, dataType);

                        // Store both original and normalized name
                        const normalizedName = this.normalizeIdentifier(varName);

                        const varLocation = this.createLocation(j, this.lines[j].indexOf(varName), varName.length);
                        console.log(`  Creating symbol: ${varName} (${kind}) at line ${j}, type: ${dataType}, scope: ${scope}`);

                        const newSymbol: STSymbolExtended = {
                            name: varName,
                            normalizedName, // Add normalized name for case-insensitive lookups
                            kind,
                            location: varLocation,
                            scope,
                            dataType,
                            description,
                            literalType,
                            references: []
                        };

                        // For string variables, add extra logging
                        if (dataType.toUpperCase() === 'STRING' ||
                            dataType.toUpperCase() === 'WSTRING' ||
                            dataType.toUpperCase().startsWith('STRING[') ||
                            dataType.toUpperCase().startsWith('WSTRING[')) {
                            console.log(`  Added string variable: ${varName} (normalized: ${normalizedName}), type: ${dataType}`);
                        }

                        variables.push(newSymbol);
                    }
                }
            }
        }

        return variables;
    }

    /**
     * Parse parameters in VAR_INPUT, VAR_OUTPUT, VAR_IN_OUT sections
     */
    private parseParametersInRange(startLine: number, endLine: number): STParameter[] {
        const parameters: STParameter[] = [];

        for (let i = startLine; i <= endLine; i++) {
            const line = this.lines[i]?.trim();
            if (!line) continue;

            // Check for parameter VAR sections
            const paramSectionMatch = line.match(/^\s*VAR_(INPUT|OUTPUT|IN_OUT)\s*$/i);
            if (paramSectionMatch) {
                const direction = paramSectionMatch[1].toUpperCase() as 'INPUT' | 'OUTPUT' | 'IN_OUT';

                // Parse parameters until END_VAR
                for (let j = i + 1; j <= endLine; j++) {
                    const paramLine = this.lines[j]?.trim();
                    if (!paramLine || paramLine.toUpperCase().startsWith('END_VAR')) {
                        i = j; // Update outer loop position
                        break;
                    }

                    // Strip comments before parsing
                    const cleanLine = this.stripComments(paramLine);
                    if (!cleanLine) continue; // Skip empty lines after comment removal

                    // Enhanced parameter regex that handles:
                    // 1. Basic parameters: name : type;
                    // 2. Parameters with default values: name : type := default;
                    // 3. Array parameters: name : ARRAY[0..10] OF type;
                    // 4. Parameters with attributes: name : type {attribute := 'value'};
                    const paramRegex = /^\s*(\w+)\s*:\s*((?:ARRAY\s*\[\s*[\d.-]+\s*\.\.\s*[\d.-]+\s*\]\s*OF\s*)?[\w\d_]+)(?:\s*:=\s*([^;{]+))?(?:\s*\{[^}]*\})?\s*;/i;

                    const paramMatch = cleanLine.match(paramRegex);
                    if (paramMatch) {
                        const [, paramName, dataTypeFullText, defaultValue] = paramMatch;
                        // Extract the base data type
                        const dataType = this.extractBaseType(dataTypeFullText);

                        parameters.push({
                            name: paramName,
                            dataType,
                            direction,
                            defaultValue: defaultValue?.trim(),
                            location: this.createLocation(j, this.lines[j].indexOf(paramName), paramName.length)
                        });
                    }
                }
            }
        }

        return parameters;
    }

    /**
     * Parse global variables (VAR_GLOBAL sections)
     */
    private parseGlobalVariables(): STSymbolExtended[] {
        const globals: STSymbolExtended[] = [];
        const globalRegex = /^\s*VAR_GLOBAL(?:\s+CONSTANT|\s+RETAIN|\s+PERSISTENT)?\s*$/i;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];

            if (globalRegex.test(line)) {
                // Parse until END_VAR
                let j = i + 1;
                while (j < this.lines.length) {
                    const varLine = this.lines[j]?.trim();
                    if (!varLine) {
                        j++;
                        continue;
                    }

                    if (varLine.toUpperCase().startsWith('END_VAR')) {
                        i = j; // Skip to end of VAR_GLOBAL section
                        break;
                    }

                    // Strip comments before parsing
                    const cleanLine = this.stripComments(varLine);
                    if (!cleanLine) {
                        j++;
                        continue; // Skip empty lines after comment removal
                    }

                    // Enhanced global variable regex that handles:
                    // 1. Basic globals: name : type;
                    // 2. Globals with initialization: name : type := value;
                    // 3. Array globals: name : ARRAY[0..10] OF type;
                    // 4. AT declarations: name AT %QX0.0 : type;
                    // 5. Globals with attributes: name : type {attribute := 'value'};
                    const varRegex = /^\s*(\w+)(?:\s+AT\s+%\w+[\d.]+)?\s*:\s*((?:ARRAY\s*\[\s*[\d.-]+\s*\.\.\s*[\d.-]+\s*\]\s*OF\s*)?[\w\d_]+)(?:\s*:=\s*([^;{]+))?(?:\s*\{[^}]*\})?\s*;/i;

                    const varMatch = cleanLine.match(varRegex);
                    if (varMatch) {
                        const [, varName, dataTypeFullText, initialValue] = varMatch;

                        // Extract the base type
                        const dataType = this.extractBaseType(dataTypeFullText);
                        const isArray = dataTypeFullText.toUpperCase().startsWith('ARRAY');

                        // Determine if this is a standard type or user-defined (likely FB) type
                        const isKnown = this.isKnownDataType(dataType);
                        const kind = isKnown ? STSymbolKind.Variable : STSymbolKind.FunctionBlockInstance;

                        // Create appropriate description
                        let description: string;
                        if (isArray) {
                            description = `Array of ${dataType}`;
                            if (initialValue) description += ` with initial value: ${initialValue.trim()}`;
                        } else if (isKnown) {
                            description = initialValue
                                ? `Initial value: ${initialValue.trim()}`
                                : `Global variable of type ${dataType}`;
                        } else {
                            description = `Global instance of ${dataType}`;
                        }

                        const literalType = this.getLiteralType(initialValue, dataType);

                        globals.push({
                            name: varName,
                            kind,
                            location: this.createLocation(j, this.lines[j].indexOf(varName), varName.length),
                            scope: STScope.Global,
                            dataType,
                            description,
                            literalType,
                            references: []
                        });
                    }
                    j++;
                }
            }
        }

        return globals;
    }

    /**
     * Find the matching END keyword for a given construct
     * Handles nested blocks of the same type
     */
    private findEndKeyword(startLine: number, keyword: string): number {
        const endKeyword = `END_${keyword}`;
        let depth = 0;

        // First find the actual starting line with the keyword (in case the match was earlier in the line)
        let actualStartLine = startLine;
        const startLineText = this.lines[startLine].trim().toUpperCase();
        if (startLineText.startsWith(keyword)) {
            depth = 1;
        }

        for (let i = actualStartLine + 1; i < this.lines.length; i++) {
            // Get the trimmed, uppercase line for matching
            const line = this.stripComments(this.lines[i]).trim().toUpperCase();
            if (!line) continue;

            // Check for the same keyword (nesting)
            // We need to check for word boundaries to avoid partial matches
            // e.g., PROGRAM should not match PROGRAM_TEST
            const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (keywordRegex.test(line)) {
                depth++;
            }
            // Check for the end keyword
            else if (line.startsWith(endKeyword)) {
                depth--;
                if (depth === 0) {
                    return i;
                }
            }
        }

        // If no end found, return the last line (defensive)
        console.warn(`Could not find matching ${endKeyword} for ${keyword} starting at line ${startLine}`);
        return this.lines.length - 1;
    }

    /**
     * Strip comments from a line of code
     * Handles both single-line (//) and block ((*...*)) comments
     */
    private stripComments(line: string): string {
        if (!line) return '';

        let result = line;
        let modified = true;

        // Iteratively process comments until no more are found
        // This handles cases with multiple comments in one line
        while (modified) {
            modified = false;

            // Remove single-line comments
            const singleLineComment = result.indexOf('//');
            if (singleLineComment !== -1) {
                result = result.substring(0, singleLineComment);
                modified = true;
                continue;
            }

            // Remove block comments - note: doesn't handle nested block comments
            const blockCommentStart = result.indexOf('(*');
            if (blockCommentStart !== -1) {
                const blockCommentEnd = result.indexOf('*)', blockCommentStart);
                if (blockCommentEnd !== -1) {
                    result = result.substring(0, blockCommentStart) +
                        ' ' + // Replace with space to avoid joining tokens
                        result.substring(blockCommentEnd + 2);
                    modified = true;
                    continue;
                } else {
                    // If no closing tag, remove everything after the start tag
                    result = result.substring(0, blockCommentStart);
                    break;
                }
            }
        }

        return result.trim();
    }

    /**
     * Get literal type from initialization value
     */
    private getLiteralType(value: string | undefined, dataType: string): string {
        if (!value) return dataType;

        // Return the declared type directly for standard string types
        const upperDataType = dataType.toUpperCase();
        if (upperDataType === 'STRING' || upperDataType === 'WSTRING' ||
            upperDataType === 'CHAR' || upperDataType === 'WCHAR' ||
            upperDataType.startsWith('STRING[') || upperDataType.startsWith('WSTRING[')) {
            console.log(`Returning string type: ${upperDataType} for value: ${value}`);
            return upperDataType;
        }

        const upperVal = value.trim().toUpperCase();
        const val = value.trim();

        // Time literals
        if (upperVal.startsWith('LTIME#') || upperVal.startsWith('LT#')) return 'LTIME';
        if (upperVal.startsWith('TIME#') || upperVal.startsWith('T#')) return 'TIME';

        // Date literals
        if (upperVal.startsWith('LDATE#') || upperVal.startsWith('LD#')) return 'LDATE';
        if (upperVal.startsWith('DATE#') || upperVal.startsWith('D#')) return 'DATE';
        if (upperVal.startsWith('DT#') || upperVal.startsWith('DATE_AND_TIME#')) return 'DATE_AND_TIME';
        if (upperVal.startsWith('TOD#') || upperVal.startsWith('TIME_OF_DAY#')) return 'TIME_OF_DAY';

        // String & Char literals - improved detection
        if (upperVal.startsWith('WSTRING#') || val.startsWith('\"')) {
            console.log(`Detected WSTRING literal: ${val}`);
            return 'WSTRING';
        }
        if (upperVal.startsWith('STRING#')) {
            console.log(`Detected STRING literal with prefix: ${val}`);
            return 'STRING';
        }
        if (upperVal.startsWith('WCHAR#')) {
            console.log(`Detected WCHAR literal: ${val}`);
            return 'WCHAR';
        }
        if (val.startsWith('\'')) {
            // 'a' is CHAR, '' and 'ab' are STRING
            if (val.length === 3) {
                console.log(`Detected CHAR literal: ${val}`);
                return 'CHAR';
            }
            console.log(`Detected STRING literal with single quotes: ${val}`);
            return 'STRING';
        }

        // Number literals
        if (/^[0-9]+$/.test(val)) return 'INT';
        if (/^[0-9]+\.[0-9]+$/.test(val)) return 'REAL';
        if (upperVal === 'TRUE' || upperVal === 'FALSE') return 'BOOL';

        return dataType; // Fallback to the declared type
    }

    /**
     * Checks if a given type is a known standard IEC 61131-3 data type.
     * This helps distinguish between variable declarations and function block instances.
     */
    private isKnownDataType(dataType: string): boolean {
        if (!dataType) return false;

        // First check for string types with length specification like STRING[80]
        const stringLengthMatch = dataType.match(/^(STRING|WSTRING)\s*\[\s*(\d+)\s*\]$/i);
        if (stringLengthMatch) {
            console.log(`Detected STRING with length specification: ${dataType}`);
            return true; // STRING[n] is a known data type
        }

        const upperDataType = dataType.toUpperCase();

        // Special handling for STRING types which are often problematic
        if (upperDataType === 'STRING' || upperDataType === 'WSTRING' ||
            upperDataType.startsWith('STRING[') || upperDataType.startsWith('WSTRING[')) {
            console.log(`Special handling for string type: ${dataType}`);
            return true;
        }

        const knownTypes = new Set([
            // Elementary Types
            'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD',
            'SINT', 'USINT', 'INT', 'UINT', 'DINT', 'UDINT', 'LINT', 'ULINT',
            'REAL', 'LREAL',
            'TIME', 'LTIME',
            'DATE', 'LDATE',
            'TIME_OF_DAY', 'TOD',
            'DATE_AND_TIME', 'DT',
            'STRING', 'WSTRING',
            'CHAR', 'WCHAR',

            // Generic Types
            'ANY', 'ANY_INT', 'ANY_REAL', 'ANY_BIT', 'ANY_STRING', 'ANY_DATE',
            'ANY_NUM', 'ANY_ELEMENTARY', 'ANY_DERIVED', 'ANY_MAGNITUDE',
            'ANY_CHAR', 'ANY_CHARS',

            // Standard Function Block Types - these are sometimes used as types but 
            // we consider them "known" to avoid confusion with user-defined types
            'TON', 'TOF', 'TP', 'CTU', 'CTD', 'CTUD', 'R_TRIG', 'F_TRIG', 'SR', 'RS'
        ]);
        return knownTypes.has(upperDataType);
    }

    /**
     * Convert VAR section type to scope
     */
    private getVarScope(varType: string): STScope {
        switch (varType.toUpperCase()) {
            case '_INPUT': return STScope.Input;
            case '_OUTPUT': return STScope.Output;
            case '_IN_OUT': return STScope.InOut;
            case '_GLOBAL': return STScope.Global;
            default: return STScope.Local;
        }
    }

    /**
     * Create a Location object for the given position
     */
    private createLocation(line: number, character: number, length: number): Location {
        return {
            uri: this.document.uri,
            range: {
                start: { line, character },
                end: { line, character: character + length }
            }
        };
    }

    /**
     * Extract the base type from a potentially complex type declaration
     * e.g. from "ARRAY[0..10] OF INT" extract "INT"
     */
    private extractBaseType(typeText: string): string {
        const arrayMatch = typeText.match(/ARRAY\s*\[.*\]\s*OF\s*(\w+)/i);
        if (arrayMatch) {
            return arrayMatch[1];
        }
        return typeText.trim();
    }

    /**
     * Standardize variable names for consistent lookup
     * IEC 61131-3 identifiers are case-insensitive
     */
    private normalizeIdentifier(name: string): string {
        if (!name) return '';
        // For ST, we use lowercase as the standard form
        const normalized = name.toLowerCase();
        console.log(`Normalized identifier: '${name}' to '${normalized}'`);
        return normalized;
    }
}

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
     * Parse the document and extract all symbols
     */
    public parseSymbols(): STSymbolExtended[] {
        const symbols: STSymbolExtended[] = [];

        // Parse top-level constructs
        const programs = this.parsePrograms();
        const functions = this.parseFunctions();
        const functionBlocks = this.parseFunctionBlocks();
        const globalVariables = this.parseGlobalVariables();

        symbols.push(...programs);
        symbols.push(...functions);
        symbols.push(...functionBlocks);
        symbols.push(...globalVariables);

        // Also add local variables from programs, functions, and function blocks as individual symbols
        programs.forEach(program => {
            if (program.members) {
                program.members.forEach(member => {
                    symbols.push(this.convertToExtendedSymbol(member, program.name));
                });
            }
        });

        functions.forEach(func => {
            if (func.members) {
                func.members.forEach(member => {
                    symbols.push(this.convertToExtendedSymbol(member, func.name));
                });
            }
        });

        functionBlocks.forEach(fb => {
            if (fb.members) {
                fb.members.forEach(member => {
                    symbols.push(this.convertToExtendedSymbol(member, fb.name));
                });
            }
        });

        return symbols;
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
    private parseVariablesInRange(startLine: number, endLine: number): STSymbol[] {
        const variables: STSymbol[] = [];

        for (let i = startLine; i <= endLine; i++) {
            const line = this.lines[i]?.trim();
            if (!line) continue;

            // Check for VAR section start
            const varSectionMatch = line.match(/^\s*VAR(_INPUT|_OUTPUT|_IN_OUT|_GLOBAL)?\s*$/i);
            if (varSectionMatch) {
                const varType = varSectionMatch[1] || '';
                const scope = this.getVarScope(varType);

                // Parse variables until END_VAR
                for (let j = i + 1; j <= endLine; j++) {
                    const varLine = this.lines[j]?.trim();
                    if (!varLine || varLine.toUpperCase().startsWith('END_VAR')) {
                        i = j; // Update outer loop position
                        break;
                    }

                    // Parse variable declaration: varName : TYPE := initialValue;
                    const varMatch = varLine.match(/^\s*(\w+)\s*:\s*(\w+)(?:\s*:=\s*([^;]+))?\s*;/i);
                    if (varMatch) {
                        const [, varName, dataType, initialValue] = varMatch;

                        variables.push({
                            name: varName,
                            kind: STSymbolKind.Variable,
                            location: this.createLocation(j, varLine.indexOf(varName), varName.length),
                            scope,
                            dataType,
                            description: initialValue ? `Initial value: ${initialValue}` : undefined
                        });
                    }

                    // Parse function block instances: instanceName : FB_TYPE;
                    const fbInstanceMatch = varLine.match(/^\s*(\w+)\s*:\s*([A-Z]\w+)\s*;/i);
                    if (fbInstanceMatch && !varMatch) {
                        const [, instanceName, fbType] = fbInstanceMatch;

                        variables.push({
                            name: instanceName,
                            kind: STSymbolKind.FunctionBlockInstance,
                            location: this.createLocation(j, varLine.indexOf(instanceName), instanceName.length),
                            scope,
                            dataType: fbType,
                            description: `Instance of ${fbType}`
                        });
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
                        i = j;
                        break;
                    }

                    const paramMatch = paramLine.match(/^\s*(\w+)\s*:\s*(\w+)(?:\s*:=\s*([^;]+))?\s*;/i);
                    if (paramMatch) {
                        const [, paramName, dataType, defaultValue] = paramMatch;

                        parameters.push({
                            name: paramName,
                            dataType,
                            direction,
                            defaultValue,
                            location: this.createLocation(j, paramLine.indexOf(paramName), paramName.length)
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
    private parseGlobalVariables(): STSymbol[] {
        const globals: STSymbol[] = [];
        const globalRegex = /^\s*VAR_GLOBAL(?:\s+CONSTANT)?\s*$/i;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];

            if (globalRegex.test(line)) {
                console.log(`Found VAR_GLOBAL section at line ${i}: ${line}`);
                // Parse until END_VAR
                for (let j = i + 1; j < this.lines.length; j++) {
                    const varLine = this.lines[j]?.trim();
                    if (!varLine || varLine.toUpperCase().startsWith('END_VAR')) {
                        break;
                    }

                    const varMatch = varLine.match(/^\s*(\w+)\s*:\s*(\w+)(?:\s*:=\s*([^;]+))?\s*;/i);
                    if (varMatch) {
                        const [, varName, dataType, initialValue] = varMatch;

                        console.log(`Found global variable: ${varName} : ${dataType}`);

                        globals.push({
                            name: varName,
                            kind: STSymbolKind.Variable,
                            location: this.createLocation(j, varLine.indexOf(varName), varName.length),
                            scope: STScope.Global,
                            dataType,
                            description: initialValue ? `Initial value: ${initialValue}` : undefined
                        });
                    }
                }
            }
        }

        console.log(`Parsed ${globals.length} global variables`);
        return globals;
    }

    /**
     * Find the matching END keyword for a given construct
     */
    private findEndKeyword(startLine: number, keyword: string): number {
        const endKeyword = `END_${keyword}`;
        let depth = 0;

        for (let i = startLine; i < this.lines.length; i++) {
            const line = this.lines[i].trim().toUpperCase();

            if (line.startsWith(keyword)) {
                depth++;
            } else if (line.startsWith(endKeyword)) {
                depth--;
                if (depth === 0) {
                    return i;
                }
            }
        }

        return this.lines.length - 1;
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
     * Convert a basic STSymbol to STSymbolExtended with parent context
     */
    private convertToExtendedSymbol(symbol: STSymbol, parentName: string): STSymbolExtended {
        return {
            ...symbol,
            parentSymbol: parentName,
            references: []
        };
    }
}

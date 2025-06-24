/**
 * Enhanced Definition Provider with Member Access Support
 * Provides comprehensive go-to-definition functionality including FB member navigation
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Location, DefinitionParams } from 'vscode-languageserver';
import {
    STSymbolExtended,
    STSymbolKind,
    STScope,
    MemberAccessExpression,
    SemanticContext,
    SymbolIndex
} from '../../shared/types';
import { WorkspaceIndexer } from '../workspace-indexer';
import { MemberAccessProvider } from './member-access-provider';
import { getFunctionBlockDescription, getMemberDescription, getShortFBDescription } from './enhanced-descriptions';

// Concise descriptions for standard function blocks
const STANDARD_FB_DESCRIPTIONS: Record<string, string> = {
    'TON': 'On-Delay Timer',
    'TOF': 'Off-Delay Timer',
    'TP': 'Pulse Timer',
    'CTU': 'Up Counter',
    'CTD': 'Down Counter',
    'CTUD': 'Up-Down Counter',
    'R_TRIG': 'Rising Edge Detector',
    'F_TRIG': 'Falling Edge Detector',
    'RS': 'Reset-Dominant Bistable',
    'SR': 'Set-Dominant Bistable'
};

export class EnhancedDefinitionProvider {
    private memberAccessProvider: MemberAccessProvider;

    constructor(memberAccessProvider: MemberAccessProvider) {
        this.memberAccessProvider = memberAccessProvider;
    }

    /**
     * Provide definition locations for a symbol at the given position
     */
    public provideDefinition(
        document: TextDocument,
        position: Position,
        workspaceIndexer: WorkspaceIndexer,
        localSymbolIndex: SymbolIndex
    ): Location[] {
        console.log(`EnhancedDefinitionProvider: Looking for definition at ${position.line}:${position.character} in ${document.uri}`);
        const locations: Location[] = [];

        // Parse member access expressions in the document
        const memberExpressions = this.memberAccessProvider.parseMemberAccess(document);
        console.log(`Found ${memberExpressions.length} member access expressions in document`);

        // Check if position is within a member access expression
        const memberAccess = this.memberAccessProvider.getMemberAccessAtPosition(memberExpressions, position);

        // Debug info for local symbols index
        console.log(`Local symbol index has ${localSymbolIndex.symbolsByName.size} unique symbols`);
        for (const [name, symbols] of localSymbolIndex.symbolsByName.entries()) {
            console.log(`  Symbol name: "${name}" has ${symbols.length} entries`);
        }

        if (memberAccess) {
            // Handle member access navigation
            const accessPart = this.memberAccessProvider.getAccessPart(memberAccess, position);

            if (accessPart === 'instance') {
                // Navigate to instance definition - check both workspace and local indexes
                let instanceLocations = workspaceIndexer.findSymbolDefinition(memberAccess.instance);

                // If not found in workspace, check local symbols
                if (instanceLocations.length === 0) {
                    const localSymbols = localSymbolIndex.symbolsByName.get(memberAccess.instance);
                    if (localSymbols) {
                        instanceLocations = localSymbols.map(symbol => symbol.location);
                    }
                }

                locations.push(...instanceLocations);
            } else if (accessPart === 'member') {
                // Navigate to member definition
                const memberLocation = this.findMemberDefinition(memberAccess, workspaceIndexer, localSymbolIndex);
                if (memberLocation) {
                    locations.push(memberLocation);
                }
            }
        } else {                // Standard symbol navigation
            const symbolName = this.findSymbolAtPosition(document, position);
            if (symbolName) {
                console.log(`Looking for definition of symbol: ${symbolName}`);

                // Try exact match first
                let localSymbols = localSymbolIndex.symbolsByName.get(symbolName);

                // Try case-insensitive lookup if exact match failed
                if (!localSymbols || localSymbols.length === 0) {
                    const normalizedName = symbolName.toLowerCase();
                    console.log(`Trying case-insensitive lookup for: ${normalizedName}`);

                    // Search all entries with case-insensitive comparison
                    for (const [name, symbols] of localSymbolIndex.symbolsByName.entries()) {
                        if (name.toLowerCase() === normalizedName) {
                            console.log(`Found case-insensitive match with key: "${name}"`);
                            localSymbols = symbols;
                            break;
                        }
                    }
                }

                // Use local symbols if found
                // Use local symbols if found
                if (localSymbols && localSymbols.length > 0) {
                    console.log(`  Found ${localSymbols.length} local symbols`);

                    // Check if any of these are string variables
                    const stringVars = localSymbols.filter(s =>
                        s.dataType &&
                        (s.dataType.toUpperCase() === 'STRING' ||
                            s.dataType.toUpperCase() === 'WSTRING' ||
                            s.dataType.toUpperCase().startsWith('STRING[') ||
                            s.dataType.toUpperCase().startsWith('WSTRING['))
                    );

                    if (stringVars.length > 0) {
                        console.log(`  Found ${stringVars.length} string variables among local symbols`);
                        stringVars.forEach(s => console.log(`    String var: ${s.name} (${s.dataType})`));
                    }

                    locations.push(...localSymbols.map(s => s.location));
                } else {
                    // Fallback to workspace index
                    console.log(`  No local symbols found, checking workspace index`);
                    const symbolLocations = workspaceIndexer.findSymbolDefinition(symbolName);
                    locations.push(...symbolLocations);

                    // If still not found, try special string variable lookup
                    if (symbolLocations.length === 0) {
                        console.log(`  No workspace symbols found, trying special string variable lookup`);
                        const allSymbols = workspaceIndexer.getAllSymbols();
                        const stringVars = allSymbols.filter(s =>
                            s.name.toLowerCase() === symbolName.toLowerCase() &&
                            s.dataType &&
                            (s.dataType.toUpperCase() === 'STRING' ||
                                s.dataType.toUpperCase() === 'WSTRING' ||
                                s.dataType.toUpperCase().startsWith('STRING[') ||
                                s.dataType.toUpperCase().startsWith('WSTRING['))
                        );

                        if (stringVars.length > 0) {
                            console.log(`  Found ${stringVars.length} matching string variables`);
                            stringVars.forEach(s => console.log(`    String var: ${s.name} (${s.dataType})`));
                            locations.push(...stringVars.map(s => s.location));
                        }
                    }
                }
            }
        }

        console.log(`Definition locations found: ${locations.length}`);
        return locations;
    }

    /**
     * Find member definition for a member access expression
     */
    private findMemberDefinition(
        memberAccess: MemberAccessExpression,
        workspaceIndexer: WorkspaceIndexer,
        localSymbolIndex: SymbolIndex
    ): Location | null {
        console.log(`Finding member definition for ${memberAccess.instance}.${memberAccess.member}`);

        // Get symbols from both workspace and local indexes
        const workspaceSymbols = workspaceIndexer.getAllSymbols();
        const localSymbols: STSymbolExtended[] = [];

        // Convert local symbols to extended format
        for (const symbolList of localSymbolIndex.symbolsByName.values()) {
            symbolList.forEach(symbol => {
                localSymbols.push(symbol as STSymbolExtended);
            });
        }

        // Combine all symbols
        const allSymbols = [...workspaceSymbols, ...localSymbols];
        console.log(`Total symbols available: ${allSymbols.length}`);

        // Find the instance symbol
        const instanceSymbol = allSymbols.find(symbol => symbol.name === memberAccess.instance);
        console.log(`Instance symbol found: ${instanceSymbol ? `${instanceSymbol.name} (${instanceSymbol.dataType})` : 'none'}`);

        const customFBTypes = this.getCustomFBTypes(workspaceIndexer);

        const result = this.memberAccessProvider.findMemberDefinition(
            memberAccess.instance,
            memberAccess.member,
            allSymbols,
            customFBTypes
        );

        console.log(`Member definition result: ${result ? 'found' : 'null'}`);
        return result;
    }

    /**
     * Get custom function block types from workspace
     */
    private getCustomFBTypes(workspaceIndexer: WorkspaceIndexer) {
        const customFBTypes = new Map();
        const allSymbols = workspaceIndexer.getAllSymbols();

        allSymbols
            .filter(symbol => symbol.kind === STSymbolKind.FunctionBlock)
            .forEach(fbSymbol => {
                // Create a declaration-like structure for the FB
                const fbDeclaration = {
                    type: 'function_block' as any,
                    location: fbSymbol.location.range,
                    name: fbSymbol.name,
                    parameters: fbSymbol.parameters,
                    variables: fbSymbol.members,
                    returnType: undefined
                };
                customFBTypes.set(fbSymbol.name, fbDeclaration);
            });

        return customFBTypes;
    }

    /**
     * Find symbol at position (existing logic)
     */
    private findSymbolAtPosition(document: TextDocument, position: Position): string | null {
        const lineText = document.getText({
            start: { line: position.line, character: 0 },
            end: { line: position.line, character: Number.MAX_VALUE }
        });

        console.log(`Finding symbol in line: "${lineText}" at position ${position.character}`);

        // Use a regex that better matches ST identifiers (including those with underscores)
        const wordRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
        let match;
        let foundWord: string | null = null;
        let foundStart = -1;
        let foundEnd = -1;

        while ((match = wordRegex.exec(lineText)) !== null) {
            const word = match[0];
            const start = match.index;
            const end = start + word.length;

            if (position.character >= start && position.character <= end) {
                foundWord = word;
                foundStart = start;
                foundEnd = end;
                console.log(`Found symbol at position: "${foundWord}" (${start}-${end})`);

                // Special handling for string variables - check if the word is used with string operations
                const lineContext = lineText.substring(Math.max(0, start - 20), Math.min(lineText.length, end + 20));
                if (lineContext.includes("'") || lineContext.includes('"') ||
                    lineContext.toLowerCase().includes('string') ||
                    lineContext.toLowerCase().includes('wstring')) {
                    console.log(`  Symbol appears to be used in string context: "${lineContext}"`);
                }

                break;
            }
        }

        // If no match found with cursor directly on a word, try finding the closest word
        if (!foundWord) {
            let closestDistance = Number.MAX_SAFE_INTEGER;
            while ((match = wordRegex.exec(lineText)) !== null) {
                const word = match[0];
                const start = match.index;
                const end = start + word.length;

                // Calculate distance from cursor to word
                let distance = Number.MAX_SAFE_INTEGER;
                if (position.character < start) {
                    distance = start - position.character;
                } else if (position.character > end) {
                    distance = position.character - end;
                }

                if (distance < closestDistance) {
                    closestDistance = distance;
                    foundWord = word;
                    foundStart = start;
                    foundEnd = end;
                }
            }

            // Only use the closest word if it's reasonably close (within 5 characters)
            if (closestDistance <= 5 && foundWord) {
                console.log(`Found nearest symbol: "${foundWord}" (${foundStart}-${foundEnd}), distance: ${closestDistance}`);
            } else {
                foundWord = null;
            }
        }

        return foundWord;
    }

    /**
     * Provide hover information for symbols and members
     */
    public provideHover(
        document: TextDocument,
        position: Position,
        workspaceIndexer: WorkspaceIndexer,
        localSymbolIndex: SymbolIndex
    ): string | null {
        // Parse member access expressions
        const memberExpressions = this.memberAccessProvider.parseMemberAccess(document);
        const memberAccess = this.memberAccessProvider.getMemberAccessAtPosition(memberExpressions, position);

        if (memberAccess) {
            const accessPart = this.memberAccessProvider.getAccessPart(memberAccess, position);

            if (accessPart === 'member') {
                return this.getMemberHoverInfo(memberAccess, workspaceIndexer);
            } else if (accessPart === 'instance') {
                return this.getInstanceHoverInfo(memberAccess, workspaceIndexer);
            }
        }

        // Standard symbol hover
        const symbolName = this.findSymbolAtPosition(document, position);
        if (symbolName) {
            return this.getSymbolHoverInfo(symbolName, workspaceIndexer);
        }

        return null;
    }

    /**
     * Get hover information for a member
     */
    private getMemberHoverInfo(
        memberAccess: MemberAccessExpression,
        workspaceIndexer: WorkspaceIndexer
    ): string | null {
        const allSymbols = workspaceIndexer.getAllSymbols();

        // Try function block instance first, then fall back to variable with FB type
        let instanceSymbol = allSymbols.find(symbol =>
            symbol.name === memberAccess.instance &&
            symbol.kind === STSymbolKind.FunctionBlockInstance
        );

        // If not found as FunctionBlockInstance, try as Variable with FB dataType
        if (!instanceSymbol) {
            instanceSymbol = allSymbols.find(symbol =>
                symbol.name === memberAccess.instance &&
                symbol.kind === STSymbolKind.Variable &&
                symbol.dataType &&
                this.memberAccessProvider.isStandardFBType(symbol.dataType)
            );
        }

        if (!instanceSymbol || !instanceSymbol.dataType) {
            return null;
        }

        const customFBTypes = this.getCustomFBTypes(workspaceIndexer);
        const availableMembers = this.memberAccessProvider.getAvailableMembers(
            instanceSymbol.dataType,
            customFBTypes
        );

        const member = availableMembers.find(m => m.name === memberAccess.member);
        if (member) {
            // Create tooltip with Markdown formatting for syntax highlighting
            let hoverText = `(${member.direction.replace('VAR_', '')}) **${member.name}**: \`${member.dataType}\``;

            // Add description if available
            if (member.description) {
                // Add first sentence of description for brief context
                const firstSentence = member.description.split('.')[0];
                hoverText += `\n\n${firstSentence}.`;
            }

            // Add parent function block type info
            hoverText += `\n\nMember of \`${instanceSymbol.dataType}\` function block`;

            return hoverText;
        }

        return null;
    }

    /**
     * Get hover information for an instance
     */
    private getInstanceHoverInfo(
        memberAccess: MemberAccessExpression,
        workspaceIndexer: WorkspaceIndexer
    ): string | null {
        const allSymbols = workspaceIndexer.getAllSymbols();

        // Try function block instance first, then fall back to variable with FB type
        let instanceSymbol = allSymbols.find(symbol =>
            symbol.name === memberAccess.instance &&
            symbol.kind === STSymbolKind.FunctionBlockInstance
        );

        // If not found as FunctionBlockInstance, try as Variable with FB dataType
        if (!instanceSymbol) {
            instanceSymbol = allSymbols.find(symbol => {
                if (symbol.name === memberAccess.instance && symbol.kind === STSymbolKind.Variable && symbol.dataType) {
                    if (this.memberAccessProvider.isStandardFBType(symbol.dataType)) {
                        return true;
                    }
                    const fbDefinitions = workspaceIndexer.findSymbolsByName(symbol.dataType);
                    return fbDefinitions.some(def => def.kind === STSymbolKind.FunctionBlock);
                }
                return false;
            });
        } if (instanceSymbol) {
            // Check if this is a standard function block
            const displayType = instanceSymbol.literalType || instanceSymbol.dataType;

            // Create tooltip with Markdown formatting for syntax highlighting
            let hoverText = `**${instanceSymbol.name}**: \`${displayType}\``;

            // For standard FBs, always add the type description directly instead of in parentheses
            // This ensures descriptions are always visible
            if (instanceSymbol.dataType && this.memberAccessProvider.isStandardFBType(instanceSymbol.dataType)) {
                const fbType = instanceSymbol.dataType.toUpperCase();
                const description = STANDARD_FB_DESCRIPTIONS[fbType];
                if (description) {
                    // Include full description with FB type and description on the next line
                    hoverText = `**${instanceSymbol.name}**: \`${displayType}\` *(${description})*\n\n`;
                    hoverText += `Standard function block for ${description}.`;
                }
            }

            return hoverText;
        }

        return null;
    }

    /**
     * Get hover information for a regular symbol
     */
    private getSymbolHoverInfo(
        symbolName: string,
        workspaceIndexer: WorkspaceIndexer
    ): string | null {
        const symbols = workspaceIndexer.findSymbolsByName(symbolName);
        if (symbols.length > 0) {
            const symbol = symbols[0]; // Use the first definition found
            const displayType = symbol.literalType || symbol.dataType || '';

            // Create tooltips with Markdown formatting for syntax highlighting
            if (symbol.kind === STSymbolKind.FunctionBlock) {
                return this.formatStandardFBHover(symbol.name);
            } else if (symbol.kind === STSymbolKind.Program) {
                return `## Program: \`${symbol.name}\`\n\nIEC 61131-3 program organization unit (POU)`;
            } else if (displayType) {
                let result = `**${symbol.name}**: \`${displayType}\``;

                // Add kind info
                const kindDisplay = symbol.kind.toLowerCase().replace(/_/g, ' ');
                result += `\n\n*${kindDisplay}*`;

                // Add description if available
                if (symbol.description) {
                    result += `\n\n${symbol.description.split('\n')[0]}`;
                }

                return result;
            } else {
                return `**${symbol.name}**`;
            }
        }

        return null;
    }

    /**
     * Format hover text for standard function blocks in a consistent way
     * @param fbType The function block type name
     */
    private formatStandardFBHover(fbType: string): string {
        // For standard function blocks, we want to show their core purpose without extra text
        // Example: "function block TON (On-Delay Timer)"
        if (this.memberAccessProvider.isStandardFBType(fbType)) {
            const fbTypeUpper = fbType.toUpperCase();
            const description = STANDARD_FB_DESCRIPTIONS[fbTypeUpper] || '';
            if (description) {
                // Format with heading style and detailed description
                let result = `## Function Block: \`${fbType}\`\n\n`;
                result += `**Type**: ${description}\n\n`;
                result += `Standard IEC 61131-3 function block used for ${description.toLowerCase()} operations.`;
                return result;
            }
        }

        return `## Function Block: \`${fbType}\``;
    }
}

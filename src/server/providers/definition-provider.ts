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
        const locations: Location[] = [];

        // Parse member access expressions in the document
        const memberExpressions = this.memberAccessProvider.parseMemberAccess(document);

        // Check if position is within a member access expression
        const memberAccess = this.memberAccessProvider.getMemberAccessAtPosition(memberExpressions, position);

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
        } else {
            // Standard symbol navigation
            const symbolName = this.findSymbolAtPosition(document, position);
            if (symbolName) {
                // Try exact match first
                let localSymbols = localSymbolIndex.symbolsByName.get(symbolName);

                // Try case-insensitive lookup if exact match failed
                if (!localSymbols || localSymbols.length === 0) {
                    const normalizedName = symbolName.toLowerCase();

                    // Search all entries with case-insensitive comparison
                    for (const [name, symbols] of localSymbolIndex.symbolsByName.entries()) {
                        if (name.toLowerCase() === normalizedName) {
                            localSymbols = symbols;
                            break;
                        }
                    }
                }

                // Use local symbols if found
                if (localSymbols && localSymbols.length > 0) {
                    locations.push(...localSymbols.map(s => s.location));
                } else {
                    // Fallback to workspace index
                    const symbolLocations = workspaceIndexer.findSymbolDefinition(symbolName);
                    locations.push(...symbolLocations);

                    // If still not found, try special string variable lookup
                    if (symbolLocations.length === 0) {
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
                            locations.push(...stringVars.map(s => s.location));
                        }
                    }
                }
            }
        }

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

        const customFBTypes = this.getCustomFBTypes(workspaceIndexer);

        return this.memberAccessProvider.findMemberDefinition(
            memberAccess.instance,
            memberAccess.member,
            allSymbols,
            customFBTypes
        );
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
     * Find symbol at position
     */
    private findSymbolAtPosition(document: TextDocument, position: Position): string | null {
        const lineText = document.getText({
            start: { line: position.line, character: 0 },
            end: { line: position.line, character: Number.MAX_VALUE }
        });

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
            if (!(closestDistance <= 5 && foundWord)) {
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
            return `**${member.name}** (${member.direction})\n\nType: \`${member.dataType}\`\n\nFunction Block: \`${member.fbType}\`${member.description ? `\n\n${member.description}` : ''}`;
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
        }

        if (instanceSymbol) {
            const kindDisplay = (instanceSymbol.kind === STSymbolKind.Variable ? 'Function Block Instance' : instanceSymbol.kind).replace(/_/g, ' ');
            const displayType = instanceSymbol.literalType || instanceSymbol.dataType;
            let hoverText = `**${instanceSymbol.name}** (*${kindDisplay}*)\n\nType: \`${displayType}\``;

            if (instanceSymbol.literalType && instanceSymbol.literalType !== instanceSymbol.dataType) {
                hoverText += ` (Declared as \`${instanceSymbol.dataType}\`)`;
            }

            if (instanceSymbol.description) {
                hoverText += `\n\n${instanceSymbol.description}`;
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
            const kindDisplay = symbol.kind.replace(/_/g, ' ');
            const displayType = symbol.literalType || symbol.dataType;
            let hoverText = `**${symbol.name}** (*${kindDisplay}*)\n\nType: \`${displayType}\``;

            if (symbol.literalType && symbol.literalType !== symbol.dataType) {
                hoverText += ` (Declared as \`${symbol.dataType}\`)`;
            }

            if (symbol.description) {
                hoverText += `\n\n${symbol.description}`;
            }

            return hoverText;
        }

        return null;
    }
}

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
                const symbolLocations = workspaceIndexer.findSymbolDefinition(symbolName);
                locations.push(...symbolLocations);
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
        const text = document.getText();
        const lines = text.split('\n');
        const line = lines[position.line];

        if (!line) return null;

        // Simple word extraction at position
        const wordMatch = line.match(/\b\w+\b/g);
        if (!wordMatch) return null;

        let currentPos = 0;
        for (const word of wordMatch) {
            const wordStart = line.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;

            if (position.character >= wordStart && position.character <= wordEnd) {
                return word;
            }
            currentPos = wordEnd;
        }

        return null;
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
            instanceSymbol = allSymbols.find(symbol =>
                symbol.name === memberAccess.instance &&
                symbol.kind === STSymbolKind.Variable &&
                symbol.dataType &&
                this.memberAccessProvider.isStandardFBType(symbol.dataType)
            );
        }

        if (instanceSymbol) {
            const kindDisplay = instanceSymbol.kind === STSymbolKind.Variable ? 'Function Block Instance' : instanceSymbol.kind;
            return `**${instanceSymbol.name}** (${kindDisplay})\n\nType: \`${instanceSymbol.dataType}\`${instanceSymbol.description ? `\n\n${instanceSymbol.description}` : ''}`;
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
        const definitions = workspaceIndexer.findSymbolDefinition(symbolName);
        if (definitions.length > 0) {
            // For now, just indicate that a definition exists
            return `**${symbolName}**\n\nDefinition found (${definitions.length} location${definitions.length > 1 ? 's' : ''})`;
        }

        return null;
    }
}

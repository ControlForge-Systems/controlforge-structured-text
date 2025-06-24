/**
 * Hover Provider for Structured Text
 * Provides hover information for symbols and function block members with VS Code theme-aware formatting
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Hover, MarkupKind } from 'vscode-languageserver';
import {
    STSymbolExtended,
    STSymbolKind,
    STScope,
    MemberAccessExpression,
    SymbolIndex
} from '../../shared/types';
import { WorkspaceIndexer } from '../workspace-indexer';
import { MemberAccessProvider } from './member-access-provider';

// Standard function block descriptions
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

export class HoverProvider {
    private memberAccessProvider: MemberAccessProvider;

    constructor(memberAccessProvider: MemberAccessProvider) {
        this.memberAccessProvider = memberAccessProvider;
    }

    /**
     * Provide hover information for symbols and members
     * Returns a Hover object with markdown content
     */
    public provideHover(
        document: TextDocument,
        position: Position,
        workspaceIndexer: WorkspaceIndexer,
        localSymbolIndex: SymbolIndex
    ): Hover | null {
        // First try to get the hover text
        const hoverText = this.getHoverText(document, position, workspaceIndexer, localSymbolIndex);

        if (hoverText) {
            // Return as markdown content in a Hover object
            return {
                contents: {
                    kind: MarkupKind.Markdown,
                    value: hoverText
                }
            };
        }

        return null;
    }

    /**
     * Get hover text for the symbol at the given position
     */
    private getHoverText(
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
     * Find the symbol at the given position
     */
    private findSymbolAtPosition(document: TextDocument, position: Position): string | null {
        const line = document.getText({
            start: { line: position.line, character: 0 },
            end: { line: position.line, character: Number.MAX_SAFE_INTEGER }
        });

        // Match identifiers in the line
        const identifierPattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
        const matches: { word: string, start: number, end: number }[] = [];
        let match: RegExpExecArray | null;

        while ((match = identifierPattern.exec(line)) !== null) {
            matches.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        // Check which identifier contains the cursor position
        for (const { word, start, end } of matches) {
            if (position.character >= start && position.character <= end) {
                return word;
            }
        }

        return null;
    }

    /**
     * Format hover content for a function block member
     */
    private getMemberHoverInfo(
        memberAccess: MemberAccessExpression,
        workspaceIndexer: WorkspaceIndexer
    ): string | null {
        const allSymbols = workspaceIndexer.getAllSymbols();

        // Find the instance symbol
        let instanceSymbol = allSymbols.find(symbol =>
            symbol.name === memberAccess.instance &&
            (symbol.kind === STSymbolKind.FunctionBlockInstance ||
                (symbol.kind === STSymbolKind.Variable &&
                    symbol.dataType &&
                    this.memberAccessProvider.isStandardFBType(symbol.dataType))));

        if (!instanceSymbol || !instanceSymbol.dataType) {
            return null;
        }

        // Get available members
        const customFBTypes = this.getCustomFBTypes(workspaceIndexer);
        const availableMembers = this.memberAccessProvider.getAvailableMembers(
            instanceSymbol.dataType,
            customFBTypes
        );

        const member = availableMembers.find(m => m.name === memberAccess.member);
        if (member) {
            // Format member information
            const directionDisplay = member.direction.replace('VAR_', '');
            let hoverText = `(${directionDisplay}) **${member.name}**: \`${member.dataType}\``;

            // Add description if available
            if (member.description) {
                const firstSentence = member.description.split('.')[0];
                hoverText += `\n\n${firstSentence}.`;
            }

            // Add parent function block type info
            hoverText += `\n\n**Member of**: \`${instanceSymbol.dataType} function block\``;

            return hoverText;
        }

        return null;
    }

    /**
     * Format hover content for a function block instance
     */
    private getInstanceHoverInfo(
        memberAccess: MemberAccessExpression,
        workspaceIndexer: WorkspaceIndexer
    ): string | null {
        const allSymbols = workspaceIndexer.getAllSymbols();

        // Find the instance symbol
        let instanceSymbol = allSymbols.find(symbol => {
            if (symbol.name === memberAccess.instance) {
                if (symbol.kind === STSymbolKind.FunctionBlockInstance) {
                    return true;
                }
                if (symbol.kind === STSymbolKind.Variable && symbol.dataType) {
                    if (this.memberAccessProvider.isStandardFBType(symbol.dataType)) {
                        return true;
                    }
                    const fbDefinitions = workspaceIndexer.findSymbolsByName(symbol.dataType);
                    return fbDefinitions.some(def => def.kind === STSymbolKind.FunctionBlock);
                }
            }
            return false;
        });

        if (instanceSymbol) {
            const displayType = instanceSymbol.literalType || instanceSymbol.dataType || 'unknown';
            let hoverText = `**${instanceSymbol.name}**: \`${displayType}\``;

            // Add description for standard function blocks
            if (instanceSymbol.dataType && this.memberAccessProvider.isStandardFBType(instanceSymbol.dataType)) {
                const fbType = instanceSymbol.dataType.toUpperCase();
                const description = STANDARD_FB_DESCRIPTIONS[fbType];
                if (description) {
                    hoverText = `**${instanceSymbol.name}**: \`${displayType}\` *(${description})*`;
                    hoverText += `\n\nStandard function block for ${description}.`;
                }
            }

            // Add kind as metadata
            hoverText += `\n\n*${instanceSymbol.kind === STSymbolKind.FunctionBlockInstance ? 'function block instance' : 'variable'}*`;

            return hoverText;
        }

        return null;
    }

    /**
     * Format hover content for a standard symbol
     */
    private getSymbolHoverInfo(
        symbolName: string,
        workspaceIndexer: WorkspaceIndexer
    ): string | null {
        const symbols = workspaceIndexer.findSymbolsByName(symbolName);

        if (symbols.length > 0) {
            const symbol = symbols[0]; // Use the first definition found
            const displayType = symbol.literalType || symbol.dataType || '';

            // Handle different symbol kinds
            if (symbol.kind === STSymbolKind.FunctionBlock) {
                return this.getFunctionBlockHoverInfo(symbol.name);
            }

            else if (symbol.kind === STSymbolKind.Program) {
                return `**Program**: \`${symbol.name}\`\n\nIEC 61131-3 program organization unit (POU)\n\n*program*`;
            }

            else if (displayType) {
                // Handle variables and other symbols
                let result = `**${symbol.name}**: \`${displayType}\``;

                // Add kind info as metadata
                const kindDisplay = symbol.kind.toLowerCase().replace(/_/g, ' ');
                result += `\n\n*${kindDisplay}*`;

                // Add description if available
                if (symbol.description) {
                    const firstSentence = symbol.description.split('\n')[0].split('.')[0];
                    result += `\n\n${firstSentence}.`;
                }

                return result;
            }

            else {
                return `**${symbol.name}**`;
            }
        }

        return null;
    }

    /**
     * Format hover content for a function block
     */
    private getFunctionBlockHoverInfo(fbType: string): string {
        if (this.memberAccessProvider.isStandardFBType(fbType)) {
            const fbTypeUpper = fbType.toUpperCase();
            const description = STANDARD_FB_DESCRIPTIONS[fbTypeUpper] || '';

            if (description) {
                let result = `**Function Block**: \`${fbType}\``;
                result += `\n\n**Type**: ${description}`;
                result += `\n\nStandard IEC 61131-3 function block used for ${description.toLowerCase()} operations.`;
                result += `\n\n*function block definition*`;
                return result;
            }
        }

        return `**Function Block**: \`${fbType}\``;
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
}

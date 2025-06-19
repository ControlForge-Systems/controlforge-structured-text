/**
 * Member Access Completion Provider
 * Provides intelligent completion for function block members
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, CompletionItem, CompletionItemKind } from 'vscode-languageserver';
import { STSymbolExtended, STSymbolKind, FBMemberDefinition } from '../../shared/types';
import { WorkspaceIndexer } from '../workspace-indexer';
import { MemberAccessProvider } from './member-access-provider';

export class MemberCompletionProvider {
    private memberAccessProvider: MemberAccessProvider;

    constructor(memberAccessProvider: MemberAccessProvider) {
        this.memberAccessProvider = memberAccessProvider;
    }

    /**
     * Provide completion items for member access
     */
    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        workspaceIndexer: WorkspaceIndexer
    ): CompletionItem[] {
        const completionItems: CompletionItem[] = [];

        // Check if we're in a member access context (typing after "instance.")
        const memberContext = this.getMemberAccessContext(document, position);

        if (memberContext) {
            // Get available members for the instance type
            const instanceType = this.getInstanceType(memberContext.instanceName, workspaceIndexer);

            if (instanceType) {
                const customFBTypes = this.getCustomFBTypes(workspaceIndexer);
                const availableMembers = this.memberAccessProvider.getAvailableMembers(instanceType, customFBTypes);

                // Convert members to completion items
                availableMembers.forEach(member => {
                    completionItems.push(this.createMemberCompletionItem(member));
                });
            }
        } else {
            // Provide general completion items (variables, function blocks, etc.)
            const generalCompletions = this.getGeneralCompletions(workspaceIndexer);
            completionItems.push(...generalCompletions);
        }

        return completionItems;
    }

    /**
     * Check if position is in a member access context (after "instance.")
     */
    private getMemberAccessContext(document: TextDocument, position: Position): { instanceName: string } | null {
        const text = document.getText();
        const lines = text.split('\n');
        const currentLine = lines[position.line];

        if (!currentLine) return null;

        // Look backwards from position to find "instance."
        const beforeCursor = currentLine.substring(0, position.character);
        const memberAccessMatch = beforeCursor.match(/(\w+)\.\s*$/);

        if (memberAccessMatch) {
            return { instanceName: memberAccessMatch[1] };
        }

        return null;
    }

    /**
     * Get the type of an instance
     */
    private getInstanceType(instanceName: string, workspaceIndexer: WorkspaceIndexer): string | null {
        const allSymbols = workspaceIndexer.getAllSymbols();

        // Try function block instance first, then fall back to variable with FB type
        let instanceSymbol = allSymbols.find(symbol =>
            symbol.name === instanceName &&
            symbol.kind === STSymbolKind.FunctionBlockInstance
        );

        // If not found as FunctionBlockInstance, try as Variable with FB dataType
        if (!instanceSymbol) {
            instanceSymbol = allSymbols.find(symbol =>
                symbol.name === instanceName &&
                symbol.kind === STSymbolKind.Variable &&
                symbol.dataType &&
                this.memberAccessProvider.isStandardFBType(symbol.dataType)
            );
        }

        return instanceSymbol?.dataType || null;
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
     * Create completion item for a member
     */
    private createMemberCompletionItem(member: FBMemberDefinition): CompletionItem {
        const kind = this.getMemberCompletionKind(member.direction);
        const detail = `${member.direction}: ${member.dataType}`;
        const documentation = member.description || `${member.direction} member of ${member.fbType}`;

        return {
            label: member.name,
            kind,
            detail,
            documentation,
            insertText: member.name,
            filterText: member.name,
            sortText: this.getMemberSortText(member.direction, member.name)
        };
    }

    /**
     * Get completion item kind based on member direction
     */
    private getMemberCompletionKind(direction: string): CompletionItemKind {
        switch (direction.toUpperCase()) {
            case 'INPUT':
                return CompletionItemKind.Property;
            case 'OUTPUT':
                return CompletionItemKind.Field;
            case 'VAR':
                return CompletionItemKind.Variable;
            default:
                return CompletionItemKind.Property;
        }
    }

    /**
     * Get sort text to order members logically (inputs first, then outputs, then vars)
     */
    private getMemberSortText(direction: string, name: string): string {
        const prefix = direction.toUpperCase() === 'INPUT' ? '1' :
            direction.toUpperCase() === 'OUTPUT' ? '2' : '3';
        return `${prefix}_${name}`;
    }

    /**
     * Get general completion items (not member access)
     */
    private getGeneralCompletions(workspaceIndexer: WorkspaceIndexer): CompletionItem[] {
        const completionItems: CompletionItem[] = [];
        const allSymbols = workspaceIndexer.getAllSymbols();

        // Add variables and function block instances
        allSymbols.forEach(symbol => {
            if (symbol.kind === STSymbolKind.Variable ||
                symbol.kind === STSymbolKind.FunctionBlockInstance) {
                completionItems.push({
                    label: symbol.name,
                    kind: symbol.kind === STSymbolKind.Variable ?
                        CompletionItemKind.Variable :
                        CompletionItemKind.Class,
                    detail: symbol.dataType || symbol.kind,
                    documentation: symbol.description,
                    insertText: symbol.name
                });
            }
        });

        // Add standard keywords
        const keywords = [
            'IF', 'THEN', 'ELSE', 'ELSIF', 'END_IF',
            'FOR', 'TO', 'BY', 'DO', 'END_FOR',
            'WHILE', 'END_WHILE',
            'REPEAT', 'UNTIL', 'END_REPEAT',
            'CASE', 'OF', 'END_CASE',
            'FUNCTION', 'END_FUNCTION',
            'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',
            'PROGRAM', 'END_PROGRAM',
            'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_GLOBAL', 'END_VAR',
            'TRUE', 'FALSE',
            'AND', 'OR', 'NOT', 'XOR'
        ];

        keywords.forEach(keyword => {
            completionItems.push({
                label: keyword,
                kind: CompletionItemKind.Keyword,
                insertText: keyword,
                sortText: `9_${keyword}` // Sort keywords last
            });
        });

        return completionItems;
    }
}

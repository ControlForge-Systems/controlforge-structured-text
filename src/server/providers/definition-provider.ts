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
    SymbolIndex,
    StandardFBDescription
} from '../../shared/types';
import { WorkspaceIndexer } from '../workspace-indexer';
import { MemberAccessProvider } from './member-access-provider';

// ─── Data type hover descriptions ───────────────────────────────────────────

const DATA_TYPE_HOVER: Record<string, string> = {
    'BOOL':         '**BOOL** (*Boolean*)\n\nSingle-bit boolean. Values: `TRUE` or `FALSE`.\n\n**Size:** 1 bit (typically 1 byte in memory)',
    'BYTE':         '**BYTE** (*Byte*)\n\nUnsigned 8-bit integer. Range: `0` to `255`.\n\n**Size:** 8 bits',
    'WORD':         '**WORD** (*Word*)\n\nUnsigned 16-bit integer. Range: `0` to `65535`.\n\n**Size:** 16 bits',
    'DWORD':        '**DWORD** (*Double Word*)\n\nUnsigned 32-bit integer. Range: `0` to `4294967295`.\n\n**Size:** 32 bits',
    'LWORD':        '**LWORD** (*Long Word*)\n\nUnsigned 64-bit integer. Range: `0` to `2⁶⁴−1`.\n\n**Size:** 64 bits',
    'SINT':         '**SINT** (*Short Integer*)\n\nSigned 8-bit integer. Range: `−128` to `127`.\n\n**Size:** 8 bits',
    'INT':          '**INT** (*Integer*)\n\nSigned 16-bit integer. Range: `−32768` to `32767`.\n\n**Size:** 16 bits',
    'DINT':         '**DINT** (*Double Integer*)\n\nSigned 32-bit integer. Range: `−2147483648` to `2147483647`.\n\n**Size:** 32 bits',
    'LINT':         '**LINT** (*Long Integer*)\n\nSigned 64-bit integer. Range: `−2⁶³` to `2⁶³−1`.\n\n**Size:** 64 bits',
    'USINT':        '**USINT** (*Unsigned Short Integer*)\n\nUnsigned 8-bit integer. Range: `0` to `255`.\n\n**Size:** 8 bits',
    'UINT':         '**UINT** (*Unsigned Integer*)\n\nUnsigned 16-bit integer. Range: `0` to `65535`.\n\n**Size:** 16 bits',
    'UDINT':        '**UDINT** (*Unsigned Double Integer*)\n\nUnsigned 32-bit integer. Range: `0` to `4294967295`.\n\n**Size:** 32 bits',
    'ULINT':        '**ULINT** (*Unsigned Long Integer*)\n\nUnsigned 64-bit integer. Range: `0` to `2⁶⁴−1`.\n\n**Size:** 64 bits',
    'REAL':         '**REAL** (*Real*)\n\nSingle-precision IEEE 754 floating-point. Range: ±3.4×10³⁸ (~7 significant digits).\n\n**Size:** 32 bits',
    'LREAL':        '**LREAL** (*Long Real*)\n\nDouble-precision IEEE 754 floating-point. Range: ±1.8×10³⁰⁸ (~15 significant digits).\n\n**Size:** 64 bits',
    'TIME':         '**TIME** (*Time*)\n\nDuration value. Literal syntax: `T#1h30m0s` or `TIME#500ms`.\n\n**Size:** 32 bits (milliseconds)',
    'LTIME':        '**LTIME** (*Long Time*)\n\nHigh-resolution duration value. Literal syntax: `LTIME#1h30m0s500ms`.\n\n**Size:** 64 bits (nanoseconds)',
    'DATE':         '**DATE** (*Date*)\n\nCalendar date. Literal syntax: `D#2024-01-31` or `DATE#2024-01-31`.\n\n**Size:** 32 bits',
    'TIME_OF_DAY':  '**TIME_OF_DAY** (*Time of Day*)\n\nTime within a day. Literal syntax: `TOD#12:30:00` or `TIME_OF_DAY#08:00:00.500`.\n\n**Size:** 32 bits',
    'TOD':          '**TOD** (*Time of Day*)\n\nShort alias for `TIME_OF_DAY`. Literal syntax: `TOD#12:30:00`.\n\n**Size:** 32 bits',
    'DATE_AND_TIME': '**DATE_AND_TIME** (*Date and Time*)\n\nCombined date and time. Literal syntax: `DT#2024-01-31-12:30:00`.\n\n**Size:** 32 bits',
    'DT':           '**DT** (*Date and Time*)\n\nShort alias for `DATE_AND_TIME`. Literal syntax: `DT#2024-01-31-12:30:00`.\n\n**Size:** 32 bits',
    'STRING':       '**STRING** (*String*)\n\nFixed-length single-byte character string. Default max length: 80 characters.\n\nOptional length: `STRING[255]`.',
    'WSTRING':      '**WSTRING** (*Wide String*)\n\nFixed-length wide (Unicode) character string.\n\nOptional length: `WSTRING[255]`.',
    'CHAR':         '**CHAR** (*Character*)\n\nSingle single-byte character.\n\n**Size:** 8 bits',
    'WCHAR':        '**WCHAR** (*Wide Character*)\n\nSingle Unicode character.\n\n**Size:** 16 bits',
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
            const displayType = instanceSymbol.literalType || instanceSymbol.dataType;

            // Check if instance is a standard FB — render rich tooltip
            if (displayType && this.memberAccessProvider.isStandardFBType(displayType)) {
                return this.buildStandardFBHover(instanceSymbol.name, displayType, 'instance');
            }

            const kindDisplay = (instanceSymbol.kind === STSymbolKind.Variable ? 'Function Block Instance' : instanceSymbol.kind).replace(/_/g, ' ');
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
        // Check if hovering on a primitive data type
        const dtHover = DATA_TYPE_HOVER[symbolName.toUpperCase()];
        if (dtHover) {
            return dtHover;
        }

        // Check if hovering on a standard FB type name (e.g., TON in a declaration)
        const fbDesc = this.memberAccessProvider.getStandardFBDescription(symbolName.toUpperCase());
        if (fbDesc) {
            return this.buildStandardFBHover(undefined, fbDesc.name, 'type');
        }

        const symbols = workspaceIndexer.findSymbolsByName(symbolName);
        if (symbols.length > 0) {
            const symbol = symbols[0]; // Use the first definition found

            // If it's a function block definition, check for standard FB
            if (symbol.kind === STSymbolKind.FunctionBlock) {
                const stdDesc = this.memberAccessProvider.getStandardFBDescription(symbol.name.toUpperCase());
                if (stdDesc) {
                    return this.buildStandardFBHover(undefined, stdDesc.name, 'type');
                }
            }

            // If it's an FB instance, show rich tooltip
            if ((symbol.kind === STSymbolKind.FunctionBlockInstance || symbol.kind === STSymbolKind.Variable) &&
                symbol.dataType && this.memberAccessProvider.isStandardFBType(symbol.dataType)) {
                return this.buildStandardFBHover(symbol.name, symbol.dataType, 'instance');
            }

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

    /**
     * Build a rich markdown hover tooltip for a standard function block
     */
    private buildStandardFBHover(
        instanceName: string | undefined,
        fbType: string,
        context: 'type' | 'instance'
    ): string {
        const fbDesc = this.memberAccessProvider.getStandardFBDescription(fbType);
        const members = this.memberAccessProvider.getAvailableMembers(fbType, new Map());

        const parts: string[] = [];

        // Header
        if (context === 'instance' && instanceName) {
            parts.push(`**${instanceName}** : \`${fbType}\` (*Function Block Instance*)`);
        } else {
            parts.push(`**${fbType}** (*Standard Function Block — ${fbDesc?.category || 'IEC 61131-3'}*)`);
        }

        // Summary
        if (fbDesc) {
            parts.push('');
            parts.push(fbDesc.summary);
        }

        // Parameter table
        if (members.length > 0) {
            const inputs = members.filter(m => m.direction === 'VAR_INPUT');
            const outputs = members.filter(m => m.direction === 'VAR_OUTPUT');

            parts.push('');
            parts.push('**Parameters:**');

            if (inputs.length > 0) {
                parts.push('');
                parts.push('| Input | Type | Description |');
                parts.push('|-------|------|-------------|');
                for (const m of inputs) {
                    parts.push(`| \`${m.name}\` | \`${m.dataType}\` | ${m.description || ''} |`);
                }
            }

            if (outputs.length > 0) {
                parts.push('');
                parts.push('| Output | Type | Description |');
                parts.push('|--------|------|-------------|');
                for (const m of outputs) {
                    parts.push(`| \`${m.name}\` | \`${m.dataType}\` | ${m.description || ''} |`);
                }
            }
        }

        // Behavior
        if (fbDesc) {
            parts.push('');
            parts.push(`**Behavior:** ${fbDesc.behavior}`);
        }

        // Usage example
        if (fbDesc?.example) {
            parts.push('');
            parts.push('**Example:**');
            parts.push('```iecst');
            parts.push(fbDesc.example);
            parts.push('```');
        }

        return parts.join('\n');
    }
}

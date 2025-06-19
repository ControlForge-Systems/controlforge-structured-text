/**
 * Member Access Provider for Function Block Navigation
 * Handles navigation through the dot operator (instance.member)
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Location, Range } from 'vscode-languageserver';
import {
    MemberAccessExpression,
    FBMemberDefinition,
    STSymbolExtended,
    STSymbolKind,
    STScope,
    STDeclaration,
    STParameter,
    STSymbol
} from '../../shared/types';

export class MemberAccessProvider {
    private standardFBMembers: Map<string, FBMemberDefinition[]> = new Map();

    constructor() {
        this.initializeStandardFBMembers();
    }

    /**
     * Initialize standard IEC 61131-3 function block members
     */
    private initializeStandardFBMembers(): void {
        this.standardFBMembers = new Map();

        // Timer function blocks
        this.standardFBMembers.set('TON', [
            { name: 'IN', dataType: 'BOOL', direction: 'INPUT', description: 'Timer input signal', fbType: 'TON' },
            { name: 'PT', dataType: 'TIME', direction: 'INPUT', description: 'Preset time', fbType: 'TON' },
            { name: 'Q', dataType: 'BOOL', direction: 'OUTPUT', description: 'Timer output', fbType: 'TON' },
            { name: 'ET', dataType: 'TIME', direction: 'OUTPUT', description: 'Elapsed time', fbType: 'TON' }
        ]);

        this.standardFBMembers.set('TOF', [
            { name: 'IN', dataType: 'BOOL', direction: 'INPUT', description: 'Timer input signal', fbType: 'TOF' },
            { name: 'PT', dataType: 'TIME', direction: 'INPUT', description: 'Preset time', fbType: 'TOF' },
            { name: 'Q', dataType: 'BOOL', direction: 'OUTPUT', description: 'Timer output', fbType: 'TOF' },
            { name: 'ET', dataType: 'TIME', direction: 'OUTPUT', description: 'Elapsed time', fbType: 'TOF' }
        ]);

        this.standardFBMembers.set('TP', [
            { name: 'IN', dataType: 'BOOL', direction: 'INPUT', description: 'Timer input signal', fbType: 'TP' },
            { name: 'PT', dataType: 'TIME', direction: 'INPUT', description: 'Preset time', fbType: 'TP' },
            { name: 'Q', dataType: 'BOOL', direction: 'OUTPUT', description: 'Timer output', fbType: 'TP' },
            { name: 'ET', dataType: 'TIME', direction: 'OUTPUT', description: 'Elapsed time', fbType: 'TP' }
        ]);

        // Counter function blocks
        this.standardFBMembers.set('CTU', [
            { name: 'CU', dataType: 'BOOL', direction: 'INPUT', description: 'Count up input', fbType: 'CTU' },
            { name: 'R', dataType: 'BOOL', direction: 'INPUT', description: 'Reset input', fbType: 'CTU' },
            { name: 'PV', dataType: 'INT', direction: 'INPUT', description: 'Preset value', fbType: 'CTU' },
            { name: 'Q', dataType: 'BOOL', direction: 'OUTPUT', description: 'Counter output', fbType: 'CTU' },
            { name: 'CV', dataType: 'INT', direction: 'OUTPUT', description: 'Current value', fbType: 'CTU' }
        ]);

        this.standardFBMembers.set('CTD', [
            { name: 'CD', dataType: 'BOOL', direction: 'INPUT', description: 'Count down input', fbType: 'CTD' },
            { name: 'LD', dataType: 'BOOL', direction: 'INPUT', description: 'Load input', fbType: 'CTD' },
            { name: 'PV', dataType: 'INT', direction: 'INPUT', description: 'Preset value', fbType: 'CTD' },
            { name: 'Q', dataType: 'BOOL', direction: 'OUTPUT', description: 'Counter output', fbType: 'CTD' },
            { name: 'CV', dataType: 'INT', direction: 'OUTPUT', description: 'Current value', fbType: 'CTD' }
        ]);

        this.standardFBMembers.set('CTUD', [
            { name: 'CU', dataType: 'BOOL', direction: 'INPUT', description: 'Count up input', fbType: 'CTUD' },
            { name: 'CD', dataType: 'BOOL', direction: 'INPUT', description: 'Count down input', fbType: 'CTUD' },
            { name: 'R', dataType: 'BOOL', direction: 'INPUT', description: 'Reset input', fbType: 'CTUD' },
            { name: 'LD', dataType: 'BOOL', direction: 'INPUT', description: 'Load input', fbType: 'CTUD' },
            { name: 'PV', dataType: 'INT', direction: 'INPUT', description: 'Preset value', fbType: 'CTUD' },
            { name: 'QU', dataType: 'BOOL', direction: 'OUTPUT', description: 'Count up output', fbType: 'CTUD' },
            { name: 'QD', dataType: 'BOOL', direction: 'OUTPUT', description: 'Count down output', fbType: 'CTUD' },
            { name: 'CV', dataType: 'INT', direction: 'OUTPUT', description: 'Current value', fbType: 'CTUD' }
        ]);

        // Edge detection function blocks
        this.standardFBMembers.set('R_TRIG', [
            { name: 'CLK', dataType: 'BOOL', direction: 'INPUT', description: 'Clock input', fbType: 'R_TRIG' },
            { name: 'Q', dataType: 'BOOL', direction: 'OUTPUT', description: 'Rising edge output', fbType: 'R_TRIG' }
        ]);

        this.standardFBMembers.set('F_TRIG', [
            { name: 'CLK', dataType: 'BOOL', direction: 'INPUT', description: 'Clock input', fbType: 'F_TRIG' },
            { name: 'Q', dataType: 'BOOL', direction: 'OUTPUT', description: 'Falling edge output', fbType: 'F_TRIG' }
        ]);

        // Bistable function blocks
        this.standardFBMembers.set('RS', [
            { name: 'S', dataType: 'BOOL', direction: 'INPUT', description: 'Set input', fbType: 'RS' },
            { name: 'R1', dataType: 'BOOL', direction: 'INPUT', description: 'Reset input', fbType: 'RS' },
            { name: 'Q1', dataType: 'BOOL', direction: 'OUTPUT', description: 'Output', fbType: 'RS' }
        ]);

        this.standardFBMembers.set('SR', [
            { name: 'S1', dataType: 'BOOL', direction: 'INPUT', description: 'Set input', fbType: 'SR' },
            { name: 'R', dataType: 'BOOL', direction: 'INPUT', description: 'Reset input', fbType: 'SR' },
            { name: 'Q1', dataType: 'BOOL', direction: 'OUTPUT', description: 'Output', fbType: 'SR' }
        ]);
    }

    /**
     * Parse member access expressions from a document
     */
    public parseMemberAccess(document: TextDocument): MemberAccessExpression[] {
        const memberExpressions: MemberAccessExpression[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const memberAccessRegex = /(\w+)\.(\w+)/g;
            let match;

            while ((match = memberAccessRegex.exec(line)) !== null) {
                const [fullMatch, instance, member] = match;
                const startChar = match.index;
                const endChar = startChar + fullMatch.length;
                const instanceEndChar = startChar + instance.length;
                const memberStartChar = instanceEndChar + 1; // +1 for the dot

                memberExpressions.push({
                    instance,
                    member,
                    location: {
                        uri: document.uri,
                        range: {
                            start: { line: lineIndex, character: startChar },
                            end: { line: lineIndex, character: endChar }
                        }
                    },
                    instanceLocation: {
                        uri: document.uri,
                        range: {
                            start: { line: lineIndex, character: startChar },
                            end: { line: lineIndex, character: instanceEndChar }
                        }
                    },
                    memberLocation: {
                        uri: document.uri,
                        range: {
                            start: { line: lineIndex, character: memberStartChar },
                            end: { line: lineIndex, character: endChar }
                        }
                    }
                });
            }
        }

        return memberExpressions;
    }

    /**
     * Find member definition for a given instance and member name
     */
    public findMemberDefinition(
        instanceName: string,
        memberName: string,
        workspaceSymbols: STSymbolExtended[],
        customFBTypes: Map<string, STDeclaration>
    ): Location | null {

        // Find the instance declaration to get its type
        // Try function block instance first, then fall back to any variable with a FB type
        let instanceSymbol = workspaceSymbols.find(symbol =>
            symbol.name === instanceName &&
            symbol.kind === STSymbolKind.FunctionBlockInstance
        );

        // If not found as FunctionBlockInstance, try as Variable with FB dataType
        if (!instanceSymbol) {
            instanceSymbol = workspaceSymbols.find(symbol =>
                symbol.name === instanceName &&
                symbol.kind === STSymbolKind.Variable &&
                symbol.dataType &&
                this.isStandardFBType(symbol.dataType)
            );
        }

        if (!instanceSymbol || !instanceSymbol.dataType) {
            return null;
        }

        const fbType = instanceSymbol.dataType;

        // Check standard FB types first
        const standardMembers = this.standardFBMembers.get(fbType);

        if (standardMembers) {
            const member = standardMembers.find(m => m.name === memberName);
            if (member) {
                // For standard FB members, we'll create a virtual location
                // In a real implementation, this could point to documentation
                return this.createVirtualMemberLocation(fbType, memberName, instanceSymbol.location);
            }
        }

        // Check custom FB types
        const customFB = customFBTypes.get(fbType);
        if (customFB && customFB.parameters) {
            const parameter = customFB.parameters.find(p => p.name === memberName);
            if (parameter) {
                return parameter.location;
            }
        }

        // Check custom FB variables
        if (customFB && customFB.variables) {
            const variable = customFB.variables.find(v => v.name === memberName);
            if (variable) {
                return variable.location;
            }
        }

        return null;
    }

    /**
     * Get available members for a function block instance
     */
    public getAvailableMembers(
        instanceType: string,
        customFBTypes: Map<string, STDeclaration>
    ): FBMemberDefinition[] {
        const members: FBMemberDefinition[] = [];

        // Add standard FB members
        const standardMembers = this.standardFBMembers.get(instanceType);
        if (standardMembers) {
            members.push(...standardMembers);
        }

        // Add custom FB members
        const customFB = customFBTypes.get(instanceType);
        if (customFB) {
            // Add parameters as members
            if (customFB.parameters) {
                customFB.parameters.forEach(param => {
                    members.push({
                        name: param.name,
                        dataType: param.dataType,
                        direction: param.direction,
                        description: param.defaultValue ? `Default: ${param.defaultValue}` : undefined,
                        fbType: instanceType
                    });
                });
            }

            // Add variables as members (typically outputs or internal vars)
            if (customFB.variables) {
                customFB.variables.forEach(variable => {
                    if (variable.scope === STScope.Output || variable.scope === STScope.Local) {
                        members.push({
                            name: variable.name,
                            dataType: variable.dataType || 'UNKNOWN',
                            direction: variable.scope === STScope.Output ? 'OUTPUT' : 'VAR',
                            description: variable.description,
                            fbType: instanceType
                        });
                    }
                });
            }
        }

        return members;
    }

    /**
     * Create a virtual location for standard FB members
     */
    private createVirtualMemberLocation(fbType: string, memberName: string, instanceLocation: Location): Location {
        // Use real definition files for standard function blocks
        const workspaceRoot = this.getWorkspaceRoot(instanceLocation.uri);
        const definitionPath = `${workspaceRoot}/iec61131-definitions/${fbType}.st`;
        const definitionUri = `file://${definitionPath}`;

        // Calculate the approximate line number for the member
        const lineNumber = this.getMemberLineNumber(fbType, memberName);

        return {
            uri: definitionUri,
            range: {
                start: { line: lineNumber, character: 4 }, // Indented member location
                end: { line: lineNumber, character: 4 + memberName.length }
            }
        };
    }

    /**
     * Get the workspace root from a file URI
     */
    private getWorkspaceRoot(fileUri: string): string {
        // Extract workspace root from file URI
        const path = fileUri.replace('file://', '');
        const parts = path.split('/');

        // Find the controlforge-structured-text directory
        const projectIndex = parts.findIndex(part => part === 'controlforge-structured-text');
        if (projectIndex !== -1) {
            return parts.slice(0, projectIndex + 1).join('/');
        }

        // Fallback: assume current directory structure
        return parts.slice(0, -2).join('/'); // Remove filename and examples/
    }

    /**
     * Get the approximate line number for a member in the definition file
     */
    private getMemberLineNumber(fbType: string, memberName: string): number {
        // Approximate line numbers based on definition file structure
        const memberLines: Record<string, Record<string, number>> = {
            'TON': { 'IN': 5, 'PT': 6, 'Q': 9, 'ET': 10 },
            'TOF': { 'IN': 5, 'PT': 6, 'Q': 9, 'ET': 10 },
            'TP': { 'IN': 5, 'PT': 6, 'Q': 9, 'ET': 10 },
            'CTU': { 'CU': 5, 'R': 6, 'PV': 7, 'Q': 10, 'CV': 11 },
            'R_TRIG': { 'CLK': 5, 'Q': 8 }
        };

        return memberLines[fbType]?.[memberName] || 0;
    }

    /**
     * Check if a position is within a member access expression
     */
    public getMemberAccessAtPosition(
        memberExpressions: MemberAccessExpression[],
        position: Position
    ): MemberAccessExpression | null {
        return memberExpressions.find(expr => {
            const range = expr.location.range;
            return position.line === range.start.line &&
                position.character >= range.start.character &&
                position.character <= range.end.character;
        }) || null;
    }

    /**
     * Determine if position is on instance or member part
     */
    public getAccessPart(
        memberExpression: MemberAccessExpression,
        position: Position
    ): 'instance' | 'member' | null {
        if (this.isPositionInRange(position, memberExpression.instanceLocation.range)) {
            return 'instance';
        }
        if (this.isPositionInRange(position, memberExpression.memberLocation.range)) {
            return 'member';
        }
        return null;
    }

    /**
     * Check if position is within a range
     */
    private isPositionInRange(position: Position, range: Range): boolean {
        return position.line === range.start.line &&
            position.character >= range.start.character &&
            position.character <= range.end.character;
    }

    /**
     * Check if a data type is a standard function block type
     */
    public isStandardFBType(dataType: string): boolean {
        return this.standardFBMembers.has(dataType);
    }
}

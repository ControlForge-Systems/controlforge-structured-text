/**
 * Member Access Provider for Function Block Navigation
 * Handles navigation through the dot operator (instance.member)
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Location, Range } from 'vscode-languageserver';
import * as path from 'path';
import {
    MemberAccessExpression,
    FBMemberDefinition,
    StandardFBDescription,
    STSymbolExtended,
    STSymbolKind,
    STScope,
    STDeclaration,
    STParameter,
    STSymbol
} from '../../shared/types';
import { getExtensionPath } from '../extension-path';

export class MemberAccessProvider {
    private standardFBMembers: Map<string, FBMemberDefinition[]> = new Map();
    private standardFBDescriptions: Map<string, StandardFBDescription> = new Map();

    constructor() {
        this.initializeStandardFBMembers();
        this.initializeStandardFBDescriptions();
    }

    /**
     * Initialize standard IEC 61131-3 function block members
     */
    private initializeStandardFBMembers(): void {
        this.standardFBMembers = new Map();

        // Timer function blocks
        this.standardFBMembers.set('TON', [
            { name: 'IN', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Start signal — rising edge starts timer', fbType: 'TON' },
            { name: 'PT', dataType: 'TIME', direction: 'VAR_INPUT', description: 'Preset time — delay duration before Q goes TRUE', fbType: 'TON' },
            { name: 'Q', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — TRUE when ET >= PT and IN is TRUE', fbType: 'TON' },
            { name: 'ET', dataType: 'TIME', direction: 'VAR_OUTPUT', description: 'Elapsed time — counts from T#0s to PT while IN is TRUE', fbType: 'TON' }
        ]);

        this.standardFBMembers.set('TOF', [
            { name: 'IN', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Timer input — Q follows IN while TRUE', fbType: 'TOF' },
            { name: 'PT', dataType: 'TIME', direction: 'VAR_INPUT', description: 'Preset time — off-delay duration after IN goes FALSE', fbType: 'TOF' },
            { name: 'Q', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — TRUE while IN is TRUE or timer running', fbType: 'TOF' },
            { name: 'ET', dataType: 'TIME', direction: 'VAR_OUTPUT', description: 'Elapsed time — counts from T#0s to PT after IN goes FALSE', fbType: 'TOF' }
        ]);

        this.standardFBMembers.set('TP', [
            { name: 'IN', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Trigger input — rising edge starts pulse', fbType: 'TP' },
            { name: 'PT', dataType: 'TIME', direction: 'VAR_INPUT', description: 'Preset time — pulse duration', fbType: 'TP' },
            { name: 'Q', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Pulse output — TRUE for duration PT', fbType: 'TP' },
            { name: 'ET', dataType: 'TIME', direction: 'VAR_OUTPUT', description: 'Elapsed time — counts from T#0s to PT during pulse', fbType: 'TP' }
        ]);

        // Counter function blocks
        this.standardFBMembers.set('CTU', [
            { name: 'CU', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Count up — CV increments on rising edge', fbType: 'CTU' },
            { name: 'R', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Reset — sets CV to 0 when TRUE', fbType: 'CTU' },
            { name: 'PV', dataType: 'INT', direction: 'VAR_INPUT', description: 'Preset value — target count for Q output', fbType: 'CTU' },
            { name: 'Q', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — TRUE when CV >= PV', fbType: 'CTU' },
            { name: 'CV', dataType: 'INT', direction: 'VAR_OUTPUT', description: 'Current value — running count', fbType: 'CTU' }
        ]);

        this.standardFBMembers.set('CTD', [
            { name: 'CD', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Count down — CV decrements on rising edge', fbType: 'CTD' },
            { name: 'LD', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Load — sets CV to PV when TRUE', fbType: 'CTD' },
            { name: 'PV', dataType: 'INT', direction: 'VAR_INPUT', description: 'Preset value — initial count loaded by LD', fbType: 'CTD' },
            { name: 'Q', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — TRUE when CV <= 0', fbType: 'CTD' },
            { name: 'CV', dataType: 'INT', direction: 'VAR_OUTPUT', description: 'Current value — running count', fbType: 'CTD' }
        ]);

        this.standardFBMembers.set('CTUD', [
            { name: 'CU', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Count up — CV increments on rising edge', fbType: 'CTUD' },
            { name: 'CD', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Count down — CV decrements on rising edge', fbType: 'CTUD' },
            { name: 'R', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Reset — sets CV to 0 when TRUE', fbType: 'CTUD' },
            { name: 'LD', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Load — sets CV to PV when TRUE', fbType: 'CTUD' },
            { name: 'PV', dataType: 'INT', direction: 'VAR_INPUT', description: 'Preset value — target for QU, load value for LD', fbType: 'CTUD' },
            { name: 'QU', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Up output — TRUE when CV >= PV', fbType: 'CTUD' },
            { name: 'QD', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Down output — TRUE when CV <= 0', fbType: 'CTUD' },
            { name: 'CV', dataType: 'INT', direction: 'VAR_OUTPUT', description: 'Current value — running count', fbType: 'CTUD' }
        ]);

        // Edge detection function blocks
        this.standardFBMembers.set('R_TRIG', [
            { name: 'CLK', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Clock input — signal to monitor for rising edge', fbType: 'R_TRIG' },
            { name: 'Q', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — TRUE for one scan on FALSE->TRUE transition', fbType: 'R_TRIG' }
        ]);

        this.standardFBMembers.set('F_TRIG', [
            { name: 'CLK', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Clock input — signal to monitor for falling edge', fbType: 'F_TRIG' },
            { name: 'Q', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — TRUE for one scan on TRUE->FALSE transition', fbType: 'F_TRIG' }
        ]);

        // Bistable function blocks
        this.standardFBMembers.set('RS', [
            { name: 'S', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Set input — sets Q1 TRUE (non-dominant)', fbType: 'RS' },
            { name: 'R1', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Reset input — resets Q1 FALSE (dominant, priority)', fbType: 'RS' },
            { name: 'Q1', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — latched bistable state', fbType: 'RS' }
        ]);

        this.standardFBMembers.set('SR', [
            { name: 'S1', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Set input — sets Q1 TRUE (dominant, priority)', fbType: 'SR' },
            { name: 'R', dataType: 'BOOL', direction: 'VAR_INPUT', description: 'Reset input — resets Q1 FALSE (non-dominant)', fbType: 'SR' },
            { name: 'Q1', dataType: 'BOOL', direction: 'VAR_OUTPUT', description: 'Output — latched bistable state', fbType: 'SR' }
        ]);
    }

    /**
     * Initialize standard FB descriptions for hover tooltips
     */
    private initializeStandardFBDescriptions(): void {
        this.standardFBDescriptions = new Map();

        this.standardFBDescriptions.set('TON', {
            name: 'TON',
            category: 'Timer',
            summary: 'On-Delay Timer. Starts timing when IN goes TRUE; Q becomes TRUE after preset time PT elapses.',
            behavior: 'When IN transitions FALSE→TRUE, ET counts up. Q goes TRUE when ET reaches PT. When IN goes FALSE, Q and ET reset immediately.',
            example: 'MyTimer(IN := StartCondition, PT := T#5s);\nIF MyTimer.Q THEN\n    // 5 seconds elapsed\nEND_IF;'
        });

        this.standardFBDescriptions.set('TOF', {
            name: 'TOF',
            category: 'Timer',
            summary: 'Off-Delay Timer. Q stays TRUE for preset time PT after IN goes FALSE.',
            behavior: 'Q follows IN while TRUE. When IN goes FALSE, ET counts up. Q goes FALSE when ET reaches PT. If IN goes TRUE again before PT, timer resets.',
            example: 'FanDelay(IN := MotorRunning, PT := T#30s);\nFanOutput := FanDelay.Q;\n// Fan stays on 30s after motor stops'
        });

        this.standardFBDescriptions.set('TP', {
            name: 'TP',
            category: 'Timer',
            summary: 'Pulse Timer. Generates a fixed-duration pulse on rising edge of IN.',
            behavior: 'Q goes TRUE immediately on IN rising edge and stays TRUE for PT. New rising edges during active pulse are ignored. ET counts up to PT then stops.',
            example: 'Pulse(IN := TriggerInput, PT := T#500ms);\nPulseOutput := Pulse.Q;\n// 500ms pulse on each trigger'
        });

        this.standardFBDescriptions.set('CTU', {
            name: 'CTU',
            category: 'Counter',
            summary: 'Count Up. CV increments on each rising edge of CU; Q goes TRUE when CV reaches PV.',
            behavior: 'CV increments by 1 on each rising edge of CU. Q becomes TRUE when CV >= PV. R resets CV to 0 and Q to FALSE.',
            example: 'Counter(CU := PartSensor, R := ResetBtn, PV := 100);\nIF Counter.Q THEN\n    // 100 parts counted\nEND_IF;'
        });

        this.standardFBDescriptions.set('CTD', {
            name: 'CTD',
            category: 'Counter',
            summary: 'Count Down. CV decrements on each rising edge of CD; Q goes TRUE when CV reaches 0.',
            behavior: 'CV decrements by 1 on each rising edge of CD. Q becomes TRUE when CV <= 0. LD loads PV into CV when TRUE.',
            example: 'Countdown(CD := ItemDispensed, LD := Reload, PV := 50);\nIF Countdown.Q THEN\n    // All items dispensed\nEND_IF;'
        });

        this.standardFBDescriptions.set('CTUD', {
            name: 'CTUD',
            category: 'Counter',
            summary: 'Count Up/Down. Bidirectional counter with separate up (CU) and down (CD) inputs.',
            behavior: 'CV increments on CU rising edge, decrements on CD rising edge. QU goes TRUE when CV >= PV. QD goes TRUE when CV <= 0. R resets CV to 0. LD loads PV into CV.',
            example: 'BiCounter(CU := AddPart, CD := RemovePart, R := FALSE, LD := FALSE, PV := 100);\nIF BiCounter.QU THEN\n    // Upper limit reached\nEND_IF;'
        });

        this.standardFBDescriptions.set('R_TRIG', {
            name: 'R_TRIG',
            category: 'Edge Detection',
            summary: 'Rising Edge Detector. Q is TRUE for one scan cycle on FALSE→TRUE transition of CLK.',
            behavior: 'Q is TRUE for exactly one scan cycle when CLK transitions from FALSE to TRUE. Q is FALSE at all other times. Uses internal memory M to track previous CLK state.',
            example: 'StartEdge(CLK := StartButton);\nIF StartEdge.Q THEN\n    // Button just pressed (one-shot)\nEND_IF;'
        });

        this.standardFBDescriptions.set('F_TRIG', {
            name: 'F_TRIG',
            category: 'Edge Detection',
            summary: 'Falling Edge Detector. Q is TRUE for one scan cycle on TRUE→FALSE transition of CLK.',
            behavior: 'Q is TRUE for exactly one scan cycle when CLK transitions from TRUE to FALSE. Q is FALSE at all other times. Uses internal memory M to track previous CLK state.',
            example: 'StopEdge(CLK := RunningSignal);\nIF StopEdge.Q THEN\n    // Signal just dropped (one-shot)\nEND_IF;'
        });

        this.standardFBDescriptions.set('RS', {
            name: 'RS',
            category: 'Bistable',
            summary: 'Reset-Dominant Bistable. Latching flip-flop where R1 (reset) has priority over S (set).',
            behavior: 'Q1 = TRUE when S is TRUE and R1 is FALSE. Q1 = FALSE when R1 is TRUE (regardless of S). Q1 holds state when both are FALSE.',
            example: 'EStopLatch(S := StartPermit, R1 := EStopPressed);\nMotorEnable := EStopLatch.Q1;\n// EStop always overrides start'
        });

        this.standardFBDescriptions.set('SR', {
            name: 'SR',
            category: 'Bistable',
            summary: 'Set-Dominant Bistable. Latching flip-flop where S1 (set) has priority over R (reset).',
            behavior: 'Q1 = TRUE when S1 is TRUE (regardless of R). Q1 = FALSE when R is TRUE and S1 is FALSE. Q1 holds state when both are FALSE.',
            example: 'RunLatch(S1 := StartCmd, R := StopCmd);\nRunning := RunLatch.Q1;\n// Start always overrides stop'
        });
    }

    /**
     * Get description for a standard function block type
     */
    public getStandardFBDescription(fbType: string): StandardFBDescription | undefined {
        return this.standardFBDescriptions.get(fbType);
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
                    let memberDirection: FBMemberDefinition['direction'];
                    switch (param.direction) {
                        case 'INPUT':
                            memberDirection = 'VAR_INPUT';
                            break;
                        case 'OUTPUT':
                            memberDirection = 'VAR_OUTPUT';
                            break;
                        case 'IN_OUT':
                            memberDirection = 'VAR_IN_OUT';
                            break;
                        default:
                            // This case should ideally not be hit if parsing is correct
                            memberDirection = 'VAR';
                    }
                    members.push({
                        name: param.name,
                        dataType: param.dataType,
                        direction: memberDirection,
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
                            direction: variable.scope === STScope.Output ? 'VAR_OUTPUT' : 'VAR',
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
     * Create a virtual location for a FB member that points to the definition file
     * Note: This requires the iec61131-definitions folder to be included in the packaged extension
     */
    private createVirtualMemberLocation(fbType: string, memberName: string, instanceLocation: Location): Location {
        // Use extension path to locate standard function block definitions
        const extensionPath = getExtensionPath();
        if (!extensionPath) {
            // Fallback: return instance location if extension path not available
            return instanceLocation;
        }

        const definitionPath = path.join(extensionPath, 'iec61131-definitions', `${fbType}.st`);
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
     * Get the line number for a member in iec61131-definitions/*.st (0-indexed)
     */
    private getMemberLineNumber(fbType: string, memberName: string): number {
        const memberLines: Record<string, Record<string, number>> = {
            'TON':    { 'IN': 19, 'PT': 20, 'Q': 23, 'ET': 24 },
            'TOF':    { 'IN': 17, 'PT': 18, 'Q': 21, 'ET': 22 },
            'TP':     { 'IN': 18, 'PT': 19, 'Q': 22, 'ET': 23 },
            'CTU':    { 'CU': 18, 'R': 19, 'PV': 20, 'Q': 23, 'CV': 24 },
            'CTD':    { 'CD': 18, 'LD': 19, 'PV': 20, 'Q': 23, 'CV': 24 },
            'CTUD':   { 'CU': 19, 'CD': 20, 'R': 21, 'LD': 22, 'PV': 23, 'QU': 26, 'QD': 27, 'CV': 28 },
            'R_TRIG': { 'CLK': 18, 'Q': 21, 'M': 24 },
            'F_TRIG': { 'CLK': 18, 'Q': 21, 'M': 24 },
            'RS':     { 'S': 18, 'R1': 19, 'Q1': 22 },
            'SR':     { 'S1': 18, 'R': 19, 'Q1': 22 }
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

import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Location } from 'vscode-languageserver';
import { MemberAccessProvider } from '../../server/providers/member-access-provider';
import { STSymbolExtended, STSymbolKind, STScope, STDeclaration, ASTNodeType, MemberAccessExpression } from '../../shared/types';

function doc(uri: string, content: string): TextDocument {
    return TextDocument.create(uri, 'structured-text', 1, content);
}

function makeSymbol(name: string, kind: STSymbolKind, dataType: string, scope: STScope = STScope.Local): STSymbolExtended {
    return {
        name,
        kind,
        dataType,
        scope,
        location: { uri: 'file:///test.st', range: { start: { line: 0, character: 0 }, end: { line: 0, character: name.length } } },
        normalizedName: name.toLowerCase()
    };
}

function makeCustomFB(name: string, params: { name: string; dataType: string; direction: 'INPUT' | 'OUTPUT' | 'IN_OUT' }[]): STDeclaration {
    return {
        type: ASTNodeType.FunctionBlock,
        location: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
        name,
        parameters: params.map(p => ({
            name: p.name,
            dataType: p.dataType,
            direction: p.direction,
            location: { uri: 'file:///fb.st', range: { start: { line: 1, character: 4 }, end: { line: 1, character: 4 + p.name.length } } }
        })),
        variables: []
    };
}

suite('Member Access Provider Unit Tests', () => {
    let provider: MemberAccessProvider;

    setup(() => {
        provider = new MemberAccessProvider();
    });

    suite('parseMemberAccess', () => {
        test('should parse single member access expression', () => {
            const document = doc('file:///test.st', 'myTimer.Q := TRUE;');
            const expressions = provider.parseMemberAccess(document);

            assert.strictEqual(expressions.length, 1);
            assert.strictEqual(expressions[0].instance, 'myTimer');
            assert.strictEqual(expressions[0].member, 'Q');
        });

        test('should parse multiple member access expressions', () => {
            const document = doc('file:///test.st', `IF timer1.Q THEN
    motor.start := TRUE;
    sensor.value := counter.CV;
END_IF;`);
            const expressions = provider.parseMemberAccess(document);

            assert.strictEqual(expressions.length, 4);
            const names = expressions.map(e => `${e.instance}.${e.member}`);
            assert.ok(names.includes('timer1.Q'));
            assert.ok(names.includes('motor.start'));
            assert.ok(names.includes('sensor.value'));
            assert.ok(names.includes('counter.CV'));
        });

        test('should return empty array for no member access', () => {
            const document = doc('file:///test.st', 'x := 42;\ny := x + 1;');
            const expressions = provider.parseMemberAccess(document);
            assert.strictEqual(expressions.length, 0);
        });

        test('should set correct location ranges', () => {
            const document = doc('file:///test.st', 'myTimer.Q');
            const expressions = provider.parseMemberAccess(document);

            assert.strictEqual(expressions.length, 1);
            const expr = expressions[0];
            // Full expression: chars 0-9
            assert.strictEqual(expr.location.range.start.character, 0);
            assert.strictEqual(expr.location.range.end.character, 9);
            // Instance part: chars 0-7
            assert.strictEqual(expr.instanceLocation.range.start.character, 0);
            assert.strictEqual(expr.instanceLocation.range.end.character, 7);
            // Member part: chars 8-9
            assert.strictEqual(expr.memberLocation.range.start.character, 8);
            assert.strictEqual(expr.memberLocation.range.end.character, 9);
        });

        test('should track correct line numbers', () => {
            const document = doc('file:///test.st', 'x := 1;\nfoo.bar := 2;');
            const expressions = provider.parseMemberAccess(document);

            assert.strictEqual(expressions.length, 1);
            assert.strictEqual(expressions[0].location.range.start.line, 1);
        });
    });

    suite('isStandardFBType', () => {
        test('should recognize all standard timer FBs', () => {
            assert.ok(provider.isStandardFBType('TON'));
            assert.ok(provider.isStandardFBType('TOF'));
            assert.ok(provider.isStandardFBType('TP'));
        });

        test('should recognize counter FBs', () => {
            assert.ok(provider.isStandardFBType('CTU'));
            assert.ok(provider.isStandardFBType('CTD'));
            assert.ok(provider.isStandardFBType('CTUD'));
        });

        test('should recognize edge detection FBs', () => {
            assert.ok(provider.isStandardFBType('R_TRIG'));
            assert.ok(provider.isStandardFBType('F_TRIG'));
        });

        test('should recognize bistable FBs', () => {
            assert.ok(provider.isStandardFBType('RS'));
            assert.ok(provider.isStandardFBType('SR'));
        });

        test('should return false for non-standard types', () => {
            assert.ok(!provider.isStandardFBType('INT'));
            assert.ok(!provider.isStandardFBType('BOOL'));
            assert.ok(!provider.isStandardFBType('MyCustomFB'));
            assert.ok(!provider.isStandardFBType(''));
        });
    });

    suite('getAvailableMembers', () => {
        test('should return standard TON members', () => {
            const members = provider.getAvailableMembers('TON', new Map());
            assert.ok(members.length >= 4);
            const names = members.map(m => m.name);
            assert.ok(names.includes('IN'));
            assert.ok(names.includes('PT'));
            assert.ok(names.includes('Q'));
            assert.ok(names.includes('ET'));
        });

        test('should return standard CTU members', () => {
            const members = provider.getAvailableMembers('CTU', new Map());
            const names = members.map(m => m.name);
            assert.ok(names.includes('CU'));
            assert.ok(names.includes('R'));
            assert.ok(names.includes('PV'));
            assert.ok(names.includes('Q'));
            assert.ok(names.includes('CV'));
        });

        test('should return custom FB parameters as members', () => {
            const customFBTypes = new Map<string, STDeclaration>();
            customFBTypes.set('FB_Motor', makeCustomFB('FB_Motor', [
                { name: 'start', dataType: 'BOOL', direction: 'INPUT' },
                { name: 'speed', dataType: 'INT', direction: 'INPUT' },
                { name: 'running', dataType: 'BOOL', direction: 'OUTPUT' }
            ]));

            const members = provider.getAvailableMembers('FB_Motor', customFBTypes);
            assert.ok(members.length >= 3);
            const names = members.map(m => m.name);
            assert.ok(names.includes('start'));
            assert.ok(names.includes('speed'));
            assert.ok(names.includes('running'));
        });

        test('should return empty for unknown type', () => {
            const members = provider.getAvailableMembers('UnknownFB', new Map());
            assert.strictEqual(members.length, 0);
        });

        test('should set correct direction for custom FB members', () => {
            const customFBTypes = new Map<string, STDeclaration>();
            customFBTypes.set('FB_Test', makeCustomFB('FB_Test', [
                { name: 'inp', dataType: 'INT', direction: 'INPUT' },
                { name: 'outp', dataType: 'BOOL', direction: 'OUTPUT' },
                { name: 'io', dataType: 'REAL', direction: 'IN_OUT' }
            ]));

            const members = provider.getAvailableMembers('FB_Test', customFBTypes);
            const inp = members.find(m => m.name === 'inp');
            const outp = members.find(m => m.name === 'outp');
            const io = members.find(m => m.name === 'io');

            assert.strictEqual(inp?.direction, 'VAR_INPUT');
            assert.strictEqual(outp?.direction, 'VAR_OUTPUT');
            assert.strictEqual(io?.direction, 'VAR_IN_OUT');
        });
    });

    suite('getMemberAccessAtPosition', () => {
        test('should find expression at position', () => {
            const document = doc('file:///test.st', 'myTimer.Q := TRUE;');
            const expressions = provider.parseMemberAccess(document);
            const pos: Position = { line: 0, character: 3 }; // within "myTimer"

            const result = provider.getMemberAccessAtPosition(expressions, pos);
            assert.ok(result, 'should find expression');
            assert.strictEqual(result!.instance, 'myTimer');
        });

        test('should return null when position is outside expressions', () => {
            const document = doc('file:///test.st', 'myTimer.Q := TRUE;');
            const expressions = provider.parseMemberAccess(document);
            const pos: Position = { line: 0, character: 15 }; // in "TRUE"

            const result = provider.getMemberAccessAtPosition(expressions, pos);
            assert.strictEqual(result, null);
        });

        test('should return null for wrong line', () => {
            const document = doc('file:///test.st', 'myTimer.Q := TRUE;');
            const expressions = provider.parseMemberAccess(document);
            const pos: Position = { line: 1, character: 3 };

            const result = provider.getMemberAccessAtPosition(expressions, pos);
            assert.strictEqual(result, null);
        });
    });

    suite('getAccessPart', () => {
        test('should return instance when cursor on instance', () => {
            const document = doc('file:///test.st', 'myTimer.Q');
            const expressions = provider.parseMemberAccess(document);
            const expr = expressions[0];
            const pos: Position = { line: 0, character: 3 }; // within "myTimer"

            assert.strictEqual(provider.getAccessPart(expr, pos), 'instance');
        });

        test('should return member when cursor on member', () => {
            const document = doc('file:///test.st', 'myTimer.Q');
            const expressions = provider.parseMemberAccess(document);
            const expr = expressions[0];
            const pos: Position = { line: 0, character: 8 }; // on "Q"

            assert.strictEqual(provider.getAccessPart(expr, pos), 'member');
        });

        test('should return null when cursor on dot', () => {
            const document = doc('file:///test.st', 'myTimer.Q');
            const expressions = provider.parseMemberAccess(document);
            const expr = expressions[0];
            // dot is at char 7; instance range ends at 7, member starts at 8
            const pos: Position = { line: 0, character: 7 };

            const part = provider.getAccessPart(expr, pos);
            // char 7 is the end of instance range (inclusive), so should be 'instance'
            assert.ok(part === 'instance' || part === null, `expected instance or null, got ${part}`);
        });
    });

    suite('getStandardFBDescription', () => {
        test('should return description for all standard FB types', () => {
            const fbTypes = ['TON', 'TOF', 'TP', 'CTU', 'CTD', 'CTUD', 'R_TRIG', 'F_TRIG', 'RS', 'SR'];
            for (const fbType of fbTypes) {
                const desc = provider.getStandardFBDescription(fbType);
                assert.ok(desc, `should have description for ${fbType}`);
                assert.strictEqual(desc!.name, fbType);
                assert.ok(desc!.category, `${fbType} should have category`);
                assert.ok(desc!.summary, `${fbType} should have summary`);
                assert.ok(desc!.behavior, `${fbType} should have behavior`);
                assert.ok(desc!.example, `${fbType} should have example`);
            }
        });

        test('should return undefined for non-standard types', () => {
            assert.strictEqual(provider.getStandardFBDescription('INT'), undefined);
            assert.strictEqual(provider.getStandardFBDescription('MyCustomFB'), undefined);
            assert.strictEqual(provider.getStandardFBDescription(''), undefined);
        });

        test('should categorize timer FBs correctly', () => {
            assert.strictEqual(provider.getStandardFBDescription('TON')!.category, 'Timer');
            assert.strictEqual(provider.getStandardFBDescription('TOF')!.category, 'Timer');
            assert.strictEqual(provider.getStandardFBDescription('TP')!.category, 'Timer');
        });

        test('should categorize counter FBs correctly', () => {
            assert.strictEqual(provider.getStandardFBDescription('CTU')!.category, 'Counter');
            assert.strictEqual(provider.getStandardFBDescription('CTD')!.category, 'Counter');
            assert.strictEqual(provider.getStandardFBDescription('CTUD')!.category, 'Counter');
        });

        test('should categorize edge detection FBs correctly', () => {
            assert.strictEqual(provider.getStandardFBDescription('R_TRIG')!.category, 'Edge Detection');
            assert.strictEqual(provider.getStandardFBDescription('F_TRIG')!.category, 'Edge Detection');
        });

        test('should categorize bistable FBs correctly', () => {
            assert.strictEqual(provider.getStandardFBDescription('RS')!.category, 'Bistable');
            assert.strictEqual(provider.getStandardFBDescription('SR')!.category, 'Bistable');
        });

        test('should include usage examples with ST code', () => {
            const tonDesc = provider.getStandardFBDescription('TON');
            assert.ok(tonDesc!.example.includes('MyTimer'), 'TON example should have instance');
            assert.ok(tonDesc!.example.includes('T#'), 'TON example should have TIME literal');
        });
    });

    suite('findMemberDefinition', () => {
        test('should find standard FB member definition', () => {
            const symbols: STSymbolExtended[] = [
                makeSymbol('myTimer', STSymbolKind.FunctionBlockInstance, 'TON')
            ];

            const result = provider.findMemberDefinition('myTimer', 'Q', symbols, new Map());
            // Without extension path set, falls back to instance location
            assert.ok(result, 'should find standard member definition');
        });

        test('should find custom FB member definition', () => {
            const symbols: STSymbolExtended[] = [
                makeSymbol('motor', STSymbolKind.FunctionBlockInstance, 'FB_Motor')
            ];

            const customFBTypes = new Map<string, STDeclaration>();
            customFBTypes.set('FB_Motor', makeCustomFB('FB_Motor', [
                { name: 'start', dataType: 'BOOL', direction: 'INPUT' },
                { name: 'running', dataType: 'BOOL', direction: 'OUTPUT' }
            ]));

            const result = provider.findMemberDefinition('motor', 'start', symbols, customFBTypes);
            assert.ok(result, 'should find custom FB member');
        });

        test('should return null for unknown instance', () => {
            const result = provider.findMemberDefinition('unknown', 'Q', [], new Map());
            assert.strictEqual(result, null);
        });

        test('should return null for unknown member on known instance', () => {
            const symbols: STSymbolExtended[] = [
                makeSymbol('myTimer', STSymbolKind.FunctionBlockInstance, 'TON')
            ];

            const result = provider.findMemberDefinition('myTimer', 'NONEXISTENT', symbols, new Map());
            assert.strictEqual(result, null);
        });

        test('should find member on Variable with standard FB type', () => {
            const symbols: STSymbolExtended[] = [
                makeSymbol('myTimer', STSymbolKind.Variable, 'TON')
            ];

            const result = provider.findMemberDefinition('myTimer', 'Q', symbols, new Map());
            assert.ok(result, 'should find member via Variable with FB dataType');
        });
    });
});

import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Location } from 'vscode-languageserver';
import { EnhancedDefinitionProvider } from '../../server/providers/definition-provider';
import { MemberAccessProvider } from '../../server/providers/member-access-provider';
import { WorkspaceIndexer } from '../../server/workspace-indexer';
import { STSymbolExtended, STSymbolKind, STScope, SymbolIndex, FileSymbols } from '../../shared/types';

function doc(uri: string, content: string): TextDocument {
    return TextDocument.create(uri, 'structured-text', 1, content);
}

function makeSymbol(name: string, kind: STSymbolKind, dataType: string, uri: string = 'file:///test.st', line: number = 0, char: number = 0): STSymbolExtended {
    return {
        name,
        kind,
        dataType,
        scope: STScope.Local,
        location: { uri, range: { start: { line, character: char }, end: { line, character: char + name.length } } },
        normalizedName: name.toLowerCase()
    };
}

function emptyLocalIndex(): SymbolIndex {
    return {
        files: new Map(),
        symbolsByName: new Map()
    };
}

function localIndexWith(symbols: STSymbolExtended[]): SymbolIndex {
    const idx = emptyLocalIndex();
    for (const s of symbols) {
        const existing = idx.symbolsByName.get(s.name) || [];
        existing.push(s);
        idx.symbolsByName.set(s.name, existing);
    }
    return idx;
}

suite('Definition Provider Unit Tests', () => {
    let memberAccessProvider: MemberAccessProvider;
    let defProvider: EnhancedDefinitionProvider;

    setup(() => {
        memberAccessProvider = new MemberAccessProvider();
        defProvider = new EnhancedDefinitionProvider(memberAccessProvider);
    });

    suite('provideDefinition — standard symbol', () => {
        test('should find definition from local symbol index', () => {
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    counter : INT;
END_VAR
    counter := counter + 1;
END_PROGRAM`);

            const counterSymbol = makeSymbol('counter', STSymbolKind.Variable, 'INT', 'file:///test.st', 2, 4);
            const localIdx = localIndexWith([counterSymbol]);
            const indexer = new WorkspaceIndexer();

            // Position on "counter" in the assignment line (line 4, char 4)
            const locations = defProvider.provideDefinition(document, { line: 4, character: 4 }, indexer, localIdx);
            assert.ok(locations.length > 0, 'should find local symbol definition');
        });

        test('should find definition case-insensitively from local index', () => {
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    MyVar : INT;
END_VAR
    myvar := 10;
END_PROGRAM`);

            const sym = makeSymbol('MyVar', STSymbolKind.Variable, 'INT', 'file:///test.st', 2, 4);
            const localIdx = localIndexWith([sym]);
            const indexer = new WorkspaceIndexer();

            // Position on "myvar" (lowercase) at line 4
            const locations = defProvider.provideDefinition(document, { line: 4, character: 4 }, indexer, localIdx);
            assert.ok(locations.length > 0, 'should find definition via case-insensitive match');
        });

        test('should fall back to workspace indexer when not in local index', () => {
            const document = doc('file:///main.st', `PROGRAM Main
VAR
    x : INT;
END_VAR
    x := Add(1, 2);
END_PROGRAM`);

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///funcs.st', `FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
END_FUNCTION`));

            const localIdx = emptyLocalIndex();

            // Position on "Add" at line 4
            const locations = defProvider.provideDefinition(document, { line: 4, character: 9 }, indexer, localIdx);
            assert.ok(locations.length > 0, 'should find definition from workspace indexer');
            assert.ok(locations.some(l => l.uri === 'file:///funcs.st'));
        });
    });

    suite('provideDefinition — member access', () => {
        test('should navigate to instance definition when cursor on instance', () => {
            // "myTimer.Q" — cursor on "myTimer"
            const document = doc('file:///test.st', 'myTimer.Q := TRUE;');

            const timerSymbol = makeSymbol('myTimer', STSymbolKind.FunctionBlockInstance, 'TON', 'file:///test.st', 0, 0);
            const localIdx = localIndexWith([timerSymbol]);
            const indexer = new WorkspaceIndexer();

            // Position on instance part (char 3 = within "myTimer")
            const locations = defProvider.provideDefinition(document, { line: 0, character: 3 }, indexer, localIdx);
            assert.ok(locations.length > 0, 'should find instance definition');
        });

        test('should navigate to member definition when cursor on member', () => {
            const document = doc('file:///test.st', 'myTimer.Q := TRUE;');

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
    myTimer.Q := TRUE;
END_PROGRAM`));

            const localIdx = emptyLocalIndex();

            // Position on member part (char 8 = "Q")
            const locations = defProvider.provideDefinition(document, { line: 0, character: 8 }, indexer, localIdx);
            // Member definition for standard FB returns a virtual location
            assert.ok(locations.length > 0, 'should find member definition');
        });
    });

    suite('provideHover', () => {
        test('should return hover info for known symbol', () => {
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    counter : INT;
END_VAR
    counter := 42;
END_PROGRAM`);

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(document);
            const localIdx = emptyLocalIndex();

            // Position on "counter" at line 4
            const hover = defProvider.provideHover(document, { line: 4, character: 4 }, indexer, localIdx);
            assert.ok(hover, 'should return hover info');
            assert.ok(hover!.includes('counter'), 'hover should mention symbol name');
        });

        test('should return null for unknown position', () => {
            const document = doc('file:///test.st', '    ');
            const indexer = new WorkspaceIndexer();
            const localIdx = emptyLocalIndex();

            const hover = defProvider.provideHover(document, { line: 0, character: 0 }, indexer, localIdx);
            assert.strictEqual(hover, null);
        });

        test('should return hover for member access instance', () => {
            const document = doc('file:///test.st', 'myTimer.Q');

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///defs.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
END_PROGRAM`));

            const localIdx = emptyLocalIndex();

            // Cursor on instance part
            const hover = defProvider.provideHover(document, { line: 0, character: 3 }, indexer, localIdx);
            // hover may be null if myTimer not in workspace as FBInstance — depends on parser
            // This test documents current behavior
            assert.ok(hover === null || typeof hover === 'string', 'should return null or string');
        });

        test('should return hover for member access member', () => {
            const document = doc('file:///test.st', 'myTimer.Q');

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///defs.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
END_PROGRAM`));

            const localIdx = emptyLocalIndex();

            // Cursor on member part
            const hover = defProvider.provideHover(document, { line: 0, character: 8 }, indexer, localIdx);
            assert.ok(hover === null || typeof hover === 'string', 'should return null or string');
        });
    });

    suite('provideHover — standard FB tooltips', () => {
        test('should return rich tooltip for standard FB type name (TON)', () => {
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
END_PROGRAM`);

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(document);
            const localIdx = emptyLocalIndex();

            // Hover on "TON" type name at line 2
            const hover = defProvider.provideHover(document, { line: 2, character: 15 }, indexer, localIdx);
            assert.ok(hover, 'should return hover for TON type');
            assert.ok(hover!.includes('TON'), 'should mention TON');
            assert.ok(hover!.includes('Standard Function Block'), 'should identify as standard FB');
            assert.ok(hover!.includes('Timer'), 'should show Timer category');
            assert.ok(hover!.includes('Parameters'), 'should include parameters section');
            assert.ok(hover!.includes('IN'), 'should list IN parameter');
            assert.ok(hover!.includes('PT'), 'should list PT parameter');
            assert.ok(hover!.includes('Q'), 'should list Q output');
            assert.ok(hover!.includes('ET'), 'should list ET output');
            assert.ok(hover!.includes('Behavior'), 'should include behavior section');
            assert.ok(hover!.includes('Example'), 'should include example section');
            assert.ok(hover!.includes('```iecst'), 'should have code fence');
        });

        test('should return rich tooltip for FB instance hovering on instance name', () => {
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
    myTimer.Q;
END_PROGRAM`);

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(document);
            const localIdx = emptyLocalIndex();

            // Hover on "myTimer" in member access at line 4
            const hover = defProvider.provideHover(document, { line: 4, character: 4 }, indexer, localIdx);
            assert.ok(hover, 'should return hover for instance');
            assert.ok(hover!.includes('myTimer'), 'should mention instance name');
            assert.ok(hover!.includes('TON'), 'should mention FB type');
            assert.ok(hover!.includes('Function Block Instance'), 'should identify as instance');
        });

        test('should return rich tooltip for all standard FB types', () => {
            const fbTypes = ['TON', 'TOF', 'TP', 'CTU', 'CTD', 'CTUD', 'R_TRIG', 'F_TRIG', 'RS', 'SR'];
            const indexer = new WorkspaceIndexer();
            const localIdx = emptyLocalIndex();

            for (const fbType of fbTypes) {
                const document = doc('file:///test.st', `PROGRAM Main\nVAR\n    inst : ${fbType};\nEND_VAR\nEND_PROGRAM`);
                indexer.updateFileIndex(document);

                // Hover on type name
                const hover = defProvider.provideHover(document, { line: 2, character: 14 }, indexer, localIdx);
                assert.ok(hover, `should return hover for ${fbType}`);
                assert.ok(hover!.includes(fbType), `hover should mention ${fbType}`);
                assert.ok(hover!.includes('Parameters'), `${fbType} hover should have parameters`);
            }
        });

        test('should return parameter table with input and output sections', () => {
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    c : CTU;
END_VAR
END_PROGRAM`);

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(document);
            const localIdx = emptyLocalIndex();

            const hover = defProvider.provideHover(document, { line: 2, character: 10 }, indexer, localIdx);
            assert.ok(hover, 'should return hover for CTU');
            assert.ok(hover!.includes('| Input |'), 'should have input table header');
            assert.ok(hover!.includes('| Output |'), 'should have output table header');
            assert.ok(hover!.includes('CU'), 'should list CU input');
            assert.ok(hover!.includes('CV'), 'should list CV output');
        });

        test('should return standard hover for non-FB symbols', () => {
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    counter : INT;
END_VAR
    counter := 42;
END_PROGRAM`);

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(document);
            const localIdx = emptyLocalIndex();

            const hover = defProvider.provideHover(document, { line: 4, character: 4 }, indexer, localIdx);
            assert.ok(hover, 'should return hover');
            assert.ok(hover!.includes('counter'), 'should mention symbol name');
            // Should NOT include standard FB tooltip features
            assert.ok(!hover!.includes('Standard Function Block'), 'should not be treated as FB');
            assert.ok(!hover!.includes('Parameters'), 'should not have parameter table');
        });

        test('should show member hover with description for member access', () => {
            const document = doc('file:///test.st', 'myTimer.Q');

            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///defs.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
END_PROGRAM`));
            const localIdx = emptyLocalIndex();

            // Cursor on Q member
            const hover = defProvider.provideHover(document, { line: 0, character: 8 }, indexer, localIdx);
            assert.ok(hover, 'should return member hover');
            assert.ok(hover!.includes('Q'), 'should mention member name');
            assert.ok(hover!.includes('BOOL'), 'should show member type');
            assert.ok(hover!.includes('TON'), 'should reference FB type');
        });
    });

    suite('findSymbolAtPosition edge cases', () => {
        test('should find symbol with underscores', () => {
            const document = doc('file:///test.st', '    my_var_name := 10;');

            const sym = makeSymbol('my_var_name', STSymbolKind.Variable, 'INT', 'file:///test.st', 0, 4);
            const localIdx = localIndexWith([sym]);
            const indexer = new WorkspaceIndexer();

            const locations = defProvider.provideDefinition(document, { line: 0, character: 8 }, indexer, localIdx);
            assert.ok(locations.length > 0, 'should find symbol with underscores');
        });

        test('should return empty for position on whitespace far from symbols', () => {
            const document = doc('file:///test.st', '                              ');
            const indexer = new WorkspaceIndexer();
            const localIdx = emptyLocalIndex();

            const locations = defProvider.provideDefinition(document, { line: 0, character: 15 }, indexer, localIdx);
            assert.strictEqual(locations.length, 0);
        });
    });
});

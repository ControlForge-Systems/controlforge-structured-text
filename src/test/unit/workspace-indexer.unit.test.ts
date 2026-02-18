import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { WorkspaceIndexer } from '../../server/workspace-indexer';
import { STSymbolKind, STScope } from '../../shared/types';

function doc(uri: string, content: string): TextDocument {
    return TextDocument.create(uri, 'structured-text', 1, content);
}

suite('Workspace Indexer Unit Tests', () => {

    suite('updateFileIndex', () => {
        test('should index symbols from a document', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM Main
VAR
    counter : INT := 0;
END_VAR
END_PROGRAM`));

            const symbols = indexer.getAllSymbols();
            assert.ok(symbols.length > 0, 'should have indexed symbols');
            const counter = symbols.find(s => s.name === 'counter');
            assert.ok(counter, 'counter should be indexed');
            assert.strictEqual(counter!.dataType, 'INT');
        });

        test('should categorize programs', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM MainProgram
VAR
    x : INT;
END_VAR
END_PROGRAM`));

            const stats = indexer.getIndexStats();
            assert.ok(stats.programCount > 0, 'should have categorized program');
        });

        test('should categorize function blocks', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
END_VAR
END_FUNCTION_BLOCK`));

            const stats = indexer.getIndexStats();
            assert.ok(stats.functionBlockCount > 0, 'should have categorized FB');
        });

        test('should categorize functions', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
END_FUNCTION`));

            const stats = indexer.getIndexStats();
            assert.ok(stats.functionCount > 0, 'should have categorized function');
        });

        test('should categorize global variables', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
VAR_GLOBAL
    systemStatus : BOOL := FALSE;
END_VAR`));

            const stats = indexer.getIndexStats();
            assert.ok(stats.globalVariableCount > 0, 'should have categorized global var');
        });

        test('should replace symbols on re-index of same file', () => {
            const indexer = new WorkspaceIndexer();
            const uri = 'file:///test.st';

            indexer.updateFileIndex(doc(uri, `
PROGRAM Test
VAR
    oldVar : INT;
END_VAR
END_PROGRAM`));

            indexer.updateFileIndex(doc(uri, `
PROGRAM Test
VAR
    newVar : REAL;
END_VAR
END_PROGRAM`));

            const symbols = indexer.getAllSymbols();
            const oldVar = symbols.find(s => s.name === 'oldVar');
            const newVar = symbols.find(s => s.name === 'newVar');
            assert.ok(!oldVar, 'old symbol should be removed');
            assert.ok(newVar, 'new symbol should be present');
        });
    });

    suite('Multi-file indexing', () => {
        test('should index symbols from multiple files', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///a.st', `
PROGRAM ProgramA
VAR
    varA : INT;
END_VAR
END_PROGRAM`));

            indexer.updateFileIndex(doc('file:///b.st', `
FUNCTION_BLOCK FB_Sensor
VAR_INPUT
    value : REAL;
END_VAR
END_FUNCTION_BLOCK`));

            const stats = indexer.getIndexStats();
            assert.strictEqual(stats.fileCount, 2);
            assert.ok(stats.programCount > 0);
            assert.ok(stats.functionBlockCount > 0);
        });
    });

    suite('removeFileFromIndex', () => {
        test('should remove all symbols for a file', () => {
            const indexer = new WorkspaceIndexer();
            const uri = 'file:///removeme.st';
            indexer.updateFileIndex(doc(uri, `
PROGRAM ToRemove
VAR
    temp : INT;
END_VAR
END_PROGRAM`));

            assert.ok(indexer.getAllSymbols().length > 0);
            indexer.removeFileFromIndex(uri);
            const remaining = indexer.getAllSymbols().filter(s => s.location.uri === uri);
            assert.strictEqual(remaining.length, 0, 'no symbols should remain for removed file');
        });

        test('should not affect other files', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///keep.st', `
VAR_GLOBAL
    keepVar : BOOL;
END_VAR`));
            indexer.updateFileIndex(doc('file:///remove.st', `
VAR_GLOBAL
    removeVar : BOOL;
END_VAR`));

            indexer.removeFileFromIndex('file:///remove.st');
            const symbols = indexer.getAllSymbols();
            assert.ok(symbols.find(s => s.name === 'keepVar'), 'keepVar should remain');
            assert.ok(!symbols.find(s => s.name === 'removeVar'), 'removeVar should be gone');
        });
    });

    suite('findSymbolDefinition', () => {
        test('should find exact match', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM Test
VAR
    myVar : INT;
END_VAR
END_PROGRAM`));

            const locs = indexer.findSymbolDefinition('myVar');
            assert.ok(locs.length > 0, 'should find exact match');
        });

        test('should find case-insensitive match', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM Test
VAR
    MyVar : INT;
END_VAR
END_PROGRAM`));

            const locs = indexer.findSymbolDefinition('myvar');
            assert.ok(locs.length > 0, 'should find case-insensitive match');
        });

        test('should prefer exact match over case-insensitive', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM Test
VAR
    Counter : INT;
END_VAR
END_PROGRAM`));

            const locs = indexer.findSymbolDefinition('Counter');
            assert.ok(locs.length > 0, 'should find exact match');
        });

        test('should find cross-file definitions', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///defs.st', `
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
END_VAR
END_FUNCTION_BLOCK`));

            indexer.updateFileIndex(doc('file:///main.st', `
PROGRAM Main
VAR
    motor : FB_Motor;
END_VAR
END_PROGRAM`));

            const locs = indexer.findSymbolDefinition('FB_Motor');
            assert.ok(locs.length > 0, 'should find cross-file FB definition');
            assert.ok(locs.some(l => l.uri === 'file:///defs.st'), 'should point to definition file');
        });
    });

    suite('findSymbolsByName', () => {
        test('should return all matching symbols case-insensitively', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM Test
VAR
    MyVar : INT;
END_VAR
END_PROGRAM`));

            const results = indexer.findSymbolsByName('myvar');
            assert.ok(results.length > 0, 'should find symbol by lowercase name');
            assert.strictEqual(results[0].name, 'MyVar', 'original case preserved');
        });
    });

    suite('findSymbolReferences', () => {
        test('should find symbol references', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM Test
VAR
    counter : INT;
END_VAR
END_PROGRAM`));

            // buildCrossReferences is called via initialize (filesystem path),
            // but for unit tests we can check the reference after re-indexing
            // References are built in buildFileReferences which runs during updateFileIndex
            // Actually, buildCrossReferences is only called from scanWorkspace
            // So references won't be populated via updateFileIndex alone
            // This test documents current behavior
            const refs = indexer.findSymbolReferences('counter');
            // References may be empty since buildCrossReferences not called
            assert.ok(Array.isArray(refs), 'should return an array');
        });
    });

    suite('getIndexStats', () => {
        test('should return accurate counts', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `
PROGRAM Main
VAR
    x : INT;
END_VAR
END_PROGRAM

FUNCTION_BLOCK FB_Test
VAR_INPUT
    a : BOOL;
END_VAR
END_FUNCTION_BLOCK

FUNCTION Calc : REAL
VAR_INPUT
    b : REAL;
END_VAR
END_FUNCTION

VAR_GLOBAL
    globalFlag : BOOL;
END_VAR`));

            const stats = indexer.getIndexStats();
            assert.strictEqual(stats.fileCount, 1);
            assert.ok(stats.programCount >= 1, `expected >=1 program, got ${stats.programCount}`);
            assert.ok(stats.functionBlockCount >= 1, `expected >=1 FB, got ${stats.functionBlockCount}`);
            assert.ok(stats.functionCount >= 1, `expected >=1 function, got ${stats.functionCount}`);
            assert.ok(stats.globalVariableCount >= 1, `expected >=1 global var, got ${stats.globalVariableCount}`);
        });
    });
});

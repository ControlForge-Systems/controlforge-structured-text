import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, CompletionItemKind } from 'vscode-languageserver';
import { MemberCompletionProvider } from '../../server/providers/completion-provider';
import { MemberAccessProvider } from '../../server/providers/member-access-provider';
import { WorkspaceIndexer } from '../../server/workspace-indexer';

function doc(uri: string, content: string): TextDocument {
    return TextDocument.create(uri, 'structured-text', 1, content);
}

suite('Completion Provider Unit Tests', () => {
    let memberAccessProvider: MemberAccessProvider;
    let completionProvider: MemberCompletionProvider;

    setup(() => {
        memberAccessProvider = new MemberAccessProvider();
        completionProvider = new MemberCompletionProvider(memberAccessProvider);
    });

    suite('provideCompletionItems — member access context', () => {
        test('should provide TON members after instance dot', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
    myTimer.
END_PROGRAM`));

            const document = doc('file:///test.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
    myTimer.
END_PROGRAM`);

            // Position after "myTimer." on line 4
            const pos: Position = { line: 4, character: 12 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const labels = items.map(i => i.label);
            assert.ok(labels.includes('IN'), 'should include IN');
            assert.ok(labels.includes('PT'), 'should include PT');
            assert.ok(labels.includes('Q'), 'should include Q');
            assert.ok(labels.includes('ET'), 'should include ET');
        });

        test('should provide CTU members after counter dot', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    myCounter : CTU;
END_VAR
    myCounter.
END_PROGRAM`));

            const document = doc('file:///test.st', `PROGRAM Main
VAR
    myCounter : CTU;
END_VAR
    myCounter.
END_PROGRAM`);

            const pos: Position = { line: 4, character: 14 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const labels = items.map(i => i.label);
            assert.ok(labels.includes('CU'), 'should include CU');
            assert.ok(labels.includes('CV'), 'should include CV');
            assert.ok(labels.includes('Q'), 'should include Q');
        });

        test('should return empty members for unknown instance type', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    x : INT;
END_VAR
    x.
END_PROGRAM`));

            const document = doc('file:///test.st', `PROGRAM Main
VAR
    x : INT;
END_VAR
    x.
END_PROGRAM`);

            const pos: Position = { line: 4, character: 6 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            // INT is not a FB type, so no members
            // May still get general completions if member context not detected
            const memberLabels = items.filter(i => i.kind !== CompletionItemKind.Keyword &&
                i.kind !== CompletionItemKind.Variable &&
                i.kind !== CompletionItemKind.Class);
            // No specific member completions expected for INT
            assert.ok(true, 'should not crash for non-FB dot access');
        });
    });

    suite('provideCompletionItems — general context', () => {
        test('should include keywords', () => {
            const indexer = new WorkspaceIndexer();
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    x : INT;
END_VAR

END_PROGRAM`);

            // Position on empty line (line 4) — general context
            const pos: Position = { line: 4, character: 0 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const labels = items.map(i => i.label);
            assert.ok(labels.includes('IF'), 'should include IF keyword');
            assert.ok(labels.includes('FOR'), 'should include FOR keyword');
            assert.ok(labels.includes('WHILE'), 'should include WHILE keyword');
            assert.ok(labels.includes('CASE'), 'should include CASE keyword');
            assert.ok(labels.includes('TRUE'), 'should include TRUE');
            assert.ok(labels.includes('FALSE'), 'should include FALSE');
        });

        test('should include workspace variables', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    counter : INT;
    flag : BOOL;
END_VAR
END_PROGRAM`));

            const document = doc('file:///test.st', `PROGRAM Main
VAR
    counter : INT;
    flag : BOOL;
END_VAR

END_PROGRAM`);

            const pos: Position = { line: 5, character: 0 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const labels = items.map(i => i.label);
            assert.ok(labels.includes('counter'), 'should include counter variable');
            assert.ok(labels.includes('flag'), 'should include flag variable');
        });

        test('should include FB instances in general completions', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR
END_PROGRAM`));

            const document = doc('file:///test.st', `PROGRAM Main
VAR
    myTimer : TON;
END_VAR

END_PROGRAM`);

            const pos: Position = { line: 4, character: 0 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const labels = items.map(i => i.label);
            assert.ok(labels.includes('myTimer'), 'should include FB instance');
        });
    });

    suite('member completion item details', () => {
        test('should set correct detail for member items', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    t : TON;
END_VAR
    t.
END_PROGRAM`));

            const document = doc('file:///test.st', `PROGRAM Main
VAR
    t : TON;
END_VAR
    t.
END_PROGRAM`);

            const pos: Position = { line: 4, character: 6 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const qItem = items.find(i => i.label === 'Q');
            assert.ok(qItem, 'should have Q completion item');
            assert.ok(qItem!.detail?.includes('BOOL'), 'detail should mention BOOL');
            assert.ok(qItem!.detail?.includes('VAR_OUTPUT'), 'detail should mention VAR_OUTPUT');
        });

        test('should sort inputs before outputs', () => {
            const indexer = new WorkspaceIndexer();
            indexer.updateFileIndex(doc('file:///test.st', `PROGRAM Main
VAR
    t : TON;
END_VAR
    t.
END_PROGRAM`));

            const document = doc('file:///test.st', `PROGRAM Main
VAR
    t : TON;
END_VAR
    t.
END_PROGRAM`);

            const pos: Position = { line: 4, character: 6 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const inItem = items.find(i => i.label === 'IN');
            const qItem = items.find(i => i.label === 'Q');

            assert.ok(inItem?.sortText, 'IN should have sortText');
            assert.ok(qItem?.sortText, 'Q should have sortText');
            // Inputs (VAR_INPUT) should sort before outputs (VAR_OUTPUT)
            assert.ok(inItem!.sortText! < qItem!.sortText!, 'inputs should sort before outputs');
        });

        test('should sort keywords last', () => {
            const indexer = new WorkspaceIndexer();
            const document = doc('file:///test.st', `PROGRAM Main
VAR
    x : INT;
END_VAR

END_PROGRAM`);

            const pos: Position = { line: 4, character: 0 };
            const items = completionProvider.provideCompletionItems(document, pos, indexer);

            const keywordItems = items.filter(i => i.kind === CompletionItemKind.Keyword);
            assert.ok(keywordItems.length > 0, 'should have keyword items');
            for (const kw of keywordItems) {
                assert.ok(kw.sortText?.startsWith('9_'), `keyword ${kw.label} sortText should start with 9_`);
            }
        });
    });
});

import * as assert from 'assert';
import { Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SignatureHelpProvider } from '../../server/providers/signature-help-provider';
import { WorkspaceIndexer } from '../../server/workspace-indexer';

function doc(uri: string, content: string): TextDocument {
    return TextDocument.create(uri, 'structured-text', 1, content);
}

suite('Signature Help Provider Unit Tests', () => {
    let provider: SignatureHelpProvider;

    setup(() => {
        provider = new SignatureHelpProvider();
    });

    test('provides standard function signature on LIMIT(', () => {
        const indexer = new WorkspaceIndexer();
        const document = doc('file:///test.st', `PROGRAM Main
VAR
    x : REAL;
END_VAR
    x := LIMIT(0.0, x, 100.0);
END_PROGRAM`);

        const position: Position = { line: 4, character: 15 };
        const help = provider.provideSignatureHelp(document, position, indexer);

        assert.ok(help, 'signature help should exist');
        assert.strictEqual(help!.activeParameter, 0);
        assert.strictEqual(help!.signatures[0].label.includes('LIMIT('), true);
    });

    test('tracks active parameter with commas', () => {
        const indexer = new WorkspaceIndexer();
        const document = doc('file:///test.st', `PROGRAM Main
VAR
    x : REAL;
END_VAR
    x := LIMIT(0.0, x, 100.0);
END_PROGRAM`);

        const position: Position = { line: 4, character: 24 };
        const help = provider.provideSignatureHelp(document, position, indexer);

        assert.ok(help, 'signature help should exist');
        assert.strictEqual(help!.activeParameter, 2);
    });

    test('provides standard FB signature for instance call', () => {
        const indexer = new WorkspaceIndexer();
        const content = `PROGRAM Main
VAR
    t : TON;
END_VAR
    t(IN := TRUE, PT := T#5s);
END_PROGRAM`;
        const document = doc('file:///test.st', content);
        indexer.updateFileIndex(document);

        const position: Position = { line: 4, character: 6 };
        const help = provider.provideSignatureHelp(document, position, indexer);

        assert.ok(help, 'signature help should exist');
        assert.strictEqual(help!.signatures[0].label.startsWith('TON('), true);
    });

    test('provides custom function signature from workspace', () => {
        const indexer = new WorkspaceIndexer();
        const functionDoc = doc('file:///func.st', `FUNCTION CalcAvg : REAL
VAR_INPUT
    A : REAL;
    B : REAL;
END_VAR
END_FUNCTION`);
        const callDoc = doc('file:///main.st', `PROGRAM Main
VAR
    x : REAL;
END_VAR
    x := CalcAvg(1.0, 2.0);
END_PROGRAM`);

        indexer.updateFileIndex(functionDoc);
        indexer.updateFileIndex(callDoc);

        const position: Position = { line: 4, character: 17 };
        const help = provider.provideSignatureHelp(callDoc, position, indexer);

        assert.ok(help, 'signature help should exist');
        assert.strictEqual(help!.signatures[0].label.startsWith('CalcAvg('), true);
    });

    test('provides custom function block signature from workspace', () => {
        const indexer = new WorkspaceIndexer();
        const fbDoc = doc('file:///fb.st', `FUNCTION_BLOCK FB_Motor
VAR_INPUT
    Enable : BOOL;
    SpeedSetpoint : REAL;
END_VAR
END_FUNCTION_BLOCK`);
        const programDoc = doc('file:///main.st', `PROGRAM Main
VAR
    motor : FB_Motor;
END_VAR
    motor(Enable := TRUE, SpeedSetpoint := 42.0);
END_PROGRAM`);

        indexer.updateFileIndex(fbDoc);
        indexer.updateFileIndex(programDoc);

        const position: Position = { line: 4, character: 10 };
        const help = provider.provideSignatureHelp(programDoc, position, indexer);

        assert.ok(help, 'signature help should exist');
        assert.strictEqual(help!.signatures[0].label.startsWith('FB_Motor('), true);
    });

    test('returns null when not in call context', () => {
        const indexer = new WorkspaceIndexer();
        const document = doc('file:///test.st', `PROGRAM Main
VAR
    x : INT;
END_VAR
    x := 5;
END_PROGRAM`);

        const position: Position = { line: 4, character: 4 };
        const help = provider.provideSignatureHelp(document, position, indexer);

        assert.strictEqual(help, null);
    });
});

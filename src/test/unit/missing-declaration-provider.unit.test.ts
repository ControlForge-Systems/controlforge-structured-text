import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    CodeActionKind,
    CodeActionParams,
    DiagnosticSeverity,
    Diagnostic,
    Position,
    Range
} from 'vscode-languageserver';
import {
    inferTypeFromContext,
    findInsertionPoint,
    provideMissingDeclarationAction,
    provideAddAllMissingDeclarationsAction
} from '../../server/providers/missing-declaration-provider';
import { STSymbolExtended, STSymbolKind, STScope } from '../../shared/types';
import { provideCodeActions } from '../../server/providers/code-action-provider';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function doc(content: string): TextDocument {
    return TextDocument.create('file:///test.st', 'structured-text', 1, content);
}

function undefDiag(line: number, char: number, varName: string): Diagnostic {
    return {
        severity: DiagnosticSeverity.Warning,
        range: {
            start: Position.create(line, char),
            end: Position.create(line, char + varName.length),
        },
        message: `Undefined identifier '${varName}'`,
        source: 'ControlForge ST',
    };
}

function makeParams(document: TextDocument, diagnostics: Diagnostic[]): CodeActionParams {
    return {
        textDocument: { uri: document.uri },
        range: Range.create(0, 0, 0, 0),
        context: { diagnostics },
    };
}

/** Minimal symbol for a PROGRAM POU at a given line */
function programSymbol(name: string, line: number): STSymbolExtended {
    return {
        name,
        kind: STSymbolKind.Program,
        scope: STScope.Global,
        location: {
            uri: 'file:///test.st',
            range: {
                start: Position.create(line, 0),
                end: Position.create(line, name.length + 8)
            }
        }
    };
}

// ─── inferTypeFromContext ─────────────────────────────────────────────────────

suite('MissingDeclarationProvider - inferTypeFromContext', () => {

    test('BOOL from TRUE assignment', () => {
        const lines = ['    x := TRUE;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'BOOL');
    });

    test('BOOL from FALSE assignment', () => {
        const lines = ['    x := FALSE;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'BOOL');
    });

    test('INT from integer assignment', () => {
        const lines = ['    x := 42;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'INT');
    });

    test('INT from zero assignment', () => {
        const lines = ['    x := 0;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'INT');
    });

    test('REAL from float assignment', () => {
        const lines = ['    x := 3.14;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'REAL');
    });

    test('TIME from T# literal', () => {
        const lines = ['    x := T#5s;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'TIME');
    });

    test('TIME from TIME# literal', () => {
        const lines = ['    x := TIME#1m30s;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'TIME');
    });

    test('STRING from single-quoted literal', () => {
        const lines = ["    x := 'hello';"];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'STRING');
    });

    test('STRING from double-quoted literal', () => {
        const lines = ['    x := "hello";'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'STRING');
    });

    test('BOOL from IF condition usage', () => {
        const lines = ['    IF x THEN'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'BOOL');
    });

    test('BOOL from AND expression', () => {
        const lines = ['    result := x AND y;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'BOOL');
    });

    test('BOOL from OR expression', () => {
        const lines = ['    result := a OR x;'];
        assert.strictEqual(inferTypeFromContext('x', lines, 0), 'BOOL');
    });

    test('TON from .Q member access', () => {
        const lines = ['    IF myTimer.Q THEN'];
        assert.strictEqual(inferTypeFromContext('myTimer', lines, 0), 'TON');
    });

    test('TON from .ET member access', () => {
        const lines = ['    elapsed := myTimer.ET;'];
        assert.strictEqual(inferTypeFromContext('myTimer', lines, 0), 'TON');
    });

    test('TON from FB call with PT :=', () => {
        const lines = ['    myTimer(IN := start, PT := T#5s);'];
        assert.strictEqual(inferTypeFromContext('myTimer', lines, 0), 'TON');
    });

    test('CTU from .CV member access', () => {
        const lines = ['    count := myCounter.CV;'];
        assert.strictEqual(inferTypeFromContext('myCounter', lines, 0), 'CTU');
    });

    test('R_TRIG from .CLK member access', () => {
        const lines = ['    myEdge.CLK := input;'];
        assert.strictEqual(inferTypeFromContext('myEdge', lines, 0), 'R_TRIG');
    });

    test('default INT when no context matches', () => {
        const lines = ['    someFunc(myVar);'];
        assert.strictEqual(inferTypeFromContext('myVar', lines, 0), 'INT');
    });

    test('uses nearby lines for context', () => {
        const lines = [
            '    myTimer(',
            '        IN := start,',
            '        PT := T#5s',
            '    );',
        ];
        assert.strictEqual(inferTypeFromContext('myTimer', lines, 0), 'TON');
    });

    test('case-insensitive variable name matching', () => {
        const lines = ['    MyVar := TRUE;'];
        assert.strictEqual(inferTypeFromContext('MyVar', lines, 0), 'BOOL');
    });
});

// ─── findInsertionPoint ───────────────────────────────────────────────────────

suite('MissingDeclarationProvider - findInsertionPoint', () => {

    test('finds insertion inside existing VAR block', () => {
        const content = [
            'PROGRAM Main',      // 0
            'VAR',               // 1
            '    x : INT;',      // 2
            'END_VAR',           // 3
            '    y := 1;',       // 4
            'END_PROGRAM',       // 5
        ].join('\n');
        const lines = content.split('\n');
        const symbols = [programSymbol('Main', 0)];

        const point = findInsertionPoint(lines, 4, symbols);

        assert.strictEqual(point.needsNewBlock, false);
        assert.strictEqual(point.isGlobal, false);
        // Should insert after line 2 (before END_VAR on line 3)
        assert.strictEqual(point.insertAfterLine, 2);
    });

    test('creates new VAR block when none exists', () => {
        const content = [
            'PROGRAM Main',      // 0
            'VAR_INPUT',         // 1
            '    enable : BOOL;',// 2
            'END_VAR',           // 3
            '    x := 1;',       // 4
            'END_PROGRAM',       // 5
        ].join('\n');
        const lines = content.split('\n');
        const symbols = [programSymbol('Main', 0)];

        const point = findInsertionPoint(lines, 4, symbols);

        assert.strictEqual(point.needsNewBlock, true);
        assert.strictEqual(point.isGlobal, false);
    });

    test('uses global insertion point when outside any POU', () => {
        const content = [
            'VAR_GLOBAL',        // 0
            '    g : INT;',      // 1
            'END_VAR',           // 2
        ].join('\n');
        const lines = content.split('\n');
        const symbols: STSymbolExtended[] = [];

        const point = findInsertionPoint(lines, 1, symbols);

        assert.strictEqual(point.isGlobal, true);
        assert.strictEqual(point.needsNewBlock, false);
        // insert before END_VAR (line 2), so after line 1
        assert.strictEqual(point.insertAfterLine, 1);
    });

    test('creates VAR_GLOBAL when no global block exists', () => {
        const lines = ['    x := 1;'];
        const symbols: STSymbolExtended[] = [];

        const point = findInsertionPoint(lines, 0, symbols);

        assert.strictEqual(point.isGlobal, true);
        assert.strictEqual(point.needsNewBlock, true);
    });
});

// ─── provideMissingDeclarationAction ─────────────────────────────────────────

suite('MissingDeclarationProvider - provideMissingDeclarationAction', () => {

    test('returns null for non-matching diagnostic', () => {
        const document = doc('PROGRAM Main\nEND_PROGRAM\n');
        const diag: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: Range.create(0, 0, 0, 5),
            message: "Missing semicolon",
            source: 'ControlForge ST'
        };
        const result = provideMissingDeclarationAction(document, diag, []);
        assert.strictEqual(result, null);
    });

    test('produces action with correct title', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    y := TRUE;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(4, 4, 'y');

        const action = provideMissingDeclarationAction(document, diag, symbols);

        assert.ok(action);
        assert.strictEqual(action!.title, "Declare 'y' as BOOL");
        assert.strictEqual(action!.kind, CodeActionKind.QuickFix);
        assert.strictEqual(action!.isPreferred, true);
    });

    test('inserts declaration before END_VAR', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    newVar := 42;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(4, 4, 'newVar');

        const action = provideMissingDeclarationAction(document, diag, symbols);

        assert.ok(action?.edit?.changes);
        const edits = action!.edit!.changes!['file:///test.st'];
        assert.strictEqual(edits.length, 1);
        assert.ok(edits[0].newText.includes('newVar : INT;'));
    });

    test('creates new VAR block when none exists', () => {
        const content = [
            'PROGRAM Main',
            '    newVar := 42;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(1, 4, 'newVar');

        const action = provideMissingDeclarationAction(document, diag, symbols);

        assert.ok(action?.edit?.changes);
        const edits = action!.edit!.changes!['file:///test.st'];
        assert.strictEqual(edits.length, 1);
        const text = edits[0].newText;
        assert.ok(text.includes('VAR'), `expected VAR in: ${text}`);
        assert.ok(text.includes('newVar : INT;'), `expected declaration in: ${text}`);
        assert.ok(text.includes('END_VAR'), `expected END_VAR in: ${text}`);
    });

    test('infers BOOL for variable assigned TRUE', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    flag := TRUE;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(4, 4, 'flag');

        const action = provideMissingDeclarationAction(document, diag, symbols);

        assert.ok(action);
        assert.ok(action!.title.includes('BOOL'));
        const edits = action!.edit!.changes!['file:///test.st'];
        assert.ok(edits[0].newText.includes('flag : BOOL;'));
    });

    test('infers REAL for variable assigned float', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    ratio := 1.5;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(4, 4, 'ratio');

        const action = provideMissingDeclarationAction(document, diag, symbols);

        assert.ok(action);
        assert.ok(action!.title.includes('REAL'));
    });

    test('infers TIME for variable assigned T# literal', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    delay := T#5s;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(4, 4, 'delay');

        const action = provideMissingDeclarationAction(document, diag, symbols);

        assert.ok(action);
        assert.ok(action!.title.includes('TIME'));
    });

    test('infers TON for FB instance with .Q access', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    IF myTimer.Q THEN',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(4, 7, 'myTimer');

        const action = provideMissingDeclarationAction(document, diag, symbols);

        assert.ok(action);
        assert.ok(action!.title.includes('TON'));
    });
});

// ─── provideAddAllMissingDeclarationsAction ───────────────────────────────────

suite('MissingDeclarationProvider - provideAddAllMissingDeclarationsAction', () => {

    test('returns null for fewer than 2 undefined diagnostics', () => {
        const document = doc('PROGRAM Main\nEND_PROGRAM\n');
        const diags = [undefDiag(0, 0, 'x')];
        const result = provideAddAllMissingDeclarationsAction(document, diags, []);
        assert.strictEqual(result, null);
    });

    test('returns batch action for 2+ undefined diagnostics', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    existing : INT;',
            'END_VAR',
            '    a := TRUE;',
            '    b := 42;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diags = [
            undefDiag(4, 4, 'a'),
            undefDiag(5, 4, 'b'),
        ];

        const action = provideAddAllMissingDeclarationsAction(document, diags, symbols);

        assert.ok(action);
        assert.ok(action!.title.includes('2'));
        assert.strictEqual(action!.kind, CodeActionKind.QuickFix);
    });

    test('deduplicates same variable name across multiple diagnostics', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    existing : INT;',
            'END_VAR',
            '    x := TRUE;',
            '    x := FALSE;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diags = [
            undefDiag(4, 4, 'x'),
            undefDiag(5, 4, 'x'),
            undefDiag(4, 4, 'y'), // need 2 unique vars to trigger batch
        ];

        const action = provideAddAllMissingDeclarationsAction(document, diags, symbols);

        // Should not insert 'x' twice
        assert.ok(action);
        const edits = action!.edit!.changes!['file:///test.st'];
        const allText = edits.map((e: { newText: string }) => e.newText).join('');
        const xCount = (allText.match(/\bx\s*:/g) || []).length;
        assert.strictEqual(xCount, 1);
    });
});

// ─── Integration via provideCodeActions ──────────────────────────────────────

suite('Code Action Provider - Undefined identifier integration', () => {

    test('provideCodeActions produces single-var fix for undefined identifier', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    newVar := 0;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diag = undefDiag(4, 4, 'newVar');
        const params = makeParams(document, [diag]);

        const actions = provideCodeActions(document, params, symbols);

        const fix = actions.find(a => a.title.startsWith("Declare 'newVar'"));
        assert.ok(fix, 'Expected single-var declare action');
        assert.strictEqual(fix!.kind, CodeActionKind.QuickFix);
    });

    test('provideCodeActions produces batch fix for multiple undefined identifiers', () => {
        const content = [
            'PROGRAM Main',
            'VAR',
            '    x : INT;',
            'END_VAR',
            '    a := TRUE;',
            '    b := 42;',
            'END_PROGRAM',
        ].join('\n');
        const document = doc(content);
        const symbols = [programSymbol('Main', 0)];
        const diags = [
            undefDiag(4, 4, 'a'),
            undefDiag(5, 4, 'b'),
        ];
        const params = makeParams(document, diags);

        const actions = provideCodeActions(document, params, symbols);

        const batchFix = actions.find(a => a.title.includes('undefined variables'));
        assert.ok(batchFix, 'Expected batch declare action');
    });

    test('provideCodeActions ignores undefined-identifier diagnostics from other sources', () => {
        const content = 'PROGRAM Main\nEND_PROGRAM\n';
        const document = doc(content);
        const diag: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: Range.create(0, 0, 0, 3),
            message: "Undefined identifier 'foo'",
            source: 'SomeOtherLinter',
        };
        const params = makeParams(document, [diag]);

        const actions = provideCodeActions(document, params, []);

        const fix = actions.find(a => a.title.startsWith("Declare 'foo'"));
        assert.strictEqual(fix, undefined);
    });
});

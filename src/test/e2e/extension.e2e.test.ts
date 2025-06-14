import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Structured Text Extension E2E Tests', () => {
    let workspaceFolder: vscode.WorkspaceFolder | undefined;

    setup(async () => {
        // Wait for workspace to be available
        const maxWait = 5000; // 5 seconds
        const startTime = Date.now();

        while (!vscode.workspace.workspaceFolders?.length && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (vscode.workspace.workspaceFolders?.length) {
            workspaceFolder = vscode.workspace.workspaceFolders[0];
        }
    });

    test('Extension should be active', async () => {
        const extension = vscode.extensions.getExtension('ControlForgeSystems.controlforge-structured-text');
        assert.ok(extension, 'Extension should be installed');

        // Wait for extension to activate if it's not already active
        if (!extension.isActive) {
            await extension.activate();
        }

        assert.ok(extension.isActive, 'Extension should be active');
    });

    test('Should open .st files with structured-text language', async () => {
        if (!workspaceFolder) {
            console.warn('Skipping test: No workspace folder available');
            return;
        }

        const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'examples', 'sample.st'));
        const doc = await vscode.workspace.openTextDocument(uri);

        assert.strictEqual(doc.languageId, 'structured-text', 'ST files should have structured-text language ID');
        assert.ok(doc.getText().length > 0, 'Sample file should have content');
    });

    test('Should open .iecst files with structured-text language', async () => {
        if (!workspaceFolder) {
            console.warn('Skipping test: No workspace folder available');
            return;
        }

        const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'examples', 'pid_controller.iecst'));
        const doc = await vscode.workspace.openTextDocument(uri);

        assert.strictEqual(doc.languageId, 'structured-text', 'IECST files should have structured-text language ID');
        assert.ok(doc.getText().length > 0, 'PID controller file should have content');
    });

    test('Validate syntax command should be available', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(
            commands.includes('controlforge-structured-text.validateSyntax'),
            'Validate syntax command should be registered'
        );
    });

    test('Validate syntax command should work on ST files', async () => {
        if (!workspaceFolder) {
            console.warn('Skipping test: No workspace folder available');
            return;
        }

        const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'examples', 'sample.st'));
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);

        // Execute the validate syntax command
        try {
            await vscode.commands.executeCommand('controlforge-structured-text.validateSyntax');
            assert.ok(true, 'Validate syntax command should execute without error');
        } catch (error) {
            assert.fail(`Validate syntax command failed: ${error}`);
        }
    });

    test('Should show warning for non-ST files when validating syntax', async () => {
        // Create a temporary non-ST file
        const uri = vscode.Uri.parse('untitled:test.txt');
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);

        // Execute the validate syntax command
        try {
            await vscode.commands.executeCommand('controlforge-structured-text.validateSyntax');
            assert.ok(true, 'Command should handle non-ST files gracefully');
        } catch (error) {
            assert.fail(`Command should not throw error for non-ST files: ${error}`);
        }
    });

    suite('Autocomplete E2E Tests', () => {
        let testDocument: vscode.TextDocument;
        let testEditor: vscode.TextEditor;

        setup(async function () {
            // Increase timeout for setup
            this.timeout(10000);

            if (!workspaceFolder) {
                console.warn('Skipping autocomplete tests: No workspace folder available');
                this.skip();
                return;
            }

            // Create a test document with some structured text content
            const testContent = `PROGRAM TestProgram
VAR
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
    message : STRING := 'Test';
END_VAR

FUNCTION_BLOCK FB_TestMotor
VAR_INPUT
    start : BOOL;
    speed : REAL;
END_VAR
VAR_OUTPUT
    running : BOOL;
END_VAR
END_FUNCTION_BLOCK

// Test autocomplete here
`;

            const uri = vscode.Uri.parse('untitled:test-autocomplete.st');
            testDocument = await vscode.workspace.openTextDocument(uri);
            testEditor = await vscode.window.showTextDocument(testDocument);

            // Insert test content
            await testEditor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), testContent);
            });

            // Wait a moment for the language server to process
            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        teardown(async () => {
            if (testEditor) {
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        });

        test('Should provide keyword completions', async function () {
            this.timeout(10000);

            if (!testEditor) {
                this.skip();
                return;
            }

            // Position cursor at the end of the document to trigger completions
            const lastLine = testDocument.lineCount - 1;
            const position = new vscode.Position(lastLine, 0);
            testEditor.selection = new vscode.Selection(position, position);

            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions, 'Should return completions');
            assert.ok(completions.items.length > 0, 'Should have completion items');

            // Check for specific keywords
            const completionLabels = completions.items.map(item => item.label as string);
            assert.ok(completionLabels.includes('IF'), 'Should include IF keyword');
            assert.ok(completionLabels.includes('FOR'), 'Should include FOR keyword');
            assert.ok(completionLabels.includes('WHILE'), 'Should include WHILE keyword');
            assert.ok(completionLabels.includes('VAR'), 'Should include VAR keyword');
            assert.ok(completionLabels.includes('BOOL'), 'Should include BOOL data type');
            assert.ok(completionLabels.includes('INT'), 'Should include INT data type');
            assert.ok(completionLabels.includes('REAL'), 'Should include REAL data type');

            // Check for new standard function blocks
            assert.ok(completionLabels.includes('TON'), 'Should include TON timer');
            assert.ok(completionLabels.includes('CTU'), 'Should include CTU counter');
            assert.ok(completionLabels.includes('R_TRIG'), 'Should include R_TRIG edge detector');

            // Check for configuration keywords
            assert.ok(completionLabels.includes('CONFIGURATION'), 'Should include CONFIGURATION keyword');
            assert.ok(completionLabels.includes('TASK'), 'Should include TASK keyword');
            assert.ok(completionLabels.includes('INTERVAL'), 'Should include INTERVAL keyword');

            // Check for conversion functions
            assert.ok(completionLabels.includes('REAL_TO_TIME'), 'Should include REAL_TO_TIME conversion');
            assert.ok(completionLabels.includes('INT_TO_STRING'), 'Should include INT_TO_STRING conversion');

            // Check for additional standard functions
            assert.ok(completionLabels.includes('ADD'), 'Should include ADD function');
            assert.ok(completionLabels.includes('GT'), 'Should include GT comparison function');

            // Check for generic data types
            assert.ok(completionLabels.includes('ANY'), 'Should include ANY generic type');
            assert.ok(completionLabels.includes('LTIME'), 'Should include LTIME extended time type');
        });

        test('Should provide variable completions from document', async function () {
            this.timeout(10000);

            if (!testEditor) {
                this.skip();
                return;
            }

            // Position cursor at the end of the document
            const lastLine = testDocument.lineCount - 1;
            const position = new vscode.Position(lastLine, 0);
            testEditor.selection = new vscode.Selection(position, position);

            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions, 'Should return completions');

            // Check for variables from the test document
            const completionLabels = completions.items.map(item => item.label as string);
            assert.ok(completionLabels.includes('counter'), 'Should include counter variable');
            assert.ok(completionLabels.includes('temperature'), 'Should include temperature variable');
            assert.ok(completionLabels.includes('isRunning'), 'Should include isRunning variable');
            assert.ok(completionLabels.includes('message'), 'Should include message variable');
            assert.ok(completionLabels.includes('start'), 'Should include start variable from function block');
            assert.ok(completionLabels.includes('speed'), 'Should include speed variable from function block');
            assert.ok(completionLabels.includes('running'), 'Should include running variable from function block');
        });

        test('Should provide function block completions', async function () {
            this.timeout(10000);

            if (!testEditor) {
                this.skip();
                return;
            }

            // Position cursor at the end of the document
            const lastLine = testDocument.lineCount - 1;
            const position = new vscode.Position(lastLine, 0);
            testEditor.selection = new vscode.Selection(position, position);

            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions, 'Should return completions');

            // Check for function blocks from the test document
            const completionLabels = completions.items.map(item => item.label as string);
            assert.ok(completionLabels.includes('FB_TestMotor'), 'Should include FB_TestMotor function block');
        });

        test('Should provide code snippet completions', async function () {
            this.timeout(10000);

            if (!testEditor) {
                this.skip();
                return;
            }

            // Position cursor at the end of the document
            const lastLine = testDocument.lineCount - 1;
            const position = new vscode.Position(lastLine, 0);
            testEditor.selection = new vscode.Selection(position, position);

            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions, 'Should return completions');

            // Check for code snippets
            const completionLabels = completions.items.map(item => item.label as string);
            assert.ok(completionLabels.includes('if-then-end'), 'Should include IF-THEN-END snippet');
            assert.ok(completionLabels.includes('for-loop'), 'Should include FOR loop snippet');
            assert.ok(completionLabels.includes('while-loop'), 'Should include WHILE loop snippet');
            assert.ok(completionLabels.includes('function-block'), 'Should include function block snippet');
            assert.ok(completionLabels.includes('var-block'), 'Should include VAR block snippet');
            assert.ok(completionLabels.includes('configuration'), 'Should include configuration snippet');
            assert.ok(completionLabels.includes('timer-on-delay'), 'Should include timer on-delay snippet');
            assert.ok(completionLabels.includes('counter-up'), 'Should include counter up snippet');
            assert.ok(completionLabels.includes('state-machine'), 'Should include state machine snippet');
        });

        test('Should provide completion items with proper kinds', async function () {
            this.timeout(10000);

            if (!testEditor) {
                this.skip();
                return;
            }

            // Position cursor at the end of the document
            const lastLine = testDocument.lineCount - 1;
            const position = new vscode.Position(lastLine, 0);
            testEditor.selection = new vscode.Selection(position, position);

            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions, 'Should return completions');

            // Check for proper completion item kinds
            const ifItem = completions.items.find(item => item.label === 'IF');
            assert.ok(ifItem, 'Should find IF keyword');
            assert.strictEqual(ifItem.kind, vscode.CompletionItemKind.Keyword, 'IF should be Keyword kind');

            const counterItem = completions.items.find(item => item.label === 'counter');
            if (counterItem) {
                assert.strictEqual(counterItem.kind, vscode.CompletionItemKind.Variable, 'counter should be Variable kind');
            }

            const fbItem = completions.items.find(item => item.label === 'FB_TestMotor');
            if (fbItem) {
                assert.strictEqual(fbItem.kind, vscode.CompletionItemKind.Class, 'FB_TestMotor should be Class kind');
            }

            const snippetItem = completions.items.find(item => item.label === 'if-then-end');
            if (snippetItem) {
                assert.strictEqual(snippetItem.kind, vscode.CompletionItemKind.Snippet, 'if-then-end should be Snippet kind');
            }
        });

        test('Should provide completion items with documentation', async function () {
            this.timeout(10000);

            if (!testEditor) {
                this.skip();
                return;
            }

            // Position cursor at the end of the document
            const lastLine = testDocument.lineCount - 1;
            const position = new vscode.Position(lastLine, 0);
            testEditor.selection = new vscode.Selection(position, position);

            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions, 'Should return completions');

            // Check that keywords have documentation
            const ifItem = completions.items.find(item => item.label === 'IF');
            assert.ok(ifItem, 'Should find IF keyword');
            assert.ok(ifItem.detail, 'IF should have detail');
            assert.ok(ifItem.documentation, 'IF should have documentation');

            const boolItem = completions.items.find(item => item.label === 'BOOL');
            assert.ok(boolItem, 'Should find BOOL data type');
            assert.ok(boolItem.detail, 'BOOL should have detail');
            assert.ok(boolItem.documentation, 'BOOL should have documentation');

            // Check that variables have type information
            const counterItem = completions.items.find(item => item.label === 'counter');
            if (counterItem) {
                assert.ok(counterItem.detail, 'counter should have detail with type info');
                assert.ok(counterItem.detail.includes('INT'), 'counter detail should include INT type');
            }
        });

        test('Should trigger completions on specific characters', async function () {
            this.timeout(10000);

            if (!testEditor) {
                this.skip();
                return;
            }

            // Test triggering on space character
            const lastLine = testDocument.lineCount - 1;
            let position = new vscode.Position(lastLine, 0);

            // Insert a space and check if completions are triggered
            await testEditor.edit(editBuilder => {
                editBuilder.insert(position, ' ');
            });

            position = new vscode.Position(lastLine, 1);
            testEditor.selection = new vscode.Selection(position, position);

            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions, 'Should provide completions after space trigger');
            assert.ok(completions.items.length > 0, 'Should have completion items after space');
        });

        test('Should work with sample.st file from examples', async function () {
            this.timeout(10000);

            if (!workspaceFolder) {
                this.skip();
                return;
            }

            // Open the sample.st file
            const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'examples', 'sample.st'));
            const doc = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(doc);

            // Position cursor at the end of the file
            const lastLine = doc.lineCount - 1;
            const position = new vscode.Position(lastLine, 0);
            editor.selection = new vscode.Selection(position, position);

            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                position
            );

            assert.ok(completions, 'Should return completions for sample.st');
            assert.ok(completions.items.length > 0, 'Should have completion items for sample.st');

            // Should include variables from the sample file
            const completionLabels = completions.items.map(item => item.label as string);

            // These variables should be extracted from the sample.st file
            const expectedVariables = ['counter', 'temperature', 'isRunning', 'message', 'timer'];
            expectedVariables.forEach(variable => {
                assert.ok(completionLabels.includes(variable), `Should include ${variable} from sample.st`);
            });

            // Should include function blocks from sample.st
            assert.ok(completionLabels.includes('FB_Motor'), 'Should include FB_Motor from sample.st');

            // Close the document
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        });
    });
});

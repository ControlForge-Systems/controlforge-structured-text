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

        const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'samples', 'basic', 'sample.st'));
        const doc = await vscode.workspace.openTextDocument(uri);

        assert.strictEqual(doc.languageId, 'structured-text', 'ST files should have structured-text language ID');
        assert.ok(doc.getText().length > 0, 'Sample file should have content');
    });

    test('Should open .iecst files with structured-text language', async () => {
        if (!workspaceFolder) {
            console.warn('Skipping test: No workspace folder available');
            return;
        }

        const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'samples', 'advanced', 'pid_controller.iecst'));
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

        const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'samples', 'basic', 'sample.st'));
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

        test('Should work with sample.st file from samples', async function () {
            this.timeout(10000);

            if (!workspaceFolder) {
                this.skip();
                return;
            }

            // Open the sample.st file
            const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'samples', 'basic', 'sample.st'));
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

    suite('Function Block Instance Member Completion', () => {
        test('Should provide member completion for function block instances', async () => {
            if (!workspaceFolder) {
                console.warn('Skipping test: No workspace folder available');
                return;
            }

            // Create a test document with function block instances
            const testCode = `PROGRAM TestInstanceMembers
VAR
    pulseTimer : TP;
    upCounter : CTU;
    downCounter : CTD;
    upDownCounter : CTUD;
    risingEdge : R_TRIG;
    fallingEdge : F_TRIG;
    setReset : RS;
    resetSet : SR;
    onTimer : TON;
    offTimer : TOF;
END_VAR

// Test completion here
`;

            const doc = await vscode.workspace.openTextDocument({
                content: testCode,
                language: 'structured-text'
            });

            const editor = await vscode.window.showTextDocument(doc);

            // Test TP (pulse timer) member completion
            const testPosition = new vscode.Position(14, 0); // Start of the comment line
            await editor.edit(edit => {
                edit.replace(new vscode.Range(14, 0, 14, 21), 'pulseTimer.'); // Replace the comment
            });

            const tpCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                new vscode.Position(14, 11) // After "pulseTimer."
            );

            assert.ok(tpCompletions, 'Should get completions for TP instance');
            const tpLabels = tpCompletions.items.map(item => item.label as string);
            assert.ok(tpLabels.includes('Q'), 'TP should have Q output');
            assert.ok(tpLabels.includes('ET'), 'TP should have ET output');
            assert.strictEqual(tpLabels.length, 2, 'TP should have exactly 2 outputs');

            // Test CTU (up counter) member completion
            await editor.edit(edit => {
                edit.insert(new vscode.Position(15, 0), 'upCounter.');
            });

            const ctuCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                new vscode.Position(15, 10) // After "upCounter."
            );

            assert.ok(ctuCompletions, 'Should get completions for CTU instance');
            const ctuLabels = ctuCompletions.items.map(item => item.label as string);
            assert.ok(ctuLabels.includes('Q'), 'CTU should have Q output');
            assert.ok(ctuLabels.includes('CV'), 'CTU should have CV output');
            assert.strictEqual(ctuLabels.length, 2, 'CTU should have exactly 2 outputs');

            // Test CTUD (up/down counter) member completion
            await editor.edit(edit => {
                edit.insert(new vscode.Position(16, 0), 'upDownCounter.');
            });

            const ctudCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                new vscode.Position(16, 14) // After "upDownCounter."
            );

            assert.ok(ctudCompletions, 'Should get completions for CTUD instance');
            const ctudLabels = ctudCompletions.items.map(item => item.label as string);
            assert.ok(ctudLabels.includes('QU'), 'CTUD should have QU output');
            assert.ok(ctudLabels.includes('QD'), 'CTUD should have QD output');
            assert.ok(ctudLabels.includes('CV'), 'CTUD should have CV output');
            assert.strictEqual(ctudLabels.length, 3, 'CTUD should have exactly 3 outputs');

            // Test R_TRIG (rising edge) member completion
            await editor.edit(edit => {
                edit.insert(new vscode.Position(17, 0), 'risingEdge.');
            });

            const rtrigCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                new vscode.Position(17, 11) // After "risingEdge."
            );

            assert.ok(rtrigCompletions, 'Should get completions for R_TRIG instance');
            const rtrigLabels = rtrigCompletions.items.map(item => item.label as string);
            assert.ok(rtrigLabels.includes('Q'), 'R_TRIG should have Q output');
            assert.strictEqual(rtrigLabels.length, 1, 'R_TRIG should have exactly 1 output');

            // Close the document
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        });

        test('Should provide member completion details and documentation', async () => {
            if (!workspaceFolder) {
                console.warn('Skipping test: No workspace folder available');
                return;
            }

            const testCode = `PROGRAM TestMemberDetails
VAR
    myTimer : TON;
END_VAR

// Test: myTimer.
`;

            const doc = await vscode.workspace.openTextDocument({
                content: testCode,
                language: 'structured-text'
            });

            const editor = await vscode.window.showTextDocument(doc);

            // Position after "myTimer."
            await editor.edit(edit => {
                edit.insert(new vscode.Position(5, 17), 'myTimer.');
            });

            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                new vscode.Position(5, 26)
            );

            assert.ok(completions, 'Should get completions');

            // Check Q member details
            const qItem = completions.items.find(item => item.label === 'Q');
            assert.ok(qItem, 'Should find Q member');
            assert.strictEqual(qItem.kind, vscode.CompletionItemKind.Property, 'Q should be a Property');
            assert.ok(qItem.detail?.includes('BOOL'), 'Q detail should include BOOL type');
            assert.ok(qItem.detail?.includes('TON'), 'Q detail should include TON type');

            // Check ET member details
            const etItem = completions.items.find(item => item.label === 'ET');
            assert.ok(etItem, 'Should find ET member');
            assert.strictEqual(etItem.kind, vscode.CompletionItemKind.Property, 'ET should be a Property');
            assert.ok(etItem.detail?.includes('TIME'), 'ET detail should include TIME type');
            assert.ok(etItem.detail?.includes('TON'), 'ET detail should include TON type');

            // Close the document
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        });

        test('Should not provide member completion for non-function-block variables', async () => {
            if (!workspaceFolder) {
                console.warn('Skipping test: No workspace folder available');
                return;
            }

            const testCode = `PROGRAM TestNonFB
VAR
    normalVar : INT;
    boolVar : BOOL;
END_VAR

// Test: normalVar.
`;

            const doc = await vscode.workspace.openTextDocument({
                content: testCode,
                language: 'structured-text'
            });

            const editor = await vscode.window.showTextDocument(doc);

            // Position after "normalVar."
            await editor.edit(edit => {
                edit.insert(new vscode.Position(6, 19), 'normalVar.');
            });

            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                new vscode.Position(6, 29)
            );

            // Should get general completions, not specific member completions
            assert.ok(completions, 'Should get completions');

            // Check that we get general completions (keywords, etc.), not member-specific ones
            const labels = completions.items.map(item => item.label as string);
            assert.ok(labels.length > 10, 'Should get many general completions');
            assert.ok(labels.includes('IF'), 'Should include general keywords');
            assert.ok(labels.includes('WHILE'), 'Should include general keywords');

            // Close the document
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        });

        test('Should provide function block instances in general completion', async () => {
            if (!workspaceFolder) {
                console.warn('Skipping test: No workspace folder available');
                return;
            }

            const testCode = `PROGRAM TestFBInstances
VAR
    timer1 : TON;
    counter1 : CTU;
    edge1 : R_TRIG;
    normalVar : INT;
END_VAR

// Test completion here
`;

            const doc = await vscode.workspace.openTextDocument({
                content: testCode,
                language: 'structured-text'
            });

            const editor = await vscode.window.showTextDocument(doc);

            // Position at the end for general completion
            const position = new vscode.Position(8, 23);

            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                position
            );

            assert.ok(completions, 'Should get completions');
            const labels = completions.items.map(item => item.label as string);

            // Should include function block instances
            assert.ok(labels.includes('timer1'), 'Should include timer1 instance');
            assert.ok(labels.includes('counter1'), 'Should include counter1 instance');
            assert.ok(labels.includes('edge1'), 'Should include edge1 instance');

            // Should also include normal variables
            assert.ok(labels.includes('normalVar'), 'Should include normalVar');

            // Check that FB instances have correct details
            const timer1Item = completions.items.find(item => item.label === 'timer1');
            assert.ok(timer1Item, 'Should find timer1 item');
            assert.strictEqual(timer1Item.kind, vscode.CompletionItemKind.Variable, 'FB instance should be Variable kind');
            assert.ok(timer1Item.detail?.includes('TON'), 'timer1 detail should include TON type');

            // Close the document
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        });
    });
});

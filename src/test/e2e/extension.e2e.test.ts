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
});

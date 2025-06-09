import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('ControlForge Structured Text extension is now active!');

    // Register the hello world command
    const helloWorldCommand = vscode.commands.registerCommand('controlforge-structured-text.helloWorld', () => {
        vscode.window.showInformationMessage('Hello from ControlForge Structured Text!');
    });

    // Register the validate syntax command
    const validateSyntaxCommand = vscode.commands.registerCommand('controlforge-structured-text.validateSyntax', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found!');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'structured-text') {
            vscode.window.showWarningMessage('Current file is not a Structured Text file!');
            return;
        }

        // Basic syntax validation (placeholder)
        const text = document.getText();
        const lines = text.split('\n');
        let errorCount = 0;

        lines.forEach((line, index) => {
            // Simple validation: check for unmatched parentheses
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;

            if (openParens !== closeParens) {
                errorCount++;
            }
        });

        if (errorCount === 0) {
            vscode.window.showInformationMessage('✅ No basic syntax errors found!');
        } else {
            vscode.window.showWarningMessage(`⚠️ Found ${errorCount} potential syntax issues.`);
        }
    });

    // Register event handler for when Structured Text files are opened
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'structured-text') {
            vscode.window.showInformationMessage('Structured Text file opened - ControlForge Structured Text is ready!');
        }
    });

    // Add commands to the extension context
    context.subscriptions.push(helloWorldCommand);
    context.subscriptions.push(validateSyntaxCommand);
    context.subscriptions.push(onDidOpenTextDocument);
}

export function deactivate() {
    console.log('ControlForge Structured Text extension is now deactivated!');
}

import * as vscode from 'vscode';
import { validateStructuredText, formatValidationMessage } from './validator';

export function activate(context: vscode.ExtensionContext) {
    console.log('ControlForge Structured Text extension is now active!');

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

        // Validate syntax using extracted validation logic
        const text = document.getText();
        const result = validateStructuredText(text);
        const message = formatValidationMessage(result);

        if (result.errorCount === 0) {
            vscode.window.showInformationMessage(message);
        } else {
            vscode.window.showWarningMessage(message);
        }
    });

    // Register event handler for when Structured Text files are opened
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'structured-text') {
            vscode.window.showInformationMessage('Structured Text file opened - ControlForge Structured Text is ready!');
        }
    });

    // Add commands to the extension context
    context.subscriptions.push(validateSyntaxCommand);
    context.subscriptions.push(onDidOpenTextDocument);
}

export function deactivate() {
    console.log('ControlForge Structured Text extension is now deactivated!');
}

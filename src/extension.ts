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

    // Register IntelliSense (completion) provider for Structured Text
    const structuredTextKeywords = [
        'IF', 'THEN', 'ELSE', 'ELSIF', 'END_IF', 'CASE', 'OF', 'END_CASE', 'FOR', 'TO', 'BY', 'DO', 'END_FOR', 'WHILE', 'END_WHILE', 'REPEAT', 'UNTIL', 'END_REPEAT', 'EXIT', 'RETURN', 'CONTINUE',
        'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_TEMP', 'VAR_GLOBAL', 'VAR_ACCESS', 'VAR_CONFIG', 'VAR_EXTERNAL', 'END_VAR', 'CONSTANT', 'RETAIN', 'NON_RETAIN', 'PERSISTENT', 'AT',
        'PROGRAM', 'END_PROGRAM', 'FUNCTION', 'END_FUNCTION', 'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK', 'TYPE', 'END_TYPE', 'STRUCT', 'END_STRUCT', 'ARRAY', 'STRING', 'WSTRING',
        'TRUE', 'FALSE', 'NULL', 'THIS', 'SUPER', 'ABSTRACT', 'FINAL', 'IMPLEMENTS', 'EXTENDS', 'INTERFACE', 'METHOD', 'PROPERTY', 'NAMESPACE', 'USING', 'WITH', 'CONFIGURATION', 'RESOURCE', 'TASK', 'ON', 'PRIORITY', 'SINGLE', 'INTERVAL', 'READ_WRITE', 'READ_ONLY', 'WRITE_ONLY',
        'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD', 'SINT', 'USINT', 'INT', 'UINT', 'DINT', 'UDINT', 'LINT', 'ULINT', 'REAL', 'LREAL', 'TIME', 'DATE', 'TIME_OF_DAY', 'TOD', 'DATE_AND_TIME', 'DT', 'POINTER', 'REFERENCE', 'ANY', 'ANY_DERIVED', 'ANY_ELEMENTARY', 'ANY_MAGNITUDE', 'ANY_NUM', 'ANY_REAL', 'ANY_INT', 'ANY_BIT', 'ANY_STRING', 'ANY_DATE'
    ];

    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { language: 'structured-text', scheme: 'file' },
        {
            provideCompletionItems(document, position) {
                const completions = structuredTextKeywords.map(keyword => {
                    const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                    item.insertText = keyword;
                    return item;
                });
                return completions;
            }
        },
        '.' // Trigger on dot, can add more trigger characters if needed
    );

    // Add commands to the extension context
    context.subscriptions.push(validateSyntaxCommand);
    context.subscriptions.push(onDidOpenTextDocument);
    context.subscriptions.push(completionProvider);
}

export function deactivate() {
    console.log('ControlForge Structured Text extension is now deactivated!');
}

import * as vscode from 'vscode';
import { validateStructuredText, formatValidationMessage } from './validator';
import { extractVariables, extractFunctionBlocks, getCompletionKeywords, getCodeSnippets } from './parser';

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

    // Enhanced IntelliSense (completion) provider for Structured Text
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        [
            { language: 'structured-text', scheme: 'file' },
            { language: 'structured-text', scheme: 'untitled' }
        ],
        {
            provideCompletionItems(document, position, token, context) {
                const completions: vscode.CompletionItem[] = [];
                const line = document.lineAt(position).text;
                const linePrefix = line.substring(0, position.character).toLowerCase();

                // Get keyword categories from parser
                const { controlKeywords, declarationKeywords, dataTypes, literals } = getCompletionKeywords();

                // Add all keyword types to completions
                const allKeywords = [...controlKeywords, ...declarationKeywords, ...dataTypes, ...literals];

                allKeywords.forEach(({ keyword, detail, documentation }) => {
                    const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                    item.detail = detail;
                    item.documentation = new vscode.MarkdownString(documentation);
                    item.insertText = keyword;
                    completions.push(item);
                });

                // Add code snippets for common patterns
                const snippetTemplates = getCodeSnippets();
                const snippets = snippetTemplates.map(template => {
                    const item = new vscode.CompletionItem(template.label, vscode.CompletionItemKind.Snippet);
                    item.insertText = new vscode.SnippetString(template.insertText);
                    item.detail = template.detail;
                    item.documentation = template.documentation;
                    return item;
                });

                completions.push(...snippets);

                // Extract variables from current document
                const documentText = document.getText();
                const variables = extractVariables(documentText);
                variables.forEach(variable => {
                    const item = new vscode.CompletionItem(variable.name, vscode.CompletionItemKind.Variable);
                    item.detail = `${variable.type} variable`;
                    item.documentation = new vscode.MarkdownString(`Variable of type ${variable.type}`);
                    item.insertText = variable.name;
                    completions.push(item);
                });

                // Extract function blocks from current document
                const functionBlocks = extractFunctionBlocks(documentText);
                functionBlocks.forEach(fb => {
                    const item = new vscode.CompletionItem(fb.name, vscode.CompletionItemKind.Class);
                    item.detail = `Function block`;
                    item.documentation = new vscode.MarkdownString(`Function block: ${fb.name}`);
                    item.insertText = fb.name;
                    completions.push(item);
                });

                return completions;
            }
        },
        '.', ' ', ':', '(' // Multiple trigger characters
    );

    // Add commands to the extension context
    context.subscriptions.push(validateSyntaxCommand);
    context.subscriptions.push(onDidOpenTextDocument);
    context.subscriptions.push(completionProvider);
}

export function deactivate() {
    console.log('ControlForge Structured Text extension is now deactivated!');
}

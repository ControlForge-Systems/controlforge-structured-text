import * as vscode from 'vscode';
import { validateStructuredText, formatValidationMessage } from './validator';
import { extractVariables, extractFunctionBlocks, extractFunctionBlockInstances, getFunctionBlockMembers, getCompletionKeywords, getCodeSnippets } from './parser';
import { activateLanguageServer, deactivateLanguageServer } from './client/lsp-client';

// Track LSP activation status
let lspActivated = false;
let lspActivationAttempts = 0;
const MAX_LSP_ACTIVATION_ATTEMPTS = 3;

/**
 * Activate the extension
 * @param context Extension context provided by VS Code
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('ControlForge Structured Text extension is now active!');

    // Try to activate the language server with retry mechanism
    await tryActivateLanguageServer(context);

    // Register command to check LSP status
    const checkLspStatusCommand = vscode.commands.registerCommand('controlforge-structured-text.checkLspStatus', () => {
        if (lspActivated) {
            vscode.window.showInformationMessage('ControlForge Structured Text LSP is running.');
        } else {
            const retryOption = 'Retry Connection';
            vscode.window.showWarningMessage(
                'ControlForge Structured Text LSP is not running.',
                retryOption
            ).then(selection => {
                if (selection === retryOption) {
                    lspActivationAttempts = 0; // Reset counter for manual retry
                    tryActivateLanguageServer(context);
                }
            });
        }
    });
    context.subscriptions.push(checkLspStatusCommand);

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
                const linePrefix = line.substring(0, position.character);
                const documentText = document.getText();

                // Check if we're completing after a dot (function block instance member access)
                const dotMatch = linePrefix.match(/(\w+)\.$/i);
                if (dotMatch) {
                    const instanceName = dotMatch[1];

                    // Extract function block instances from current document
                    const fbInstances = extractFunctionBlockInstances(documentText);
                    const instance = fbInstances.find(inst => inst.name.toLowerCase() === instanceName.toLowerCase());

                    if (instance) {
                        // Get the members for this function block type
                        const members = getFunctionBlockMembers(instance.type);
                        members.forEach(member => {
                            const item = new vscode.CompletionItem(member.name, vscode.CompletionItemKind.Property);
                            item.detail = `${member.type} - ${instance.type}.${member.name}`;
                            item.documentation = new vscode.MarkdownString(member.description);
                            item.insertText = member.name;
                            completions.push(item);
                        });

                        return completions; // Return only member completions for dot notation
                    }
                }

                // Regular completion (not after dot)
                const linePrefixLower = linePrefix.toLowerCase();

                // Get keyword categories from parser
                const { controlKeywords, declarationKeywords, dataTypes, literals, standardFunctionBlocks, standardFunctions, conversionFunctions } = getCompletionKeywords();

                // Add control keywords, declaration keywords, data types, and literals (no brackets needed)
                const simpleKeywords = [...controlKeywords, ...declarationKeywords, ...dataTypes, ...literals];
                simpleKeywords.forEach(({ keyword, detail, documentation }) => {
                    const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                    item.detail = detail;
                    item.documentation = new vscode.MarkdownString(documentation);
                    item.insertText = keyword;
                    completions.push(item);
                });

                // Add standard function blocks with context-aware completion
                standardFunctionBlocks.forEach(({ keyword, detail, documentation }) => {
                    // Create two completion items for each function block:
                    // 1. For type declaration (after colon)
                    // 2. For function call (with parameters)

                    // Type declaration completion (just the name)
                    const typeItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Class);
                    typeItem.detail = `${detail} (Type)`;
                    typeItem.documentation = new vscode.MarkdownString(`${documentation}\n\nUse for variable declarations: \`myTimer : ${keyword};\``);
                    typeItem.insertText = keyword;
                    typeItem.sortText = `0_${keyword}`; // Higher priority
                    completions.push(typeItem);

                    // Function call completion (with parameter template)
                    const callItem = new vscode.CompletionItem(`${keyword}()`, vscode.CompletionItemKind.Function);
                    callItem.detail = `${detail} (Call)`;
                    callItem.documentation = new vscode.MarkdownString(`${documentation}\n\nUse for function calls with parameters.`);

                    // Create parameter templates based on function block type
                    let insertText = '';
                    switch (keyword) {
                        case 'TON':
                        case 'TOF':
                            insertText = `${keyword}(IN := \${1:signal}, PT := \${2:T#1s})`;
                            break;
                        case 'TP':
                            insertText = `${keyword}(IN := \${1:signal}, PT := \${2:T#1s})`;
                            break;
                        case 'CTU':
                            insertText = `${keyword}(CU := \${1:signal}, R := \${2:reset}, PV := \${3:100})`;
                            break;
                        case 'CTD':
                            insertText = `${keyword}(CD := \${1:signal}, LD := \${2:load}, PV := \${3:100})`;
                            break;
                        case 'CTUD':
                            insertText = `${keyword}(CU := \${1:upSignal}, CD := \${2:downSignal}, R := \${3:reset}, LD := \${4:load}, PV := \${5:100})`;
                            break;
                        case 'R_TRIG':
                        case 'F_TRIG':
                            insertText = `${keyword}(CLK := \${1:signal})`;
                            break;
                        case 'RS':
                            insertText = `${keyword}(S := \${1:setSignal}, R1 := \${2:resetSignal})`;
                            break;
                        case 'SR':
                            insertText = `${keyword}(S1 := \${1:setSignal}, R := \${2:resetSignal})`;
                            break;
                        default:
                            insertText = `${keyword}(\${1:params})`;
                    }

                    callItem.insertText = new vscode.SnippetString(insertText);
                    callItem.sortText = `1_${keyword}`; // Lower priority than type
                    completions.push(callItem);
                });

                // Add standard functions with brackets and parameter placeholders
                standardFunctions.forEach(({ keyword, detail, documentation }) => {
                    const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Function);
                    item.detail = detail;
                    item.documentation = new vscode.MarkdownString(documentation);

                    // Create snippet with parameter placeholders based on function
                    let insertText = '';
                    switch (keyword) {
                        case 'ABS':
                        case 'SQRT':
                        case 'LN':
                        case 'LOG':
                        case 'EXP':
                        case 'SIN':
                        case 'COS':
                        case 'TAN':
                        case 'ASIN':
                        case 'ACOS':
                        case 'ATAN':
                            insertText = `${keyword}(\${1:value})`;
                            break;
                        case 'MIN':
                        case 'MAX':
                        case 'ADD':
                        case 'SUB':
                        case 'MUL':
                        case 'DIV':
                        case 'GT':
                        case 'GE':
                        case 'LT':
                        case 'LE':
                        case 'EQ':
                        case 'NE':
                            insertText = `${keyword}(\${1:value1}, \${2:value2})`;
                            break;
                        case 'LIMIT':
                            insertText = `${keyword}(\${1:min}, \${2:value}, \${3:max})`;
                            break;
                        case 'MUX':
                            insertText = `${keyword}(\${1:selector}, \${2:input0}, \${3:input1})`;
                            break;
                        case 'SEL':
                            insertText = `${keyword}(\${1:condition}, \${2:falseValue}, \${3:trueValue})`;
                            break;
                        default:
                            insertText = `${keyword}(\${1:param})`;
                    }

                    item.insertText = new vscode.SnippetString(insertText);
                    completions.push(item);
                });

                // Add conversion functions with brackets and parameter placeholders
                conversionFunctions.forEach(({ keyword, detail, documentation }) => {
                    const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Function);
                    item.detail = detail;
                    item.documentation = new vscode.MarkdownString(documentation);
                    item.insertText = new vscode.SnippetString(`${keyword}(\${1:value})`);
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
                const currentDocumentText = document.getText();
                const variables = extractVariables(currentDocumentText);
                variables.forEach(variable => {
                    const item = new vscode.CompletionItem(variable.name, vscode.CompletionItemKind.Variable);
                    item.detail = `${variable.type} variable`;
                    item.documentation = new vscode.MarkdownString(`Variable of type ${variable.type}`);
                    item.insertText = variable.name;
                    completions.push(item);
                });

                // Extract function blocks from current document
                const functionBlocks = extractFunctionBlocks(currentDocumentText);
                functionBlocks.forEach(fb => {
                    const item = new vscode.CompletionItem(fb.name, vscode.CompletionItemKind.Class);
                    item.detail = `Function block`;
                    item.documentation = new vscode.MarkdownString(`Function block: ${fb.name}`);
                    item.insertText = fb.name;
                    completions.push(item);
                });

                // Extract function block instances from current document
                const fbInstances = extractFunctionBlockInstances(currentDocumentText);
                fbInstances.forEach(instance => {
                    const item = new vscode.CompletionItem(instance.name, vscode.CompletionItemKind.Variable);
                    item.detail = `${instance.type} instance`;
                    item.documentation = new vscode.MarkdownString(`Function block instance of type ${instance.type}`);
                    item.insertText = instance.name;
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

    /**
     * Tries to activate the language server with retry mechanism
     * @param context Extension context
     */
    async function tryActivateLanguageServer(context: vscode.ExtensionContext): Promise<void> {
        if (lspActivationAttempts >= MAX_LSP_ACTIVATION_ATTEMPTS) {
            console.error(`Maximum LSP activation attempts (${MAX_LSP_ACTIVATION_ATTEMPTS}) reached. Giving up.`);
            vscode.window.showErrorMessage(
                'Failed to activate Structured Text Language Server after multiple attempts. Some features will be unavailable.',
                'Check Status'
            ).then(selection => {
                if (selection === 'Check Status') {
                    vscode.commands.executeCommand('controlforge-structured-text.checkLspStatus');
                }
            });
            return;
        }

        lspActivationAttempts++;
        console.log(`Attempting to activate LSP (attempt ${lspActivationAttempts}/${MAX_LSP_ACTIVATION_ATTEMPTS})...`);

        try {
            // Start the Language Server for Go to Definition and Find References
            await activateLanguageServer(context);
            lspActivated = true;
            lspActivationAttempts = 0; // Reset counter on success
            console.log('Language server activated successfully.');
        } catch (error: any) {
            console.error(`Failed to activate language server (attempt ${lspActivationAttempts}/${MAX_LSP_ACTIVATION_ATTEMPTS}):`, error);

            if (lspActivationAttempts < MAX_LSP_ACTIVATION_ATTEMPTS) {
                // Schedule retry with exponential backoff
                const retryDelayMs = Math.min(1000 * Math.pow(2, lspActivationAttempts - 1), 10000);
                console.log(`Scheduling LSP activation retry in ${retryDelayMs}ms...`);

                setTimeout(() => {
                    tryActivateLanguageServer(context);
                }, retryDelayMs);
            } else {
                vscode.window.showErrorMessage(`Failed to activate LSP: ${error.message || 'Unknown error'}`);
            }
        }
    }
}

export async function deactivate(): Promise<void> {
    console.log('ControlForge Structured Text extension is now deactivating...');

    try {
        // Clean up and stop the language server
        await deactivateLanguageServer();
        console.log('Language server deactivated successfully.');
    } catch (error) {
        console.error('Error during language server deactivation:', error);
    }

    console.log('ControlForge Structured Text extension deactivation complete.');
}

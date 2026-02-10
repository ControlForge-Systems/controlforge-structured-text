import * as vscode from 'vscode';
import { validateStructuredText, formatValidationMessage } from './validator';
import { activateLanguageServer, deactivateLanguageServer } from './client/lsp-client';

// NOTE: Parser imports removed - completion now handled by LSP server
// See src/server/providers/completion-provider.ts for implementation

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

    // NOTE: Completion provider is now handled entirely by the LSP server
    // See src/server/providers/completion-provider.ts for implementation

    // Add commands to the extension context
    context.subscriptions.push(validateSyntaxCommand);
    context.subscriptions.push(onDidOpenTextDocument);

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

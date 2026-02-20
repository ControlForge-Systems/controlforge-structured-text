/**
 * LSP Client for Structured Text
 * Manages the connection between VS Code and the ST Language Server
 */

import * as path from 'path';
import { workspace, ExtensionContext, window, commands, OutputChannel } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    State
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let outputChannel: OutputChannel;
let startingPromise: Thenable<void> | undefined;

/**
 * Activates the Language Server Protocol client
 * @param context Extension context
 * @returns Promise that resolves when client is ready or fails with error
 */
export async function activateLanguageServer(context: ExtensionContext): Promise<void> {
    if (!outputChannel) {
        outputChannel = window.createOutputChannel('Structured Text LSP');
        context.subscriptions.push(outputChannel);
    }

    outputChannel.appendLine('Activating Structured Text Language Server...');

    // The server is implemented in node
    let serverModule: string;

    try {
        // Try to use the webpack bundled server first
        serverModule = context.asAbsolutePath(path.join('dist', 'server', 'server.js'));
        outputChannel.appendLine(`Looking for server module at: ${serverModule}`);
    } catch (err) {
        // Fallback to the non-bundled version if webpack bundle doesn't exist
        outputChannel.appendLine('Webpack bundle not found, falling back to compiled output.');
        serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));
        outputChannel.appendLine(`Falling back to server module at: ${serverModule}`);
    }

    // The debug options for the server
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: [] }
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for structured text documents
        documentSelector: [{ scheme: 'file', language: 'structured-text' }],
        synchronize: {
            // Notify the server about file changes to '.st' and '.iecst' files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/*.{st,iecst}')
        },
        outputChannel: outputChannel,
        revealOutputChannelOn: 4, // Show output when error occurs
        middleware: {
            // Add custom error handling if needed
        },
        initializationOptions: {
            // Pass extension installation path to server for accessing iec61131-definitions/
            extensionPath: context.extensionPath
        }
    };

    // Create the language client
    if (client) {
        outputChannel.appendLine('Client already exists, stopping previous instance...');
        await client.stop();
        client = undefined;
    }

    client = new LanguageClient(
        'structuredTextLanguageServer',
        'Structured Text Language Server',
        serverOptions,
        clientOptions
    );

    // Add client state change handler
    client.onDidChangeState((event) => {
        outputChannel.appendLine(`Client state changed: ${State[event.oldState]} -> ${State[event.newState]}`);
    });

    // Start the client with error handling
    try {
        outputChannel.appendLine('Starting Structured Text Language Server...');
        startingPromise = client.start();
        await startingPromise;
        outputChannel.appendLine('Structured Text Language Server started successfully.');
        commands.executeCommand('setContext', 'structuredText.lspReady', true);
        return Promise.resolve();
    } catch (error: any) {
        outputChannel.appendLine(`Error starting Language Server: ${error?.message || 'Unknown error'}`);
        window.showErrorMessage(`Failed to start Structured Text Language Server: ${error?.message || 'Unknown error'}`);
        client = undefined;
        commands.executeCommand('setContext', 'structuredText.lspReady', false);
        return Promise.reject(error);
    }
}

/**
 * Deactivates the Language Server
 * @returns Promise that resolves when client is stopped
 */
/**
 * Send a custom request to the language server.
 */
export async function sendRequest<T>(method: string, params?: unknown): Promise<T | null> {
    if (!client || client.state !== State.Running) {
        return null;
    }
    return client.sendRequest<T>(method, params);
}

export async function deactivateLanguageServer(): Promise<void> {
    outputChannel?.appendLine('Deactivating Structured Text Language Server...');

    if (startingPromise) {
        try {
            // Wait for any ongoing start operation to complete
            await startingPromise;
        } catch (error) {
            // Ignore errors from startup since we're shutting down anyway
            outputChannel?.appendLine(`Ignoring startup error during shutdown: ${error}`);
        }
    }

    if (!client) {
        outputChannel?.appendLine('No Language Server client to deactivate.');
        return Promise.resolve();
    }

    try {
        outputChannel?.appendLine(`Stopping Language Server client in state: ${State[client.state]}`);

        // Only attempt to stop if the client is running
        if (client.state === State.Running) {
            const result = await client.stop();
            outputChannel?.appendLine('Language Server stopped successfully.');
            return result;
        } else {
            outputChannel?.appendLine(`Client not in running state (${State[client.state]}), skipping stop.`);
            return Promise.resolve();
        }
    } catch (error: any) {
        outputChannel?.appendLine(`Error stopping Language Server: ${error?.message || 'Unknown error'}`);
        return Promise.reject(error);
    } finally {
        client = undefined;
        commands.executeCommand('setContext', 'structuredText.lspReady', false);
    }
}

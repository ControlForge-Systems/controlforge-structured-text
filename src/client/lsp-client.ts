/**
 * LSP Client for Structured Text
 * Manages the connection between VS Code and the ST Language Server
 */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activateLanguageServer(context: ExtensionContext): void {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(
        path.join('out', 'server', 'server.js')
    );

    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
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
        }
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'structuredTextLanguageServer',
        'Structured Text Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
}

export function deactivateLanguageServer(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

/**
 * Language Server for Structured Text
 * Provides Go to Definition and Find References functionality
 */

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    TextDocumentSyncKind,
    InitializeResult,
    DefinitionParams,
    Location,
    Position
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { STSymbolKind, FileSymbols, SymbolIndex, STSymbolExtended } from '../shared/types';
import { STASTParser } from './ast-parser';
import { WorkspaceIndexer } from './workspace-indexer';
import { setExtensionPath } from './extension-path';
import { MemberAccessProvider } from './providers/member-access-provider';
import { EnhancedDefinitionProvider } from './providers/definition-provider';
import { MemberCompletionProvider } from './providers/completion-provider';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Add a custom error handler for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    connection.console.error(`Uncaught Exception: ${error.message}`);
    connection.console.error(error.stack || 'No stacktrace available');
    // Don't terminate, let the LSP client handle it
});

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Workspace symbol index
const symbolIndex: SymbolIndex = {
    files: new Map(),
    symbolsByName: new Map()
};

// Workspace indexer for cross-file navigation
const workspaceIndexer = new WorkspaceIndexer();

// Enhanced providers for advanced navigation
const memberAccessProvider = new MemberAccessProvider();
const enhancedDefinitionProvider = new EnhancedDefinitionProvider(memberAccessProvider);
const memberCompletionProvider = new MemberCompletionProvider(memberAccessProvider);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
    try {
        const extPath = (params.initializationOptions as any)?.extensionPath;
        setExtensionPath(extPath);
        if (!extPath) {
            connection.console.warn('Extension path not provided in initialization options');
        }

        const capabilities = params.capabilities;

        hasConfigurationCapability = !!(
            capabilities.workspace && !!capabilities.workspace.configuration
        );
        hasWorkspaceFolderCapability = !!(
            capabilities.workspace && !!capabilities.workspace.workspaceFolders
        );

        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                definitionProvider: true,
                referencesProvider: true,
                hoverProvider: true,
                completionProvider: {
                    resolveProvider: true
                }
            }
        };

        if (hasWorkspaceFolderCapability) {
            result.capabilities.workspace = {
                workspaceFolders: {
                    supported: true
                }
            };
        }

        connection.console.log('Structured Text Language Server initialized');
        return result;
    } catch (error: any) {
        connection.console.error(`Server initialization failed: ${error.message}`);
        throw error;
    }
});

// Re-export for backward compatibility
export { getExtensionPath } from './extension-path';

connection.onRequest('custom/showIndexStats', () => {
    return workspaceIndexer.getIndexStats();
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }

    // Initialize workspace indexer
    connection.workspace.getWorkspaceFolders().then(folders => {
        if (folders && folders.length > 0) {
            const workspaceRoot = folders[0].uri.replace('file://', '');
            workspaceIndexer.initialize(workspaceRoot);
        }
    }).catch(error => {
        connection.console.error(`Workspace init failed: ${error}`);
    });
});

// Graceful shutdown handlers
connection.onShutdown(() => {
    // Clean up resources
});

connection.onExit(() => {
    // Final cleanup
});

/**
 * Extract symbols from document using AST parser
 */
function parseSTSymbols(document: TextDocument): STSymbolExtended[] {
    const parser = new STASTParser(document);
    return parser.parseSymbols();
}

/**
 * Update symbol index for a document
 */
function updateSymbolIndex(document: TextDocument): void {
    const symbols = parseSTSymbols(document);
    const fileSymbols: FileSymbols = {
        uri: document.uri,
        symbols: symbols,
        lastModified: Date.now()
    };

    // Update file symbols
    symbolIndex.files.set(document.uri, fileSymbols);

    // Clear existing symbols for this file from the name index
    for (const [name, symbolList] of symbolIndex.symbolsByName.entries()) {
        const filtered = symbolList.filter(symbol => symbol.location.uri !== document.uri);
        if (filtered.length === 0) {
            symbolIndex.symbolsByName.delete(name);
        } else {
            symbolIndex.symbolsByName.set(name, filtered);
        }
    }

    // Update symbols by name index
    symbols.forEach(symbol => {
        if (!symbol.normalizedName) {
            symbol.normalizedName = symbol.name.toLowerCase();
        }

        // Add by exact name
        if (!symbolIndex.symbolsByName.has(symbol.name)) {
            symbolIndex.symbolsByName.set(symbol.name, []);
        }
        symbolIndex.symbolsByName.get(symbol.name)!.push(symbol);

        // Add normalized (lowercase) entry for case-insensitive lookups
        const normalizedName = symbol.name.toLowerCase();
        if (normalizedName !== symbol.name) {
            if (!symbolIndex.symbolsByName.has(normalizedName)) {
                symbolIndex.symbolsByName.set(normalizedName, []);
            }
            symbolIndex.symbolsByName.get(normalizedName)!.push(symbol);
        }

        // Index members (for function blocks, functions, programs)
        if (symbol.members) {
            symbol.members.forEach(member => {
                if (!member.normalizedName) {
                    member.normalizedName = member.name.toLowerCase();
                }

                if (!symbolIndex.symbolsByName.has(member.name)) {
                    symbolIndex.symbolsByName.set(member.name, []);
                }
                symbolIndex.symbolsByName.get(member.name)!.push(member);

                const memberNormalizedName = member.name.toLowerCase();
                if (memberNormalizedName !== member.name) {
                    if (!symbolIndex.symbolsByName.has(memberNormalizedName)) {
                        symbolIndex.symbolsByName.set(memberNormalizedName, []);
                    }
                    symbolIndex.symbolsByName.get(memberNormalizedName)!.push(member);
                }
            });
        }
    });
}

/**
 * Find identifier at cursor position
 */
function findSymbolAtPosition(document: TextDocument, position: Position): string | null {
    const text = document.getText();
    const lines = text.split('\n');
    const line = lines[position.line];

    if (!line) return null;

    const wordRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
    let match;

    while ((match = wordRegex.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (position.character >= start && position.character <= end) {
            return match[0];
        }
    }

    return null;
}

// Go to Definition handler
connection.onDefinition((params: DefinitionParams): Location[] => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    // Use enhanced definition provider for member access and standard navigation
    const locations = enhancedDefinitionProvider.provideDefinition(document, params.position, workspaceIndexer, symbolIndex);
    if (locations.length > 0) return locations;

    // Fallback to basic symbol search
    const symbolName = findSymbolAtPosition(document, params.position);
    if (!symbolName) return [];

    // Try workspace indexer for cross-file definitions
    const workspaceDefinitions = workspaceIndexer.findSymbolDefinition(symbolName);
    if (workspaceDefinitions.length > 0) return workspaceDefinitions;

    // Fallback to local file definitions - try exact match first
    let symbols = symbolIndex.symbolsByName.get(symbolName);

    // Case-insensitive fallback
    if (!symbols || symbols.length === 0) {
        const normalizedName = symbolName.toLowerCase();
        for (const [name, symbolList] of symbolIndex.symbolsByName.entries()) {
            if (name.toLowerCase() === normalizedName) {
                symbols = symbolList;
                break;
            }
        }
    }

    if (!symbols) return [];
    return symbols.map(symbol => symbol.location);
});

// Hover handler - provides information about symbols and members
connection.onHover((params): { contents: string } | null => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    // Use enhanced definition provider for hover information
    const hoverInfo = enhancedDefinitionProvider.provideHover(document, params.position, workspaceIndexer, symbolIndex);

    if (hoverInfo) {
        return { contents: hoverInfo };
    }

    return null;
});

// Completion handler - provides intelligent completion for members and symbols
connection.onCompletion((params): CompletionItem[] => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    // Use member completion provider for intelligent completion
    const completionItems = memberCompletionProvider.provideCompletionItems(document, params.position, workspaceIndexer);

    return completionItems;
});

// References handler - now with cross-file support
connection.onReferences((params): Location[] => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const symbolName = findSymbolAtPosition(document, params.position);
    if (!symbolName) return [];

    // Get references from workspace indexer
    const workspaceReferences = workspaceIndexer.findSymbolReferences(symbolName);
    if (workspaceReferences.length > 0) {
        return workspaceReferences;
    }

    // Fallback to local file references
    const symbols = symbolIndex.symbolsByName.get(symbolName);
    if (!symbols) return [];

    return symbols.map(symbol => symbol.location);
});

// Document change handlers - now with workspace indexer integration and debouncing
let changeDebounceTimer: NodeJS.Timeout | undefined;

documents.onDidChangeContent(change => {
    // Debounce to avoid re-parsing on every keystroke
    if (changeDebounceTimer) {
        clearTimeout(changeDebounceTimer);
    }
    
    changeDebounceTimer = setTimeout(() => {
        updateSymbolIndex(change.document);
        workspaceIndexer.updateFileIndex(change.document);
    }, 300); // Wait 300ms after last change
});

documents.onDidOpen(change => {
    updateSymbolIndex(change.document);
    workspaceIndexer.updateFileIndex(change.document);
});

// File close handler — cleanup index
documents.onDidClose(event => {
    const uri = event.document.uri;

    // Remove from local symbol index
    const fileSymbols = symbolIndex.files.get(uri);
    if (fileSymbols) {
        fileSymbols.symbols.forEach(symbol => {
            const symbols = symbolIndex.symbolsByName.get(symbol.name);
            if (symbols) {
                const filtered = symbols.filter(s => s.location.uri !== uri);
                if (filtered.length === 0) {
                    symbolIndex.symbolsByName.delete(symbol.name);
                } else {
                    symbolIndex.symbolsByName.set(symbol.name, filtered);
                }
            }
        });
        
        // Remove file entry
        symbolIndex.files.delete(uri);
    }
    
    // Remove from workspace indexer
    workspaceIndexer.removeFileFromIndex(uri);
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

/**
 * Language Server for Structured Text
 * Provides Go to Definition and Find References functionality
 */

import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    DefinitionParams,
    Location,
    Position,
    Range
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { STSymbol, STSymbolKind, STScope, FileSymbols, SymbolIndex, STSymbolExtended } from '../shared/types';
import { STASTParser } from './ast-parser';
import { WorkspaceIndexer } from './workspace-indexer';
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
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
    connection.console.log('Structured Text Language Server is initializing...');

    try {
        const capabilities = params.capabilities;

        // Does the client support the `workspace/configuration` request?
        hasConfigurationCapability = !!(
            capabilities.workspace && !!capabilities.workspace.configuration
        );
        hasWorkspaceFolderCapability = !!(
            capabilities.workspace && !!capabilities.workspace.workspaceFolders
        );
        hasDiagnosticRelatedInformationCapability = !!(
            capabilities.textDocument &&
            capabilities.textDocument.publishDiagnostics &&
            capabilities.textDocument.publishDiagnostics.relatedInformation
        );

        connection.console.log('Client capabilities processed successfully.');

        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                // Tell the client that this server supports go to definition
                definitionProvider: true,
                // Tell the client that this server supports find references
                referencesProvider: true,
                // Tell the client that this server supports hover
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

        connection.console.log('Server initialization completed successfully.');
        return result;
    } catch (error: any) {
        connection.console.error(`Error during server initialization: ${error.message}`);
        connection.console.error(error.stack || 'No stacktrace available');
        throw error; // Re-throw to let the client know about the error
    }
});

// Add a custom command to show workspace indexer stats
connection.onRequest('custom/showIndexStats', () => {
    const stats = workspaceIndexer.getIndexStats();
    connection.console.log(`Index Statistics: ${JSON.stringify(stats, null, 2)}`);
    return stats;
});

connection.onInitialized(() => {
    connection.console.log('Structured Text Language Server initialized and ready.');

    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }

    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }

    // Always try to initialize workspace indexer
    connection.workspace.getWorkspaceFolders().then(folders => {
        if (folders && folders.length > 0) {
            const workspaceRoot = folders[0].uri.replace('file://', '');
            connection.console.log(`Initializing workspace indexer for: ${workspaceRoot}`);
            workspaceIndexer.initialize(workspaceRoot);
            connection.console.log(`Workspace indexer initialized`);
        } else {
            connection.console.log('No workspace folders found');
        }
    }).catch(error => {
        connection.console.log(`Error initializing workspace: ${error}`);
    });
});

// Add handlers for graceful shutdown
connection.onShutdown(() => {
    connection.console.log('Structured Text Language Server is shutting down...');
    // Clean up any resources here if needed
});

connection.onExit(() => {
    connection.console.log('Structured Text Language Server is exiting.');
    // Final cleanup before exit
});

/**
 * Enhanced parser to extract symbols using AST-based parsing
 */
function parseSTSymbols(document: TextDocument): STSymbolExtended[] {
    const parser = new STASTParser(document);
    const symbols = parser.parseSymbols();

    // Add detailed logging for debugging
    connection.console.log(`Parsed ${symbols.length} symbols from ${document.uri}`);
    symbols.forEach(symbol => {
        connection.console.log(`  Symbol: ${symbol.name} (${symbol.kind}) - Type: ${symbol.dataType || 'unknown'}`);
    });

    return symbols;
}

/**
 * Update symbol index for a document using enhanced parser
 */
function updateSymbolIndex(document: TextDocument): void {
    const symbols = parseSTSymbols(document);
    const fileSymbols: FileSymbols = {
        uri: document.uri,
        symbols: symbols,
        lastModified: Date.now()
    };

    // Display all parsed symbols for verification
    connection.console.log(`Updating symbol index for ${document.uri} with ${symbols.length} symbols:`);
    symbols.forEach(symbol => {
        connection.console.log(`  Symbol: ${symbol.name} (${symbol.kind}), Type: ${symbol.dataType || 'unknown'}`);
    });

    // Update file symbols
    symbolIndex.files.set(document.uri, fileSymbols);

    // Clear existing symbols for this file from the name index
    connection.console.log(`Clearing old symbols from name index for ${document.uri}`);
    for (const [name, symbolList] of symbolIndex.symbolsByName.entries()) {
        const filtered = symbolList.filter(symbol => symbol.location.uri !== document.uri);
        if (filtered.length === 0) {
            connection.console.log(`  Removing empty symbol: ${name}`);
            symbolIndex.symbolsByName.delete(name);
        } else {
            connection.console.log(`  Keeping ${filtered.length} instances of ${name}`);
            symbolIndex.symbolsByName.set(name, filtered);
        }
    }

    // Update symbols by name index with new symbols
    connection.console.log(`Adding ${symbols.length} new symbols to name index`);
    symbols.forEach(symbol => {
        // Always set the normalized name if not already set
        if (!symbol.normalizedName) {
            symbol.normalizedName = symbol.name.toLowerCase();
        }

        connection.console.log(`  Adding symbol: ${symbol.name} (normalized: ${symbol.normalizedName})`);

        // First add by exact name
        if (!symbolIndex.symbolsByName.has(symbol.name)) {
            symbolIndex.symbolsByName.set(symbol.name, []);
        }
        symbolIndex.symbolsByName.get(symbol.name)!.push(symbol);

        // Always add a normalized (lowercase) entry too to ensure case-insensitive lookups work
        const normalizedName = symbol.name.toLowerCase();
        if (normalizedName !== symbol.name) {
            connection.console.log(`    Also adding normalized entry: ${normalizedName}`);
            if (!symbolIndex.symbolsByName.has(normalizedName)) {
                symbolIndex.symbolsByName.set(normalizedName, []);
            }
            symbolIndex.symbolsByName.get(normalizedName)!.push(symbol);
        }

        // Also add members if present (for function blocks, functions, programs)
        if (symbol.members) {
            connection.console.log(`  Processing ${symbol.members.length} members for ${symbol.name}`);
            symbol.members.forEach(member => {
                // Set normalized name for members too
                if (!member.normalizedName) {
                    member.normalizedName = member.name.toLowerCase();
                }

                connection.console.log(`    Adding member: ${member.name} (normalized: ${member.normalizedName})`);

                // Add by exact name
                if (!symbolIndex.symbolsByName.has(member.name)) {
                    symbolIndex.symbolsByName.set(member.name, []);
                }
                symbolIndex.symbolsByName.get(member.name)!.push(member);

                // Always add a normalized entry for the member too
                const memberNormalizedName = member.name.toLowerCase();
                if (memberNormalizedName !== member.name) {
                    connection.console.log(`      Also adding normalized entry: ${memberNormalizedName}`);
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
 * Find symbol at position with improved identifier detection
 */
function findSymbolAtPosition(document: TextDocument, position: Position): string | null {
    const text = document.getText();
    const lines = text.split('\n');
    const line = lines[position.line];

    if (!line) {
        connection.console.log(`No line found at position ${position.line}`);
        return null;
    }

    connection.console.log(`Finding symbol in line ${position.line}: "${line}"`);

    // Improved regex for ST identifiers (including those with underscores)
    const wordRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
    let match;
    let matches = [];

    // Find all identifiers in the line
    while ((match = wordRegex.exec(line)) !== null) {
        const word = match[0];
        const start = match.index;
        const end = start + word.length;
        matches.push({ word, start, end });
        connection.console.log(`  Found identifier: "${word}" at ${start}-${end}`);
    }

    // Check which identifier contains the cursor position
    for (const { word, start, end } of matches) {
        if (position.character >= start && position.character <= end) {
            connection.console.log(`  Position ${position.character} is inside word "${word}"`);
            return word;
        }
    }

    connection.console.log(`No identifier found at position ${position.character}`);
    return null;
}

// Go to Definition handler - now with enhanced member access support
connection.onDefinition((params: DefinitionParams): Location[] => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        connection.console.log('No document found for definition request');
        return [];
    }

    // Use enhanced definition provider for member access and standard navigation
    const locations = enhancedDefinitionProvider.provideDefinition(document, params.position, workspaceIndexer, symbolIndex);

    connection.console.log(`Enhanced definition provider found ${locations.length} locations`);

    if (locations.length > 0) {
        return locations;
    }

    // Fallback to basic symbol search if enhanced provider doesn't find anything
    const symbolName = findSymbolAtPosition(document, params.position);
    if (!symbolName) {
        connection.console.log('No symbol found at position');
        return [];
    }

    connection.console.log(`Looking for definition of symbol: ${symbolName}`);

    // First try workspace indexer for cross-file definitions
    const workspaceDefinitions = workspaceIndexer.findSymbolDefinition(symbolName);
    connection.console.log(`Workspace indexer found ${workspaceDefinitions.length} definitions for ${symbolName}`);

    if (workspaceDefinitions.length > 0) {
        return workspaceDefinitions;
    }

    // Fallback to local file definitions - try exact match first
    let symbols = symbolIndex.symbolsByName.get(symbolName);

    // If not found with exact match, try case-insensitive lookup
    if (!symbols || symbols.length === 0) {
        const normalizedName = symbolName.toLowerCase();
        connection.console.log(`Trying case-insensitive lookup for: ${normalizedName}`);

        // Check all symbols for a case-insensitive match
        for (const [name, symbolList] of symbolIndex.symbolsByName.entries()) {
            if (name.toLowerCase() === normalizedName) {
                symbols = symbolList;
                connection.console.log(`Found case-insensitive match: ${name}`);
                break;
            }
        }
    }

    connection.console.log(`Local index found ${symbols?.length || 0} symbols for ${symbolName}`);

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

// Document change handlers - now with workspace indexer integration
documents.onDidChangeContent(change => {
    updateSymbolIndex(change.document);
    workspaceIndexer.updateFileIndex(change.document);
});

documents.onDidOpen(change => {
    updateSymbolIndex(change.document);
    workspaceIndexer.updateFileIndex(change.document);
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

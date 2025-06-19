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
    return result;
});

// Add a custom command to show workspace indexer stats
connection.onRequest('custom/showIndexStats', () => {
    const stats = workspaceIndexer.getIndexStats();
    connection.console.log(`Index Statistics: ${JSON.stringify(stats, null, 2)}`);
    return stats;
});

connection.onInitialized(() => {
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

/**
 * Enhanced parser to extract symbols using AST-based parsing
 */
function parseSTSymbols(document: TextDocument): STSymbolExtended[] {
    const parser = new STASTParser(document);
    return parser.parseSymbols();
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

    // Update symbols by name index with new symbols
    symbols.forEach(symbol => {
        if (!symbolIndex.symbolsByName.has(symbol.name)) {
            symbolIndex.symbolsByName.set(symbol.name, []);
        }
        symbolIndex.symbolsByName.get(symbol.name)!.push(symbol);

        // Also add members if present (for function blocks, functions, programs)
        if (symbol.members) {
            symbol.members.forEach(member => {
                if (!symbolIndex.symbolsByName.has(member.name)) {
                    symbolIndex.symbolsByName.set(member.name, []);
                }
                symbolIndex.symbolsByName.get(member.name)!.push(member);
            });
        }
    });
}

/**
 * Find symbol at position
 */
function findSymbolAtPosition(document: TextDocument, position: Position): string | null {
    const text = document.getText();
    const lines = text.split('\n');
    const line = lines[position.line];

    if (!line) return null;

    // Simple word extraction at position
    const wordMatch = line.match(/\b\w+\b/g);
    if (!wordMatch) return null;

    let currentPos = 0;
    for (const word of wordMatch) {
        const wordStart = line.indexOf(word, currentPos);
        const wordEnd = wordStart + word.length;

        if (position.character >= wordStart && position.character <= wordEnd) {
            return word;
        }
        currentPos = wordEnd;
    }

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

    // Fallback to local file definitions
    const symbols = symbolIndex.symbolsByName.get(symbolName);
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

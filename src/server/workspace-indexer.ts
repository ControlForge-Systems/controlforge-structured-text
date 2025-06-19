/**
 * Workspace Symbol Indexer for Cross-File References
 * Handles file watching, workspace scanning, and indexing
 */

import * as fs from 'fs';
import * as path from 'path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Location, Range, FileChangeType } from 'vscode-languageserver';
import {
    WorkspaceSymbolIndex,
    STSymbolExtended,
    STDeclaration,
    FileSymbols,
    STSymbolKind,
    STScope,
    ASTNodeType
} from '../shared/types';
import { STASTParser } from './ast-parser';

export class WorkspaceIndexer {
    private index: WorkspaceSymbolIndex;
    private workspaceRoot: string | null = null;
    private indexedFiles: Set<string> = new Set();

    constructor() {
        this.index = {
            programs: new Map(),
            functions: new Map(),
            functionBlocks: new Map(),
            globalVariables: new Map(),
            fileSymbols: new Map(),
            symbolReferences: new Map(),
            lastUpdated: Date.now()
        };
    }

    /**
     * Initialize the workspace indexer with a root path
     */
    public initialize(workspaceRoot: string): void {
        this.workspaceRoot = workspaceRoot;
        this.scanWorkspace();
    }

    /**
     * Scan the entire workspace for ST files and build initial index
     */
    private async scanWorkspace(): Promise<void> {
        if (!this.workspaceRoot) return;

        try {
            console.log(`Starting workspace scan from: ${this.workspaceRoot}`);
            await this.scanDirectory(this.workspaceRoot);
            this.buildCrossReferences();
            console.log(`Workspace indexed: ${this.indexedFiles.size} files processed`);
            console.log(`Indexed files: ${Array.from(this.indexedFiles).join(', ')}`);
        } catch (error) {
            console.error('Error scanning workspace:', error);
        }
    }

    /**
     * Recursively scan directory for .st and .iecst files
     */
    private async scanDirectory(dirPath: string): Promise<void> {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Skip node_modules, .git, and other common directories
                if (!['node_modules', '.git', '.vscode', 'out', 'dist'].includes(entry.name)) {
                    await this.scanDirectory(fullPath);
                }
            } else if (entry.isFile() && this.isSTFile(entry.name)) {
                await this.indexFile(fullPath);
            }
        }
    }

    /**
     * Check if file is a Structured Text file
     */
    private isSTFile(filename: string): boolean {
        return filename.endsWith('.st') || filename.endsWith('.iecst');
    }    /**
     * Index a single file
     */
    public async indexFile(filePath: string): Promise<void> {
        try {
            console.log(`Indexing file: ${filePath}`);
            const content = await fs.promises.readFile(filePath, 'utf8');
            const uri = this.pathToUri(filePath);

            // Create a text document for parsing
            const document = TextDocument.create(uri, 'structured-text', 1, content);

            this.updateFileIndex(document);
            this.indexedFiles.add(filePath);
            console.log(`Successfully indexed: ${filePath}`);
        } catch (error) {
            console.error(`Error indexing file ${filePath}:`, error);
        }
    }

    /**
     * Update file index for a document
     */
    public updateFileIndex(document: TextDocument): void {
        const uri = document.uri;
        console.log(`WorkspaceIndexer: Updating file index for ${uri}`);

        // Remove existing symbols for this file
        this.removeFileFromIndex(uri);

        // Parse symbols from the document
        const parser = new STASTParser(document);
        const symbols = parser.parseSymbols();

        console.log(`WorkspaceIndexer: Parsed ${symbols.length} symbols`);

        // Log all symbols for verification
        symbols.forEach(symbol => {
            console.log(`  Symbol: ${symbol.name} (${symbol.kind}) - Type: ${symbol.dataType || 'unknown'}`);
        });

        // Update file symbols
        const fileSymbols: FileSymbols = {
            uri,
            symbols,
            lastModified: Date.now()
        };
        this.index.fileSymbols.set(uri, fileSymbols);

        // Add symbols to their respective categories and create normalized (lowercase) versions
        symbols.forEach(symbol => {
            this.categorizeSymbol(symbol);

            // Store normalized version for case-insensitive lookups
            if (symbol.normalizedName && symbol.normalizedName !== symbol.name) {
                console.log(`  Adding normalized symbol: ${symbol.normalizedName} (original: ${symbol.name})`);
            }
        });

        this.index.lastUpdated = Date.now();
    }

    /**
     * Remove a file from the index
     */
    public removeFileFromIndex(uri: string): void {
        const fileSymbols = this.index.fileSymbols.get(uri);
        if (!fileSymbols) return;

        // Remove symbols from category maps
        fileSymbols.symbols.forEach(symbol => {
            this.removeSymbolFromCategories(symbol, uri);
        });

        // Remove file entry
        this.index.fileSymbols.delete(uri);

        // Remove from indexed files tracking
        const filePath = this.uriToPath(uri);
        this.indexedFiles.delete(filePath);
    }

    /**
     * Categorize a symbol into the appropriate index maps
     */
    private categorizeSymbol(symbol: STSymbolExtended): void {
        console.log(`Categorizing symbol: ${symbol.name} (${symbol.kind}), type: ${symbol.dataType || 'unknown'}`);

        // Ensure we have a normalized name (lowercase)
        if (!symbol.normalizedName) {
            symbol.normalizedName = symbol.name.toLowerCase();
        }

        switch (symbol.kind) {
            case STSymbolKind.Program:
                // For programs, functions, and function blocks, store as extended symbols
                // We'll create a simplified declaration for the index
                this.index.programs.set(symbol.name, this.createDeclarationFromSymbol(symbol));
                // Also store with normalized name if different
                if (symbol.normalizedName !== symbol.name) {
                    this.index.programs.set(symbol.normalizedName, this.createDeclarationFromSymbol(symbol));
                }
                break;
            case STSymbolKind.Function:
                this.index.functions.set(symbol.name, this.createDeclarationFromSymbol(symbol));
                if (symbol.normalizedName !== symbol.name) {
                    this.index.functions.set(symbol.normalizedName, this.createDeclarationFromSymbol(symbol));
                }
                break;
            case STSymbolKind.FunctionBlock:
                this.index.functionBlocks.set(symbol.name, this.createDeclarationFromSymbol(symbol));
                if (symbol.normalizedName !== symbol.name) {
                    this.index.functionBlocks.set(symbol.normalizedName, this.createDeclarationFromSymbol(symbol));
                }
                break;
            case STSymbolKind.Variable:
                if (symbol.scope === STScope.Global) {
                    this.index.globalVariables.set(symbol.name, symbol);
                    if (symbol.normalizedName !== symbol.name) {
                        this.index.globalVariables.set(symbol.normalizedName, symbol);
                    }
                }

                // Special handling for string variables which may be missed
                if (symbol.dataType &&
                    (symbol.dataType.toUpperCase() === 'STRING' ||
                        symbol.dataType.toUpperCase() === 'WSTRING' ||
                        symbol.dataType.toUpperCase().startsWith('STRING[') ||
                        symbol.dataType.toUpperCase().startsWith('WSTRING['))) {
                    console.log(`  Special handling for string variable: ${symbol.name}`);
                }

                // Note: Local variables are stored in fileSymbols and found via getAllSymbols()
                break;
        }
    }

    /**
     * Create a declaration from an extended symbol
     */
    private createDeclarationFromSymbol(symbol: STSymbolExtended): STDeclaration {
        return {
            type: this.getASTNodeType(symbol.kind),
            location: symbol.location.range,
            name: symbol.name,
            parameters: symbol.parameters,
            variables: symbol.members,
            returnType: symbol.returnType
        };
    }

    /**
     * Map symbol kind to AST node type
     */
    private getASTNodeType(kind: STSymbolKind): ASTNodeType {
        switch (kind) {
            case STSymbolKind.Program:
                return ASTNodeType.Program;
            case STSymbolKind.Function:
                return ASTNodeType.Function;
            case STSymbolKind.FunctionBlock:
                return ASTNodeType.FunctionBlock;
            default:
                return ASTNodeType.Identifier;
        }
    }

    /**
     * Remove symbol from category maps when file is removed
     */
    private removeSymbolFromCategories(symbol: STSymbolExtended, uri: string): void {
        // Only remove if the symbol belongs to this file
        if (symbol.location.uri !== uri) return;

        switch (symbol.kind) {
            case STSymbolKind.Program:
                this.index.programs.delete(symbol.name);
                break;
            case STSymbolKind.Function:
                this.index.functions.delete(symbol.name);
                break;
            case STSymbolKind.FunctionBlock:
                this.index.functionBlocks.delete(symbol.name);
                break;
            case STSymbolKind.Variable:
                if (symbol.scope === STScope.Global) {
                    this.index.globalVariables.delete(symbol.name);
                }
                break;
        }
    }

    /**
     * Build cross-references between symbols
     */
    private buildCrossReferences(): void {
        // Clear existing references
        this.index.symbolReferences.clear();

        // Scan all files for symbol references
        for (const fileSymbols of this.index.fileSymbols.values()) {
            this.buildFileReferences(fileSymbols);
        }
    }

    /**
     * Build references for symbols in a specific file
     */
    private buildFileReferences(fileSymbols: FileSymbols): void {
        // For now, we'll add the symbol definitions as references
        // In a more sophisticated implementation, we'd parse the actual usage
        fileSymbols.symbols.forEach(symbol => {
            const lowerCaseName = symbol.name.toLowerCase();
            if (!this.index.symbolReferences.has(lowerCaseName)) {
                this.index.symbolReferences.set(lowerCaseName, []);
            }
            this.index.symbolReferences.get(lowerCaseName)!.push(symbol.location);
        });
    }

    /**
     * Find symbol definition by name (cross-file lookup)
     * Uses case-insensitive matching as per IEC 61131-3 standard
     */
    public findSymbolDefinition(symbolName: string): Location[] {
        const locations: Location[] = [];
        const allSymbols = this.getAllSymbols();
        const normalizedName = symbolName.toLowerCase();

        console.log(`Workspace indexer looking for symbol: ${symbolName} (normalized: ${normalizedName})`);
        console.log(`Total symbols in workspace: ${allSymbols.length}`);

        // First, try finding exact case match
        const exactMatches = allSymbols.filter(symbol => symbol.name === symbolName);
        if (exactMatches.length > 0) {
            console.log(`Found ${exactMatches.length} exact case matches`);
            exactMatches.forEach(symbol => {
                locations.push(symbol.location);
                console.log(`  Found exact match: ${symbol.name} (${symbol.kind}) - Type: ${symbol.dataType || 'unknown'} in ${symbol.location.uri}`);
            });
        } else {
            // Fall back to case-insensitive matching
            console.log(`No exact matches, trying case-insensitive lookup`);
            const caseInsensitiveMatches = allSymbols.filter(symbol =>
                symbol.name.toLowerCase() === normalizedName ||
                (symbol.normalizedName && symbol.normalizedName === normalizedName)
            );

            caseInsensitiveMatches.forEach(symbol => {
                locations.push(symbol.location);
                console.log(`  Found case-insensitive match: ${symbol.name} (${symbol.kind}) - Type: ${symbol.dataType || 'unknown'} in ${symbol.location.uri}`);
            });

            // Special handling for string variables
            if (caseInsensitiveMatches.length === 0) {
                console.log(`Looking specifically for string variables matching: ${symbolName}`);
                const stringVarMatches = allSymbols.filter(symbol =>
                    (symbol.name.toLowerCase().includes(normalizedName) ||
                        (symbol.normalizedName && symbol.normalizedName.includes(normalizedName))) &&
                    symbol.dataType &&
                    (symbol.dataType.toUpperCase() === 'STRING' ||
                        symbol.dataType.toUpperCase() === 'WSTRING' ||
                        symbol.dataType.toUpperCase().startsWith('STRING[') ||
                        symbol.dataType.toUpperCase().startsWith('WSTRING['))
                );

                if (stringVarMatches.length > 0) {
                    console.log(`Found ${stringVarMatches.length} string variables that might match`);
                    stringVarMatches.forEach(symbol => {
                        locations.push(symbol.location);
                        console.log(`  Found string variable: ${symbol.name} (${symbol.dataType}) in ${symbol.location.uri}`);
                    });
                }
            }
        }

        return locations;
    }

    /**
     * Find symbols by name across the entire workspace
     */
    public findSymbolsByName(symbolName: string): STSymbolExtended[] {
        const symbols: STSymbolExtended[] = [];
        const allSymbols = this.getAllSymbols();

        allSymbols.forEach(symbol => {
            if (symbol.name.toLowerCase() === symbolName.toLowerCase()) {
                symbols.push(symbol);
            }
        });

        return symbols;
    }

    /**
     * Find all references for a symbol name.
     * @param symbolName The name of the symbol to find references for.
     * @returns An array of locations where the symbol is referenced.
     */
    public findSymbolReferences(symbolName: string): Location[] {
        return this.index.symbolReferences.get(symbolName.toLowerCase()) || [];
    }

    /**
     * Get all symbols from all indexed files
     */
    public getAllSymbols(): STSymbolExtended[] {
        const allSymbols: STSymbolExtended[] = [];

        for (const fileSymbols of this.index.fileSymbols.values()) {
            allSymbols.push(...fileSymbols.symbols);
        }

        return allSymbols;
    }

    /**
     * Get workspace statistics
     */
    public getIndexStats(): {
        fileCount: number;
        programCount: number;
        functionCount: number;
        functionBlockCount: number;
        globalVariableCount: number;
    } {
        return {
            fileCount: this.index.fileSymbols.size,
            programCount: this.index.programs.size,
            functionCount: this.index.functions.size,
            functionBlockCount: this.index.functionBlocks.size,
            globalVariableCount: this.index.globalVariables.size
        };
    }

    /**
     * Convert file path to URI
     */
    private pathToUri(filePath: string): string {
        return `file://${filePath.replace(/\\/g, '/')}`;
    }

    /**
     * Convert URI to file path
     */
    private uriToPath(uri: string): string {
        return uri.replace('file://', '').replace(/\//g, path.sep);
    }
}

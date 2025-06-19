/**
 * Workspace Symbol Indexer for Cross-File References
 * Handles file watching, workspace scanning, and persistent symbol indexing
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
     * Update index for a specific document (called when file changes)
     */
    public updateFileIndex(document: TextDocument): void {
        const uri = document.uri;

        // Remove existing symbols for this file
        this.removeFileFromIndex(uri);

        // Parse symbols from the document
        const parser = new STASTParser(document);
        const symbols = parser.parseSymbols();

        // Update file symbols
        const fileSymbols: FileSymbols = {
            uri,
            symbols,
            lastModified: Date.now()
        };
        this.index.fileSymbols.set(uri, fileSymbols);

        // Add symbols to their respective categories
        symbols.forEach(symbol => {
            this.categorizeSymbol(symbol);
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
        switch (symbol.kind) {
            case STSymbolKind.Program:
                // For programs, functions, and function blocks, store as extended symbols
                // We'll create a simplified declaration for the index
                this.index.programs.set(symbol.name, this.createDeclarationFromSymbol(symbol));
                break;
            case STSymbolKind.Function:
                this.index.functions.set(symbol.name, this.createDeclarationFromSymbol(symbol));
                break;
            case STSymbolKind.FunctionBlock:
                this.index.functionBlocks.set(symbol.name, this.createDeclarationFromSymbol(symbol));
                break;
            case STSymbolKind.Variable:
                if (symbol.scope === STScope.Global) {
                    this.index.globalVariables.set(symbol.name, symbol);
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
            if (!this.index.symbolReferences.has(symbol.name)) {
                this.index.symbolReferences.set(symbol.name, []);
            }
            this.index.symbolReferences.get(symbol.name)!.push(symbol.location);
        });
    }

    /**
     * Find symbol definition by name (cross-file lookup)
     */
    public findSymbolDefinition(symbolName: string): Location[] {
        console.log(`Searching for symbol: ${symbolName}`);
        console.log(`Index stats: ${JSON.stringify(this.getIndexStats())}`);

        const locations: Location[] = [];

        // Check programs
        const program = this.index.programs.get(symbolName);
        if (program) {
            console.log(`Found program: ${symbolName}`);
            // We need to find the original symbol to get the full location
            const originalSymbol = this.findOriginalSymbol(symbolName, STSymbolKind.Program);
            if (originalSymbol) {
                locations.push(originalSymbol.location);
            }
        }

        // Check functions
        const func = this.index.functions.get(symbolName);
        if (func) {
            console.log(`Found function: ${symbolName}`);
            const originalSymbol = this.findOriginalSymbol(symbolName, STSymbolKind.Function);
            if (originalSymbol) {
                locations.push(originalSymbol.location);
            }
        }

        // Check function blocks
        const fb = this.index.functionBlocks.get(symbolName);
        if (fb) {
            console.log(`Found function block: ${symbolName}`);
            const originalSymbol = this.findOriginalSymbol(symbolName, STSymbolKind.FunctionBlock);
            if (originalSymbol) {
                locations.push(originalSymbol.location);
            }
        }

        // Check global variables
        const globalVar = this.index.globalVariables.get(symbolName);
        if (globalVar) {
            console.log(`Found global variable: ${symbolName}`);
            locations.push(globalVar.location);
        }

        // Check local variables in all files
        console.log(`Checking ${this.index.fileSymbols.size} files for local symbols`);
        for (const [fileUri, fileSymbols] of this.index.fileSymbols.entries()) {
            const matchingSymbols = fileSymbols.symbols.filter(symbol => symbol.name === symbolName);
            if (matchingSymbols.length > 0) {
                console.log(`Found ${matchingSymbols.length} symbols named '${symbolName}' in file: ${fileUri}`);
                matchingSymbols.forEach(symbol => {
                    console.log(`  - Symbol: ${symbol.name} (${symbol.kind}) at line ${symbol.location.range.start.line + 1}`);
                    if (!locations.some(loc =>
                        loc.uri === symbol.location.uri &&
                        loc.range.start.line === symbol.location.range.start.line
                    )) {
                        locations.push(symbol.location);
                    }
                });
            }
        }

        console.log(`Found ${locations.length} locations for ${symbolName}`);
        return locations;
    }

    /**
     * Find the original symbol in file symbols by name and kind
     */
    private findOriginalSymbol(symbolName: string, kind: STSymbolKind): STSymbolExtended | undefined {
        for (const fileSymbols of this.index.fileSymbols.values()) {
            for (const symbol of fileSymbols.symbols) {
                if (symbol.name === symbolName && symbol.kind === kind) {
                    return symbol;
                }
            }
        }
        return undefined;
    }

    /**
     * Find all references to a symbol (cross-file)
     */
    public findSymbolReferences(symbolName: string): Location[] {
        return this.index.symbolReferences.get(symbolName) || [];
    }

    /**
     * Get function block definition for instance type resolution
     */
    public getFunctionBlockDefinition(fbTypeName: string): STDeclaration | undefined {
        return this.index.functionBlocks.get(fbTypeName);
    }

    /**
     * Get all symbols in the workspace
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

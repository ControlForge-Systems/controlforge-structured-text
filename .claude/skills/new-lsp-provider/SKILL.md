---
name: new-lsp-provider
description: Scaffold a new LSP feature provider for the ControlForge Structured Text language server (semantic tokens, inlay hints, call/type hierarchy, go-to-type-definition, selection range, document symbols, etc.). Use this whenever an issue asks for a new editor capability that the language server must answer via an LSP request. It creates the provider module, declares its capability and wires its request handler in src/server/server.ts, optionally extends the workspace indexer for cross-file data, and adds a mirroring unit test.
---

# New LSP Provider

Add a new feature provider to the Structured Text language server. Providers are plain classes (or exported functions) under `src/server/providers/` that take a `TextDocument` plus the indexes and return LSP result types. `server.ts` owns the connection: it declares the capability in the `InitializeResult` and forwards the matching `connection.onX(...)` request to the provider.

## Read first

- `CLAUDE.md` - architecture, build, testing, conventions (4-space indent, explicit types, no `any`, kebab-case files, PascalCase classes).
- `src/server/server.ts` - the registration point. See lines 84-105 (the `result.capabilities` object) and the `connection.onDefinition` / `connection.onHover` / `connection.onCompletion` handlers below it.
- An existing provider to mirror: `src/server/providers/definition-provider.ts` (class `EnhancedDefinitionProvider`) or `src/server/providers/diagnostics-provider.ts` (exported `computeDiagnostics` function).
- `src/server/workspace-indexer.ts` - `WorkspaceIndexer` (cross-file symbols) and `src/shared/types.ts` (`SymbolIndex`, `STSymbolExtended`, `STSymbolKind`).

## Steps

1. **Create the provider.** Add `src/server/providers/<feature>-provider.ts`. Follow an existing provider's shape: a `PascalCase` class constructed once in `server.ts`, with a public `provide<Feature>(document, position, workspaceIndexer, symbolIndex)` method that returns the LSP result type for the request. Reuse `WorkspaceIndexer` for cross-file lookups and the local `SymbolIndex` for the open file, exactly as `EnhancedDefinitionProvider.provideDefinition` does. Keep all parsing/text-scanning helpers private to the class.

2. **Instantiate the provider in `src/server/server.ts`.** Add the import next to the existing provider imports (lines 27-34) and construct it alongside the other singletons (lines 59-62), e.g.:
   ```ts
   import { SelectionRangeProvider } from './providers/selection-range-provider';
   // ...
   const selectionRangeProvider = new SelectionRangeProvider();
   ```

3. **Declare the capability.** This is the registration point. Inside `connection.onInitialize`, add the capability flag to the `result.capabilities` object (lines 84-105). Capabilities are declared exactly like the existing ones, e.g. `definitionProvider: true,` / `hoverProvider: true,`. Add a boolean flag or an options object in the same style:
   ```ts
   const result: InitializeResult = {
       capabilities: {
           textDocumentSync: TextDocumentSyncKind.Incremental,
           definitionProvider: true,
           hoverProvider: true,
           // new capability - same shape as the lines above
           selectionRangeProvider: true,
       }
   };
   ```

4. **Wire the request handler.** Below the existing handlers, forward the LSP request to the provider, mirroring `connection.onDefinition` (server.ts lines 259-291):
   ```ts
   connection.onSelectionRanges((params) => {
       const document = documents.get(params.textDocument.uri);
       if (!document) return [];
       return selectionRangeProvider.provideSelectionRanges(document, params.positions, workspaceIndexer, symbolIndex);
   });
   ```
   Import any new request param/result types from `vscode-languageserver/node` in the import block at the top of the file.

5. **Wire through `workspace-indexer.ts` only if cross-file symbol data is needed.** If the feature must resolve symbols defined in other files (type hierarchy, go-to-type-definition), add a query method to `WorkspaceIndexer` next to `findSymbolDefinition` / `findSymbolsByName` / `getAllSymbols` and call it from the provider. Local-only features (selection range, document-scoped tokens) can rely on the `SymbolIndex` passed from `server.ts` and skip this step.

6. **Add the unit test.** Create `src/test/unit/<feature>-provider.unit.test.ts` mirroring `src/test/unit/definition-provider.unit.test.ts`: Mocha `suite()` / `test()`, the `doc(uri, content)` helper, `makeSymbol(...)` and `localIndexWith(...)` helpers, and `setup()` to construct the provider. Assert the provider's return value directly - do not boot the server. Tests are discovered by the glob `**/*.unit.test.js` in compiled `out/`.

## Files to touch

- `src/server/providers/<feature>-provider.ts` (new)
- `src/server/server.ts` (import, instantiate, capability flag, request handler)
- `src/server/workspace-indexer.ts` (only if cross-file data is required)
- `src/test/unit/<feature>-provider.unit.test.ts` (new)

## Definition of Done

- New provider returns correct results for the feature; capability is declared in `result.capabilities` and the matching `connection.onX` handler delegates to the provider.
- Unit test added and asserts the provider output directly.
- `npm run test:unit` passes (all existing + new tests).
- `npm run webpack-prod` succeeds (the `dist/` bundle shipped in the `.vsix` builds clean).
- Conventional Commit, e.g. `feat: add selection range provider`. No Claude attribution trailers. ASCII only (no em/en dashes, smart quotes, or other non-keyboard glyphs).

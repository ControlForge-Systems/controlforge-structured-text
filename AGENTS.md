# Agent Instructions

## Project

VS Code extension for IEC 61131-3 Structured Text. LSP-based architecture with client-server split.

## Spec Compliance

Consult `docs/IEC61131_SPECIFICATION.md` before any language-related change. It is the authoritative source for keywords, operators, data types, standard function blocks, and vendor compatibility.

`src/iec61131_specification.ts` is a developer reference file only — not imported or bundled.

## Architecture

```
src/extension.ts                        - Extension entry, commands
src/validator.ts                        - Syntax validation
src/client/lsp-client.ts               - LSP client
src/server/server.ts                   - LSP server
src/server/ast-parser.ts               - AST parser (multi-line accumulator)
src/server/workspace-indexer.ts        - Workspace symbol indexing
src/server/providers/completion-provider.ts
src/server/providers/definition-provider.ts
src/server/providers/member-access-provider.ts
src/shared/types.ts                    - Shared type definitions
syntaxes/structured-text.tmLanguage.json - TextMate grammar
iec61131-definitions/                  - Standard FB definitions (runtime, must ship in .vsix)
samples/                               - User-facing example .st files
manual-tests/                          - Internal QA test fixtures by feature
```

## Data Flow

`STASTParser.parseSymbols()` -> consumed by `server.ts` (local SymbolIndex) and `workspace-indexer.ts` (WorkspaceSymbolIndex) -> providers consume indexed symbols for completion, definition, member-access.

## Build

```bash
npm run compile       # rm -rf out && tsc (dev/test output)
npm run webpack-prod  # rm -rf dist && webpack (production bundle)
npm run clean         # rm -rf out dist
```

- `out/` = tsc output for dev/tests, excluded from .vsix
- `dist/` = webpack bundle shipped in .vsix
- Both dirs cleaned before builds to prevent stale artifacts

## Testing

```bash
npm run test:unit     # compile + mocha unit tests (~44 tests, <1s)
npm run test:e2e      # compile + @vscode/test-electron (needs display)
npm test              # both
```

- Mocha with `suite()`/`test()`, files named `*.unit.test.ts`
- Test discovery via glob `**/*.unit.test.js` in compiled `out/`
- Pre-commit hook (husky) runs unit + e2e before every commit
- All changes must pass: `npm run test:unit` and `npm run webpack-prod`

## Conventions

- TypeScript, 4-space indent, explicit types (no `any`)
- Files: kebab-case. Functions: camelCase. Classes: PascalCase. Constants: UPPER_SNAKE_CASE
- Language ID: `structured-text`. Extensions: `.st`, `.iecst`
- Keywords are case-insensitive per IEC 61131-3
- Prefer built-in VS Code/Node APIs over external deps
- Async/await over raw promises
- Dispose all disposables via `context.subscriptions`

## Changelog

Follow [Keep a Changelog](https://keepachangelog.com/) with Fixed/Added/Changed/Removed sections. No severity labels. Concise, no implementation details. Unreleased work goes under `[Unreleased]`.

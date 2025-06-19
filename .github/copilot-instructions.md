# Copilot Instructions for ControlForge Structured Text Extension

## Project Overview
This is a VS Code extension providing comprehensive support for Structured Text (ST) programming language used in industrial automation and PLC programming according to IEC 61131-3 standard.

## CRITICAL: IEC 61131-3 Specification Compliance
**ALWAYS consult `docs/IEC61131_SPECIFICATION.md` before making any language-related changes.** This document is the authoritative source for:
- Correct Structured Text syntax, keywords, and operators
- Standard function blocks (TON, TOF, CTU, R_TRIG, etc.) and their members
- Data types (BOOL, INT, REAL, STRING, etc.) and type conversion rules
- Vendor compatibility notes and cross-platform considerations
- Standard functions and their proper usage

**Before suggesting any code changes:**
1. Reference the specification for correct IEC 61131-3 syntax
2. Ensure all language features conform to the specification
3. Consider vendor compatibility notes for cross-platform support
4. Never introduce syntax or elements that conflict with the specification
5. For function block member completion, use the standard FB definitions in the spec

## Code Style Guidelines
- Use TypeScript for all new code
- Follow 4-space indentation consistently
- Prefer explicit types over `any` - use proper typing
- Use descriptive variable and function names
- Follow ESLint configuration (if present)
- Include JSDoc comments for all public functions and classes

## Architecture Patterns
- Extension follows VS Code extension API patterns with Language Server Protocol (LSP)
- Main extension entry point: `src/extension.ts`
- **Client-Server Architecture**: LSP client in `src/client/` communicates with language server in `src/server/`
- Language features implemented via LSP providers for completion, definition, and member access
- Syntax highlighting via TextMate grammar: `syntaxes/structured-text.tmLanguage.json`
- Language configuration: `language-configuration.json`
- Workspace indexing for cross-file navigation and IntelliSense

## File Organization
```
/src/extension.ts           - Main extension activation and commands
/src/validator.ts           - Syntax validation logic
/src/parser.ts             - ST language parsing utilities
/src/client/lsp-client.ts  - Language Server Protocol client
/src/server/server.ts      - LSP server implementation
/src/server/ast-parser.ts  - AST parsing for semantic analysis
/src/server/workspace-indexer.ts - Workspace symbol indexing
/src/server/providers/     - LSP feature providers (completion, definition, etc.)
/src/shared/types.ts       - Shared type definitions
/syntaxes/                 - TextMate grammar files
/samples/                  - Sample ST code files (.st, .iecst)
/manual-tests/            - Manual test files for QA
/iec61131-definitions/     - Standard IEC 61131-3 function block definitions
/src/test/unit/            - Fast unit tests
/src/test/e2e/             - End-to-end integration tests
/docs/                     - Project documentation
/docs/IEC61131_SPECIFICATION.md - **AUTHORITATIVE IEC 61131-3 language specification**
```

## Naming Conventions
- **Files**: kebab-case (e.g., `structured-text.tmLanguage.json`)
- **Functions**: camelCase (e.g., `validateStructuredText`, `parseTokens`)
- **Classes**: PascalCase (e.g., `StructuredTextValidator`, `STParser`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_VALIDATION_TIMEOUT`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IValidationResult`)

## Language Support Specifics
- Support file extensions: `.st` and `.iecst`
- Language ID: `structured-text`
- Scope name: `source.structured-text`
- Comments: Line comments `//` and block comments `(* *)`
- Case-insensitive keywords (IF, THEN, ELSE, FOR, WHILE, etc.)
- Data types: BOOL, INT, REAL, STRING, ARRAY, STRUCT, etc.

## Testing Strategy
- **Unit Tests**: Fast, isolated tests in `src/test/unit/`
- **E2E Tests**: Integration tests in `src/test/e2e/`
- Use Mocha test framework with @vscode/test-electron
- Pre-commit hooks run all tests automatically
- Test files should end with `.test.ts` or `.unit.test.ts`

## Error Handling Patterns
```typescript
// Preferred error handling pattern
try {
    const result = await validateSyntax(document);
    return { success: true, data: result };
} catch (error) {
    vscode.window.showErrorMessage(`ST Validation failed: ${error.message}`);
    return { success: false, error: error.message };
}
```

## VS Code Extension Best Practices
- Use `vscode.window.showErrorMessage()` for user-facing errors
- Use `vscode.window.showInformationMessage()` for success messages
- Prefer async/await over promises
- Always dispose of disposables in extension context
- Use proper activation events (avoid `*` activation)

## Dependencies Management
- Prefer built-in VS Code APIs over external libraries
- Use @types/vscode for VS Code API types
- **LSP Dependencies**: `vscode-languageclient` and `vscode-languageserver` for language server protocol
- Keep devDependencies for development tools only
- Update package.json engines.vscode when using newer APIs
- Current engine requirement: `^1.100.0`

## Structured Text Language Rules
- Keywords are case-insensitive: `IF`, `if`, `If` all valid
- Support standard operators: `AND`, `OR`, `NOT`, `+`, `-`, `*`, `/`, `=`, `<>`, etc.
- Function blocks: `FUNCTION_BLOCK`, `END_FUNCTION_BLOCK`
- Functions: `FUNCTION`, `END_FUNCTION`
- Programs: `PROGRAM`, `END_PROGRAM`
- Variable declarations: `VAR`, `VAR_INPUT`, `VAR_OUTPUT`, `END_VAR`

## Code Generation Patterns
```typescript
// Command registration pattern
const disposable = vscode.commands.registerCommand('controlforge-structured-text.validateSyntax', () => {
    // Command implementation
});
context.subscriptions.push(disposable);

// Language provider registration (legacy - prefer LSP providers)
const provider = vscode.languages.registerHoverProvider('structured-text', {
    provideHover(document, position, token) {
        // Provider implementation
    }
});
context.subscriptions.push(provider);

// LSP Client activation pattern
import { activateLanguageServer, deactivateLanguageServer } from './client/lsp-client';

export function activate(context: vscode.ExtensionContext) {
    activateLanguageServer(context);
    // Other activation code
}

export function deactivate() {
    return deactivateLanguageServer();
}
```

## What NOT to Do
- Don't use `any` type unless absolutely necessary
- Don't commit .vsix files or node_modules to repository
- Don't use synchronous file operations in extension code
- Don't hardcode file paths - use VS Code workspace APIs
- Don't activate on `*` - use specific activation events
- Don't forget to dispose of resources in deactivate()

## Performance Considerations
- Use incremental parsing for large ST files
- Implement debouncing for real-time validation
- Cache validation results when appropriate
- Use VS Code's built-in tokenization when possible

## Documentation Standards
- All public APIs must have JSDoc comments
- Update CHANGELOG.md for user-facing changes
- Keep README.md current with features
- Include code examples in documentation

## Marketplace Readiness
- Ensure proper .vscodeignore excludes development files
- Include README.md, LICENSE, and CHANGELOG.md in package
- Use appropriate categories and keywords in package.json
- Maintain version compatibility with engines.vscode

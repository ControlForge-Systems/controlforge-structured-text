# Manual Test Files

This directory contains test files specifically designed for manual testing and quality assurance of the ControlForge Structured Text extension.

## Structure

### `/completion/` - IntelliSense & Completion Tests
Files for testing auto-completion features:
- `completion.st` - General completion testing
- `instance-members.st` - Function block member completion (dot notation)
- `lsp.st` - Basic Language Server Protocol completion features
- `lsp-stage2.st` - Advanced LSP completion and feature testing

### `/navigation/` - Code Navigation Tests  
Files for testing go-to-definition and find-references:
- `member-access.st` - Member access navigation testing
- `navigation-targets.st` - Cross-file navigation targets
- `local-vars.st` - Local variable navigation and indexing
- `find-references.st` - Find All References (Shift+F12) testing

### `/syntax/` - Syntax Highlighting Tests
Files for testing syntax highlighting and language features:
- `highlighting.st` - Comprehensive syntax highlighting verification
- `literals.st` - Literal value highlighting (numbers, strings, etc.)
- `function-blocks.st` - Function block syntax highlighting
- `test.st` - General syntax and language feature testing
- `test.iecst` - Verify `.iecst` extension activates correctly

### `/rename/` - Rename Symbol Tests
Files for testing F2 rename functionality:
- `rename-symbols.st` - Rename variables, FB instances, functions; rejection of reserved names (keywords, data types, standard functions/FBs)

### `/commands/` - Extension Command Tests
Files for testing Command Palette commands:
- `commands.st` - Validate Syntax, Show Index Statistics, Check LSP Status

### `/diagnostics/` - Diagnostic & Linting Tests
Files for testing real-time diagnostics and semantic analysis:
- `semantic-checks.st` - Phase 2 semantic checks (missing semicolons, duplicates, undefined/unused vars, type mismatches)
- `code-action-fixes.st` - Quick fixes for semantic diagnostics (insert semicolon, remove duplicate, remove unused)

### `/formatting/` - Code Formatting Tests
Files for testing document and range formatting:
- `unformatted-input.st` - Unformatted input for Format Document testing
- `expected-output.st` - Expected result after formatting (idempotency check)
- `settings-variations.st` - Test formatting with different VS Code settings (keywordCase, operator spacing, alignment, etc.)

### `/snippets/` - Code Snippet Tests
Files for testing IEC 61131-3 code snippets:
- `snippets-test.st` - All snippet prefixes, expected expansions, and tab stop behaviour

### `/hover/` - Hover Tooltip Tests
Files for testing hover information and tooltips:
- `fb-hover-tooltips.st` - Standard function block hover tooltips with parameter tables, behavior, examples

## Purpose

These files are used by:
- QA teams for manual testing
- Developers for feature verification
- Regression testing of extension functionality
- Manual test plan execution

## Note

These are **test files**, not production examples. For learning Structured Text programming, see the `/samples/` directory instead.

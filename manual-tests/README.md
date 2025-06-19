# Manual Test Files

This directory contains test files specifically designed for manual testing and quality assurance of the ControlForge Structured Text extension.

## Structure

### `/completion/` - IntelliSense & Completion Tests
Files for testing auto-completion features:
- `test_completion.st` - General completion testing
- `test_instance_members.st` - Function block member completion (dot notation)
- `test-lsp.st` - Basic Language Server Protocol completion features
- `test-lsp-stage2.st` - Advanced LSP completion and feature testing

### `/navigation/` - Code Navigation Tests  
Files for testing go-to-definition and find-references:
- `test-member-access.st` - Member access navigation testing
- `test-navigation-targets.st` - Cross-file navigation targets
- `test-local-vars.st` - Local variable navigation and indexing

### `/syntax/` - Syntax Highlighting Tests
Files for testing syntax highlighting and language features:
- `test_highlighting.st` - Comprehensive syntax highlighting verification
- `test_literals.st` - Literal value highlighting (numbers, strings, etc.)
- `test_function_blocks.st` - Function block syntax highlighting
- `test.st` - General syntax and language feature testing

## Purpose

These files are used by:
- QA teams for manual testing
- Developers for feature verification
- Regression testing of extension functionality
- Manual test plan execution

## Note

These are **test files**, not production examples. For learning Structured Text programming, see the `/samples/` directory instead.

# ControlForge Structured Text

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ControlForgeSystems.controlforge-structured-text?label=VS%20Marketplace&color=0066b8)](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ControlForgeSystems.controlforge-structured-text)](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)

Professional **Structured Text (IEC 61131-3)** development environment for **PLC programming** in Visual Studio Code.

![ControlForge Structured Text Demo](images/demo.gif)

## Key Features

- **Code Formatting**: Format Document, Format Selection, configurable keyword casing, operator spacing, VAR alignment
- **Real-time Diagnostics**: Errors and warnings as you type — missing semicolons, type mismatches, undefined/unused variables, unmatched blocks
- **Code Actions & Quick Fixes**: One-click fixes for missing END blocks, semicolons, duplicate/unused declarations, unclosed strings
- **Rename Symbol (F2)**: Rename variables, functions, FBs, programs with IEC 61131-3 validation
- **Go to Definition & Find References**: Cross-file symbol navigation
- **Function Block IntelliSense**: Auto-complete for FB members (`myTimer.Q`, `upCounter.CV`)
- **Rich Syntax Highlighting**: Complete IEC 61131-3 language support
- **Smart Code Completion**: Context-aware suggestions for keywords, types, and variables
- **Workspace Indexing**: Automatic cross-file symbol discovery and resolution
- **Code Snippets**: Pre-built templates for common PLC patterns

## Getting Started

### Installation
1. Open **Visual Studio Code**
2. Go to **Extensions** (`Ctrl+Shift+X`)
3. Search for **"ControlForge Structured Text"**
4. Click **Install**

### Commands

Access via the Command Palette (`Ctrl+Shift+P`):

- **ControlForge Structured Text: Validate Syntax** - Check current file for syntax errors
- **ControlForge Structured Text: Check LSP Status** - Verify Language Server is running
- **ControlForge Structured Text: Show Index Statistics** - Display indexed workspace symbols

### Quick Start
1. Create a new file with `.st` or `.iecst` extension
2. Start typing - syntax highlighting activates automatically
3. Use `Ctrl+Space` for IntelliSense completion
4. Type function block instances followed by `.` for member completion

### Function Block Completion Example
```st
PROGRAM MyProgram
VAR
    startTimer : TON;          // Timer On-Delay
    partCounter : CTU;         // Counter Up
    emergencyStop : R_TRIG;    // Rising Edge Trigger
END_VAR

// IntelliSense in action:
startTimer.     // Shows: Q (BOOL), ET (TIME)
partCounter.    // Shows: Q (BOOL), CV (INT)
emergencyStop.  // Shows: Q (BOOL)
END_PROGRAM
```

## Language Features

### Smart IntelliSense
- **Function Block Members**: Auto-complete for all standard IEC 61131-3 function blocks
  - Timers: `TON`, `TOF`, `TP` → `Q`, `ET`
  - Counters: `CTU`, `CTD`, `CTUD` → `Q`, `CV`, `QU`, `QD`
  - Edge Detectors: `R_TRIG`, `F_TRIG` → `Q`
  - Bistables: `RS`, `SR` → `Q1`
- **Keyword Completion**: All IEC 61131-3 keywords and constructs
- **Data Type Suggestions**: `BOOL`, `INT`, `REAL`, `TIME`, `STRING`, etc.
- **Variable Detection**: Automatically detects declared variables
- **Code Snippets**: Templates for common patterns (IF-THEN, FOR loops, etc.)

### Navigation
- **Go to Definition**: Jump to symbol declarations across files
- **Find References**: Locate all usages of a symbol
- **Rename Symbol (F2)**: Rename with IEC 61131-3 validation — rejects keywords, data types, standard functions
- **Member Access Navigation**: Navigate from `instance.member` to FB definitions
- **Hover Information**: Rich tooltips for standard FBs with parameter tables, behavior, and usage examples

### Diagnostics
- **Real-time error detection**: Errors appear as you type with 300ms debounce
- **Unmatched blocks**: Missing `END_PROGRAM`, `END_IF`, `END_VAR`, etc.
- **Unclosed strings**: Single-quoted (`STRING`) and double-quoted (`WSTRING`)
- **Unmatched parentheses**: Per-line detection with string/comment awareness
- **Missing semicolons**: Detects missing `;` on statement lines in POU bodies
- **Duplicate declarations**: Same-name variables in the same scope (case-insensitive)
- **Undefined variables**: Identifiers used but not declared, with fuzzy "did you mean?" matching
- **Unused variables**: Local variables declared but never referenced in body
- **Type mismatches**: Incompatible assignments (e.g., STRING to INT, BOOL to INT)
- **Problems panel**: All diagnostics surface in `Ctrl+Shift+M` with source "ControlForge ST"
- **Case-insensitive**: Keyword matching per IEC 61131-3

### Code Actions & Quick Fixes
- **Missing END blocks**: Auto-insert `END_IF`, `END_FOR`, `END_WHILE`, `END_CASE`, `END_PROGRAM`, `END_FUNCTION`, `END_FUNCTION_BLOCK`, `END_VAR`, etc.
- **Unclosed strings**: Append closing quote (single or double) at end of line
- **Unmatched parentheses**: Insert missing closing `)` at end of expression
- **Missing semicolons**: Insert `;` at end of statement
- **Duplicate declarations**: Remove duplicate variable declaration line
- **Unused variables**: Remove unused variable declaration line
- **Light bulb menu**: Fixes appear via `Ctrl+.` or clicking the light bulb icon

### Code Formatting
- **Format Document**: Format entire file via Command Palette (`Ctrl+Shift+P` > Format Document)
- **Format Selection**: Format only selected code
- **Keyword casing**: Configurable UPPER, lower, or preserve
- **Operator spacing**: Automatic spaces around `:=`, `+`, `-`, `*`, `/`, `=`, `<>`, `<=`, `>=`
- **Indentation**: Automatic block-level indent for IF/FOR/WHILE/CASE/REPEAT, VAR sections, POU bodies
- **VAR alignment**: Align colon positions across declarations in VAR blocks
- **Trailing whitespace**: Automatic removal
- **Settings**: All formatting options configurable via `structured-text.format.*`

### Syntax Highlighting
- **Keywords**: `IF`, `THEN`, `ELSE`, `FOR`, `WHILE`, `CASE`, `VAR`, `END_VAR`
- **Data Types**: `BOOL`, `INT`, `REAL`, `TIME`, `STRING`, `ARRAY`, `STRUCT`
- **Operators**: `AND`, `OR`, `NOT`, `XOR`, `:=`, `+`, `-`, `*`, `/`
- **Comments**: `//` single-line and `(* *)` multi-line
- **Literals**: String, numeric (decimal, hex, binary), time literals
- **Function Blocks**: Standard IEC 61131-3 function blocks

### Editor Features
- **Auto-closing**: Brackets, quotes, and parentheses
- **Comment Toggle**: `Ctrl+/` for quick commenting
- **Word Matching**: Intelligent word selection and highlighting
- **File Association**: Automatic recognition of `.st` and `.iecst` files

## Supported File Extensions
- `.st` - Standard Structured Text files
- `.iecst` - IEC 61131-3 Structured Text files

## Requirements
- **Visual Studio Code** 1.100.0 or higher
- **Operating System**: Windows, macOS, or Linux

## What's New in v1.3.0
- **Rich FB Hover Tooltips**: Standard function blocks show parameter tables, behavior descriptions, and usage examples on hover
- **Advanced Diagnostics**: Missing semicolons, duplicate declarations, undefined variables, unused variables, type mismatches — all with quick fixes
- **Code Formatting**: Format Document and Format Selection with keyword casing, operator spacing, indentation, VAR alignment
- **Rename Symbol (F2)**: Rename variables, functions, FBs, programs with identifier validation and comment-awareness
- **Code actions & quick fixes**: Auto-insert missing END blocks, close unclosed strings, fix unmatched parentheses via light bulb menu
- **Real-time diagnostics**: Unmatched blocks, unclosed strings, unmatched parentheses shown in Problems panel as you type
- **Multi-line declaration parsing**: Arrays, structs, and complex initializers now parse correctly
- **366 unit tests**: Comprehensive coverage for all LSP providers, diagnostics, code actions, rename, and formatting

## What's New in v1.2.5
- **Multi-line declaration parsing**: Arrays, structs, and complex initializers now parse correctly
- **VAR qualifier support**: `VAR_GLOBAL CONSTANT`, `VAR RETAIN`, etc.
- **Complex type support**: `STRING[n]`, `POINTER TO`, `REFERENCE TO`, multi-dim `ARRAY`
- **Case-insensitive symbol lookup**: IEC 61131-3 compliant across all symbol types
- **Memory leak fix**: Proper index cleanup on file close, debounced re-parsing
- **Performance**: 300ms debounce on document changes

## What's New in v1.2.0
- **Go to Definition & Find References**: Cross-file symbol navigation
- **Language Server Protocol (LSP)**: Full client-server architecture
- **Member Access Navigation**: Navigate from instance members to definitions
- **Workspace Indexing**: Automatic cross-file symbol discovery
- **IEC 61131-3 Definition Files**: Standard FB definitions for hover and completion

## Support & Feedback

- **Website**: [controlforge.dev](https://controlforge.dev/)
- **Issues**: [GitHub Issues](https://github.com/ControlForge-Systems/controlforge-structured-text/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ControlForge-Systems/controlforge-structured-text/discussions)
- **Rate & Review**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)

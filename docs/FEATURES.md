# Features

## Code Completion & IntelliSense
- Function block member completion with dot notation (`myTimer.Q`, `upCounter.CV`)
- Context-aware keyword and data type suggestions
- Parameter templates with snippet placeholders for function calls
- Variable and function block instance completion from current document
- Code snippets for common control logic patterns

## Enhanced Hover Documentation
- Concise, VS Code-style hover tooltips for consistent developer experience
- Type information for variables: `variableName: TYPE`
- Function block type tooltips: `function block TYPE (Description)` 
- Function block instance tooltips: `instanceName: TYPE (Description)`
- Member tooltips with direction and type: `(DIRECTION) memberName: TYPE`
- Minimalist design matching VS Code's built-in TypeScript/JavaScript tooltips
- IEC 61131-3 compliant documentation for standard function blocks

## Code Navigation
- Go to Definition (F12) for variables, function blocks, and members
- Find All References across entire project
- Cross-file navigation between instances and standard library definitions
- Hover information for variables and function block members

## Syntax Validation
- Real-time error detection while typing
- IEC 61131-3 compliance checking
- Function block parameter validation
- Manual syntax validation command

## Language Support
- Syntax highlighting for Structured Text elements
- Support for .st and .iecst file formats
- Case-insensitive keyword recognition
- Comment toggling (line and block comments)

## Standard Function Blocks
- Complete IEC 61131-3 standard library support
- Timers: TON, TOF, TP
- Counters: CTU, CTD, CTUD  
- Edge detectors: R_TRIG, F_TRIG
- Bistables: RS, SR
- Built-in member definitions and documentation

## Development Environment
- Language Server Protocol architecture
- Multi-file project support
- Workspace-wide symbol indexing
- Cross-platform compatibility (Windows, macOS, Linux)

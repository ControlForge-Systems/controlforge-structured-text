# ControlForge Structured Text - VS Code Extension

A Visual Studio Code extension that provides support for PLC Structured Text (IEC 61131-3) programming.

## Features

- **Syntax Highlighting**: Comprehensive syntax highlighting for `.st` and `.iecst` files
- **Language Support**: Supports IEC 61131-3 Structured Text standard
- **Commands**: 
  - `ControlForge Structured Text: Hello World` - Sample command
  - `ControlForge Structured Text: Validate Syntax` - Basic syntax validation

## Supported File Extensions

- `.st` - Structured Text files
- `.iecst` - IEC Structured Text files

## Language Features

- Syntax highlighting for:
  - Keywords (IF, THEN, ELSE, FOR, WHILE, etc.)
  - Data types (BOOL, INT, REAL, STRING, etc.)
  - Operators (AND, OR, NOT, arithmetic operators)
  - Comments (// and (* *))
  - String literals
  - Numeric literals (decimal, hex, binary, octal)

- Language configuration:
  - Auto-closing pairs for brackets and quotes
  - Comment toggling support
  - Word pattern matching

## Development

### Setup

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press `F5` to open a new Extension Development Host window
4. Open a `.st` or `.iecst` file to see syntax highlighting in action

### Building

```bash
npm run compile
```

### Watching for changes

```bash
npm run watch
```

## Usage

1. Install the extension
2. Open any `.st` or `.iecst` file
3. Enjoy syntax highlighting and language features
4. Use the Command Palette (`Ctrl+Shift+P`) to access ControlForge Structured Text commands

## Requirements

- Visual Studio Code 1.74.0 or higher

## License

This extension is licensed under the **Business Source License 1.1 (BUSL-1.1)**.

**Copyright (c) 2025 Michael Distel**

Under the BUSL-1.1, you are granted the right to copy, modify, create derivative works, and use the "ControlForge Structured Text" extension for any purpose, except for any use that is prohibited by the Additional Use Grant (currently "None").

This license will automatically convert to the **GNU General Public License v3.0 or later (GPL-3.0-or-later)** on **June 9, 2029**. After this date, the software will be governed by the terms of the GPL-3.0-or-later.

For the full license text, please see the [LICENSE](LICENSE) file in this repository.

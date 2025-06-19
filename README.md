# ControlForge Structured Text

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ControlForgeSystems.controlforge-structured-text)](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ControlForgeSystems.controlforge-structured-text)](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)

Professional **Structured Text (IEC 61131-3)** development environment for **PLC programming** in Visual Studio Code.

## ✨ Key Features

- 🎯 **Function Block IntelliSense**: Auto-complete for FB outputs (`myTimer.Q`, `upCounter.CV`)
- 🔍 **Go to Definition & Find References**: Navigate through code with member access support
- 🌈 **Rich Syntax Highlighting**: Complete IEC 61131-3 language support
- 💡 **Smart Code Completion**: Context-aware suggestions for keywords, types, and variables
- ℹ️ **Hover Information**: Detailed tooltips for variables and function block members
- 🔧 **Code Validation**: Built-in syntax validation and error detection
- 📝 **Code Snippets**: Pre-built templates for common PLC patterns

## 📸 Screenshots

### Syntax Highlighting & IntelliSense
![Syntax Highlighting](images/syntax-highlighting.png)
*Rich syntax highlighting for all IEC 61131-3 constructs*

## 🚀 Getting Started

### Installation
1. Open **Visual Studio Code**
2. Go to **Extensions** (`Ctrl+Shift+X`)
3. Search for **"ControlForge Structured Text"**
4. Click **Install**

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

## 📋 Language Features

### 🧠 Smart IntelliSense
- **Function Block Members**: Auto-complete for all standard IEC 61131-3 function blocks
  - Timers: `TON`, `TOF`, `TP` → `Q`, `ET`
  - Counters: `CTU`, `CTD`, `CTUD` → `Q`, `CV`, `QU`, `QD`
  - Edge Detectors: `R_TRIG`, `F_TRIG` → `Q`
  - Bistables: `RS`, `SR` → `Q1`
- **Keyword Completion**: All IEC 61131-3 keywords and constructs
- **Data Type Suggestions**: `BOOL`, `INT`, `REAL`, `TIME`, `STRING`, etc.
- **Variable Detection**: Automatically detects declared variables
- **Code Snippets**: Templates for common patterns (IF-THEN, FOR loops, etc.)

### 🎨 Syntax Highlighting
- **Keywords**: `IF`, `THEN`, `ELSE`, `FOR`, `WHILE`, `CASE`, `VAR`, `END_VAR`
- **Data Types**: `BOOL`, `INT`, `REAL`, `TIME`, `STRING`, `ARRAY`, `STRUCT`
- **Operators**: `AND`, `OR`, `NOT`, `XOR`, `:=`, `+`, `-`, `*`, `/`
- **Comments**: `//` single-line and `(* *)` multi-line
- **Literals**: String, numeric (decimal, hex, binary), time literals
- **Function Blocks**: Standard IEC 61131-3 function blocks

### 🔧 Editor Features
- **Auto-closing**: Brackets, quotes, and parentheses
- **Comment Toggle**: `Ctrl+/` for quick commenting
- **Word Matching**: Intelligent word selection and highlighting
- **File Association**: Automatic recognition of `.st` and `.iecst` files

## 💻 Supported File Extensions
- `.st` - Standard Structured Text files
- `.iecst` - IEC 61131-3 Structured Text files

## ⚙️ Requirements
- **Visual Studio Code** 1.100.0 or higher
- **Operating System**: Windows, macOS, or Linux

## 🛠️ Commands
Access these commands via the Command Palette (`Ctrl+Shift+P`):
- **"ControlForge Structured Text: Validate Syntax"** - Check code for syntax errors
- **"ControlForge Structured Text: Show Index Statistics"** - Display workspace indexing information

## 🧩 Advanced Language Server Features (v1.2.0+)

### 🔍 Code Navigation
- **Go to Definition** (`F12` or `Ctrl+Click`): Navigate to variable, function block, and member declarations
- **Member Access Navigation**: Jump from `instance.member` to their definitions in function blocks
- **Cross-file Navigation**: Navigate between files using Go to Definition
- **Hover Information**: Detailed tooltips with type and scope information for variables and members

### 🧠 Intelligent Analysis
- **Workspace Symbol Indexing**: Analyzes all `.st` and `.iecst` files in your workspace
- **Cross-Reference Support**: Find all references to variables and function blocks
- **Standard Library Integration**: Navigate to standard IEC 61131-3 function block definitions
- **Context-Aware Completions**: Smarter suggestions based on scope and context

### ⚡ Performance Features
- **Background Processing**: Non-blocking language server for responsive editing
- **Incremental Updates**: Only reanalyzes changed files for better performance
- **On-Demand Navigation**: Efficient symbol resolution without workspace-wide scans
- **Smart Caching**: Remembers type information for quick lookups

## 📊 What's New in v1.2.0
- 🔍 **Go to Definition & Find References** - Navigate through your Structured Text code
- 🌐 **Language Server Protocol Integration** - Advanced IDE features with LSP
- 🏭 **IEC 61131-3 Definition Files** - Standard function block support
- 🧩 **Cross-File Navigation** - Jump between files and references
- 📝 **Enhanced Documentation** - Comprehensive test guides and examples

## 📊 Previous Updates
- ✨ **v1.1.0: Function Block Member Completion** - Dot notation support
- 🔍 **Enhanced Parser** - Better variable and FB instance detection
- 🧪 **Comprehensive Testing** - Automated tests ensure reliability
- 📚 **Improved Documentation** - Better examples and guides

## 🤝 Support & Feedback

- 🌐 **Website**: [controlforge.dev](https://controlforge.dev/)
- 📧 **Issues**: [GitHub Issues](https://github.com/ControlForge-Systems/controlforge-structured-text/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ControlForge-Systems/controlforge-structured-text/discussions)
- ⭐ **Rate & Review**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)

## 📄 License

Licensed under the **Business Source License 1.1 (BUSL-1.1)**.  
For details, see [License Terms](https://controlforge.dev/license).

---

**Made with ❤️ for the PLC programming community**

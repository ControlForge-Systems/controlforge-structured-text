# ControlForge Structured Text

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ControlForgeSystems.controlforge-structured-text)](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ControlForgeSystems.controlforge-structured-text)](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)

Professional **Structured Text (IEC 61131-3)** development environment for **PLC programming** in Visual Studio Code.

## ✨ Key Features

- 🎯 **Function Block IntelliSense**: Auto-complete for FB outputs (`myTimer.Q`, `upCounter.CV`)
- 🌈 **Rich Syntax Highlighting**: Complete IEC 61131-3 language support
- 💡 **Smart Code Completion**: Context-aware suggestions for keywords, types, and variables
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
- **"Structured Text: Validate Syntax"** - Check code for syntax errors

## 📊 What's New in v1.1.0
- ✨ **Function Block Member Completion** - The headline feature!
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

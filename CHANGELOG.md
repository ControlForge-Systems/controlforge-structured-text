# Change Log

## [1.2.1] - 2025-06-19

### Fixed
- Language Server Protocol (LSP) activation issues
- Enhanced error handling for LSP initialization
- Added diagnostic tools for LSP status verification
- Improved server-client communication with detailed logging

## [1.2.0] - 2025-06-18

### Added
- Language Server Protocol (LSP) integration for advanced IDE features
- Go to Definition support for variables and function blocks
- Find References for all symbol types
- Improved navigation across multiple files
- Real-time code analysis and validation

### Improved
- Better cross-file symbol indexing and resolution
- Enhanced member access completion with type information
- More detailed hover information
- Optimized workspace symbol handling

## [1.1.0] - 2025-06-16

### Added
- **Function Block Instance Member Completion**: Auto-complete for function block output members
  - Dot notation support (e.g., `myTimer.Q`, `upCounter.CV`)
  - Support for all IEC 61131-3 standard function blocks (TON, TOF, TP, CTU, CTD, CTUD, R_TRIG, F_TRIG, RS, SR)
  - Type-aware suggestions with detailed descriptions
- Enhanced parser with function block instance extraction
- Enhanced code snippets and examples

### Improved
- Syntax highlighting with additional keywords (END_CONFIGURATION, END_RESOURCE)
- Better variable and function block detection
- Enhanced error handling and performance
- Updated documentation and testing infrastructure

### Fixed
- Missing syntax highlighting for configuration keywords
- Parser edge cases for variable declarations

## [1.0.1] - 2024-01-09 15:30:00

### Changed
- Updated publisher ID from ControlForge to ControlForgeSystems
- Removed Hello World sample command
- Improved extension description for marketplace listing
- Updated repository and website URLs

## [1.0.0] - 2024-01-09

### Added
- Initial release
- Syntax highlighting for Structured Text
- Basic syntax validation
- Support for .st and .iecst files
- IEC 61131-3 language features

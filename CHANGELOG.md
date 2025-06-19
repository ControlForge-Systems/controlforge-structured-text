# Change Log

## [1.2.0] - 2025-06-19

### Added
- **Go to Definition & Find References**: Navigate through Structured Text code
  - Member access navigation for function blocks (`instance.member` → definition)
  - Cross-file navigation between instances and library definitions
  - Smart hover information for variables and function block members
  - Comprehensive symbol indexing across workspace
- **Language Server Protocol (LSP) Integration**:
  - Client-server architecture for advanced IDE features
  - Workspace indexing for cross-file references
  - Enhanced symbol provider with member access support
- **IEC 61131-3 Definition Files**:
  - Standard function block definition files (TON, TOF, TP, CTU, etc.)
  - Enhanced documentation and specification compliance
  - Sample files and test cases for manual validation

### Improved
- Reorganized project structure with better separation of concerns
- Enhanced documentation with comprehensive test guides
- Better performance with smarter caching and incremental updates
- More robust parser with better error handling

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

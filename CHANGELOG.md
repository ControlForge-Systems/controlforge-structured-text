# Change Log

## [Unreleased]

### Fixed
- Parser regex fails on multi-line variable declarations (#41)
- Verbose console.log in definition provider polluting test and server output

### Added
- Rename Symbol (F2): rename variables, functions, FBs, programs with IEC 61131-3 validation, comment awareness (#28)
- Code actions and quick fixes: auto-insert missing END blocks, close unclosed strings, fix unmatched parentheses (#26)
- Real-time diagnostics with Problems panel integration: unmatched blocks, unclosed strings, unmatched parentheses (#27)
- AST parser rewrite with multi-line statement accumulator architecture (#41)
- 62 unit tests for workspace-indexer, member-access-provider, definition-provider, completion-provider (44 → 106 total) (#44)
- 45 unit tests for diagnostics provider (106 → 151 total) (#27)
- 31 unit tests for code action provider (151 → 182 total) (#26)
- 58 unit tests for rename provider (182 → 240 total) (#28)
- Clean build steps for compile and webpack scripts

### Changed
- Extracted `getExtensionPath` from server.ts into extension-path.ts for testability (#44)
- Updated all npm dependencies (TypeScript 4.9→5.9, webpack 5.99→5.105, node types 16→20) (#50)
- Removed legacy parser (`parser.ts`) and its tests

### Removed
- Stale documentation (FEATURES.md, MANUAL_TEST_GUIDE.md, RELEASE_PLAN.md, TESTING.md)
- Dead scripts (pretest, compile-test, test:watch, test:pre-commit)
- Stale files (test-local.sh, HOW_TO_TEST_LOCALLY.md)
- Stale branches (develop, feature/issue-5-rename-symbol-support)

## [1.2.5] - 2026-02-10

### Fixed
- Duplicate completion provider conflicts (#37)
- npm test failing in clean environments (#38)
- iec61131-definitions/ inaccessible in packaged extension (#39)
- Hardcoded workspace root breaking in renamed folders (#40)
- Inconsistent case-insensitive symbol lookup (#42)
- Memory leak from missing index cleanup on file close (#43)

### Changed
- Removed duplicate completion provider from extension client
- Extension path passed via LSP initialization instead of hardcoded lookup
- Normalized symbol names for IEC 61131-3 case-insensitive compliance
- Debounced document change handling for typing performance

## [1.2.4] - 2025-06-21

### Fixed
- Improved error handling for LSP client connection
- Fixed "Pending response rejected since connection got disposed" error
- Added proper shutdown sequence for LSP server process

### Changed
- Enhanced language server connection stability
- Improved error reporting for better diagnostics
- Completed migration to webpack bundling for better reliability

## [1.2.3] - 2025-06-21

### Fixed
- Comprehensive fix for LSP initialization error with vscode-languageclient module
- Improved module resolution with fallback mechanisms
- Enhanced error reporting for language server initialization issues

### Changed
- Migrated to webpack-based bundling for improved performance and reliability
- Reduced extension size by optimizing included dependencies
- Improved extension startup time by bundling code into fewer files

## [1.2.2] - 2025-06-21

### Fixed
- Critical bug fix: resolved LSP initialization error with vscode-languageclient module
- Added robust error handling for language server activation
- Added LSP status check command to verify Language Server Protocol is running

## [1.2.1] - 2025-06-19

### Fixed
- Language Server Protocol (LSP) activation issues
- Enhanced error handling for LSP initialization
- Added diagnostic tools for LSP status verification
- Improved server-client communication with detailed logging

## [1.2.0] - 2025-06-19

### Added
- **Go to Definition & Find References**: Navigate through Structured Text code
- **Member access navigation** for function blocks (instance.member → definition)
- **Cross-file navigation** between instances and library definitions
- Smart **hover information** for variables and function block members
- Comprehensive **symbol indexing** across workspace
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

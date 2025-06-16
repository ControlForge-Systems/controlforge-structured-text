# Change Log

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

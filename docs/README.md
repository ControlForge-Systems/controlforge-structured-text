# Documentation

This folder contains comprehensive documentation for the ControlForge Structured Text VS Code Extension.

## Main Documentation

- **[IEC61131_SPECIFICATION.md](./IEC61131_SPECIFICATION.md)** - High-level IEC 61131-3 Structured Text language specification
- **[language-reference/](./language-reference/)** - Detailed language reference documentation (see [index.md](./language-reference/index.md))
- **[FEATURES.md](./FEATURES.md)** - Extension features details

## Development Documentation

- **[TESTING.md](./TESTING.md)** - Testing strategy and git workflow
- **[MANUAL_TEST_GUIDE.md](./MANUAL_TEST_GUIDE.md)** - Step-by-step manual testing instructions

## Release Documentation

- **[releases/](./releases/)** - Release notes for all versions
- **[RELEASE_PLAN.md](./RELEASE_PLAN.md)** - Release planning and procedures
- **[MANUAL_QA_PLAN.md](./MANUAL_QA_PLAN.md)** - Quality assurance guidelines

## User Documentation

For end-user documentation, see the main [README.md](../README.md) in the project root.

## Language Reference Structure

The [language-reference/](./language-reference/) directory contains:

- **[index.md](./language-reference/index.md)** - Master index and overview
- **[st-language-overview.md](./language-reference/st-language-overview.md)** - Language introduction
- **[st-symbol-kinds.md](./language-reference/st-symbol-kinds.md)** - Symbol types and declarations
- **[st-ast-node-types.md](./language-reference/st-ast-node-types.md)** - AST structure definitions
- **[st-syntax-rules.md](./language-reference/st-syntax-rules.md)** - Formal syntax rules
- **[st-oop-features.md](./language-reference/st-oop-features.md)** - Object-oriented programming features
- **[st-examples.md](./language-reference/st-examples.md)** - Code examples
- **[st-compliance-notes.md](./language-reference/st-compliance-notes.md)** - IEC 61131-3 compliance
- **[st-implementation-guide.md](./language-reference/st-implementation-guide.md)** - Implementation details

## Runtime Dependencies

- **[iec61131-definitions/](../iec61131-definitions/)** - Standard function block definitions required for:
  - Member completion
  - Hover information
  - Navigation to definitions
  - **IMPORTANT**: Must be included in packaged extension (.vsix)

## Test Resources

- **[manual-tests/](../manual-tests/)** - Test files for manual verification of features
  - **[manual-tests/hover/](../manual-tests/hover/)** - Test files for hover tooltips
  - **[manual-tests/completion/](../manual-tests/completion/)** - Test files for code completion
  - **[manual-tests/navigation/](../manual-tests/navigation/)** - Test files for code navigation

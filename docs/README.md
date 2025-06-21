# Documentation

This folder contains comprehensive documentation for the ControlForge Structured Text VS Code Extension.

## Files

- **[IEC61131_SPECIFICATION.md](./IEC61131_SPECIFICATION.md)** - Complete IEC 61131-3 Structured Text language specification and reference
- **[TESTING.md](./TESTING.md)** - Testing strategy, commands, and git workflow documentation
- **[MANUAL_TEST_GUIDE.md](./MANUAL_TEST_GUIDE.md)** - Step-by-step manual testing instructions for extension features
- **[FEATURES.md](./FEATURES.md)** - Detailed information about extension features
- **[RELEASE_PLAN.md](./RELEASE_PLAN.md)** - Release planning and deployment procedures

## User Documentation

For end-user documentation, see the main [README.md](../README.md) in the project root.

## Development Documentation

Development-related documentation is organized as follows:
- Testing procedures: [TESTING.md](./TESTING.md) and [MANUAL_TEST_GUIDE.md](./MANUAL_TEST_GUIDE.md)
- Language specification: [IEC61131_SPECIFICATION.md](./IEC61131_SPECIFICATION.md) 
- Feature documentation: [FEATURES.md](./FEATURES.md)

## Runtime Dependencies

- **iec61131-definitions/**: This folder contains standard function block definitions required at runtime for:
  - Function block member completion
  - Hover information for standard FB members
  - Navigation to standard FB member definitions
  - **IMPORTANT**: This folder must be included in the packaged extension (.vsix)

## Release Notes

Release notes for each version are available in the [releases](./releases/) folder:
- [v1.2.2](./releases/v1.2.2.md) - Latest release with LSP stability fixes
- [v1.2.1](./releases/v1.2.1.md) - LSP improvement release
- [v1.2.0](./releases/v1.2.0.md) - Major LSP and navigation features
- [v1.1.0](./releases/v1.1.0.md) - Function block completion features
- Quality assurance: [MANUAL_QA_PLAN.md](./MANUAL_QA_PLAN.md)
- Release procedures: [RELEASE_PLAN.md](./RELEASE_PLAN.md)

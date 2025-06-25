# Structured Text Language Reference

This document provides a comprehensive reference for the Structured Text (ST) programming language as implemented in the ControlForge Structured Text extension. This reference adheres to the IEC 61131-3 standard and serves as the authoritative resource for all language-related development.

## Table of Contents

1. [Language Overview](./st-language-overview.md)
   - Purpose and Scope
   - General Principles
   - Document Conventions

2. [Language Elements](./st-language-elements.md)
   - Literals
   - Keywords
   - Operators
   - Basic Data Types

3. [Symbol Kinds and Declarations](./st-symbol-kinds.md)
   - Symbol Kinds
   - Declaration Types 
   - Variable Declaration Sections
   - Variable Qualifiers
   - Scoping Rules

4. [AST Node Types](./st-ast-node-types.md)
   - Common Node Properties
   - Expressions
   - Statements
   - Declarations
   - Program Organization Units

5. [Syntax Rules](./st-syntax-rules.md)
   - Lexical Rules
   - Program Organization Units (POUs)
   - Variable Declarations
   - Statements
   - Expressions
   - Programs, Functions, and Function Blocks

6. [Object-Oriented Programming](./st-oop-features.md)
   - Classes and Inheritance
   - Interfaces
   - Methods
   - Access Modifiers
   - Properties
   - Object Instantiation and Usage
   - AST Nodes for OOP Constructs

7. [Code Examples](./st-examples.md)
   - Program Examples
   - Function Examples
   - Function Block Examples
   - Class and Interface Examples
   - Advanced Usage Patterns

8. [IEC 61131-3 Compliance](./st-compliance-notes.md)
   - Standard Compliance
   - Extensions and Vendor-Specific Features
   - Compatibility Considerations

9. [Implementation Guide](./st-implementation-guide.md)
   - Implementation Considerations
   - Implementation-Dependent Features
   - Performance Recommendations
   - Version History

## Document Purpose

This reference document:
- Defines the grammar, syntax, and semantics of the Structured Text language
- Documents the Abstract Syntax Tree (AST) structure for parser implementation
- Serves as the canonical reference for all language features in the extension
- Provides examples of correct usage for common programming patterns
- Ensures consistent implementation across the codebase

All extension components that interact with Structured Text code (parser, validator, language server providers, etc.) should consult this reference to ensure compliance with the language specification.

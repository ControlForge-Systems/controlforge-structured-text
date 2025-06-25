# Structured Text Language Overview

## Introduction

Structured Text (ST) is a high-level textual programming language defined by the IEC 61131-3 standard for industrial automation and PLC programming. It resembles Pascal and other procedural programming languages with its block-structured approach and rich set of control flow statements.

This document provides an overview of the Structured Text language as implemented in the ControlForge Structured Text extension.

## Purpose and Scope

This language overview:

- Introduces the key concepts and principles of Structured Text programming
- Explains the organization of the language reference documentation
- Defines the document conventions used throughout the reference
- Establishes the canonical approach to language implementation

All extension components that interact with Structured Text code (parser, validator, language server providers, etc.) should follow the specifications detailed in the language reference.

## General Principles

Structured Text follows these general principles:

1. **Case Insensitivity**: Keywords, identifiers, and built-in functions are case-insensitive. For example, `IF`, `If`, and `if` are all valid and equivalent.

2. **Block-Structured**: Code is organized in blocks with clear beginning and ending markers (e.g., `IF...END_IF`, `FUNCTION...END_FUNCTION`).

3. **Strong Typing**: Variables must be declared with specific data types before use.

4. **Program Organization Units (POUs)**: Code is organized into Programs, Function Blocks, and Functions.

5. **Object-Oriented Features**: Edition 3 of the standard introduces classes, interfaces, and methods.

## Document Conventions

Throughout the language reference, the following conventions are used:

- **Keywords** are shown in `UPPERCASE` in syntax definitions
- **Optional elements** are enclosed in square brackets `[...]`
- **Repeated elements** are followed by an ellipsis `...`
- **Alternatives** are separated by a vertical bar `|`
- **Non-terminals** are shown in *italic*
- **Code examples** are shown in code blocks

### Syntax Notation

The syntax notation used in the language reference follows this format:

```
KEYWORD required_element [optional_element] (alternative1 | alternative2)
```

### Example Code

Code examples demonstrate correct usage patterns:

```
FUNCTION Add : INT
    VAR_INPUT
        a : INT;
        b : INT;
    END_VAR
    Add := a + b;
END_FUNCTION
```

## Documentation Structure

The language reference is divided into several interconnected documents:

1. **Language Elements**: Core elements like literals, keywords, operators
2. **Symbol Kinds and Declarations**: Symbol types, declaration sections, scoping
3. **AST Node Types**: Abstract Syntax Tree structure definitions
4. **Syntax Rules**: Comprehensive syntax specifications
5. **Object-Oriented Programming**: Classes, interfaces, methods, inheritance
6. **Code Examples**: Complete usage examples
7. **Compliance Notes**: IEC 61131-3 standard compliance information
8. **Implementation Guide**: Implementation-specific details and recommendations

Each document covers a specific aspect of the language to make navigation and reference easier.

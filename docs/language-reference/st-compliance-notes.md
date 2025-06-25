# IEC 61131-3 Compliance Notes

This document outlines how the ControlForge Structured Text extension adheres to the IEC 61131-3 standard and identifies any areas of extension or implementation-specific behavior.

## Standard Compliance

The ControlForge Structured Text extension is designed to comply with the IEC 61131-3 standard (Edition 3 and later) with specific attention to the following key aspects:

### 1. Case Insensitivity

All identifiers, keywords, and function names are case-insensitive as per the standard. For example, the following are all equivalent:
- `IF`, `If`, and `if`
- `PROGRAM`, `Program`, and `program`
- `MyVariable`, `MYVARIABLE`, and `myvariable`

The extension preserves original case for display purposes but treats identifiers as case-insensitive for all language processing.

### 2. Standard Data Types

The extension supports all standard data types defined in IEC 61131-3:

#### Elementary Types
- Boolean: `BOOL`
- Integer: `SINT`, `INT`, `DINT`, `LINT`, `USINT`, `UINT`, `UDINT`, `ULINT`
- Real: `REAL`, `LREAL`
- Time: `TIME`, `LTIME`, `DATE`, `LDATE`, `TIME_OF_DAY` (or `TOD`), `DATE_AND_TIME` (or `DT`)
- String: `STRING`, `WSTRING`, `CHAR`, `WCHAR`
- Bit strings: `BYTE`, `WORD`, `DWORD`, `LWORD`

#### Generic Types
- `ANY`
- `ANY_INT`
- `ANY_REAL`
- `ANY_BIT`
- `ANY_STRING`
- `ANY_DATE`
- `ANY_NUM`
- `ANY_ELEMENTARY`
- `ANY_DERIVED`
- `ANY_MAGNITUDE`
- `ANY_CHAR`
- `ANY_CHARS`

### 3. Standard Function Blocks

The extension provides built-in support for standard function blocks:

#### Timers
- `TON`: On-delay timer
- `TOF`: Off-delay timer
- `TP`: Pulse timer

#### Counters
- `CTU`: Up-counter
- `CTD`: Down-counter
- `CTUD`: Up-down counter

#### Triggers
- `R_TRIG`: Rising edge trigger
- `F_TRIG`: Falling edge trigger

#### Flip-flops
- `SR`: Set-dominant bistable
- `RS`: Reset-dominant bistable

### 4. Program Organization Units (POUs)

The extension fully supports the standard Program Organization Units:
- `PROGRAM`
- `FUNCTION_BLOCK`
- `FUNCTION`
- `CLASS` (Edition 3 and later)
- `INTERFACE` (Edition 3 and later)

### 5. Standard Language Elements

The extension implements all standard language elements including:
- Variable declarations and qualifiers
- Control structures (IF, CASE, FOR, WHILE, REPEAT)
- Expressions and operators
- Function and function block calls
- Object-oriented features (classes, interfaces, methods)

## Edition-Specific Features

The IEC 61131-3 standard has evolved through multiple editions, with significant changes introduced in Edition 3. The ControlForge Structured Text extension supports:

### Edition 2 Features
- All basic language elements and POUs
- Standard function blocks and data types
- Traditional procedural programming model

### Edition 3 Features
- Object-oriented programming constructs (classes, interfaces, methods)
- Access modifiers (`PUBLIC`, `PROTECTED`, `PRIVATE`)
- Method overriding and inheritance
- Property getters and setters
- Interface implementation

## Vendor Extensions

While strictly adhering to the IEC 61131-3 standard, the ControlForge Structured Text extension supports some common vendor extensions through configurable options:

### CODESYS Extensions
When enabled, the following CODESYS-specific extensions are supported:
- Attributes using curly braces: `{attribute 'name' := 'value'}`
- Extended string operations
- Additional library functions

### Siemens Extensions
When enabled, the following Siemens-specific extensions are supported:
- SCL-specific data types
- Siemens-specific system functions
- Block interface extensions

### Rockwell Extensions
When enabled, the following Rockwell-specific extensions are supported:
- AOI (Add-On Instruction) syntax elements
- Specific tag formats
- Parameter usage rules

## Extension Activation

Vendor-specific extensions can be enabled through pragma directives in the source code:

```
{* pragma: vendor=codesys *}
{* pragma: vendor=siemens *}
{* pragma: vendor=rockwell *}
```

These pragmas should be placed at the top of the file to ensure consistent parsing throughout the file.

## Compliance Levels

The ControlForge Structured Text extension defines the following compliance levels:

### Strict Standard Compliance
- Adheres strictly to IEC 61131-3 standard
- No vendor-specific extensions allowed
- Warnings issued for any non-standard constructs

### Standard with Common Extensions
- Adheres to IEC 61131-3 standard
- Allows common extensions that are widely supported
- Warns about vendor-specific extensions

### Vendor-Specific Mode
- Supports specific vendor extensions as configured
- May allow syntax that deviates from the standard
- Maintains compatibility with vendor-specific tools

## Compliance Checking

The extension provides compliance checking capabilities:

- **Standard Validation**: Checks code against the IEC 61131-3 standard
- **Vendor Compatibility**: Verifies compatibility with specific vendor implementations
- **Portability Analysis**: Identifies potential portability issues between platforms

## Standards Reference

The implementation is based on the following standards:

- IEC 61131-3:2013 (Edition 3)
- IEC 61131-3:2003 (Edition 2)

## Compatibility Notes

When migrating from other environments, consider the following compatibility notes:

### CODESYS Compatibility
- Most CODESYS ST code should work without modification
- Some advanced CODESYS features may require enabling vendor extensions
- Library function calls may have different semantics

### Siemens SCL Compatibility
- Basic SCL constructs map directly to standard ST
- Some Siemens-specific functions may require adaptation
- Data block access patterns differ from standard ST

### Rockwell Compatibility
- Basic ST constructs work seamlessly
- AOI-specific features may need vendor extensions enabled
- Tag naming conventions differ from standard ST

## Standard Deviations

For clarity, the following deviations from strict IEC 61131-3 compliance are present in the default configuration:

1. **Extended Comment Syntax**: In addition to standard `(* ... *)` comments, C-style `// ...` line comments are supported

2. **Enhanced Documentation Comments**: Special `(** ... *)` documentation comments for better IDE integration

3. **String Literals**: Both single quotes (`'...'`) and double quotes (`"..."`) are supported for string literals, while the standard only specifies single quotes

4. **Pragma Directives**: Support for special directives in comments: `{* pragma: ... *}` for controlling parser behavior

These deviations enhance developer experience while maintaining essential compatibility with the standard.

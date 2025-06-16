# IEC 61131-3 Structured Text Language Specification

> **IMPORTANT NOTICE FOR AI ASSISTANTS (GitHub Copilot, etc.)**  
> This document is the authoritative source for IEC 61131-3 Structured Text language specifications in the ControlForge project.
> Before suggesting code changes or additions related to IEC 61131-3 Structured Text:
> 1. Consult this specification document for correct syntax, keywords, operators, and standard elements
> 2. Ensure all suggestions conform to this specification
> 3. When adding new language features, update this document accordingly
> 4. Never introduce syntax or elements that conflict with this specification
> 5. For function block instance member completion, refer to the tables of standard function blocks and their members

This document contains standard definitions for the IEC 61131-3 Structured Text programming language, providing a centralized reference for use throughout the ControlForge Structured Text extension.

## Keywords

### Control Keywords

These keywords are used for control flow in Structured Text:

```
IF, THEN, ELSE, ELSIF, END_IF
CASE, OF, END_CASE
FOR, TO, BY, DO, END_FOR
WHILE, END_WHILE
REPEAT, UNTIL, END_REPEAT
EXIT, RETURN, CONTINUE
```

### Declaration Keywords

These keywords are used for declarations in Structured Text:

```
VAR, VAR_INPUT, VAR_OUTPUT, VAR_IN_OUT, VAR_TEMP
VAR_GLOBAL, VAR_ACCESS, VAR_CONFIG, VAR_EXTERNAL, END_VAR
CONSTANT, RETAIN, NON_RETAIN, PERSISTENT, AT
PROGRAM, END_PROGRAM
FUNCTION, END_FUNCTION
FUNCTION_BLOCK, END_FUNCTION_BLOCK
TYPE, END_TYPE
STRUCT, END_STRUCT
ARRAY, STRING, WSTRING
CONFIGURATION, END_CONFIGURATION
RESOURCE, END_RESOURCE
TASK
```

### Other Keywords

Other keywords in Structured Text:

```
TRUE, FALSE, NULL
THIS, SUPER
ABSTRACT, FINAL, IMPLEMENTS, EXTENDS
INTERFACE, METHOD, PROPERTY
NAMESPACE, USING, WITH
RESOURCE, ON, PRIORITY, SINGLE, INTERVAL
PROGRAM, WITH
VAR_GLOBAL, VAR_ACCESS
READ_WRITE, READ_ONLY, WRITE_ONLY
```

## Operators

### Logical Operators

```
AND, OR, XOR, NOT
```

### Comparison Operators

```
=, <>, <, >, <=, >=
```

### Arithmetic Operators

```
+, -, *, /, MOD, **
```

### Assignment Operators

```
:=
```

## Data Types

### Elementary Data Types

```
BOOL, BYTE, WORD, DWORD, LWORD
SINT, USINT, INT, UINT, DINT, UDINT, LINT, ULINT
REAL, LREAL
TIME, LTIME, DATE, LDATE, TIME_OF_DAY, TOD, DATE_AND_TIME, DT
STRING, WSTRING, CHAR, WCHAR
```

### Generic Data Types

```
POINTER, REFERENCE
ANY, ANY_DERIVED, ANY_ELEMENTARY, ANY_MAGNITUDE, ANY_NUM
ANY_REAL, ANY_INT, ANY_BIT, ANY_STRING, ANY_DATE
```

## Standard Function Blocks

### Timer Function Blocks

| Function Block | Members |
|---------------|---------|
| TON | IN, PT, Q, ET |
| TOF | IN, PT, Q, ET |
| TP | IN, PT, Q, ET |

### Counter Function Blocks

| Function Block | Members |
|---------------|---------|
| CTU | CU, R, PV, Q, CV |
| CTD | CD, LD, PV, Q, CV |
| CTUD | CU, CD, R, LD, PV, QU, QD, CV |

### Edge Detection Function Blocks

| Function Block | Members |
|---------------|---------|
| R_TRIG | CLK, Q |
| F_TRIG | CLK, Q |

### Bistable Function Blocks

| Function Block | Members |
|---------------|---------|
| RS | S, R1, Q1 |
| SR | S1, R, Q1 |

## Standard Functions

### Type Conversion Functions

```
BOOL_TO_INT, BOOL_TO_DINT, BOOL_TO_REAL, BOOL_TO_STRING
INT_TO_BOOL, INT_TO_DINT, INT_TO_REAL, INT_TO_STRING
DINT_TO_BOOL, DINT_TO_INT, DINT_TO_REAL, DINT_TO_STRING
REAL_TO_BOOL, REAL_TO_INT, REAL_TO_DINT, REAL_TO_STRING
STRING_TO_BOOL, STRING_TO_INT, STRING_TO_DINT, STRING_TO_REAL
```

### Numerical Functions

```
ABS, SQRT, LN, LOG, EXP
SIN, COS, TAN, ASIN, ACOS, ATAN
TRUNC, ROUND, CEIL, FLOOR
```

### String Functions

```
LEN, LEFT, RIGHT, MID, CONCAT, INSERT, DELETE, REPLACE, FIND
```

### Date and Time Functions

```
ADD_TIME, SUB_TIME, CONCAT_DATE_TOD
```

## Comment Patterns

- Single line comment: `//`
- Block comment start: `(*`
- Block comment end: `*)`

## Function Block Instance Member Access

Pattern: `myFunctionBlock.MemberName`

Example: `myTimer.Q`, `myCounter.CV`

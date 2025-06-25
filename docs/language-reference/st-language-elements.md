# Structured Text Language Elements

This document covers the fundamental elements that make up the Structured Text (ST) programming language according to the IEC 61131-3 standard.

## Basic Elements

### Case Sensitivity

According to the IEC 61131-3 standard, Structured Text is case-insensitive for identifiers, keywords, and function names. The following are equivalent:
- `IF`, `If`, `if`
- `myVariable`, `MYVARIABLE`, `MyVariable`

For consistent code style, the ControlForge Structured Text extension recommends using:
- UPPERCASE for keywords (e.g., `IF`, `THEN`, `FOR`)
- PascalCase for function blocks and programs (e.g., `MotorControl`)
- camelCase for variables (e.g., `motorSpeed`)

### Comments

Structured Text supports two comment styles:

- Line comments: Begin with `//` and continue to the end of the line
  ```
  // This is a line comment
  a := b + c; // This comment follows a statement
  ```

- Block comments: Enclosed between `(*` and `*)`
  ```
  (* This is a block comment
     that spans multiple lines *)
  ```

## Literals

Literals are fixed values that appear directly in the code.

### Integer Literals

Represent whole numbers without a decimal point:
```
123      // Decimal (base 10)
0        // Zero
-42      // Negative integer
16#FF    // Hexadecimal (base 16): 255
8#77     // Octal (base 8): 63
2#1010   // Binary (base 2): 10
```

### Real Literals

Represent floating-point numbers with a decimal point:
```
123.45   // Standard notation
-42.0    // Negative real
1.0E-6   // Scientific notation (0.000001)
1.0E+3   // Scientific notation (1000.0)
```

### Boolean Literals

Represent logical true or false values:
```
TRUE     // Logical true
FALSE    // Logical false
```

### String Literals

Represent text enclosed in single or double quotes:
```
'This is a string'
"This is also a string"
'String with ''escaped'' quote'   // Single quote escaped by doubling
```

### Time Literals

Represent time durations:
```
T#10s            // 10 seconds
TIME#10ms        // 10 milliseconds
T#1h30m          // 1 hour and 30 minutes
T#1d5h10m30s     // 1 day, 5 hours, 10 minutes, 30 seconds
```

### Date Literals

Represent calendar dates:
```
D#2023-12-31      // December 31, 2023
DATE#2023-12-31   // Same as above
```

### Date and Time Literals

Represent combined date and time values:
```
DT#2023-12-31-12:00:00           // December 31, 2023, 12:00:00
DATE_AND_TIME#2023-12-31-12:00:00 // Same as above
```

## Operators

### Arithmetic Operators

Perform mathematical calculations:
```
+      // Addition
-      // Subtraction
*      // Multiplication
/      // Division
**     // Exponentiation
MOD    // Modulo (remainder)
```

### Comparison Operators

Compare values and return boolean results:
```
=      // Equal to
<>     // Not equal to
<      // Less than
>      // Greater than
<=     // Less than or equal to
>=     // Greater than or equal to
```

### Logical Operators

Perform boolean logic operations:
```
AND    // Logical AND
OR     // Logical OR
XOR    // Logical exclusive OR
NOT    // Logical negation
```

### Bitwise Operators

Operate on bits within integer values:
```
&      // Bitwise AND
|      // Bitwise OR
^      // Bitwise XOR
NOT    // Bitwise negation
```

### Assignment Operator

Assigns values to variables:
```
:=     // Assignment
```

## Keywords

The following keywords are reserved and cannot be used as identifiers:

```
ACTION          END_ACTION      NOT            REPEAT
AND             END_CASE        OF             RETAIN
ARRAY           END_CLASS       OR             RETURN
AT              END_FOR         PRIVATE        S_BYTE
BY              END_FUNCTION    PROGRAM        S_DINT
CASE            END_IF          PROTECTED      S_INT
CLASS           END_INTERFACE   PUBLIC         S_SINT
CONFIGURATION   END_METHOD      READ_ONLY      S_WORD
CONSTANT        END_PROGRAM     READ_WRITE     THEN
DINT            END_REPEAT      REAL           THIS
DO              END_RESOURCE    RESOURCE       TO
DWORD           END_STEP        RETAIN         TOF
ELSE            END_STRUCT      RETURN         TON
ELSIF           END_TRANSITION  S_BYTE         TP
END             END_TYPE        S_DINT         TRANSITION
END_ACTION      END_WHILE       S_INT          TYPE
END_CASE        EXIT            S_SINT         UDINT
END_CLASS       EXTENDS         S_WORD         UINT
END_FOR         F_EDGE         SINT           UNTIL
END_FUNCTION    FALSE           STEP           USINT
END_IF          FOR             STRING         VAR
END_INTERFACE   FUNCTION        STRUCT         VAR_ACCESS
END_METHOD      FUNCTION_BLOCK  SUPER          VAR_CONFIG
END_PROGRAM     IF              TASK           VAR_EXTERNAL
END_REPEAT      IMPLEMENTS      THEN           VAR_GLOBAL
END_RESOURCE    IN              TIME           VAR_IN_OUT
END_STEP        INITIAL_STEP    TO             VAR_INPUT
END_STRUCT      INT             TOF            VAR_OUTPUT
END_TRANSITION  INTERFACE       TON            WHILE
END_TYPE        INTERNAL        TP             WITH
END_VAR         LINT            TRANSITION     WORD
END_WHILE       METHOD          TRUE           XOR
```

## Basic Data Types

Structured Text provides the following basic data types:

```
BOOL       // Boolean (TRUE or FALSE)
SINT       // Short integer (8 bits)
INT        // Integer (16 bits)
DINT       // Double integer (32 bits)
LINT       // Long integer (64 bits)
USINT      // Unsigned short integer (8 bits)
UINT       // Unsigned integer (16 bits)
UDINT      // Unsigned double integer (32 bits)
ULINT      // Unsigned long integer (64 bits)
REAL       // Single precision floating point (32 bits)
LREAL      // Double precision floating point (64 bits)
TIME       // Duration
DATE       // Calendar date
TIME_OF_DAY // Time of day
DATE_AND_TIME // Date and time
STRING     // Variable-length string
WSTRING    // Wide character string
BYTE       // Bit string of length 8
WORD       // Bit string of length 16
DWORD      // Bit string of length 32
LWORD      // Bit string of length 64
```

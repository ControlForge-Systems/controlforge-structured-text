# Symbol Kinds and Declarations

This document covers the various symbol kinds, declaration types, and scoping rules in the Structured Text programming language according to the IEC 61131-3 standard.

## Symbol Kinds

Structured Text programs define various kinds of symbols that represent different programming constructs:

| Symbol Kind | Description | Example |
|-------------|-------------|---------|
| `Program` | A program organization unit (POU) that can be executed by the PLC runtime | `PROGRAM MainProgram ... END_PROGRAM` |
| `Function` | A callable unit that returns a single value | `FUNCTION Add : INT ... END_FUNCTION` |
| `FunctionBlock` | A callable unit that maintains state between calls | `FUNCTION_BLOCK Counter ... END_FUNCTION_BLOCK` |
| `Variable` | A named storage location for data | `myVar : INT;` |
| `FunctionBlockInstance` | An instance of a function block | `myCounter : Counter;` |
| `Parameter` | A formal parameter to a function or function block | `VAR_INPUT speed : REAL; END_VAR` |
| `Constant` | A named value that cannot be changed | `VAR CONSTANT pi : REAL := 3.14159; END_VAR` |
| `Class` | An object-oriented template for creating objects | `CLASS Motor ... END_CLASS` |
| `Interface` | A contract defining methods to be implemented | `INTERFACE IMovable ... END_INTERFACE` |
| `Method` | A function associated with a class or interface | `METHOD Move : BOOL ... END_METHOD` |
| `Property` | A special accessor method pair for a class member | `PROPERTY Position : REAL ... END_PROPERTY` |

## Declaration Types

### Variable Declaration Sections

Structured Text provides several sections for declaring variables with different scopes and behaviors:

| Section | Description | Scope | Example |
|---------|-------------|-------|---------|
| `VAR` | Local variables | Local | `VAR temp : INT; END_VAR` |
| `VAR_INPUT` | Input parameters | Input | `VAR_INPUT start : BOOL; END_VAR` |
| `VAR_OUTPUT` | Output parameters | Output | `VAR_OUTPUT ready : BOOL; END_VAR` |
| `VAR_IN_OUT` | In/out parameters (by reference) | InOut | `VAR_IN_OUT buffer : ARRAY[0..10] OF INT; END_VAR` |
| `VAR_GLOBAL` | Global variables | Global | `VAR_GLOBAL systemState : INT; END_VAR` |
| `VAR_TEMP` | Temporary variables | Temp | `VAR_TEMP counter : INT; END_VAR` |
| `VAR_EXTERNAL` | External variables | External | `VAR_EXTERNAL alarmStatus : BOOL; END_VAR` |
| `VAR_ACCESS` | Access variables (networked) | Access | `VAR_ACCESS remoteState : INT; END_VAR` |
| `VAR_CONFIG` | Configuration variables | Config | `VAR_CONFIG mySystem.input AT %IW10 : INT; END_VAR` |

### Variable Qualifiers

These qualifiers can be added to variable declarations to modify their behavior:

| Qualifier | Description | Example |
|-----------|-------------|---------|
| `CONSTANT` | Declares a constant value that cannot be modified | `VAR CONSTANT PI : REAL := 3.14159; END_VAR` |
| `RETAIN` | Variable value is retained during power loss | `VAR RETAIN powerState : BOOL; END_VAR` |
| `PERSISTENT` | Retained during both power loss and program download | `VAR PERSISTENT configSettings : INT; END_VAR` |
| `AT` | Direct addressing of I/O or memory | `myInput AT %IX0.0 : BOOL;` |
| `READ_ONLY` | Can only be read, not written to | `VAR READ_ONLY serialNumber : STRING; END_VAR` |
| `READ_WRITE` | Can be both read and written (default) | `VAR READ_WRITE counter : INT; END_VAR` |

## Scope Rules

### Variable Visibility

The scope of a variable determines where it can be accessed:

1. **Local scope**: Variables declared with `VAR` are only accessible within their declaring Program Organization Unit (POU).

2. **Parameter scope**: 
   - `VAR_INPUT` parameters are read-only inside the POU
   - `VAR_OUTPUT` parameters are write-only inside the POU
   - `VAR_IN_OUT` parameters can be both read and written inside the POU

3. **Global scope**: Variables declared with `VAR_GLOBAL` are accessible from any POU that includes the global variable list.

4. **External scope**: Variables declared with `VAR_EXTERNAL` reference global variables declared elsewhere.

### Scoping in Classes and Methods

Classes introduce additional scoping rules:

1. **Class scope**: Variables declared in a class are accessible within all methods of that class.

2. **Method scope**: Variables declared within a method are only accessible within that method.

3. **Inheritance scope**: Variables and methods from a parent class are accessible in a child class based on their access modifiers.

### Access Modifiers

Access modifiers control the visibility of class members:

| Modifier | Description |
|----------|-------------|
| `PUBLIC` | Accessible from anywhere (default) |
| `PROTECTED` | Accessible within the class and its descendants |
| `PRIVATE` | Accessible only within the declaring class |
| `INTERNAL` | Accessible only within the current compilation unit |

## Variable Initialization

Variables can be initialized at declaration time:

```
VAR
    counter : INT := 0;              // Initialize to 0
    ready : BOOL := TRUE;            // Initialize to TRUE
    message : STRING := 'Ready';     // Initialize to string
    data : ARRAY[1..5] OF INT := [1,2,3,4,5];  // Initialize array
END_VAR
```

If no initialization is provided, variables are initialized to their default values (0, FALSE, empty string, etc.).

## Name Resolution and Qualified Access

When accessing variables, the following resolution rules apply:

1. Direct name: First searches the current scope, then outer scopes
   ```
   value := counter;  // Access variable directly
   ```

2. Qualified access: Explicitly specifies the scope or instance
   ```
   value := myFB.counter;  // Access through function block instance
   position := motor.position;  // Access through class instance
   ```

3. Fully qualified access: Uses the complete path
   ```
   value := Program1.myFB.counter;  // Fully qualified access
   ```

# IEC 61131-3 Structured Text Language Specification

> **IMPORTANT NOTICE FOR AI ASSISTANTS (GitHub Copilot, etc.)**
> This document is the authoritative source for IEC 61131-3 Structured Text language specifications in the ControlForge project.
> Before suggesting code changes or additions related to IEC 61131-3 Structured Text:
>
> 1. Consult this specification document for correct syntax, keywords, operators, and standard elements
> 2. Ensure all suggestions conform to this specification
> 3. When adding new language features, update this document accordingly
> 4. Never introduce syntax or elements that conflict with this specification
> 5. For function block instance member completion, refer to the tables of standard function blocks and their members

> **Disclaimer**
> This is an **unofficial specification** published by **ControlForge Systems**. It is not affiliated with, endorsed by, or approved by the **International Electrotechnical Commission (IEC)**. IEC and ControlForge Systems have no relationship. If you require the official IEC 61131-3 specification, it is available for purchase at: [https://webstore.iec.ch/publication/4552](https://webstore.iec.ch/publication/4552)
>

## 🚀 **Get Started with ControlForge Structured Text VS Code extension**

**ControlForge Structured Text VS Code extension** providing complete IEC 61131-3 support for industrial automation development. Join our growing community of automation engineers and developers!

### **📥 Install the Extension**
- **[VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ControlForgeSystems.controlforge-structured-text)** - Install the ControlForge Structured Text extension

### **🌐 Learn More & Get Support**
- **[ControlForge Systems Website](https://controlforge.dev/)** - Official website with tutorials and resources
- **[Documentation Hub](https://controlforge.dev/docs)** - Comprehensive guides, examples, and best practices
- **[GitHub Repository](https://github.com/ControlForge-Systems/controlforge-structured-text)** - Source code, contributions welcome
- **[Issues & Support](https://github.com/ControlForge-Systems/controlforge-structured-text/issues)** - Report bugs, request features, get help
- **[Project Roadmap](https://github.com/orgs/ControlForge-Systems/projects/1)** - See what's coming next and contribute ideas

### **💡 Why ControlForge?**
- **Complete IEC 61131-3 support** with syntax highlighting, IntelliSense, and validation
- **Cross-platform compatibility** guidance for multiple PLC vendors
- **Modern development workflow** with Git integration, CI/CD, and automated testing
- **Active community** of automation professionals and software developers

---

## Introduction to Structured Text (IEC 61131-3)

**Structured Text (ST)** is a high-level, Pascal-like programming language defined in the IEC 61131-3 standard for industrial automation. It is designed for expressing complex logic, reusable function blocks, calculations, and structured control programs in a readable, scalable form.

Unlike graphical languages like Ladder Diagram (LD) or Function Block Diagram (FBD), **ST is text-based**, making it ideal for software-style programming inside PLCs and industrial controllers. **Importantly, this also means ST can be integrated with modern technologies and development methodologies**, such as:

* **Version control systems** like Git (track changes, branches, CI/CD)
* **Automated code generation** and templating
* **Static analysis and linting tools**
* **AI-assisted development** (e.g. code suggestions via LSP or GitHub Copilot)
* **Scripting integration** with external tools (YAML, JSON, Python bridges)
* **Infrastructure-as-code and DevOps pipelines** for industrial systems

These capabilities make ST not just a PLC language, but a foundation for building maintainable, testable, and automatable control systems at scale.

You can develop Structured Text projects using any modern operating system (macOS, Linux, or Windows) and work in developer-friendly environments like VS Code, making it accessible to both automation engineers and software developers.

---

### Real-World Adoption

Structured Text is widely used in industries such as:

* **Manufacturing** – packaging machines, assembly lines, robotics
* **Water and utilities** – pumping stations, filtration, treatment plants
* **Energy** – power distribution, substations, battery management
* **Building automation** – HVAC, access control, lighting systems

Its adoption is growing thanks to platform support and better tooling.

| Platform / Vendor            | Structured Text Support                         |
| ---------------------------- | ----------------------------------------------- |
| **CODESYS (multiple OEMs)**  | Full IEC 61131-3 compliance + OOP               |
| **Siemens TIA Portal (SCL)** | Strong ST support, partial OOP                  |
| **Rockwell Studio 5000**     | ST in routines (via AOIs), no formal class      |
| **Beckhoff TwinCAT**         | Full ST support, simulation, AI tools           |
| **Schneider Modicon**        | ST via Machine Expert / Control Expert          |
| **Omron**                    | ST in Sysmac Studio                             |
| **B\&R Automation**          | Full ST via Automation Studio + CODESYS         |
| **ISaGRAF**                  | Supports ST, FBD, LD, and SFC                   |
| **OpenPLC / Soft-PLCs**      | ST support via open or autogenerated toolchains |

Structured Text is supported by virtually all modern PLC platforms. While the table lists some of the most widely used environments, ST is not limited to these. From high-end industrial controllers to open-source soft-PLCs, ST has become a standard part of nearly every automation ecosystem.

However, **each platform interprets the IEC 61131-3 standard slightly differently**, which makes code portability a challenge. Differences in syntax, library structure, function block behavior, or type handling mean that code often needs to be adapted when moving between platforms.

> **Note on IEC 61131-3 Languages**: IEC 61131-3 originally defined five programming languages: Structured Text (ST), Function Block Diagram (FBD), Ladder Diagram (LD), Sequential Function Chart (SFC), and Instruction List (IL). However, **Instruction List (IL) has been deprecated as of the 3rd Edition** and should be avoided in new projects. Use Structured Text or other graphical languages instead of IL for new development.

---

## Basic Syntax

### Comments

Structured Text supports two comment styles:

- **Single-line comments**: `// Comment text`
- **Block comments**: `(* Multi-line comment text *)`

> **Cross-Platform Note**: IEC supports both `//` for single-line and `(* ... *)` for block comments. Some tools may not handle nested block comments properly or allow comment placement in certain regions (e.g., before `VAR` blocks). Use `//` for single-line comments and avoid nesting block comments for maximum compatibility.

### Case Sensitivity

ST keywords are case-insensitive: `IF`, `if`, and `If` are all valid. However, user-defined identifiers (variables, function names) may be case-sensitive depending on the platform.

---

## Keywords

Structured Text (ST) is a strongly-typed, Pascal-style programming language defined in IEC 61131-3. It relies on a set of reserved keywords to define control flow, program structure, declarations, and behavior. These keywords form the core syntax of any ST program and cannot be used as identifiers.

### Control Keywords

Used to define logical and sequential flow in automation logic:

```
IF, THEN, ELSE, ELSIF, END_IF
CASE, OF, END_CASE
FOR, TO, BY, DO, END_FOR
WHILE, END_WHILE
REPEAT, UNTIL, END_REPEAT
EXIT, RETURN, CONTINUE
```

These keywords map closely to constructs found in high-level languages like Pascal or Ada. `IF`, `CASE`, and loops (`FOR`, `WHILE`, `REPEAT`) are staples of PLC logic, while `EXIT`, `RETURN`, and `CONTINUE` enhance flow control inside loops and functions. `CONTINUE` was introduced in the 3rd Edition.

#### Note on CONTINUE Keyword

The `CONTINUE` keyword was introduced in IEC 61131-3 Edition 3 to skip to the next iteration of a loop, similar to the `continue` statement in other programming languages. However, `CONTINUE` is **not universally supported** across all PLC platforms.

Some platforms (like Siemens TIA Portal or Rockwell Studio 5000) may not support `CONTINUE`, or restrict it to certain contexts. When writing cross-platform code, consider using alternative flow control structures (such as conditional logic with `IF` statements) to achieve the same behavior for maximum compatibility.

### Declaration Keywords

Used to define variables, functions, blocks, and types:

```
VAR, VAR_INPUT, VAR_OUTPUT, VAR_IN_OUT, VAR_TEMP
VAR_GLOBAL, VAR_ACCESS, VAR_CONFIG, VAR_EXTERNAL, END_VAR
CONSTANT, RETAIN, NON_RETAIN, PERSISTENT, AT
PROGRAM, END_PROGRAM
FUNCTION, END_FUNCTION
FUNCTION_BLOCK, END_FUNCTION_BLOCK
TYPE, END_TYPE
STRUCT, END_STRUCT
ARRAY
CONFIGURATION, END_CONFIGURATION
RESOURCE, END_RESOURCE
TASK
CLASS, END_CLASS
INTERFACE, END_INTERFACE
METHOD, END_METHOD
EXTENDS, IMPLEMENTS
PRIVATE, PROTECTED, PUBLIC, INTERNAL
NAMESPACE, END_NAMESPACE
USING
```

These keywords define the memory model, execution structure, and object orientation features (added in Edition 3). For instance, `VAR_INPUT` defines function block inputs, while `CLASS`, `METHOD`, and `INTERFACE` enable modular design with inheritance and encapsulation.

> **Cross-Platform Note**: Multiple VAR blocks behave differently across platforms. Some platforms allow multiple `VAR` sections inside the same POU; others require all declarations to be grouped. Group all variable declarations in a single `VAR` section per scope for maximum compatibility.

### Other Keywords

Additional constants and modifiers:

```
TRUE, FALSE, NULL
THIS, SUPER
ABSTRACT, FINAL
READ_WRITE, READ_ONLY, WRITE_ONLY
WITH, SINGLE, PRIORITY, ON, INTERVAL
```

These keywords support boolean logic, OOP semantics (`THIS`, `SUPER`), and access control in system design. `NULL` is used with `REFERENCE` types to indicate the absence of a target. Task-related keywords like `PRIORITY` and `INTERVAL` are used in task declarations (e.g., `TASK T1 (INTERVAL := t#100ms, PRIORITY := 1);`), though many vendors handle task timing via configuration GUI rather than requiring these keywords in user code.

### Real-World Use

Control keywords form the backbone of industrial automation logic:

- **`IF/THEN/ELSE`**: Used extensively for interlocks, safety conditions, and mode selection (e.g., manual vs. automatic operation)
- **`CASE`**: Ideal for state machines, alarm handling, and multi-step sequences (e.g., batch processes, packaging machine cycles)
- **`FOR` loops**: Common in array processing, multi-zone temperature control, and repetitive calculations
- **`WHILE` loops**: Used for data polling, communication retries, and conditional processing
- **`EXIT/RETURN`**: Critical for early termination in safety scenarios and error handling

Declaration keywords vary by project complexity:
- **Simple control programs**: Primarily use `VAR`, `FUNCTION`, and `FUNCTION_BLOCK`
- **Library development**: Leverage `TYPE`, `STRUCT`, and `ENUM` for data modeling
- **Advanced systems**: Utilize `CLASS`, `INTERFACE`, and `NAMESPACE` for modular architectures (where supported)

**Common Pattern**: Most industrial code follows a pattern of `VAR` declarations for I/O mapping, followed by `IF` statements for interlocks, `CASE` statements for sequence control, and `FUNCTION_BLOCK` calls for reusable logic components.

### Vendor Support Comparison

* **CODESYS (3.5+)**: Benchmark IEC 61131-3 compliance. Fully supports all standard keywords, including `CONTINUE` and complete OOP constructs (classes, inheritance, interfaces). Often first to adopt new Edition features.

* **Siemens TIA Portal (SCL for S7-1500)**: Supports core ST keywords with notable limitations. **Does not support `CONTINUE` keyword** - use structured workarounds instead. Partial OOP: supports interfaces and methods but no user-defined classes or inheritance between FBs. `SUPER` keyword not applicable.

* **Rockwell Studio 5000 (Logix)**: Supports fundamental control and declaration keywords but **no `CONTINUE` keyword**. No OOP implementation - uses Add-On Instructions (AOIs) as function block equivalent. Keywords like `CLASS`, `INTERFACE`, `METHOD` not recognized.

* **Beckhoff TwinCAT 3**: Full IEC compliance plus extensions. Complete OOP support including inheritance and method overriding. Treats function blocks as classes - can use `EXTENDS`, `IMPLEMENTS`, `SUPER`. Adds non-standard `PROPERTY` construct.

* **Schneider Electric**: 
  - **Control Expert (Unity)**: Edition 2 compliance only. No OOP keywords or `CONTINUE`. Limited to traditional POUs.
  - **Machine Expert**: CODESYS-based, full Edition 3 support including OOP and `CONTINUE`.

* **Omron Sysmac Studio**: Edition 2 compliance. No `CONTINUE` keyword or OOP constructs. Traditional POUs only (programs, functions, function blocks).

---

## Operators

Structured Text includes a range of operators for logical operations, arithmetic, comparisons, and assignments. Some are symbol-based (`+`, `=`, `:=`) while others are spelled out (`MOD`, `AND`, `OR`). They are essential for expressing program logic, performing calculations, and evaluating conditions.

### Logical Operators

```
AND, OR, XOR, NOT
```

These operate on boolean values or bit strings. `AND` and `OR` are used in conditions, while `XOR` and `NOT` handle exclusivity and inversion. When applied to integers, these perform bitwise operations.

### Comparison Operators

```
=, <>, <, >, <=, >=
```

Used to compare numeric or string values. `<>` denotes inequality. These return `TRUE` or `FALSE` and are often embedded in `IF`, `WHILE`, or `CASE` expressions.

### Arithmetic Operators

```
+, -, *, /, MOD, **
```

`MOD` computes integer remainder. The `**` operator (exponentiation) was introduced in IEC 61131-3 Edition 3 for power calculations (e.g., `2 ** 3` for 2³). Unlike some languages, `++` or `+=` are not allowed in Structured Text.

#### Note on Exponentiation Operator (**)

In earlier versions of IEC 61131-3, Structured Text did not include a native exponentiation operator. Developers had to rely on the `EXPT()` function (e.g., `EXPT(2, 3)` for 2³) to perform power calculations.

In the 3rd Edition, the operator `**` was introduced to provide native exponentiation (e.g., `2 ** 3`). This improves readability and aligns ST more closely with modern programming languages.

However, not all platforms support `**` yet, and many legacy systems still require `EXPT()`. When writing cross-platform code, prefer `EXPT()` for maximum compatibility unless you're targeting environments that explicitly support `**`.

### Assignment Operator

```
:=
```

Used to assign values to variables. For example, `Counter := Counter + 1;`. This is distinct from `=`, which performs a comparison.

### Real-World Use

Operators are the building blocks of industrial control logic:

**Assignment (`:=`)**: The workhorse of automation - used for I/O mapping, setpoint adjustments, and state updates:
```
ActualTemperature := AI_TempSensor;
MotorSpeed := SpeedSetpoint * ScalingFactor;
```

**Comparison operators (`=`, `<>`, `>`, etc.)**: Essential for interlocks, alarms, and process monitoring:
```
IF ActualTemperature > HighTempAlarm THEN
    AlarmActive := TRUE;
END_IF;
```

**Logical operators (`AND`, `OR`, `NOT`)**: Critical for safety interlocks and condition evaluation:
```
SafeToStart := (EmergencyStop = FALSE) AND (PermissiveConditions = TRUE) AND NOT(MaintenanceMode);
```

**Arithmetic operators (`+`, `-`, `*`, `/`, `MOD`)**: Used in analog scaling, PID calculations, and signal processing:
```
ScaledValue := ((RawADC - Offset) * Span) / 4095.0;
RemainingCycles := TotalCycles MOD BatchSize;
```

**Advanced operators**: `**` (exponentiation) appears in complex calculations like flow compensation and power calculations, though `EXPT()` function is preferred for compatibility.

### Vendor Support Comparison

* **CODESYS**: Full IEC operator support including `**` (exponentiation). Permissive with implicit type conversions. Includes safety extensions (`GE_S`, `EQ_S`) in libraries. Provides non-standard `ADR()` for pointer operations.

* **Siemens TIA Portal**: All standard operators supported with stricter type checking than CODESYS. Limited `**` support - prefer `EXPT()`. Implicit type promotions may be disallowed or cause runtime errors. String operations work predictably.

* **Rockwell Studio 5000**: **No `**` operator** - use `EXPT()` function instead. Assignment and comparison operators work normally. String operators limited - use built-in functions. Variable implicit type conversion behavior across controller models.

* **Beckhoff TwinCAT**: Full operator support identical to CODESYS. More permissive with implicit conversions and memory addressing. Supports pointer arithmetic as extension (non-portable).

* **Schneider Electric**: 
  - **Control Expert**: Standard operators supported, no `**` operator in older versions
  - **Machine Expert**: CODESYS-based, full operator support including `**`

* **Omron Sysmac**: Standard operators supported. No `**` operator support - use mathematical functions for power calculations.

---

## Standard Function Blocks

IEC 61131-3 defines a set of standard function blocks (FBs) that encapsulate common control logic in a reusable and structured way. Unlike functions, FBs retain state between cycles, making them suitable for timing, counting, and signal detection tasks.

> **Cross-Platform Note**: Even though ST is textual, execution order inside POU logic or function blocks may depend on how the runtime environment compiles and schedules tasks. Write code that doesn't depend on execution order and use explicit sequencing when order matters.

### Timer Function Blocks

```
TON, TOF, TP, PULSE_GEN
```

* `TON` (On-delay timer): Starts timing when input goes TRUE and sets output after delay.
* `TOF` (Off-delay timer): Output stays TRUE for a time after input goes FALSE.
* `TP` (Pulse timer): Generates a fixed-width pulse on rising edge.
* `PULSE_GEN`: Generates a recurring pulse with configurable high and low durations (less common).

### Counter Function Blocks

```
CTU, CTD, CTUD
```

* `CTU`: Count-up on rising edge.
* `CTD`: Count-down.
* `CTUD`: Bi-directional count-up/down with presets.

### Edge Detection Function Blocks

```
R_TRIG, F_TRIG
```

* `R_TRIG`: Detects rising edge of a boolean signal.
* `F_TRIG`: Detects falling edge.

### Bistable Function Blocks

```
RS, SR
```

* `RS`: Reset-dominant latch.
* `SR`: Set-dominant latch.

### Real-World Use

Standard Function Blocks are essential building blocks in industrial automation:

**Timer Applications**:
- **`TON` (On-Delay)**: Motor start delays, alarm confirmation timers, process step durations
- **`TOF` (Off-Delay)**: Cooling fan run-on, valve close delays, system shutdown sequences
- **`TP` (Pulse)**: Momentary outputs, reset pulses, brief notification signals

**Counter Applications**:
- **`CTU` (Count-Up)**: Production counting, cycle tracking, batch quantities
- **`CTD` (Count-Down)**: Remaining inventory, countdown timers, quota tracking
- **`CTUD` (Up/Down)**: Position tracking, bidirectional counting, balance calculations

**Edge Detection**:
- **`R_TRIG`**: Button press detection, start command triggers, rising alarm conditions
- **`F_TRIG`**: Stop command detection, falling alarm acknowledgment, end-of-cycle detection

**Bistable (Latch) Logic**:
- **`RS` (Reset-Dominant)**: Emergency stop latches, fault conditions that require manual reset
- **`SR` (Set-Dominant)**: Start/run conditions, permissive latches

**Typical Implementation Pattern**:
```
// Declare FB instances in VAR block
VAR
    StartDelay: TON;
    ProductCounter: CTU;
    StartButton: R_TRIG;
END_VAR

// Use in program logic
StartButton(CLK := StartButtonInput);
IF StartButton.Q THEN
    StartDelay(IN := TRUE, PT := T#3s);
    IF StartDelay.Q THEN
        ProductCounter(CU := TRUE, PV := 100);
    END_IF;
END_IF;
```

### Vendor Support Comparison

* **CODESYS**: Complete IEC FB implementation. All standard FBs (`TON`, `CTU`, `R_TRIG`, etc.) plus `PULSE_GEN`. Precise IEC naming and behavior. No system-specific prefixes required.

* **Siemens TIA Portal**: Standard FB functionality via system function blocks (e.g., `TON` as `SFB4`). IEC-compliant behavior but different member names (`EN`/`ENO` vs standard). Requires system block instantiation.

* **Rockwell Studio 5000**: No direct IEC FB support. Equivalent functionality through Add-On Instructions (AOIs) and built-in instructions. Must create or import standard FB equivalents. `PULSE_GEN` not available.

* **Beckhoff TwinCAT**: Full IEC FB support identical to CODESYS. Standard naming and behavior. Additional vendor-specific FBs available in extended libraries.

* **Schneider Electric**:
  - **Control Expert**: Standard FBs available with IEC naming. Some variations in member access patterns.
  - **Machine Expert**: CODESYS-based implementation with full standard FB support.

* **Omron Sysmac**: Standard timer and counter FBs supported. Encourages use of extensive vendor FB libraries for specialized functions. IEC-compliant basic FBs available.

---

## Standard Functions

IEC 61131-3 includes a comprehensive library of stateless functions that operate on one or more inputs and return a computed value. These functions cover data conversion, math operations, string handling, and time/date manipulation. Unlike function blocks, they do not retain state across cycles.

> **Cross-Platform Note**: Functions are stateless while Function Blocks (FBs) retain state between scans. Misunderstanding this difference can lead to unexpected behavior, especially when reused in tight loops or across tasks. Use functions for calculations and FBs for stateful operations.

### Type Conversion Functions

```
BOOL_TO_INT, BOOL_TO_DINT, BOOL_TO_REAL, BOOL_TO_STRING
INT_TO_BOOL, INT_TO_DINT, INT_TO_REAL, INT_TO_STRING
DINT_TO_BOOL, DINT_TO_INT, DINT_TO_REAL, DINT_TO_STRING
REAL_TO_BOOL, REAL_TO_INT, REAL_TO_DINT, REAL_TO_STRING
STRING_TO_BOOL, STRING_TO_INT, STRING_TO_DINT, STRING_TO_REAL
```

These functions are essential in type-safe Structured Text, enabling clean conversion between booleans, integers, floats, and strings.

> **Cross-Platform Note**: Type coercion varies significantly between platforms. Some platforms (like CODESYS) allow implicit casting between types (e.g., `INT` to `REAL`), while others (like Rockwell) enforce strict typing and may fault at runtime. Always use explicit conversion functions for safe, portable code.

### Numerical Functions

```
ABS, SQRT, LN, LOG, EXP
SIN, COS, TAN, ASIN, ACOS, ATAN
TRUNC, ROUND, CEIL, FLOOR
MIN, MAX, LIMIT
```

Used for basic and advanced numerical operations, including trigonometry and floating-point rounding. Functions like `TRUNC` and `ROUND` are common in analog signal processing. `MIN` and `MAX` return the smaller or larger of two values, while `LIMIT` constrains a value between minimum and maximum bounds.

### String Functions

```
LEN, LEFT, RIGHT, MID, CONCAT, INSERT, DELETE, REPLACE, FIND
```

Support operations like slicing, merging, and scanning strings. Many platforms implement both `STRING` and `WSTRING` variants for these functions.

### Date and Time Functions

```
ADD_TIME, SUB_TIME, CONCAT_DATE_TOD
```

Enable manipulation and formatting of `TIME`, `DATE`, and `DT` (date-time) types.

### Selection Functions

```
SEL, MUX
```

`SEL` selects between two values based on a boolean condition (e.g., `SEL(condition, value_if_false, value_if_true)`). `MUX` (multiplexer) selects one value from multiple inputs based on an index. These functions are commonly used for conditional value selection in control logic.

### Real-World Use

Standard functions are workhorses in industrial automation, handling data processing, signal conditioning, and system integration:

**Type Conversion - Critical for I/O and Communication**:
```
// Analog input scaling
ScaledTemp := INT_TO_REAL(RawADC) * 0.1 - 40.0;

// HMI display formatting
TempDisplay := REAL_TO_STRING(ActualTemp);

// Communication protocol conversion
ModbusData := DINT_TO_WORD(ProcessValue);
```

**Mathematical Functions - Process Calculations**:
```
// Flow compensation using square root
FlowRate := SQRT(DifferentialPressure) * K_Factor;

// PID control calculations
Error := ABS(Setpoint - ProcessValue);
OutputPower := LIMIT(0.0, PID_Output, 100.0);

// Tank volume calculations
Volume := 3.14159 * (Radius ** 2.0) * Height;  // or EXPT(Radius, 2.0) for compatibility
```

**String Functions - Logging and HMI**:
```
// Alarm message construction
AlarmMsg := CONCAT('Temperature High: ', REAL_TO_STRING(Temperature));

// Data parsing from communication
DeviceID := MID(ReceivedString, 1, 8);
CommandCode := RIGHT(ReceivedString, 4);

// Status reporting
LogEntry := CONCAT(CONCAT(TimeStamp, ': '), StatusMessage);
```

**Selection Functions - Control Logic**:
```
// Conditional value selection
OutputValue := SEL(ManualMode, AutoValue, ManualValue);

// Multi-source selection
ActiveSetpoint := MUX(SourceSelector, Setpoint1, Setpoint2, Setpoint3, Setpoint4);
```

**Time/Date Functions - Scheduling and Logging**:
```
// Shift change detection
CurrentShift := CONCAT_DATE_TOD(TodaysDate, ShiftStartTime);

// Process duration tracking
CycleTime := SUB_TIME(CurrentTime, CycleStartTime);
```

**Performance Note**: These functions are heavily used in scan cycles, so understanding their execution time on your target platform is crucial for real-time performance.

> **Note on Bitwise Functions**: IEC 61131-3 also defines bitwise manipulation functions like `SHL` (shift left), `SHR` (shift right), `ROL` (rotate left), `ROR` (rotate right), and bit access functions. These are typically accessed as library functions or through vendor-specific implementations rather than as built-in operators.

### Vendor Support Comparison

* **CODESYS**: Complete standard function library with full `WSTRING` support. All mathematical, string, and conversion functions work as specified. Includes bitwise functions (`SHL`, `SHR`, etc.) as built-in library.

* **Siemens TIA Portal**: Most standard functions supported but may have different names or require specific function blocks. Partial `WSTRING` support - some string functions don't accept wide strings. `MIN`/`MAX` available as blocks in FBD.

* **Rockwell Studio 5000**: Standard functions often implemented as AOIs rather than built-in functions. **No `WSTRING` support**. Must create or import functions like `LEN`, `CONCAT` from instruction library. No built-in `MIN`/`MAX` - use conditional logic.

* **Beckhoff TwinCAT**: Complete function library identical to CODESYS. Full `WSTRING` support and all mathematical functions. Extended bitwise and memory functions available.

* **Schneider Electric**:
  - **Control Expert**: Basic function set, limited `WSTRING` support. Some functions require specific library imports.
  - **Machine Expert**: CODESYS-based, complete function library with full type support.

* **Omron Sysmac**: Standard mathematical and conversion functions supported. Modern controllers support `WSTRING` (UTF-16). Extensive vendor function library for specialized operations.

---

## Data Types

IEC 61131-3 defines a comprehensive set of data types that are used to declare variables and configure memory layout in Structured Text (ST). These types are categorized as elementary, generic, or derived. Strict typing ensures predictable behavior, which is critical in industrial automation.

### Elementary Data Types

```
BOOL, BYTE, WORD, DWORD, LWORD
SINT, USINT, INT, UINT, DINT, UDINT, LINT, ULINT
REAL, LREAL
TIME, LTIME
DATE, LDATE
TIME_OF_DAY, TOD
DATE_AND_TIME, DT
STRING, WSTRING
CHAR, WCHAR
```

These include booleans, integers of various sizes (signed and unsigned), floating-point numbers, time and date values, and both narrow and wide character strings. `LWORD`, `LINT`, and `LTIME` are 64-bit types introduced in the 3rd Edition.

#### Note on Wide Character Support

`WSTRING` and `WCHAR` are part of the standard, but not all platforms implement them fully. For example, Rockwell does not support `WSTRING`. Stick to `STRING` unless you're targeting a Unicode-aware system with confirmed wide character support.

### Generic Data Types

```
ANY, ANY_INT, ANY_REAL, ANY_BIT, ANY_STRING, ANY_DATE
ANY_NUM, ANY_ELEMENTARY, ANY_DERIVED, ANY_MAGNITUDE
ANY_CHAR, ANY_CHARS
REFERENCE, POINTER
```

Generic types are used for polymorphic function inputs, library design, and meta-programming. `ANY_CHAR` and `ANY_CHARS` cover character and string types respectively. `REFERENCE` is the official safe reference type in ST. `POINTER` exists but is not strictly defined in the IEC standard and is often vendor-specific.

#### Note on POINTER vs REFERENCE

While IEC 61131-3 references `POINTER`, it doesn't define full pointer semantics. Many platforms either restrict or completely omit pointer support. Use `REFERENCE` instead where possible for standard-compliant behavior and better portability across platforms.

### Real-World Use

Data type selection significantly impacts performance, memory usage, and cross-platform compatibility:

**Core Industrial Types**:
- **`BOOL`**: Digital I/O, interlocks, status flags, enable/disable conditions
- **`INT`**: Analog values, counters, setpoints, general-purpose integers (-32,768 to 32,767)
- **`DINT`**: Large counters, millisecond timers, scaled analog values, communication data
- **`REAL`**: Process variables, PID calculations, engineering units, floating-point math
- **`STRING`**: Operator messages, device names, alarm texts, recipe parameters

**Specialized Applications**:
- **`TIME`**: Timer presets, delays, cycle times (e.g., `T#5s`, `T#100ms`)
- **`DATE`**: Production scheduling, maintenance records, batch tracking
- **`DT`**: Timestamping, event logging, shift management

**Performance Considerations**:
```
// Efficient for most automation tasks
CounterValue: INT;        // 16-bit, fast arithmetic
Temperature: REAL;        // 32-bit float, adequate precision

// Use only when necessary (performance/compatibility impact)
LargeCounter: LINT;       // 64-bit, not supported on all platforms
PrecisionCalc: LREAL;     // 64-bit double, slower on some PLCs
```

**Memory Optimization**:
```
// Packed bit arrays for digital I/O
InputBank: ARRAY[0..31] OF BOOL;   // 32 booleans
StatusWord: DWORD;                 // Same 32 bits, different access pattern

// String sizing for memory efficiency
ShortMessage: STRING[50];          // Fixed 50 characters + overhead
DeviceName: STRING[20];            // Appropriate sizing reduces memory
```

**Cross-Platform Strategy**:
- Stick to `BOOL`, `INT`, `DINT`, `REAL`, `STRING` for maximum compatibility
- Use `LINT`/`LREAL` only when 32-bit precision is insufficient
- Avoid `WSTRING`/`WCHAR` unless Unicode is required and platform supports it
- Test memory layout and performance on target hardware

### Vendor Support Comparison

* **CODESYS**: Complete IEC type support including all 64-bit types (`LINT`, `LREAL`, `LTIME`, `LWORD`) and full `WSTRING` implementation. Supports vendor-specific `POINTER` with `ADR()` function and permissive implicit casting.

* **Siemens TIA Portal**: Core IEC types supported with limitations. Historically lacked `LWORD` and `LTIME` (added in recent firmware). **Partial `WSTRING` support** - type exists but some operations don't accept it. Stricter type checking than CODESYS.

* **Rockwell Studio 5000**: **Custom `STRING` implementation** as structured type (SINT array with length field). **No `WSTRING` or wide character support**. 64-bit types (`LINT`, `ULINT`, `LTIME`) not supported on all controller models. **No `POINTER` or `REFERENCE` types**.

* **Beckhoff TwinCAT**: Full IEC type support plus extensions. Complete `WSTRING` and 64-bit type support. Supports `POINTER TO <type>` and `REFERENCE TO <type>` with pointer arithmetic (non-portable). Adds `PROPERTY` construct for OOP.

* **Schneider Electric**:
  - **Control Expert (Unity)**: Edition 2 type support. Limited or no `WSTRING`. Some 64-bit types on newer hardware (M580). Supports `POINTER` as non-standard extension.
  - **Machine Expert**: CODESYS-based, full type support including `WSTRING` and all 64-bit types.

* **Omron Sysmac**: Standard numeric types including 64-bit on modern controllers. `WSTRING` support as UTF-16 on NJ/NX series. No pointer or reference types. Legacy systems (CX-Programmer) have limited type support.

---

---

## Best Practices for ST Code Portability

Migrating Structured Text code between different PLC platforms can be challenging due to the differences outlined above. Here are best practices and guidelines to maximize portability and maintainability:

### Use Standard Constructs and Libraries

Write your ST code using the core language features that are uniformly supported. For example, prefer using `IF/THEN/ELSE` and structured loops (`FOR`/`WHILE`) over vendor-specific instructions. Utilize the IEC standard functions (math, string, type conversions) wherever possible, instead of proprietary ones. 

If a standard function isn't available on a platform (e.g., no `MAX()` on Rockwell), consider implementing it yourself (it's usually a small piece of code) or include it as a reusable function block in your project.

### Avoid Unsupported Keywords

Do not use `CONTINUE`, `RETURN` from nested POUs, or others you know are not accepted by your target systems. As discussed, omit `CONTINUE` if there's a chance the code will run on Siemens or Rockwell – structure your loops with an `IF` check or use `EXIT` (which is widely supported) to break out early. 

Also, avoid OOP keywords (`CLASS`, etc.) if the code might run on a non-OOP PLC. Even if you develop with OOP on one platform, you might consider providing a non-OOP equivalent (e.g., behind a conditional compile or as an alternative set of FBs) for use on simpler platforms.

### Plan for Data Type Differences

Stick to data types that exist on all target platforms. For instance, use `DINT` instead of `LINT` if 64-bit integers are not crucial – many PLCs had 32-bit limit historically. If you need 64-bit, check each platform's support; if a platform lacks it, you might simulate a 64-bit by combining two 32-bit values (but that complicates things).

For strings, as noted, use `STRING` for portability and only use `WSTRING` when absolutely needed (and when you know the platform can handle it). Likewise, be aware that the default size of `STRING` can differ (some systems default to 80 characters, others to 256, etc.), so always explicitly specify lengths for important string variables to avoid surprises.

### Group and Organize Declarations Simply

The spec's cross-platform notes mention that some tools require all variable declarations in one block. It's wise to follow that: define one `VAR … END_VAR` per POU for each memory class (global vs local vs input/output). While some allow multiple scattered `VAR` sections, keeping them consolidated improves compatibility.

Also, use standardized naming and structuring for your variables – avoid starting identifiers with underscores (some systems reserve those), and avoid using exact reserved words as part of variable names (even if case differences might allow it, it can confuse certain import/export tools).

### No Pointer Arithmetic or Direct Memory Hacks

As appealing as it might be to do low-level tricks, these are not portable. For example, using `ADR()` in CODESYS to get a pointer, then adding an offset to traverse an array, will not translate to platforms that don't support `ADR`. If you need to copy a memory block or iterate through an array, write it in pure ST (with a loop) rather than relying on `MEMCPY` or pointer math. This ensures any PLC can run it.

Also, do not rely on things like the internal byte order or size of a `BOOL` – if you need a specific packed bit array, define it explicitly (e.g., use a `BYTE` and address bits by shifting/masking, since some systems don't allow `BOOL[8]` arrays to pack into a byte the same way).

### Be Careful with Implicit Conversions

Some platforms (like Rockwell) are very strict – an expression mixing `INT` and `REAL` might not compile or could throw a runtime error if not explicitly cast. To be safe, always cast explicitly using the conversion functions when combining different types. For example, if you divide an `INT` by a `REAL`, cast the `INT` to `REAL` first. This will produce consistent behavior and avoid surprises on strict systems.

### Follow Structured Programming Practices

Don't rely on quirks. For example, avoid assuming a specific execution order of boolean expressions (the spec doesn't guarantee left-to-right short-circuit, and vendors differ). Write code that does not depend on side effects in a particular order. Similarly, do not assume uninitialized variables start at 0 – IEC says they do get a default of 0/false, but on some platforms (or in some contexts like retentive memory), you could get residual data. Always initialize variables as needed for clarity.

### Leverage PLCopen and Standard Libraries

When possible, use the vendor's implementation of the IEC standard blocks (timers, counters) instead of writing your own, as these are usually optimized and well-tested. However, note differences: e.g., Siemens requires an instance of `TON` to be called every scan; Rockwell's timers run asynchronous to code when enabled. Understand these differences – if you keep your usage simple (set inputs, call the block, use outputs as per standard meaning), the logic will be portable even if internally the PLC handles it differently.

PLCopen has defined some function blocks for common tasks (like motion control, etc.); using these can sometimes ease porting if both vendors support PLCopen function blocks.

### Conditional Compilation or Includes

If you are maintaining one codebase for multiple platforms, use conditional compilation directives (if supported) to include/exclude code sections for specific systems. For instance, you might wrap a `CONTINUE;` statement in a "if Siemens" compile guard to omit it. Not all PLC IDEs support this (CODESYS does via `{IF defined(...)}`), but if they do, it can be powerful.

Alternatively, isolate non-portable code in separate modules or libraries, so that you only swap out that part for a different platform. For example, you could have a string utility function block library – one version that uses native functions for one platform, and another for a different platform – and choose which to include.

### Testing and Static Analysis

Always test the code on the actual target platform or use any static analysis tool the vendor provides. As seen with Beckhoff, static analyzers can catch use of non-portable features (like it flags pointer usage, `WSTRING` usage, etc., as potentially non-portable). Use these warnings to guide refactoring for portability.

After importing code to a new platform's IDE, thoroughly check for any compile errors or warnings – they often point directly to an unsupported keyword or a type mismatch. Running sample scenarios on the new platform's simulator/hardware will ensure that differences in execution (like how a timer resets or how a string is handled) don't introduce bugs.

### Documentation and Style

Finally, document any assumptions in your ST code. If you deliberately used a feature that only works on one platform, comment it. For instance: `// Uses CONTINUE – not supported on PLC X, so in PLC X version of this program, loop is structured differently.` Good documentation will save headaches when porting.

Keep your ST code style clean and consistent (indentation, capitalization of keywords, etc.) – while this doesn't affect execution, it makes it easier for someone else (or you in the future) to recognize patterns and differences when moving between systems.

By following these practices, you can significantly reduce the effort required to migrate ST code between different PLC brands. In essence, strive to write clear, standard-conforming Structured Text, and be mindful of the known gaps in support among the controllers you care about. That way, your control logic will be robust and portable, leveraging the common core of IEC 61131-3 that has truly become an industry standard.

---

**References:**

### **IEC 61131-3 Specification (Official)**
Official specification document published by the International Electrotechnical Commission. Required for exact standard compliance.
* [IEC 61131-3 Official Standard](https://webstore.iec.ch/publication/4552)

### **PLCopen Technical Reports**
Provides standardized extensions and usage recommendations for IEC 61131-3, widely used by vendors and developers.
* [PLCopen Technical Activities](https://www.plcopen.org/technical-activities/technical-reports)

### **CODESYS Online Help**
The official documentation portal for CODESYS, one of the most IEC-compliant and widely adopted ST platforms.
* [CODESYS Documentation](https://help.codesys.com)

### **Siemens TIA Portal Documentation**
Resource hub for Structured Control Language (SCL) used in Siemens automation, aligned with ST syntax.
* [Siemens TIA Portal Support](https://support.industry.siemens.com)

### **Rockwell Logix 5000 IEC Compliance Guide (PDF)**
Official Rockwell document describing IEC 61131-3 feature mapping within Studio 5000.
* [Rockwell IEC Compliance Documentation](https://literature.rockwellautomation.com/idc/groups/literature/documents/pm/1756-pm018_-en-p.pdf)

### **Beckhoff TwinCAT 3 Documentation**
Documentation for TwinCAT 3's IEC 61131-3 implementation, including advanced OOP features and simulation tooling.
* [Beckhoff TwinCAT 3 InfoSys](https://infosys.beckhoff.com)

### **B&R Automation Studio Support Portal**
Vendor documentation for B&R's engineering environment, which supports full IEC 61131-3 ST and modular programming.
* [B&R Automation Help](https://help.br-automation.com)

### **Omron Sysmac Studio Overview**
Overview and manuals for Omron's Sysmac platform, which includes Structured Text programming.
* [Omron Sysmac Studio Documentation](https://industrial.omron.us/en/products/sysmac-studio)

### **OpenPLC Project**
Open-source IEC 61131-3 runtime supporting Structured Text across soft-PLC environments like Raspberry Pi, Arduino, and more.
* [OpenPLC Official Website](https://www.openplcproject.com)

### **ISaGRAF IEC Development Platform**
ST-capable platform focused on embedded automation systems, with multi-language and runtime support.
* [ISaGRAF Platform Information](https://www.isagraf.com)

### **Wikipedia – IEC 61131-3 Overview**
High-level summary of IEC 61131-3 including history, language breakdown, and adoption notes.
* [IEC 61131-3 Wikipedia](https://en.wikipedia.org/wiki/IEC_61131-3)

---

This document is distributed under the license agreement of the ControlForge project. All content is copyright © Michael Distel.
You can find the license here: [LICENSE](../LICENSE)

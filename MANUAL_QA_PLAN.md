# Manual QA Plan for ControlForge Structured Text Extension

## Overview
This manual QA plan verifies that the E2E tests accurately reflect real-world usage and that the autocomplete functionality works correctly in VS Code.

## Prerequisites
- VS Code installed
- Extension development host ready
- Test workspace with sample files

## QA Test Plan

### Phase 1: Extension Loading & Basic Functionality

#### 1.1 Extension Activation
**Test Steps:**
1. Open VS Code
2. Open the ControlForge Structured Text workspace
3. Press `F5` to launch Extension Development Host
4. Verify extension loads without errors

**Expected Results:**
- Extension appears in extensions list
- No error messages in console
- Status shows "ControlForge Structured Text extension is now active!"

#### 1.2 File Association
**Test Steps:**
1. Open `examples/sample.st`
2. Open `examples/pid_controller.iecst`
3. Check language mode in status bar

**Expected Results:**
- `.st` files show "Structured Text" language
- `.iecst` files show "Structured Text" language
- Syntax highlighting is applied

### Phase 2: Autocomplete Functionality Testing

#### 2.1 Keyword Completion
**Test Steps:**
1. Create new `.st` file
2. Type `IF` and press `Ctrl+Space`
3. Type `FOR` and press `Ctrl+Space`
4. Type `WHILE` and press `Ctrl+Space`
5. Type `CASE` and press `Ctrl+Space`

**Expected Results:**
- All control keywords appear in completion list
- Keywords show proper documentation
- Items are marked as "Keyword" type
- Rich documentation appears in tooltip

#### 2.2 Data Type Completion
**Test Steps:**
1. In a VAR block, type `: ` and press `Ctrl+Space`
2. Look for: `BOOL`, `INT`, `REAL`, `TIME`, `STRING`
3. Look for extended types: `LTIME`, `LDATE`, `CHAR`, `WCHAR`
4. Look for generic types: `ANY`, `ANY_NUM`, `ANY_REAL`

**Expected Results:**
- All data types appear in completion list
- Extended types (LTIME, LDATE, etc.) are available
- Generic types (ANY, ANY_NUM, etc.) are available
- Each type shows appropriate documentation

#### 2.3 Standard Function Blocks
**Test Steps:**
1. In program body, type `TON` and press `Ctrl+Space`
2. Type `CTU` and press `Ctrl+Space`
3. Type `R_TRIG` and press `Ctrl+Space`

**Expected Results:**
- Standard function blocks appear in completion
- Documentation explains function block purpose
- Items are properly categorized

#### 2.4 Standard Functions
**Test Steps:**
1. Type `ABS` and press `Ctrl+Space`
2. Type `SQRT` and press `Ctrl+Space`
3. Type `SIN` and press `Ctrl+Space`
4. Type `ADD` and press `Ctrl+Space`
5. Type `GT` and press `Ctrl+Space`

**Expected Results:**
- Mathematical functions available
- Arithmetic functions (ADD, SUB, etc.) available
- Comparison functions (GT, LT, etc.) available
- Functions show parameter documentation

#### 2.5 Type Conversion Functions
**Test Steps:**
1. Type `REAL_TO_TIME` and press `Ctrl+Space`
2. Type `INT_TO_STRING` and press `Ctrl+Space`
3. Type `BOOL_TO_INT` and press `Ctrl+Space`

**Expected Results:**
- All conversion functions available
- Clear documentation of conversion purpose
- Proper function naming convention

#### 2.6 Variable Extraction and Completion
**Test Steps:**
1. Create a file with this content:
```st
PROGRAM TestProgram
VAR
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
END_VAR

// Test completion here
```
2. At the comment line, press `Ctrl+Space`
3. Look for variables: `counter`, `temperature`, `isRunning`

**Expected Results:**
- All declared variables appear in completion
- Variables show their data types
- Variables are marked as "Variable" type

#### 2.7 Function Block Extraction
**Test Steps:**
1. Create a file with:
```st
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
END_VAR
END_FUNCTION_BLOCK

PROGRAM Main
// Test completion here
```
2. At the comment line, press `Ctrl+Space`
3. Look for `FB_Motor`

**Expected Results:**
- Function block appears in completion
- Marked as "Class" type
- Shows function block documentation

#### 2.8 Code Snippets
**Test Steps:**
1. Type `if` and press `Ctrl+Space`
2. Select `if-then-end` snippet
3. Verify tab stops work
4. Try other snippets: `for-loop`, `while-loop`, `function-block`, `configuration`

**Expected Results:**
- All 12 code snippets available
- Snippets are marked as "Snippet" type
- Tab stops navigate correctly
- Placeholders are pre-selected

#### 2.9 Enhanced Sample File Testing
**Test Steps:**
1. Open `examples/sample.st` (enhanced comprehensive version)
2. Navigate to the main program section
3. Test completion of complex variables:
   - Type `temp` and press `Ctrl+Space` - should show `temperature`, `tempArray`, `tempPointer`, `tempReference`
   - Type `motor` and press `Ctrl+Space` - should show `motor1`, `motor2`, `motorState`
   - Type `process` and press `Ctrl+Space` - should show `processInfo`
4. Test function block instance completion:
   - Type `motor1.` and press `Ctrl+Space` - should show outputs like `running`, `actual_speed`, `fault`, `status`, `runtime`
   - Type `upCounter.` and press `Ctrl+Space` - should show `Q`, `CV`
   - Type `pulseTimer.` and press `Ctrl+Space` - should show `Q`, `ET`

**Expected Results:**
- All declared variables from enhanced sample appear
- Complex data types (arrays, structures, enums) are recognized
- Function block instances show proper output members
- User-defined types (MotorState, ProcessData, TemperatureArray) are available

#### 2.10 Function Parameters and Templates
**Test Steps:**
1. Type `ABS(` and verify parameter template insertion
2. Type `LIMIT(` and verify three-parameter template with placeholders
3. Type `ADD(` and verify multi-parameter template
4. Type `SIN(` and verify single parameter template
5. Type `REAL_TO_STRING(` and verify conversion function template

**Expected Results:**
- Functions insert with proper parameter templates
- Tab stops allow easy navigation between parameters
- Parameter placeholders show expected types
- Template insertion respects existing code context

#### 2.11 Advanced Data Types from Enhanced Sample
**Test Steps:**
1. In a VAR block, type `: ` and press `Ctrl+Space`
2. Look for user-defined types: `MotorState`, `ProcessData`, `TemperatureArray`
3. Look for extended IEC types: `LTIME`, `LDATE`, `CHAR`, `WCHAR`
4. Look for pointer types: `POINTER TO REAL`, `REFERENCE TO REAL`
5. Look for 64-bit types: `LWORD`, `LINT`, `ULINT`, `LREAL`

**Expected Results:**
- All user-defined types from TYPE section appear
- Extended IEC 61131-3 data types are available
- Pointer and reference syntax is supported
- 64-bit integer and real types are included

#### 2.12 Mathematical and Advanced Functions
**Test Steps:**
1. Type mathematical functions and verify templates:
   - `SIN(` - should insert `SIN(${1:angle})`
   - `COS(` - should insert `COS(${1:angle})`
   - `SQRT(` - should insert `SQRT(${1:value})`
   - `ABS(` - should insert `ABS(${1:value})`
2. Type comparison functions:
   - `GT(` - should insert `GT(${1:value1}, ${2:value2})`
   - `LT(` - should insert `LT(${1:value1}, ${2:value2})`
   - `EQ(` - should insert `EQ(${1:value1}, ${2:value2})`
3. Type arithmetic functions:
   - `ADD(` - should insert `ADD(${1:value1}, ${2:value2})`
   - `SUB(` - should insert `SUB(${1:value1}, ${2:value2})`
   - `MUL(` - should insert `MUL(${1:value1}, ${2:value2})`

**Expected Results:**
- All mathematical functions available with proper templates
- Comparison functions show two-parameter templates
- Arithmetic functions support multiple parameters
- Function templates include meaningful parameter names

#### 2.13 Function Block Parameter Templates
**Test Steps:**
1. **Test Type Declaration Context:**
   - In a VAR block, type `myTimer : ` and press `Ctrl+Space`
   - Look for `TON` (should insert just `TON` for type declaration)
   - Type `myCounter : ` and look for `CTU`
   
2. **Test Function Call Context:**
   - In program body, type `TON` and press `Ctrl+Space`
   - Look for `TON()` option (should insert `TON(IN := ${1:signal}, PT := ${2:T#1s})`)
   - Type `CTU` and press `Ctrl+Space`
   - Look for `CTU()` option (should insert `CTU(CU := ${1:signal}, R := ${2:reset}, PV := ${3:100})`)
   
3. **Test Parameter Templates for All Function Blocks:**
   - `TON()` → `TON(IN := ${1:signal}, PT := ${2:T#1s})`
   - `TP()` → `TP(IN := ${1:signal}, PT := ${2:T#1s})`
   - `CTU()` → `CTU(CU := ${1:signal}, R := ${2:reset}, PV := ${3:100})`
   - `R_TRIG()` → `R_TRIG(CLK := ${1:signal})`
   - `RS()` → `RS(S := ${1:setSignal}, R1 := ${2:resetSignal})`

4. **Test Custom Function Blocks:**
   - Type function calls using the custom FB_Motor and FB_PIDController

**Expected Results:**
- Each function block type appears twice in completion: `TON` and `TON()`
- Type declaration version (e.g., `TON`) inserts just the name
- Function call version (e.g., `TON()`) inserts full parameter template
- Parameter names match IEC 61131-3 standard (IN, PT, CU, R, PV, CLK, etc.)
- Tab stops work correctly for easy parameter navigation
- Documentation explains the difference between type and call usage

#### 2.14 Syntax Highlighting Verification
**Test Steps:**
1. Create a new `.st` file with this content:
```st
VAR
    // Basic types
    boolVar : BOOL := TRUE;
    intVar : INT := 123;
    realVar : REAL := 3.14;
    
    // Extended time types
    timeVar : TIME := T#10s;
    ltimeVar : LTIME := LTIME#1d_2h_30m_45s;
    dateVar : DATE := D#2025-06-12;
    ldateVar : LDATE := LDATE#2025-06-12;
    
    // Character types
    charVar : CHAR := 'A';
    wcharVar : WCHAR := "Ω";
    
    // String types
    stringVar : STRING := 'Hello';
    wstringVar : WSTRING := "Wide String";
    
    // Extended integer types
    lwordVar : LWORD := 16#123456789ABCDEF0;
    lintVar : LINT := -9223372036854775808;
    ulintVar : ULINT := 18446744073709551615;
    lrealVar : LREAL := 2.71828182845904523536;
END_VAR
```
2. Verify syntax highlighting for all data types
3. Check that keywords like `VAR`, `END_VAR`, `TRUE` are highlighted
4. Verify that operators `:=` and comments are highlighted

**Expected Results:**
- All data types show proper syntax highlighting (same color as other types)
- `LTIME`, `LDATE`, `CHAR`, `WCHAR` are highlighted correctly
- Extended types (`LWORD`, `LINT`, `ULINT`, `LREAL`) are highlighted
- Keywords and operators have consistent highlighting
- No unhighlighted data type names

### Phase 3: Advanced Features Testing

#### 3.1 Trigger Characters
**Test Steps:**
1. Type a variable name followed by `.` (period)
2. Type `: ` (colon space) in variable declaration
3. Type `( ` (opening parenthesis) after function name

**Expected Results:**
- Completion triggered automatically
- Relevant completions appear
- No false triggers

#### 3.2 Multiple VAR Block Support
**Test Steps:**
1. Create file with multiple VAR blocks:
```st
FUNCTION_BLOCK FB_Test
VAR_INPUT
    input1 : BOOL;
END_VAR
VAR_OUTPUT
    output1 : REAL;
END_VAR
VAR
    local1 : INT;
END_VAR
// Test here
```
2. Test completion at comment

**Expected Results:**
- Variables from all VAR blocks appear
- Proper type information shown
- No duplicate entries

#### 3.3 Configuration Snippets
**Test Steps:**
1. Use the `configuration` snippet
2. Verify TASK and PROGRAM structure
3. Check tab stop navigation

**Expected Results:**
- Complete configuration structure generated
- TASK with INTERVAL placeholder
- PROGRAM WITH TASK association
- All placeholders navigable

### Phase 4: Performance & Edge Cases

#### 4.1 Large File Performance
**Test Steps:**
1. Create a large file (1000+ lines) with many variables
2. Test completion response time
3. Verify no lag or freezing

**Expected Results:**
- Completion appears within 1-2 seconds
- No UI freezing
- Memory usage reasonable

#### 4.2 Malformed Code Handling
**Test Steps:**
1. Test completion in files with syntax errors
2. Test with incomplete VAR blocks
3. Test with nested comments

**Expected Results:**
- Completion still works where possible
- No crashes or exceptions
- Graceful degradation

#### 4.3 Edge Case Variable Names
**Test Steps:**
1. Test variables with numbers: `var1`, `test123`
2. Test with underscores: `my_variable`, `_private`
3. Test mixed case: `MyVariable`, `testVar`

**Expected Results:**
- All valid variable names extracted
- Case sensitivity preserved
- No false positives

### Phase 5: Documentation & Help

#### 5.1 Completion Documentation
**Test Steps:**
1. Trigger completion for each category
2. Verify documentation appears in tooltip
3. Check for Markdown formatting

**Expected Results:**
- All items have documentation
- Markdown renders correctly
- Documentation is helpful and accurate

#### 5.2 Validate Syntax Command
**Test Steps:**
1. Open a `.st` file
2. Run command palette (`Ctrl+Shift+P`)
3. Execute "Structured Text: Validate Syntax"

**Expected Results:**
- Command appears in palette
- Executes without error
- Shows appropriate validation message

## Test Execution Checklist

### Setup Phase
- [ ] Extension development environment ready
- [ ] Sample files available
- [ ] Clean VS Code instance

### Basic Functionality
- [ ] Extension loads correctly
- [ ] File associations work
- [ ] Language mode correct
- [ ] Syntax highlighting active

### Autocomplete Categories
- [ ] Control keywords (IF, FOR, WHILE, etc.)
- [ ] Declaration keywords (VAR, PROGRAM, etc.)
- [ ] Data types (BOOL, INT, REAL, etc.)
- [ ] Extended data types (LTIME, LDATE, etc.)
- [ ] Generic types (ANY, ANY_NUM, etc.)
- [ ] Standard function blocks (TON, CTU, etc.)
- [ ] Standard functions (ABS, SQRT, etc.)
- [ ] Arithmetic functions (ADD, SUB, etc.)
- [ ] Comparison functions (GT, LT, etc.)
- [ ] Conversion functions (REAL_TO_TIME, etc.)
- [ ] Code snippets (12 total)

### Dynamic Features
- [ ] Variable extraction working
- [ ] Function block extraction working
- [ ] Multiple VAR blocks supported
- [ ] Trigger characters working

### Quality Checks
- [ ] All items have documentation
- [ ] Proper completion item kinds
- [ ] Performance acceptable
- [ ] Error handling graceful

## Success Criteria

The manual QA is successful if:

1. **All autocomplete categories work** - 160+ items available
2. **Dynamic extraction functions** - Variables and function blocks detected
3. **Snippets work correctly** - All 12 snippets with tab stops
4. **Performance is acceptable** - Sub-2-second response
5. **Documentation is complete** - All items have help text
6. **No crashes or errors** - Graceful error handling
7. **E2E tests reflect reality** - Manual testing matches automated tests

## Reporting Issues

Document any issues found with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if relevant
- Console errors if any
- File content that triggers the issue

## Notes for Improvement

After manual QA, note any areas for enhancement:
- Missing keywords or functions
- Incomplete documentation
- Performance optimizations needed
- Additional snippet ideas
- UX improvements

---

**Next Steps:** Run this manual QA plan and compare results with E2E test expectations to ensure our automated tests accurately reflect real-world usage.

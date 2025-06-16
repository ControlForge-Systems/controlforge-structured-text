# Manual QA Testing Guide

## Quick Setup
1. Open VS Code in the ControlForge Structured Text workspace
2. Press `F5` to launch Extension Development Host
3. Open `examples/test_instance_members.st` for testing

## Core Features to Test

### 1. Basic Extension Loading
- ✅ Extension loads without errors
- ✅ `.st` files show "Structured Text" language mode
- ✅ Syntax highlighting works

### 2. Function Block Instance Member Completion (Main Feature)

**Test the key feature:**
1. Open `examples/test_instance_members.st`
2. Go to line with comment `// Test member completion here`
3. Type each of these and press `Ctrl+Space`:

| Test Input | Expected Completions |
|------------|---------------------|
| `upCounter.` | `Q` (BOOL), `CV` (INT) |
| `downCounter.` | `Q` (BOOL), `CV` (INT) |
| `pulseTimer.` | `Q` (BOOL), `ET` (TIME) |
| `onTimer.` | `Q` (BOOL), `ET` (TIME) |
| `risingEdge.` | `Q` (BOOL) |
| `fallingEdge.` | `Q` (BOOL) |

**Expected Results:**
- Dot notation triggers completion automatically
- Shows correct members for each function block type
- Members show proper data types and descriptions

### 3. Standard Autocomplete

**Test basic completion (press `Ctrl+Space`):**
- **Keywords**: `IF`, `FOR`, `WHILE`, `VAR`, `END_VAR`
- **Data Types**: `BOOL`, `INT`, `REAL`, `TIME`, `STRING`
- **Function Blocks**: `TON`, `CTU`, `R_TRIG`
- **Functions**: `ABS`, `SQRT`, `ADD`, `GT`

### 4. Code Snippets

**Test snippets (type and press `Ctrl+Space`):**
- `if` → IF-THEN-END_IF block
- `for` → FOR loop with placeholders
- `while` → WHILE loop
- `timer` → TON function block usage
## Quick Validation Tests

### 5. Performance Check
- ✅ No errors in VS Code console
- ✅ Completion appears quickly (< 2 seconds)
- ✅ Extension works with large files

### 6. Variable Detection
**Test file with variables:**
```st
VAR
    myCounter : INT := 0;
    isActive : BOOL := TRUE;
END_VAR
// Type 'my' or 'is' here and press Ctrl+Space
```
- ✅ Variables appear in completion list
- ✅ Shows correct data types

## Quick Checklist
- [ ] Extension loads without errors
- [ ] Function block member completion works (main feature)
- [ ] Basic autocomplete shows keywords, types, functions
- [ ] Code snippets work with tab navigation
- [ ] Performance is good

## Issues Found
**Document any problems here:**
- Issue description
- Steps to reproduce
- Expected vs actual behavior

---

**Note:** This simplified manual test focuses on the key features. All 44 automated tests are already passing, so this manual validation ensures the real VS Code experience matches our test expectations.

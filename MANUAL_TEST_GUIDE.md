# Manual Testing Guide for Stage 2C Features

## 🧪 **Manual Testing Checklist**

### **Setup**
1. ✅ Extension installed: `controlforge-structured-text-1.1.0.vsix`
2. 📁 Open workspace: `/home/michael/projects/controlforge-structured-text`
3. 📄 Test files available in `examples/` folder

---

## **Test 1: Member Access Navigation** 🎯

### **File**: `examples/test-member-access.st`

#### **Test Cases**:

1. **Standard Timer FB (TON)**
   - Navigate to line 65: `timerDone := myTimer.Q;`
   - **Action**: Ctrl+Click on `myTimer.Q`
   - **Expected**: Should show definition info for TON.Q member
   - **Success Criteria**: Navigation works or hover shows "Q (OUTPUT): BOOL"

2. **Edge Detector FB (R_TRIG)**
   - Navigate to line 70: `IF edgeDetector.Q THEN`
   - **Action**: Ctrl+Click on `edgeDetector.Q`
   - **Expected**: Should show R_TRIG.Q definition
   - **Success Criteria**: Navigation/hover shows edge detector output info

3. **Counter FB (CTU)**
   - Navigate to line 77: `countValue := counter.CV;`
   - **Action**: Ctrl+Click on `counter.CV`
   - **Expected**: Should show CTU.CV (current value) definition
   - **Success Criteria**: Shows "CV (OUTPUT): INT"

4. **Custom FB (FB_MotorControl)**
   - Navigate to line 92: `motorStatus := motorCtrl.running;`
   - **Action**: Ctrl+Click on `motorCtrl.running`
   - **Expected**: Should navigate to FB_MotorControl.running definition
   - **Success Criteria**: Jumps to line 18 (running : BOOL definition)

---

## **Test 2: Intelligent Completion** 🧠

### **File**: `examples/test-member-access.st`

#### **Test Cases**:

1. **Standard FB Completion**
   - Go to end of file, add new line
   - **Action**: Type `myTimer.` (with dot)
   - **Expected**: Completion popup showing IN, PT, Q, ET
   - **Success Criteria**: Shows 4 members with type information

2. **Custom FB Completion**
   - **Action**: Type `motorCtrl.` (with dot)
   - **Expected**: Shows start, stop, speed, running, fault
   - **Success Criteria**: Shows input/output categorization

3. **Instance Completion**
   - **Action**: Type first few letters of instance name
   - **Expected**: Should complete instance names
   - **Success Criteria**: Autocomplete works for variable names

---

## **Test 3: Hover Information** 💬

### **File**: `examples/test-member-access.st`

#### **Test Cases**:

1. **Standard FB Member Hover**
   - **Action**: Hover over `myTimer.Q` (line 65)
   - **Expected**: "**Q** (OUTPUT)\n\nType: \`BOOL\`\n\nFunction Block: \`TON\`\n\nTimer output"
   - **Success Criteria**: Rich tooltip with type and description

2. **Custom FB Member Hover**
   - **Action**: Hover over `motorCtrl.running` (line 92)
   - **Expected**: Shows member info with FB type
   - **Success Criteria**: Displays custom FB member details

3. **Instance Hover**
   - **Action**: Hover over `myTimer` (not the member)
   - **Expected**: Shows instance information and type
   - **Success Criteria**: "**myTimer** (FunctionBlockInstance)\n\nType: \`TON\`"

---

## **Test 4: Cross-File Navigation** 🔗

### **Files**: `examples/main-app.st` and `examples/library.st`

#### **Test Cases**:

1. **Global Constant Navigation**
   - Open `examples/main-app.st`
   - **Action**: Ctrl+Click on `SYSTEM_VERSION` (line 31)
   - **Expected**: Should jump to `library.st` line 5
   - **Success Criteria**: Cross-file navigation works

2. **Function Navigation**
   - **Action**: Ctrl+Click on `CelsiusToFahrenheit` (line 34)
   - **Expected**: Should jump to function definition in `library.st`
   - **Success Criteria**: Cross-file function navigation

3. **FB Type Navigation**
   - **Action**: Ctrl+Click on `FB_AdvancedPID` (line 7)
   - **Expected**: Should navigate to FB definition in `library.st`
   - **Success Criteria**: Cross-file FB type navigation

---

## **Test 5: Complex Expressions** 🔍

### **File**: `examples/test-member-access.st`

#### **Test Cases**:

1. **Multiple Member Access in Expression**
   - Navigate to line 97: `IF (myTimer.Q AND motorCtrl.running) OR counter.Q THEN`
   - **Action**: Test Ctrl+Click on each member access
   - **Expected**: Each member access should resolve correctly
   - **Success Criteria**: All three member accesses work: `myTimer.Q`, `motorCtrl.running`, `counter.Q`

---

## **Debugging Tips** 🐛

### **Check LSP Server Status**:
1. Open VS Code Developer Tools: `Help > Toggle Developer Tools`
2. Check Console for any LSP errors
3. Look for "Language Client" messages

### **Extension Logs**:
1. View > Output
2. Select "ControlForge Structured Text" from dropdown
3. Check for server startup and indexing messages

### **Manual LSP Test**:
1. Open Command Palette (Ctrl+Shift+P)
2. Type "ControlForge" to see available commands
3. Try "Show Workspace Index Stats" if available

---

## **Success Indicators** ✅

- **Navigation**: Ctrl+Click takes you to definitions
- **Completion**: Typing `instance.` shows relevant members
- **Hover**: Rich tooltips with type information
- **Cross-file**: Navigation works between different `.st` files
- **Performance**: Features work without significant delay

---

## **Common Issues** ⚠️

- **No completion**: Check if file is recognized as Structured Text
- **No navigation**: Verify LSP server is running (check Output panel)
- **Cross-file issues**: Ensure workspace is opened (not just individual files)
- **Member access not working**: Check if instance type is properly recognized

Let me know what you find during testing! 🚀

# 🧪 How to Test Locally

## Quick Start (Easiest Method)

### Option 1: Press F5 in VS Code ⚡ (Recommended)

1. **Open project**:
   ```bash
   cd /mnt/data/Projects/controlforge-structured-text
   code .
   ```

2. **Launch extension** (in VS Code):
   - Press **F5** (or click Run → Start Debugging)
   - New window opens: **"[Extension Development Host]"**

3. **Test completions**:
   - In the new window: **File → Open File**
   - Open: `test-completion.st` (already created for you)
   - Type on the incomplete lines to test completions

4. **What to verify**:
   ```st
   myTimer.   ← Type here, should see: IN, PT, Q, ET (no duplicates!)
   IF         ← Should see keyword completions
   motor      ← Should see: motorSpeed
   pump.      ← Should see: CU, R, PV, Q, CV
   ```

5. **Check LSP status**:
   - Press **Ctrl+Shift+P**
   - Type: "ControlForge: Check LSP Status"
   - Should say: "ControlForge Structured Text LSP is running"

✅ **Done! If completions work with no duplicates, Issue #37 is fixed!**

---

## Option 2: Build and Install .vsix Package

### Step 1: Build Package
```bash
./test-local.sh     # Compile and verify
npx vsce package    # Creates .vsix file
```

### Step 2: Install
```bash
code --install-extension controlforge-structured-text-1.2.4.vsix
```

### Step 3: Reload VS Code
- Press **Ctrl+Shift+P**
- Type: "Developer: Reload Window"

### Step 4: Test
- Open `test-completion.st`
- Test completions as above

---

## Option 3: Quick CLI Check (No UI Testing)

Just verify it compiles:
```bash
./test-local.sh
```

Output should show:
- ✅ Compilation successful
- ✅ Extension compiled (123 lines)
- ✅ LSP server compiled (346 lines)

---

## 🔍 What to Look For

### ✅ SUCCESS (Issue #37 Fixed)
```
Type: myTimer.
See:  IN, PT, Q, ET  ← Each appears ONCE
```

### ❌ FAILURE (Still Duplicate)
```
Type: myTimer.
See:  IN, IN, PT, PT, Q, Q, ET, ET  ← Duplicates!
```

---

## 📋 Checklist

After testing, verify:

- [ ] Extension launches in Development Host (F5)
- [ ] File `test-completion.st` recognized as Structured Text
- [ ] LSP status shows "running"
- [ ] Typing `myTimer.` shows member completions
- [ ] **NO DUPLICATES** in completion dropdown
- [ ] Keywords autocomplete (IF, THEN, etc.)
- [ ] Variables autocomplete (motorSpeed, counter)
- [ ] No errors in Debug Console

---

## 🐛 Troubleshooting

### Extension won't launch
```bash
# Install dependencies
npm install
npm run compile
```

### No completions appearing
1. Check file type in bottom-right: Should say "Structured Text"
2. If not: Press **Ctrl+K M** → type "structured-text"

### LSP not running
1. **View → Output** (in original VS Code window)
2. Dropdown: **"ControlForge Structured Text Language Server"**
3. Look for errors

### Still seeing duplicates
- Did you reload the Extension Development Host?
- Close and relaunch (F5 again)

---

## 📹 5-Minute Video Test

1. `code .` (Open project)
2. `F5` (Launch)
3. Open `test-completion.st`
4. Type `myTimer.`
5. ✅ See IN, PT, Q, ET (no duplicates)

**Done!**

---

## 🎯 Expected Results

| Test | Before (#37) | After Fix |
|------|-------------|-----------|
| `myTimer.` | IN, IN, PT, PT ❌ | IN, PT, Q, ET ✅ |
| Completion source | Extension + LSP | LSP only ✅ |
| Code size | 357 lines | 140 lines ✅ |

---

## 📝 Report Back

After testing, let me know:
- ✅ All tests pass
- ❌ Found issue: [description]

Then we'll proceed to **Issue #38** (fix npm test)!

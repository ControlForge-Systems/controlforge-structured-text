# Pre-Release QA Checklist

Manual testing checklist for the ControlForge Structured Text extension. Run through before each release. All test files are in `manual-tests/`.

**Prerequisites**: Install the extension in VS Code (or run via F5 debug host). Ensure no other ST extension is active.

---

## 1. Setup & Activation

- [ ] Open a `.st` file → extension activates (check status bar or Output > Structured Text)
- [ ] Open `manual-tests/syntax/test.iecst` → extension activates for `.iecst` files
- [ ] Command Palette shows all 3 commands: `Structured Text: Validate Syntax`, `Show Index Statistics`, `Check LSP Status`
- [ ] Status bar or Output panel confirms LSP server is running

## 2. Syntax Highlighting

Open `manual-tests/syntax/test_highlighting.st`:

- [ ] Keywords (`PROGRAM`, `IF`, `THEN`, `END_IF`, `FOR`, `WHILE`, etc.) are highlighted
- [ ] Data types (`INT`, `REAL`, `BOOL`, `STRING`, `TIME`, etc.) are highlighted differently from keywords
- [ ] Operators (`:=`, `+`, `-`, `*`, `/`, `AND`, `OR`, `NOT`, `MOD`) are highlighted
- [ ] Single-line comments (`//`) are highlighted as comments
- [ ] Block comments (`(* ... *)`) are highlighted as comments
- [ ] String literals (`'...'` and `"..."`) are highlighted as strings

Open `manual-tests/syntax/test_literals.st`:

- [ ] Integer literals (`42`, `16#FF`, `2#1010`, `8#77`) highlighted as numbers
- [ ] Real literals (`3.14`, `1.0E5`) highlighted as numbers
- [ ] Time literals (`T#5s`, `T#1h2m3s`) highlighted correctly
- [ ] Boolean literals (`TRUE`, `FALSE`) highlighted

Open `manual-tests/syntax/test_function_blocks.st`:

- [ ] `FUNCTION_BLOCK` / `END_FUNCTION_BLOCK` highlighted as keywords
- [ ] `VAR_INPUT` / `VAR_OUTPUT` / `VAR` / `END_VAR` highlighted as keywords

Open `manual-tests/syntax/test.iecst`:

- [ ] All syntax highlighting categories work identically to `.st` files

## 3. Code Completion

Open `manual-tests/completion/test_completion.st`:

- [ ] Typing a partial keyword (e.g. `PRO`) shows completion for `PROGRAM`
- [ ] Typing a partial variable name shows matching declared variables
- [ ] Typing a data type prefix (e.g. `IN`) shows `INT`, `INT` completions
- [ ] Completion list includes standard function blocks (`TON`, `TOF`, `TP`, etc.)

Open `manual-tests/completion/test_instance_members.st`:

- [ ] Typing `instanceName.` triggers member completion for the FB type
- [ ] TON instance shows: `IN`, `PT`, `Q`, `ET`
- [ ] CTU instance shows: `CU`, `R`, `PV`, `Q`, `CV`
- [ ] Custom FB instance shows its declared `VAR_INPUT`, `VAR_OUTPUT`, `VAR` members

Open `manual-tests/completion/test-lsp.st`:

- [ ] Basic LSP completion works (variables, keywords)

Open `manual-tests/completion/test-lsp-stage2.st`:

- [ ] Advanced completion features (context-aware suggestions)

## 4. Hover Tooltips

Open `manual-tests/hover/fb-hover-tooltips.st`:

- [ ] Hover on `TON` (type name) → rich tooltip with parameter table, behavior description, usage example
- [ ] Hover on `TOF` → rich tooltip (different from TON)
- [ ] Hover on `TP` → rich tooltip
- [ ] Hover on `CTU` → rich tooltip with counter-specific parameters
- [ ] Hover on `CTD` → rich tooltip
- [ ] Hover on `CTUD` → rich tooltip
- [ ] Hover on `R_TRIG` → rich tooltip
- [ ] Hover on `F_TRIG` → rich tooltip
- [ ] Hover on `RS` → rich tooltip
- [ ] Hover on `SR` → rich tooltip
- [ ] Hover on `onDelay` (instance name) → tooltip showing type is TON
- [ ] Hover on `counter` (non-FB variable) → standard tooltip with type `INT`
- [ ] Hover on `onDelay.Q` (member access) → tooltip showing member type and description
- [ ] Hover on `countDown.CV` → member tooltip
- [ ] Hover on `countUpDown.QU` → member tooltip

## 5. Go to Definition

Open `manual-tests/navigation/test-local-vars.st`:

- [ ] Ctrl+Click on `testTimer` usage → jumps to its `VAR` declaration
- [ ] Ctrl+Click on `localFlag` usage → jumps to its declaration

Open `manual-tests/navigation/test-member-access.st`:

- [ ] Ctrl+Click on `myTimer.Q` → navigates to TON's Q definition (in `iec61131-definitions/TON.st`)
- [ ] Ctrl+Click on `myTimer.PT` → navigates to TON's PT definition
- [ ] Ctrl+Click on `edgeDetector.Q` → navigates to R_TRIG's Q definition
- [ ] Ctrl+Click on `counter.CV` → navigates to CTU's CV definition
- [ ] Ctrl+Click on `motorCtrl.running` → navigates to `FB_MotorControl`'s `running` declaration in the same file
- [ ] Ctrl+Click on `motorCtrl.fault` → navigates to `FB_MotorControl`'s `fault` declaration

Open `manual-tests/navigation/test-navigation-targets.st`:

- [ ] Cross-file navigation: Ctrl+Click on a symbol defined in another file → jumps to its definition

## 6. Find References

Open `manual-tests/navigation/test-find-references.st`:

- [ ] Right-click `counter` > Find All References → lists declaration + 4 usage locations
- [ ] Right-click `myTimer` > Find All References → lists declaration + call + member access
- [ ] Right-click `unused` > Find All References → lists declaration only (1 result)
- [ ] Right-click `enable` (in `FB_FindRefsTest`) → lists declaration + body usage

## 7. Rename Symbol

Open `manual-tests/rename/rename-symbols.st`:

**Successful renames:**
- [ ] Place cursor on `counter` (Test 1), F2, type `loopCounter` → all 3 references update
- [ ] Place cursor on `delayTimer` (Test 2), F2, type `startupDelay` → references including `.Q` member access update
- [ ] Place cursor on `speed` (Test 3), F2, type `motorSpeed` → declaration and body usage update
- [ ] Place cursor on `AddValues` (Test 4), F2, type `SumValues` → function name and return assignment update

**Rejection of invalid names:**
- [ ] F2 on `myVar`, type `IF` → rejected (reserved keyword)
- [ ] F2 on `myVar2`, type `BOOL` → rejected (data type)
- [ ] F2 on `myVar3`, type `ABS` → rejected (standard function)
- [ ] F2 on `myVar4`, type `TON` → rejected (standard FB)
- [ ] F2 on `myVar5`, type `if` → rejected (case-insensitive keyword)

**Non-renameable symbols:**
- [ ] Place cursor on `IF` keyword (Test 10) → rename not offered / prepare rename fails

## 8. Diagnostics

Open `manual-tests/diagnostics/semantic-checks.st`:

- [ ] Missing semicolon on line 12 → error diagnostic appears
- [ ] Duplicate `counter` declaration → error on second declaration
- [ ] `undeclaredVar` usage → warning for undefined variable
- [ ] `unused` variable → warning for unused variable
- [ ] `count := 'hello'` → error for STRING-to-INT type mismatch
- [ ] `flag := 42` → error for INT-to-BOOL type mismatch
- [ ] `CleanProgram` block → no diagnostics (valid code)
- [ ] All diagnostics appear in Problems panel with source "ControlForge ST"

Open `manual-tests/code-actions/missing-end-blocks.st`:

- [ ] Missing `END_PROGRAM`, `END_FUNCTION`, `END_FUNCTION_BLOCK`, `END_IF`, `END_VAR` → diagnostics shown

Open `manual-tests/code-actions/unclosed-strings.st`:

- [ ] Unclosed string literals → diagnostics shown

Open `manual-tests/code-actions/unmatched-parens.st`:

- [ ] Unmatched parentheses → diagnostics shown

Open `manual-tests/diagnostics/keyword-syntax-checks.st`:

- [ ] `ELSE IF` (both occurrences) → error squiggle on `ELSE IF` span
- [ ] Lowercase `else if` and mixed-case `Else If` → both flagged
- [ ] `ELSIF` (correct) → no diagnostic
- [ ] `IF level > 90` with no `THEN` → error squiggle at end of line
- [ ] `ELSIF level > 70` with no `THEN` → error squiggle at end of line
- [ ] `FOR i := 1 TO 100` with no `DO` → error squiggle at end of line
- [ ] `WHILE count < 10` with no `DO` → error squiggle at end of line
- [ ] `NoFalsePositives` block → no diagnostics (keywords in comments ignored)

## 9. Code Actions (Quick Fixes)

Open `manual-tests/code-actions/missing-end-blocks.st`:

- [ ] Hover diagnostic → lightbulb appears
- [ ] Click lightbulb or Ctrl+. → "Insert END_*" action shown
- [ ] Apply action → correct END keyword inserted with proper indentation

Open `manual-tests/code-actions/orphaned-ends.st`:

- [ ] Orphaned END_* → "Remove orphaned END_*" action available and works

Open `manual-tests/code-actions/unclosed-strings.st`:

- [ ] Unclosed string → "Close string literal" action available and works

Open `manual-tests/code-actions/unmatched-parens.st`:

- [ ] Missing closing paren → "Add closing parenthesis" action works
- [ ] Extra closing paren → "Remove extra closing parenthesis" action works

Open `manual-tests/diagnostics/code-action-fixes.st`:

- [ ] Missing semicolon → "Insert semicolon" action works
- [ ] Duplicate variable → "Remove duplicate declaration" action works
- [ ] Unused variable → "Remove unused variable" action works

Open `manual-tests/code-actions/keyword-syntax-fixes.st`:

- [ ] `ELSE IF` line → lightbulb offers "Replace 'ELSE IF' with 'ELSIF'", apply → line becomes `ELSIF`
- [ ] `IF level > 90` (no THEN) → lightbulb offers "Insert THEN", apply → ` THEN` inserted before any trailing comment
- [ ] `ELSIF level > 70` (no THEN) → same fix works
- [ ] `FOR i := 1 TO 10` (no DO) → lightbulb offers "Insert DO", apply → ` DO` appended
- [ ] `WHILE count > 0` (no DO) → same fix works

## 10. Code Formatting

Open `manual-tests/formatting/unformatted-input.st`:

- [ ] Format Document (`Ctrl+Shift+I` on Linux, `Shift+Alt+F` on Windows/macOS, or Ctrl+Shift+P → "Format Document") → file matches `manual-tests/formatting/expected-output.st`
- [ ] Keywords converted to UPPERCASE
- [ ] Spaces inserted around operators (`:=`, `+`, `*`, etc.)
- [ ] VAR declarations aligned (colons aligned)
- [ ] Proper indentation applied
- [ ] Trailing whitespace removed
- [ ] Final newline inserted

Open `manual-tests/formatting/expected-output.st`:

- [ ] Format Document again → no changes (idempotency)

Open `manual-tests/formatting/settings-variations.st`:

- [ ] Test 1: Set `structured-text.format.keywordCase` = `"lower"` → format → keywords become lowercase
- [ ] Test 2: Set `keywordCase` = `"preserve"` → format → mixed-case keywords unchanged
- [ ] Test 3: Set `insertSpacesAroundOperators` = `false` → format → no spaces around operators
- [ ] Test 4: Set `alignVarDeclarations` = `false` → format → colons not aligned
- [ ] Test 7: Select only the `if running then` block → right-click > Format Selection → only that block formatted
- [ ] Test 8: Format file twice → second format produces zero changes

## 11. Workspace Indexing

With multiple `.st` files open (e.g. files from `manual-tests/navigation/` and `manual-tests/hover/`):

- [ ] Symbols from all open files appear in completion
- [ ] Cross-file Go to Definition works (e.g. `test-navigation-targets.st` references)
- [ ] Closing a file removes its symbols from the index
- [ ] Editing a file updates its symbols in the index (debounced)

## 12. Commands

Open `manual-tests/commands/test-commands.st`:

- [ ] Command Palette > `Structured Text: Validate Syntax` → notification reports no errors
- [ ] Command Palette > `Structured Text: Show Index Statistics` → notification shows symbol counts
- [ ] Command Palette > `Structured Text: Check LSP Status` → notification confirms server running

## 13. Editor Features

Open any `.st` file:

- [ ] Type `(` → auto-inserts `)` 
- [ ] Type `'` → auto-inserts closing `'`
- [ ] Type `(*` → auto-inserts `*)`
- [ ] Select text, type `(` → wraps selection in `()`
- [ ] Ctrl+/ → toggles `//` line comment
- [ ] Select block, Ctrl+Shift+A → toggles `(* *)` block comment (if supported)
- [ ] Bracket matching: click next to `(` → matching `)` highlighted

## 14. File Support

- [ ] `.st` files recognized as `structured-text` language (check status bar language mode)
- [ ] `.iecst` files recognized as `structured-text` language (open `manual-tests/syntax/test.iecst`, check status bar)
- [ ] All LSP features work in `.iecst` file (completion, hover, diagnostics)

---

## Results

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| 1. Setup & Activation | | | |
| 2. Syntax Highlighting | | | |
| 3. Code Completion | | | |
| 4. Hover Tooltips | | | |
| 5. Go to Definition | | | |
| 6. Find References | | | |
| 7. Rename Symbol | | | |
| 8. Diagnostics | | | |
| 9. Code Actions | | | |
| 10. Code Formatting | | | |
| 11. Workspace Indexing | | | |
| 12. Commands | | | |
| 13. Editor Features | | | |
| 14. File Support | | | |

**Tested by:** _______________  
**Date:** _______________  
**Extension version:** _______________  
**VS Code version:** _______________  

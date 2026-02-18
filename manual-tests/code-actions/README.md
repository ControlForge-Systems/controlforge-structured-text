# Code Actions Manual Tests

Test suite for Code Actions (quick fixes) feature.

## Test Files

### missing-end-blocks.st
Tests code actions for missing END_* keywords:
- Missing END_PROGRAM
- Missing END_FUNCTION
- Missing END_FUNCTION_BLOCK
- Missing END_IF
- Missing END_VAR

**Expected:** Each diagnostic should show a blue lightbulb icon. Clicking it should show "Insert END_*" action.

### orphaned-ends.st
Tests code actions for orphaned END_* keywords without matching openers:
- Orphaned END_PROGRAM
- Orphaned END_IF
- Orphaned END_VAR

**Expected:** Each diagnostic should show a quick fix to "Remove orphaned END_*".

### unclosed-strings.st
Tests code actions for unclosed string literals:
- Unclosed single-quote string
- Unclosed double-quote string
- Insert quote before semicolon

**Expected:** Each diagnostic should show "Close string literal" action.

### unmatched-parens.st
Tests code actions for unmatched parentheses:
- Single missing closing paren
- Multiple missing closing parens
- Extra closing paren

**Expected:** Diagnostics should show actions like "Add closing parenthesis", "Add 2 closing parentheses", or "Remove extra closing parenthesis".

## How to Test

1. Open each test file in VS Code
2. Verify diagnostics appear in Problems panel and as red squiggles
3. Hover over each diagnostic to see the lightbulb icon
4. Click the lightbulb or press `Ctrl+.` (Cmd+. on Mac) to see code actions
5. Select a code action and verify it fixes the issue correctly
6. Verify indentation is preserved for block insertions

## Expected Results

- All diagnostics should have source "ControlForge ST"
- All code actions should have kind "QuickFix"
- All code actions should be marked as "preferred" (appear first in the list)
- Applying a code action should fix the diagnostic
- No false positives (valid code should not trigger actions)

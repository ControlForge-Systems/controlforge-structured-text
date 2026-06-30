---
name: new-diagnostic
description: Add a new IEC 61131-3 validation/diagnostic rule to the Structured Text language server. Use this whenever an issue asks the editor to flag a new class of error or warning - e.g. "VAR_OUTPUT not allowed in FUNCTION", "invalid TIME literal", "STRING length overflow", "dead code after RETURN/EXIT", "missing END_VAR", or any new squiggle in the Problems panel. It adds a check function to the diagnostics provider, grounds the message in the IEC spec, and adds a fixture plus a unit test.
---

# New Diagnostic Rule

All validation lives in `src/server/providers/diagnostics-provider.ts`. The exported `computeDiagnostics(document, symbols?)` (bottom of the file) runs an ordered list of `check*` functions and returns `Diagnostic[]`. `server.ts` calls it on `onDidOpen` / `onDidChangeContent` and publishes via `connection.sendDiagnostics`. Each check is a self-contained function returning `Diagnostic[]`; you add one and register it in `computeDiagnostics`.

## Read first

- `docs/IEC61131_SPECIFICATION.md` - the authoritative source. Find the clause that your rule enforces; cite it in the diagnostic message or in the check's doc comment (existing messages reference clauses, e.g. the ELSE IF check cites IEC 61131-3 clause 3.3.2).
- `src/server/providers/diagnostics-provider.ts` - study an existing check to copy its shape. Good models:
  - Syntax (no symbols needed): `checkElseIfShouldBeElsif`, `checkMissingThenDo`, `checkUnclosedStrings`.
  - Semantic (needs parsed symbols): `checkDuplicateDeclarations`, `checkConstantAssignment`, `checkFBCallInvalidMembers`.
- Shared helpers already in the file: `stripAllComments` -> `CleanLine[]`, `stripStringLiterals`, `findPouBoundaries`, `buildPouRanges`, `findVarSections` / `isInVarSection`, `getFirstKeywordToken` / `getLastKeywordToken`, `isCaseBranchLabel`, `findClosestMatch`, and `createDiagnostic(line, character, length, message, severity)` which stamps `source: 'ControlForge ST'`.
- `src/test/unit/diagnostics-provider.unit.test.ts` - the `doc()`, `diagnose()`, `assertNoDiagnostics()` helpers and `suite()`/`test()` layout.

## Steps

1. **Write the check function** in `diagnostics-provider.ts`, next to the related checks. Signature follows the existing pattern - syntax-only checks take `(cleanLines)` or `(cleanLines, rawLines)`; semantic checks also take `symbols: STSymbolExtended[]`:
   ```ts
   function checkVarOutputInFunction(cleanLines: CleanLine[], symbols: STSymbolExtended[]): Diagnostic[] {
       const diagnostics: Diagnostic[] = [];
       // ...detect the violation, then:
       diagnostics.push(createDiagnostic(
           lineIndex, column, length,
           "VAR_OUTPUT is not allowed in a FUNCTION (IEC 61131-3 clause 2.5.1.3)",
           DiagnosticSeverity.Error
       ));
       return diagnostics;
   }
   ```
   Reuse the existing helpers rather than re-tokenizing; strip comments/strings via `CleanLine.text` / `stripStringLiterals` to avoid false positives inside comments and string literals. Pick severity deliberately: `Error` for spec violations, `Warning` for likely mistakes, `Hint`/`Information` for style.

2. **Cite the spec** in the message and/or the function's doc comment so the diagnostic is traceable to `docs/IEC61131_SPECIFICATION.md`. Keep the clause reference in the message text where it aids the user (write `clause N.N.N` in plain ASCII, e.g. `clause 3.3.2`, not the section sign or invented codes).

3. **Register it in `computeDiagnostics`** (bottom of the file). Add to the Phase 1 block (`diagnostics.push(...checkX(cleanLines))`) for pure-syntax checks, or inside the `if (symbols && symbols.length > 0)` Phase 2 block for checks that need parsed symbols.

4. **Add a manual-test fixture** under `manual-tests/diagnostics/<rule>.st` (alongside `array-bounds.st`, `constant-assignment.st`, `for-loop-bounds.st`). Include both violating and clean cases so QA can eyeball the squiggles in VS Code. Fixtures are internal QA only and are excluded from the `.vsix`.

5. **Add unit tests** to `src/test/unit/diagnostics-provider.unit.test.ts` (or a new `*.unit.test.ts` if the suite grows): one `test()` asserting the diagnostic fires (message text + severity) on bad input, and one asserting `assertNoDiagnostics(...)` on valid input. Note `diagnose()` calls `computeDiagnostics(doc)` with no symbols, so semantic-phase rules must build symbols via `STASTParser` in the test - copy a semantic test that already does this.

## Files to touch

- `src/server/providers/diagnostics-provider.ts` (new check + registration in `computeDiagnostics`)
- `manual-tests/diagnostics/<rule>.st` (new fixture)
- `src/test/unit/diagnostics-provider.unit.test.ts` (new tests)

## Definition of Done

- New `check*` function is registered in `computeDiagnostics` (correct phase) and emits the diagnostic with a spec-grounded message and deliberate severity.
- Valid code does not regress - existing `assertNoDiagnostics` cases still pass.
- Fixture added under `manual-tests/diagnostics/` covering positive and negative cases.
- `npm run test:unit` passes (all existing + new tests).
- `npm run webpack-prod` succeeds.
- Conventional Commit, e.g. `feat: flag VAR_OUTPUT inside FUNCTION`. No Claude attribution trailers. ASCII only (no em/en dashes, smart quotes, or other non-keyboard glyphs).

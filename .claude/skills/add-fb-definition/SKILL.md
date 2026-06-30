---
name: add-fb-definition
description: Add a standard IEC 61131-3 function block (or standard type) to the language server so it surfaces in completion, hover, member access, and peek/go-to-definition. Use this when an issue asks to support a standard FB the extension does not yet know (e.g. PULSE_GEN, a new timer/counter/bistable) or to correct/extend an existing FB's members. It adds the runtime definition file, registers the FB's members/description/spec entry, fixes the peek line map, and adds coverage.
---

# Add a Standard FB Definition

A standard FB is known to the server in four coordinated places. The peek/go-to-definition target is the real `.st` file under `iec61131-definitions/` (loaded at runtime from the packaged extension), while completion, hover, and member validation read in-memory tables in `MemberAccessProvider` and the spec module. All four must agree on member names and order.

## Read first

- `docs/IEC61131_SPECIFICATION.md` - the authority for the FB's signature (inputs, outputs, types, behavior). See the "Standard Function Blocks" section. Cite the clause in the `.st` file header comment and the FB description.
- `iec61131-definitions/TON.st` - the shape to copy: a header `(* ... *)` doc comment with summary, behavior, and an example, then `FUNCTION_BLOCK <NAME>` with `VAR_INPUT` / `VAR_OUTPUT` sections and inline `//` comments per member, then `END_FUNCTION_BLOCK`.
- `src/server/providers/member-access-provider.ts` - `initializeStandardFBMembers()` (member tables), `initializeStandardFBDescriptions()` (hover descriptions), and `getMemberLineNumber()` (the peek line map, 0-indexed, pointing into the `.st` file).
- `src/iec61131_specification.ts` - `standardFunctionBlocks` array (used by diagnostics and completion to recognize the name).
- `.vscodeignore` - confirms `iec61131-definitions/` is intentionally NOT excluded, so the `.st` files ship at runtime. Do not add an exclusion.

## Steps

1. **Add the definition file** `iec61131-definitions/<NAME>.st`, copying `TON.st`'s structure exactly: header comment (summary, FALSE/TRUE or counting behavior, typical uses, an `Example:`), then the `FUNCTION_BLOCK` body with `VAR_INPUT` / `VAR_OUTPUT` sections and a `//` comment on every member. Member names, order, and types must match `docs/IEC61131_SPECIFICATION.md`.

2. **Register members** in `MemberAccessProvider.initializeStandardFBMembers()`: add `this.standardFBMembers.set('<NAME>', [ ... ])` with one entry per member: `{ name, dataType, direction: 'VAR_INPUT' | 'VAR_OUTPUT', description, fbType: '<NAME>' }`. This drives member completion and FB-member validation in the diagnostics provider.

3. **Register the hover description** in `initializeStandardFBDescriptions()`: `this.standardFBDescriptions.set('<NAME>', { name, category, summary, behavior, example })`. `category` matches the existing buckets (Timer, Counter, etc.). This feeds the rich hover tooltip built in `definition-provider.ts`.

4. **Add the peek line map** in `getMemberLineNumber()`: `'<NAME>': { '<MEMBER>': <0-indexedLine>, ... }`. Open your new `.st` file and read off the exact 0-indexed line of each member declaration (e.g. in `TON.st`, `IN` is line 19). Peek/go-to-definition on a member jumps to this line, so it must be correct.

5. **Add the name to the spec list** in `src/iec61131_specification.ts` `standardFunctionBlocks` so the parser and diagnostics treat `<NAME>` as a known standard FB (prevents false "undefined identifier" warnings and enables type recognition).

6. **Verify it ships in the `.vsix`.** `iec61131-definitions/` is kept by `.vscodeignore` (it has an explicit "DO NOT EXCLUDE" note). After `npm run webpack-prod`, the folder must still be packaged - run `npx vsce ls` (or `npm run package` then inspect) and confirm `iec61131-definitions/<NAME>.st` is listed.

7. **Add coverage.** Add a navigation fixture (extend `manual-tests/navigation/peek-definition.st` or `member-access.st`) exercising an instance of `<NAME>` and its members. Add a unit test in `src/test/unit/member-access-provider.unit.test.ts` (members surface for the type) and, if peek line numbers were added, `src/test/unit/definition-provider.unit.test.ts` mirroring the existing standard-FB peek tests.

## Files to touch

- `iec61131-definitions/<NAME>.st` (new runtime definition)
- `src/server/providers/member-access-provider.ts` (`initializeStandardFBMembers`, `initializeStandardFBDescriptions`, `getMemberLineNumber`)
- `src/iec61131_specification.ts` (`standardFunctionBlocks`)
- `manual-tests/navigation/*.st` (fixture coverage)
- `src/test/unit/member-access-provider.unit.test.ts` and/or `src/test/unit/definition-provider.unit.test.ts`

## Definition of Done

- `<NAME>.st` exists with a spec-cited header and members matching `docs/IEC61131_SPECIFICATION.md`.
- Member table, hover description, peek line map, and `standardFunctionBlocks` all agree on member names and order.
- Completion lists the members, hover shows the rich tooltip, and peek/go-to-definition lands on the correct line in `<NAME>.st`.
- `iec61131-definitions/<NAME>.st` is confirmed present in the packaged `.vsix`.
- `npm run test:unit` passes (all existing + new tests).
- `npm run webpack-prod` succeeds.
- Conventional Commit, e.g. `feat: add PULSE_GEN standard function block definition`. No Claude attribution trailers. ASCII only (no em/en dashes, smart quotes, or other non-keyboard glyphs).

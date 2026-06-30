PRD path: $ARGUMENTS

You are the orchestrator for system design creation. The design writing happens in a fresh-context subagent so your main session stays clean.

## Phase 1 - Prepare brief (this session)

1. If $ARGUMENTS is empty or not a valid path to a PRD file, use AskUserQuestion to ask the user for the PRD path. Wait for the answer.
2. Confirm the PRD file exists at the path. If not, ask the user to correct it.
3. Derive the target file path: the same directory as the PRD, with filename `design.md`.

## Phase 2 - First subagent invocation (discovery + write or surface questions)

Spawn the `system-design` subagent via the Agent tool with `subagent_type: "system-design"`. The prompt MUST be a complete self-contained brief:

```
You are creating a technical system design document.

PRD file: <absolute path>
Target file: <same directory>/design.md

This is the FIRST pass. No prior clarifying answers exist yet.

Instructions:
1. Read the canonical guidance in `CLAUDE.md` and, for any IEC 61131-3 language behaviour, the spec authority `docs/IEC61131_SPECIFICATION.md`.
2. Read the PRD fully.
3. Explore the relevant codebase areas implied by the PRD: the LSP client/server TypeScript sources, extension activation and commands, language data in `iec61131-definitions/`, the grammar in `syntaxes/structured-text.tmLanguage.json`, and the affected test suites (`*.unit.test.ts`, e2e under `@vscode/test-electron`).
4. Decide: do you have enough information to produce the design with no ambiguity?
   - If YES: write the design doc per the system-design skill, run the Definition of Done checklist, save to the target file path, and return a summary.
   - If NO: return REMAINING QUESTIONS listing each ambiguity that would change the design. Do NOT write or save the design in this case. Each question must be answerable by a product owner (not require codebase exploration to answer).
5. Return a summary: target file path (if saved), any REMAINING QUESTIONS, and key architectural decisions made.
```

## Phase 3 - Close the loop (this session)

When the subagent returns:
- If REMAINING QUESTIONS, ask the user via AskUserQuestion.
- Once answered, spawn the `system-design` subagent again with a NEW Agent invocation. The new brief must include the original PRD path, target path, AND the Q&A. State explicitly: "All clarifying questions have now been answered - write the design doc without surfacing further questions."
- Repeat until the subagent confirms the design was saved.
- Show the user the final target file path.

Do NOT proceed to task generation in this command - that is a separate `/tasks` invocation.

Feature description: $ARGUMENTS

You are the orchestrator for PRD creation. Run the three phases below in this main session. The PRD writing itself happens in a fresh-context subagent so your context stays clean.

## Phase 1 - Gather requirements (this session)

1. If the feature description is empty or vague, use AskUserQuestion to ask the user what feature they want a PRD for. Wait for the answer.
2. Derive a kebab-case slug from the feature description (e.g. "Dark mode toggle" -> `dark-mode-toggle`).
3. Compute the next numeric prefix: PRD folders live under status subfolders (`tasks/01-todo/`, `tasks/02-in-progress/`, `tasks/03-done/`). Find the highest `##-*` directory across ALL of those subfolders. The new prefix is that number plus one, zero-padded to 2 digits. New PRDs are always created under `tasks/01-todo/`.
4. Ask 3-5 clarifying questions using AskUserQuestion. Number them 1, 2, 3; lettered options A, B, C. Focus on:
   - Who is the user and what problem does this solve?
   - What are the success criteria?
   - What is in scope vs explicitly out of scope?
   - Any timeline or business constraints?
5. Wait for answers before proceeding.

## Phase 2 - Hand off to subagent (Agent tool)

Spawn the `prd` subagent via the Agent tool with `subagent_type: "prd"`. The prompt MUST be a complete self-contained brief - the subagent has no access to this conversation:

```
You are writing a PRD. All requirements clarification has already been done in the main session - do NOT re-ask the user any questions.

Feature: <kebab-slug>
Description: <one-paragraph description from the user>
Target file: /mnt/data/Projects/controlforge-structured-text/tasks/01-todo/<##>-<kebab-slug>/prd.md

Clarifying questions and answers (from main session):
1. <question text>
   Answer: <user's exact answer>
2. <question text>
   Answer: <user's exact answer>
... (repeat for all clarifying questions)

Instructions:
1. Read the canonical guidance in `CLAUDE.md` and, for any IEC 61131-3 language behaviour, the spec authority `docs/IEC61131_SPECIFICATION.md`.
2. Write the PRD following the create-prd skill structure.
3. Run through the Definition of Done checklist before saving.
4. Save to the target file path. Create the directory if it does not exist.
5. If you discover unresolved questions that you cannot answer from the brief or the docs, list them in your return message under "REMAINING QUESTIONS". Do NOT save with unanswered questions in the Open Questions section.
6. Return a summary: target file path, FR count, and any REMAINING QUESTIONS.
```

## Phase 3 - Close the loop (this session)

When the subagent returns:
- If the return message contains "REMAINING QUESTIONS", ask the user those questions via AskUserQuestion.
- Once answered, spawn the `prd` subagent again with a NEW Agent invocation. The new brief must include the original Q&A plus the new Q&A. The subagent has no memory of the prior call, so the full brief must be re-supplied each round.
- Repeat until the subagent confirms the PRD is saved with no remaining questions.
- Show the user the final target file path.

Do NOT proceed to task generation in this command - that is a separate `/tasks` invocation.

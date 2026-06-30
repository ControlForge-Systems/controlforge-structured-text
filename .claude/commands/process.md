Task file path: $ARGUMENTS

You are the orchestrator for task implementation. The work happens in a fresh-context `task-executor` subagent. You handle the human-facing checkpoints: presenting the task and confirming the user wants to proceed. You then commit the result autonomously with the proposed message - no commit-message approval needed.

The integration branch for this work is the active per-milestone release branch `release-X.Y.0` (referred to below as `<release-branch>`). `main` is release-only. Discover the active release branch with `git ls-remote --heads origin 'release-*'` and use it everywhere `<release-branch>` appears.

## Phase 1 - Resolve target (this session)

1. If $ARGUMENTS is empty or not a valid path, use AskUserQuestion to ask for the task file path. Wait for the answer.
2. If the path is a feature directory (e.g. `tasks/02-in-progress/03-hover-provider/`), find the next task file in `<feature-dir>/tasks/` whose DoD has unchecked items. List the tasks and ask the user which to work on. Feature folders live under status subfolders (`tasks/01-todo/`, `tasks/02-in-progress/`, `tasks/03-done/`).
3. Read the task file.

## Phase 2 - Present and confirm (this session)

Show the user:
- The **What** paragraph
- The **Relevant files** list
- The **Definition of Done** checklist

Use AskUserQuestion: "Proceed with this task?" with options: Proceed / Skip to a different task / Cancel.

If the task references a PRD or design doc in the same feature directory and the user is unsure, offer to show those before proceeding.

## Phase 3 - Hand off to subagent (Agent tool)

Spawn the `task-executor` subagent via the Agent tool with `subagent_type: "task-executor"`. The prompt:

```
You are implementing a parent task. The orchestrator has already confirmed with the user that this work should proceed.

Task file: <absolute path>
Feature directory: <absolute path of parent>
PRD path (if exists): <absolute path>
Design path (if exists): <absolute path>

Instructions:
1. Read the canonical guidance in `CLAUDE.md` and, for any IEC 61131-3 language behaviour, the spec authority `docs/IEC61131_SPECIFICATION.md`.
2. Read the task file in full - it is the contract.
3. Read the referenced PRD and design sections for context.
4. Read each Reference pattern file before writing code.
5. Work autonomously toward the Definition of Done. You have full discretion within the Relevant Files list and the reference patterns.
6. Tick DoD items in the task file as you complete them.
7. Documentation sync (in scope even if not in Relevant Files): for any user-facing change, update `README.md` and/or the relevant pages under `docs/`, and add a `CHANGELOG.md` entry under `[Unreleased]`. Language-data changes must stay consistent with `docs/IEC61131_SPECIFICATION.md` and live in `iec61131-definitions/` and `syntaxes/structured-text.tmLanguage.json`.
8. Do NOT run `git commit`. Return a proposed commit message in your summary.
9. Return the summary in the format your system prompt specifies, including a DOCS line (pages/CHANGELOG updated, or "none needed - <reason>").
```

## Phase 4 - Verify and commit (this session)

When the subagent returns:

1. Read the task file to confirm DoD items are ticked.
2. Show the user the subagent's summary: DoD status, files touched, the DOCS line, proposed commit message, any out-of-scope observations. If a user-facing change has no `README.md`/`docs/` update or no `CHANGELOG.md` `[Unreleased]` entry (and the agent gave no valid no-change reason), re-task the agent to fix the gap before committing - the `/pr` flow will otherwise block the PR at its documentation gate.
3. If unchecked DoD items remain, use AskUserQuestion to ask: "Re-invoke the agent to finish the remaining items, or accept partial completion?"
4. **Sync check before commit** (catches conflicts early, while the changeset is small):
   - `git fetch origin <release-branch>` quietly
   - `git rev-list --count HEAD..origin/<release-branch>` to see how far the release branch has moved
   - If the count is 0: proceed to step 5
   - If the count is greater than 0: merge the release branch in before committing. Run `git merge origin/<release-branch>`. If conflicts arise, resolve preferring current-branch changes for code conflicts and the release branch's version for structural/config conflicts; if a conflict is genuinely ambiguous, stop and ask. Stage and commit the merge with `chore: merge origin/<release-branch> into <branch>` before proceeding.
5. Run `git status` to show what will be staged, then `git add` the relevant files and `git commit` with the proposed Conventional Commit message - commit directly, no message approval needed. Do not add any "Co-Authored-By: Claude" or "Generated with Claude Code" trailer.
6. Confirm the commit hash to the user.

## Phase 5 - Continue or stop (this session)

Use AskUserQuestion: "Process the next parent task in this feature, or stop here?"
- If next: loop to Phase 1 with the next task file in the feature directory
- If stop: end the orchestrator

## Notes

- One parent task per agent invocation. Do not batch parent tasks.
- The user approves at the parent task boundary, not per sub-task. This is intentional - the DoD is the contract.
- If the agent reports out-of-scope observations, decide with the user whether to spin up a separate task or defer.
- Language-data changes (keywords, standard function blocks, grammar) must consult `docs/IEC61131_SPECIFICATION.md` and live in `iec61131-definitions/` and `syntaxes/structured-text.tmLanguage.json`. There is no database and no migration step.

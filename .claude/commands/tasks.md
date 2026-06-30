PRD path: $ARGUMENTS

You are the orchestrator for task list generation. The task writing happens in a fresh-context subagent. The "Go" gate between parent tasks and sub-tasks stays in the main session so the user can course-correct before sub-tasks are written.

## Phase 1 - Prepare brief (this session)

1. If $ARGUMENTS is empty or not a valid path, use AskUserQuestion to ask for the PRD path. Wait for the answer.
2. Verify the PRD file exists. Check the same directory for a `design.md` and note its path if present.
3. Derive the tasks directory: same directory as the PRD, subdirectory `tasks/`.

## Phase 2 - First subagent invocation (parent tasks only)

Spawn the `task-generator` subagent via the Agent tool with `subagent_type: "task-generator"`. The prompt:

```
You are generating a task list. This is the FIRST pass - parent tasks only, do NOT write files yet.

PRD file: <absolute path>
Design file (if exists): <absolute path or "none">
Tasks directory: <absolute path>/tasks/

Instructions:
1. Read the canonical guidance in `CLAUDE.md` and, for any IEC 61131-3 language behaviour, the spec authority `docs/IEC61131_SPECIFICATION.md`.
2. Read the PRD and design (if present).
3. Generate ~5 high-level parent tasks. The first must always be "0.0 Create feature branch" and the last must always be "N.0 Move feature folder to done".
4. Each parent task should be a coherent unit of work (one PR-worthy chunk).
5. Map each parent task to the PRD functional requirements it covers.
6. Return the parent task list ONLY in your message. Do NOT write any files.

Format your return as:
```
- [ ] 0.0 Create feature branch
- [ ] 1.0 <Parent task title>  (covers FR 1, 2, 3)
- [ ] 2.0 <Parent task title>  (covers FR 4, 5)
...
- [ ] N.0 Move feature folder to done
```
```

## Phase 3 - User approval (this session)

When the subagent returns the parent task list:
- Show it to the user verbatim.
- Use AskUserQuestion to ask: "Approve these parent tasks and proceed to sub-task generation, or request changes?" with options: Approve / Request changes / Cancel.
- If "Request changes", ask the user what to change, then spawn the subagent again with the change request appended to the brief.
- Loop until approved.

## Phase 4 - Second subagent invocation (sub-tasks + write files)

Once the user approves, spawn the `task-generator` subagent again with `subagent_type: "task-generator"`. New brief:

```
You are generating sub-tasks and writing the task files.

PRD file: <absolute path>
Design file (if exists): <absolute path or "none">
Tasks directory: <absolute path>/tasks/

Approved parent tasks (from prior round):
<paste the parent task list the user approved>

Instructions:
1. Read the canonical guidance in `CLAUDE.md` and, for any IEC 61131-3 language behaviour, the spec authority `docs/IEC61131_SPECIFICATION.md`.
2. Re-read the PRD and design (you have no memory of the prior round).
3. Break each parent task into actionable sub-tasks. Target a junior developer.
4. For each parent task, save one file at `<tasks-dir>/NN-<parent-task-slug>.md` following the generate-tasks skill format.
5. Each file must include: Relevant Files, Notes (with PR base = the active `release-X.Y.0` branch reminder; discover it with `git ls-remote --heads origin 'release-*'`), Instructions for Completing Tasks, and the Tasks list with the parent + sub-tasks.
6. Run through the Definition of Done checklist before saving each file.
7. Return a summary: list of saved file paths and total sub-task count.
```

## Phase 5 - Confirmation (this session)

When the subagent returns, show the user the list of saved task files. Done.

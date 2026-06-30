Issue to work: $ARGUMENTS

You are the orchestrator for the lightweight "work an existing issue end-to-end" flow: resolve a GitHub issue, branch, implement, commit, and open a PR, WITHOUT the full PRD -> Design -> Tasks pipeline. Use this for bugs and small, well-understood changes. The implementation happens in a fresh-context `task-executor` subagent; you handle the human-facing checkpoints (scope confirmation, branch name). You commit and open the PR autonomously - no commit-message or PR-message approval needed.

The integration branch is the active per-milestone release branch `release-X.Y.0` (referred to below as `<release-branch>`). `main` is release-only - PRs to `main` happen only via `/release`. Discover the active release branch with `git ls-remote --heads origin 'release-*'` and use it everywhere `<release-branch>` appears.

When NOT to use this: if the issue is feature-sized (a new LSP feature provider, a grammar or language-data overhaul, multi-component work, or anything that needs design alignment), stop and recommend the `/prd` workflow instead. Surface this in Phase 1 and let the user decide.

## Phase 1 - Resolve and triage (this session)

1. If $ARGUMENTS is empty, use AskUserQuestion to ask for the issue number or URL. Wait for the answer.
2. Fetch the issue: `gh issue view <number> --json number,title,body,labels,milestone,assignees,state`. If it is already closed, warn and ask whether to continue.
3. Show the user a short summary: title, labels, milestone, and a 2-3 line digest of the body.
4. Triage scope. If the issue looks feature-sized (labelled `enhancement`/`idea` with multi-component scope, a new LSP feature provider, a grammar or language-data overhaul, or otherwise needs design), recommend `/prd` and use AskUserQuestion to confirm: Proceed with lightweight `/work` / Switch to `/prd` / Cancel. For a clear bug or small change, state that and continue.

## Phase 2 - Branch (this session)

1. Sync with the latest release branch: `git fetch origin <release-branch>`.
2. Derive a conventional branch name from the issue's primary label:
   - `bug` -> `fix/issue-<number>-<slug>`
   - `enhancement`/`feature` -> `feature/issue-<number>-<slug>`
   - `documentation` -> `docs/<slug>`
   - otherwise -> `chore/<slug>`
   Derive a kebab `<slug>` from the title.
3. Propose the branch name (e.g. `fix/issue-208-completion-keyword-casing`) and confirm with the user via AskUserQuestion before creating it.
4. Create it off the freshly fetched release branch: `git checkout -b <branch> origin/<release-branch>`. Never branch off local `main` or a local release branch. If the working tree is dirty, stop and ask how to proceed before switching branches.

## Phase 3 - Root-cause (optional, this session -> `debugger` subagent)

Only for a bug whose cause is not already obvious from the issue body. Use AskUserQuestion to offer: Run `/debug`-style investigation first / Skip and implement directly. If the user opts in, spawn the `debugger` subagent (`subagent_type: "debugger"`) with a self-contained brief built from the issue body, any error/stack trace in it, and implicated file paths. The debugger is read-only and returns a root cause + proposed minimal fix; pass that into Phase 4. Skip this phase entirely for clear or trivial changes.

## Phase 4 - Implement (Agent tool -> `task-executor`)

Spawn the `task-executor` subagent via the Agent tool with `subagent_type: "task-executor"`. There is NO task file here - the issue IS the contract. The prompt MUST be a complete self-contained brief:

```
You are implementing a GitHub issue directly (lightweight flow, no task file). The orchestrator has already confirmed scope and created the branch.

Issue #<number>: <title>
Branch (already checked out): <branch>

Issue body (verbatim):
<full body>

Root-cause findings (if Phase 3 ran, else "none"):
<debugger output or "none">

Acceptance criteria (derive from the issue; make them concrete and testable):
- <criterion 1>
- <criterion 2>
...

Relevant files / starting points:
<known paths from the issue or debugger, or "discover from the codebase">

Instructions:
1. Read the canonical guidance in `CLAUDE.md` and, for any IEC 61131-3 language behaviour, the spec authority `docs/IEC61131_SPECIFICATION.md`.
2. Implement the smallest correct fix that satisfies the acceptance criteria. Respect the repo's Core Principles (simplicity, root-cause, minimal impact).
3. Add or update tests that prove the fix: Mocha unit tests (`*.unit.test.ts`) and, where behaviour spans the extension host, e2e tests under `@vscode/test-electron`. Language-data changes must stay consistent with `docs/IEC61131_SPECIFICATION.md` and live in `iec61131-definitions/` and `syntaxes/structured-text.tmLanguage.json`.
4. Run the relevant checks and report the output verbatim: `npm run test:unit` for unit tests, `npm run test:e2e` for e2e, and `npm run webpack-prod` as the production build check.
5. Documentation sync: for any user-facing change, update `README.md` and/or the relevant pages under `docs/`, and add a `CHANGELOG.md` entry under `[Unreleased]`. If no docs change is needed, say so explicitly with a reason.
6. Do NOT commit. Do NOT push.
7. Return: a summary of what changed, the list of files touched, a DOCS line (pages/CHANGELOG updated, or "none needed - <reason>"), the test/build output, and a proposed Conventional Commit message referencing the issue (e.g. `fix: ... (#<number>)`).
```

## Phase 5 - Verify and commit (this session)

1. Review the subagent's summary. Confirm the tests/build actually passed - do not accept a green claim without the output. If they failed, decide with the user whether to re-task the executor or stop.
2. Stage the changes and show the user `git diff --cached --stat` for transparency.
3. Commit autonomously with a generated Conventional Commit message using `-m` flags - no message approval needed. Do not add any "Generated with Claude Code" or "Co-Authored-By: Claude" trailer (these are suppressed via `.claude/settings.json`).
4. Confirm the branch is correct afterward.

## Phase 6 - Open the PR (this session)

Follow the `/pr` command flow to keep behaviour consistent. In short:
1. Sync again: `git fetch origin <release-branch> && git merge origin/<release-branch>` (resolve conflicts preferring this branch's code changes; ask if ambiguous).
2. **Documentation gate (blocking):** before pushing, confirm any user-facing change has a matching `README.md`/`docs/` update and a `CHANGELOG.md` `[Unreleased]` entry. Commit any doc updates on this branch, or add an explicit no-change note to the PR Summary.
3. Push the branch.
4. Create the PR with `gh pr create --base <release-branch> --assignee michaeldistel --milestone "<issue's milestone, if any>"`. Follow `.github/PULL_REQUEST_TEMPLATE.md`. The body uses `## Summary` (1-3 bullets) + `## Testing` (what ran + results), and MUST include `Closes #<number>`.
5. Output the PR URL, then wait for the CI checks with `gh pr checks <number> --watch --fail-fast` before prompting the user about merge. Never prompt to merge a red PR - surface the failing check's logs and stop.

Do not run any deploy command, push to `main`, or merge without explicit user instruction.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other agentic tools when working with code in this repository. It is the canonical source of truth; `AGENTS.md` points here.

## Project

VS Code extension for IEC 61131-3 Structured Text. LSP-based architecture with client-server split.

## Spec Compliance

Consult `docs/IEC61131_SPECIFICATION.md` before any language-related change. It is the authoritative source for keywords, operators, data types, standard function blocks, and vendor compatibility.

## Architecture

```
src/extension.ts                        - Extension entry, commands
src/validator.ts                        - Syntax validation
src/client/lsp-client.ts               - LSP client
src/server/server.ts                   - LSP server
src/server/ast-parser.ts               - AST parser (multi-line accumulator)
src/server/workspace-indexer.ts        - Workspace symbol indexing
src/server/providers/completion-provider.ts
src/server/providers/definition-provider.ts
src/server/providers/formatting-provider.ts
src/server/providers/member-access-provider.ts
src/server/providers/rename-provider.ts
src/shared/types.ts                    - Shared type definitions
syntaxes/structured-text.tmLanguage.json - TextMate grammar
iec61131-definitions/                  - Standard FB definitions (runtime, must ship in .vsix)
samples/                               - User-facing example .st files
manual-tests/                          - Internal QA test fixtures by feature
```

## Data Flow

`STASTParser.parseSymbols()` -> consumed by `server.ts` (local SymbolIndex) and `workspace-indexer.ts` (WorkspaceSymbolIndex) -> providers consume indexed symbols for completion, definition, member-access, rename.

## Build

```bash
npm run compile       # rm -rf out && tsc (dev/test output)
npm run webpack-prod  # rm -rf dist && webpack (production bundle)
npm run clean         # rm -rf out dist
```

- `out/` = tsc output for dev/tests, excluded from .vsix
- `dist/` = webpack bundle shipped in .vsix
- Both dirs cleaned before builds to prevent stale artifacts

## Testing

```bash
npm run test:unit     # compile + mocha unit tests (~307 tests, <1s)
npm run test:e2e      # compile + @vscode/test-electron (needs display)
npm test              # both
```

- Mocha with `suite()`/`test()`, files named `*.unit.test.ts`
- Test discovery via glob `**/*.unit.test.js` in compiled `out/`
- Pre-commit hook (husky) runs unit + e2e before every commit
- All changes must pass: `npm run test:unit` and `npm run webpack-prod`

## AI Workflow

This repo uses a structured PRD -> Design -> Tasks -> Implementation workflow under `.claude/`. The three documentation layers exist for human alignment; the implementing agent fills in the actual code.

Feature folders live under status subfolders: `tasks/01-todo/`, `tasks/02-in-progress/`, `tasks/03-done/`. A feature folder is moved between them as its status changes, and `tasks/TRACKING.md` is updated to match. New PRDs are created under `tasks/01-todo/`. The `##-[feature]` numeric prefix is unique across all status folders. In the paths below, `<status>` is one of those three subfolders.

1. **PRD** (`/prd`) - WHAT the system must do and WHY. Behaviour-focused, no implementation details. Saved to `tasks/<status>/##-[feature]/prd.md`.
2. **Design** (`/design`) - HOW architecturally. Components, interfaces, data flow, tradeoffs. Saved to `tasks/<status>/##-[feature]/design.md`.
3. **Tasks** (`/tasks`) - WORK UNITS with a Definition of Done. Each task file is outcome-based: What + Relevant Files + Reference patterns + DoD. NO step-by-step sub-task lists. Saved to `tasks/<status>/##-[feature]/tasks/NN-[parent-task-slug].md`. The first task is always `0.0 Create feature branch` and the last is always `N.0 Move feature folder to done`.
4. **Implementation** (`/process`) - the `task-executor` agent reads the task file and works toward the DoD with full discretion within the Relevant Files list. User approves at the parent task boundary; the orchestrator then commits with a generated conventional-commit message.

**Orchestrator pattern:** each command is an orchestrator. The main session handles user-facing interaction, then hands a complete written brief to a fresh-context subagent. The subagent reads the relevant files, does the work, and returns. No tribal knowledge in conversational context; everything the subagent needs comes from files or the brief.

### Available commands

- Pipeline: `/prd`, `/design`, `/tasks`, `/process`, `/work`
- Planning + review: `/plan`, `/review`, `/security-review`, `/debug`
- Backlog + project mgmt: `/issue`, `/issues`, `/next`, `/triage`, `/sprint`, `/roadmap`, `/milestone`
- Delivery: `/pr`, `/release`

## Working principles

- **Plan before building.** For any non-trivial change (3+ steps or architectural decisions), plan first. If something goes sideways during implementation, stop and re-plan rather than pushing through.
- **Verify before declaring done.** The Definition of Done in each task file is the contract. Run tests, check output, prove correctness. Do not tick a DoD item without running its verification command.
- **Demand elegance.** For non-trivial changes, pause and ask "is there a more elegant way?" If a fix feels hacky, replace it with the clean solution. Skip this for simple, obvious fixes.
- **Keep docs in sync.** A completed change leaves `README.md`/`docs/` and `CHANGELOG.md` (`[Unreleased]`) current for any user-facing change.

## Conventions

- TypeScript, 4-space indent, explicit types (no `any`)
- Files: kebab-case. Functions: camelCase. Classes: PascalCase. Constants: UPPER_SNAKE_CASE
- Language ID: `structured-text`. Extensions: `.st`, `.iecst`
- Keywords are case-insensitive per IEC 61131-3
- Prefer built-in VS Code/Node APIs over external deps
- Async/await over raw promises
- Dispose all disposables via `context.subscriptions`
- **Git commits:** Conventional Commit format (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`).
- **Attribution:** do NOT add "Co-Authored-By: Claude" or "Generated with Claude Code" trailers to commits or PR bodies. The `attribution` setting in `.claude/settings.json` controls this; do not bypass it by hand-typing the trailer.
- **Em dashes:** do not use em dashes in documents, comments, or output. Use a hyphen (-) or rewrite the sentence.

## Issues

Use GitHub issue templates in `.github/ISSUE_TEMPLATE/`. Blank issues disabled.

| Template | Use for | Auto-label |
|---|---|---|
| `bug.yml` | Bugs, regressions | `bug` |
| `feature.yml` | New features, enhancements | `enhancement` |
| `technical-debt.yml` | Cleanup, refactoring, dep updates | `technical-debt` |
| `idea.yml` | Far-future concepts not yet ready for planning | `idea` |

Add `Priority:` and `Effort:` labels manually per issue. No emoji/icons in titles. Concise text, no time estimates.

## Branching

```
main                   ← stable, tagged releases only; never commit directly
release-X.Y.0          ← integration branch per milestone; PRs merge here
feature/issue-N-desc   ← new functionality
fix/issue-N-desc       ← bug fixes
chore/desc             ← tooling, config, deps
docs/desc              ← documentation only
```

- All branch types target the active `release-X.Y.0` via PR - no direct pushes, no exceptions
- **`main`** updated only when releasing - merge `release-X.Y.0` → `main` via a release PR, then tag
- **Hotfixes** branch off `main`, PR back to both `main` and the active release branch
- Create `release-X.Y.0` at milestone start; delete after merge to `main`
- Active release branch is the one matching the current in-progress milestone
- **Close issues manually after their PR merges to `release-X.Y.0`** - GitHub auto-close only fires on merge to `main`; use the PR checklist item; reopen only if a regression is found before the release ships
- Before starting any issue: check `git log release-X.Y.0 --oneline | grep "#N"` to confirm it hasn't already been merged

## Release Process

**At milestone start - create release branch:**
1. `git checkout main && git pull`
2. `git checkout -b release-X.Y.0 && git push -u origin release-X.Y.0`
3. Apply branch protection (require PR, no force push, no deletion):
   ```bash
   gh api repos/ControlForge-Systems/controlforge-structured-text/branches/release-X.Y.0/protection \
     --method PUT --input - <<'EOF'
   {
     "required_pull_request_reviews": {"required_approving_review_count": 0},
     "required_status_checks": null,
     "enforce_admins": true,
     "restrictions": null,
     "allow_force_pushes": false,
     "allow_deletions": false
   }
   EOF
   ```

**During milestone - tag pre-release when QA starts:**
1. All milestone issues closed and merged into `release-X.Y.0`
2. Tag `vX.Y.0-rc.1` on `release-X.Y.0`, publish as GitHub **pre-release** - signals QA in progress, not for production

**When QA complete - ship:**
1. Move `CHANGELOG.md` `[Unreleased]` entries to `[X.Y.0] - YYYY-MM-DD`
2. Open PR `release-X.Y.0` → `main`
3. Merge PR, tag `vX.Y.0` on `main`
4. `npm run webpack-prod`, then `vsce package && vsce publish` and `ovsx publish`
5. Close the milestone
6. Delete `release-X.Y.0` branch

## Pull Requests

Template at `.github/PULL_REQUEST_TEMPLATE.md`. Two sections:

- **Summary** - 1-3 bullet points: what changed, why, closes which issues
- **Testing** - what ran and results (e.g. `npm run test:unit: 44 passing`)

PRs target the active `release-X.Y.0` by default. PRs to `main` are release-only via `/release`. Do not add Claude attribution trailers to PR bodies.

## Milestones

Title format: `vX.Y.0 - Short Theme` (e.g. `v1.3.0 - Stability & Core LSP`). Theme should describe the capability area, not "Phase N". Description lists concrete deliverables. Each issue gets a `vX.Y.0` release label matching its milestone. Keep labels and milestones in sync.

## Changelog

Follow [Keep a Changelog](https://keepachangelog.com/) with Fixed/Added/Changed/Removed sections. No severity labels. Concise, no implementation details. Unreleased work goes under `[Unreleased]`.

Issue references (`(#N)`) are allowed **only** in `CHANGELOG.md` and `docs/releases/` documents, and **only** on `### Fixed` entries (bug fixes). Do not add issue refs to Added/Changed/Removed entries, source code, comments, manual test fixtures, or any other file.

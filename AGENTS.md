# Agent Instructions

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

## Conventions

- TypeScript, 4-space indent, explicit types (no `any`)
- Files: kebab-case. Functions: camelCase. Classes: PascalCase. Constants: UPPER_SNAKE_CASE
- Language ID: `structured-text`. Extensions: `.st`, `.iecst`
- Keywords are case-insensitive per IEC 61131-3
- Prefer built-in VS Code/Node APIs over external deps
- Async/await over raw promises
- Dispose all disposables via `context.subscriptions`

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
feature/issue-N-desc   ← short-lived; cut from the active release branch
```

- **Feature branches** cut from the active `release-X.Y.0` (matches issue milestone)
- **PRs** target `release-X.Y.0`, never `main`
- **`main`** updated only when releasing — merge `release-X.Y.0` → `main` via a release PR, then tag
- **Hotfixes** branch off `main`, PR back to both `main` and the active release branch
- Create `release-X.Y.0` at milestone start; delete after merge to `main`
- Active release branch is the one matching the current in-progress milestone

## Release Process

**At milestone start — create release branch:**
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

**During milestone — tag pre-release when QA starts:**
1. All milestone issues closed and merged into `release-X.Y.0`
2. Tag `vX.Y.0-rc.1` on `release-X.Y.0`, publish as GitHub **pre-release** — signals QA in progress, not for production

**When QA complete — ship:**
1. Move `CHANGELOG.md` `[Unreleased]` entries to `[X.Y.0] - YYYY-MM-DD`
2. Open PR `release-X.Y.0` → `main`
3. Merge PR, tag `vX.Y.0` on `main`
4. `vsce package && vsce publish`
5. Close the milestone
6. Delete `release-X.Y.0` branch

## Pull Requests

Template at `.github/PULL_REQUEST_TEMPLATE.md`. Two sections:

- **Summary** — 1-3 bullet points: what changed, why, closes which issues
- **Testing** — what ran and results (e.g. `npm run test:unit: 44 passing`)

## Milestones

Title format: `vX.Y.0 - Short Theme` (e.g. `v1.3.0 - Stability & Core LSP`). Theme should describe the capability area, not "Phase N". Description lists concrete deliverables. Each issue gets a `vX.Y.0` release label matching its milestone. Keep labels and milestones in sync.

## Changelog

Follow [Keep a Changelog](https://keepachangelog.com/) with Fixed/Added/Changed/Removed sections. No severity labels. Concise, no implementation details. Unreleased work goes under `[Unreleased]`.

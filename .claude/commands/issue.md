Create a GitHub issue using `gh` with the following details.

Title: $ARGUMENTS

Repo: `ControlForge-Systems/controlforge-structured-text`. Canonical guidance is `CLAUDE.md`.

Steps:
1. Ask me for: description, and which issue template fits. Templates live in `.github/ISSUE_TEMPLATE/`: `bug.yml`, `feature.yml`, `idea.yml`, `epic.yml`, `technical-debt.yml`. Blank issues are disabled, so always map the issue to one of these templates.
2. Pick the category label(s) from this repo's set: `bug`, `enhancement`, `technical-debt`, `idea`. Add relevant area labels where they apply: `lsp`, `grammar`, `performance`, `language-intelligence`, `documentation`, `ui`, `export`, `platform`, `testing`, `simulation`. Use the nearest existing label - do not invent new ones.
3. Ask which milestone to attach. List open milestones with `gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title) (#\(.number))"'`. Milestone titles follow `vX.Y.0 - Short Theme`.
4. Title rules: no emoji or icons, concise, no time estimates.
5. Create the issue: `gh issue create --title "..." --body "..." --label "..." --milestone "..."`
6. If the issue is attached to a milestone `vX.Y.0`, also add the matching `vX.Y.0` release label so labels and milestones stay in sync (create the label first if it does not exist).
7. Add a `Priority:` label manually after creation: `Priority: Critical`, `Priority: High`, `Priority: Medium`, or `Priority: Low` via `gh issue edit <number> --add-label "Priority: ..."`.
8. If the issue is PRD-sized (multi-component scope, ambiguous acceptance criteria), note that it feeds the `/prd` workflow under `tasks/01-todo/`.
9. Output the issue URL.

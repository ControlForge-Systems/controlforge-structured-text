Show and manage GitHub issues for this repo.

Repo: `ControlForge-Systems/controlforge-structured-text`.

Arguments (optional): $ARGUMENTS - filter by label, milestone, or assignee

Steps:
1. List open issues: `gh issue list $ARGUMENTS`
2. If no arguments, group by milestone. Get open milestones with `gh api repos/:owner/:repo/milestones --jq '.[].title'`, then run `gh issue list --milestone "<name>"` for each.
3. Ask if I want to: view, assign, label, close, or link an issue to the current branch.
4. Perform the requested action using `gh issue edit` or `gh issue close`. When changing a milestone, keep the matching `vX.Y.0` release label in sync.

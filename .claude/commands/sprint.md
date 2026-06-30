Show the current sprint/milestone status - open issues, PRs in review, and recent merges.

Repo: `ControlForge-Systems/controlforge-structured-text`. Active integration branch is `release-X.Y.0`; `main` is release-only.

Steps:
1. List open milestones: `gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title): \(.open_issues) open / \(.closed_issues) closed"'` (the repo may not have `gh milestone` available - prefer the `gh api` form).
2. For the most active milestone, show:
   - Open issues: `gh issue list --milestone "<name>" --state open`
   - Closed issues this milestone: `gh issue list --milestone "<name>" --state closed`
   - Open PRs: `gh pr list --state open`
3. Summarise: X of Y issues closed, PRs pending review, estimated completion based on velocity.
4. Flag any open issues with no assignee.

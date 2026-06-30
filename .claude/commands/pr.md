Create a pull request for the current branch using `gh`.

Branch model (see CLAUDE.md "Branching"): `main` is stable/release-only. Each milestone has an integration branch `release-X.Y.0`. Feature/fix/chore/docs branches PR into the ACTIVE `release-X.Y.0`, never directly into `main`. PRs to `main` are release-only via `/release`.

Steps:
1. Discover the active release branch:
   ```
   git ls-remote --heads origin 'release-*'
   ```
   - Pick the highest `release-X.Y.0` matching the current in-progress milestone. Call it `<release>` (e.g. `release-1.5.0`) for the rest of this command.
   - If none exists, stop and tell the user no active `release-X.Y.0` branch was found - one must be created at milestone start (see `/release`).
2. Gather branch summary (kept bounded - do NOT pull the full commit history for long-running branches):
   - `git status` to see uncommitted changes
   - `git rev-list --count origin/<release>..HEAD` to get the commit count
   - `git diff origin/<release>...HEAD --stat | tail -1` for an overall size summary
   - `git log origin/<release>..HEAD --oneline -n 50` to see recent commit subjects (capped; if the count exceeds 50, note "+N earlier commits" but do not pull them)
3. Check current branch name. Warn if on `main` or `<release>` - PRs open from a feature/fix/chore/docs branch.
4. Sync with the latest active release branch before creating the PR:
   ```
   git fetch origin <release>
   git merge origin/<release>
   ```
   - Only if `origin/<release>` actually moved (the fetch reports new commits / `git rev-list --count HEAD..origin/<release>` > 0). If it did not move, skip the merge.
   - If conflicts arise, resolve them before proceeding:
     - Prefer the current branch's changes unless the conflict is clearly a structural or path issue
     - Stage resolved files with `git add`
     - Commit the merge: `git commit -m "chore: merge origin/<release> into <branch>"` (Conventional Commit format; no em dashes)
     - Push: `git push`
   - If conflicts cannot be resolved cleanly, stop and explain what needs manual attention.
5. **Pre-PR checks (blocking - all must pass before creating the PR):**
   ```
   npm run test:unit
   npm run webpack-prod
   ```
   - If either fails, stop and surface the failure. Do not open a red PR.
6. **Documentation gate (blocking - clear before creating the PR).** A completed change keeps docs current for any user-facing change. Look at what the branch changes (`git diff origin/<release>...HEAD --stat`) and update on this same branch before opening the PR:
   - `CHANGELOG.md` `[Unreleased]` - add Fixed/Added/Changed/Removed entries per [Keep a Changelog]. Issue refs `(#N)` are allowed ONLY on `### Fixed` entries.
   - `README.md` and `docs/` - update when the change adds, removes, renames, or alters behaviour of something a user can see or use (a setting, command, language feature, snippet, install/setup step).
   - If a change genuinely needs no doc update, add one line to the PR Summary saying so with a reason. Do NOT open the PR while docs are stale.
7. Generate the PR title and body, default the base to the active `<release>`, and infer the milestone and the issues to close from the branch name and commits - no need to ask the user to approve these first.
   - If the user explicitly requested base `main`, warn that `main` PRs are release-only and should go through `/release`, and do not open it without explicit instruction.
   - Body follows `.github/PULL_REQUEST_TEMPLATE.md`:
     - `## Summary` - 1-3 bullets: what changed, why, `Closes #N` if applicable
     - `## Testing` - commands run + results, e.g. `npm run test:unit: NNN passing`, `npm run webpack-prod: success`
     - Keep the `## Post-merge` checklist (`- [ ] Close linked issue(s)`).
   - Do NOT add "Co-Authored-By: Claude" or "Generated with Claude Code" trailers (suppressed via `.claude/settings.json`; do not hand-type them).
8. Create the PR:
   ```
   gh pr create --title "..." --body "..." --base "<release>" --milestone "..."
   ```
9. Output the PR URL.
10. Verify the PR checks (tests) **before** prompting for merge. Wait for checks to settle so the user is not asked to merge a red PR:
    ```
    gh pr checks <number> --watch --fail-fast
    ```
    - **All passed**: tell the user checks are green and proceed to step 11.
    - **Failed**: name the failing check and surface its logs, then stop and let the user decide - do not prompt to merge a failing PR:
      ```
      gh pr checks <number>            # lists each check + its run URL
      gh run view <databaseId> --log-failed
      ```
      (Get the failed run's `databaseId` from `gh run list --branch <branch> --limit 5 --json databaseId,workflowName,conclusion,headSha`.)
    - **Still pending / timed out**: give the user the PR URL and tell them they can re-check with `gh pr checks <number> --watch`. Do not proceed to merge on their behalf.
11. Wait for merge confirmation. Use AskUserQuestion: "Did you merge this PR?" with options: Merged / Not yet / Cancelled.
    - If **Not yet**: tell the user they can run `git checkout <release> && git pull origin <release>` themselves once the PR merges, then re-run this command's cleanup phase (or do it manually). Do not block.
    - If **Cancelled**: leave the branch and PR as-is. Stop here.
    - If **Merged**: proceed to the Cleanup phase.

## Cleanup phase (only if PR was merged)

Sync local git and clean up the feature branch so the user is ready to start fresh.

1. Note the current branch name as `<old-branch>`.
2. Switch to the active release branch and pull the latest:
   ```
   git checkout <release>
   git pull origin <release>
   ```
   This brings in the squash-merged or rebase-merged commit.
3. **Close linked issue(s) manually.** GitHub auto-close only fires on merge to `main`; merges to `<release>` do NOT auto-close. For each `#N` referenced by the PR, close it (e.g. `gh issue close <N>`), unless a regression is found before release.
4. Delete the local feature branch:
   - Use AskUserQuestion: "Delete local branch `<old-branch>`?" with options: Delete (recommended) / Keep.
   - If Delete: `git branch -D <old-branch>` (use `-D` because a squash merge leaves the branch looking "unmerged" to git even though the content is on `<release>`).
5. Delete the remote branch (only if the repo does NOT auto-delete merged branches):
   - Check: `git ls-remote --heads origin <old-branch>` - if it returns a line, the remote branch still exists.
   - If it exists, use AskUserQuestion: "Delete remote branch `origin/<old-branch>`?" with options: Delete / Keep.
   - If Delete: `git push origin --delete <old-branch>`.
6. Prune stale remote-tracking refs: `git fetch --prune origin`.
7. Confirm to the user:
   - Current branch: `<release>`
   - HEAD: `<new commit hash and subject>`
   - Linked issue(s) closed (or noted otherwise)
   - Ready to start the next branch from a clean state.

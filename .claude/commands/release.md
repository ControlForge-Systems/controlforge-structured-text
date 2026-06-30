Ship a release of the VS Code extension to the Marketplace and Open VSX, and tag it on `main`.

This is the ONLY workflow that results in release activity tied to `main`. Normal feature/fix/chore/docs PRs target the active `release-X.Y.0` via `/pr`. There is NO server deploy, NO docker, NO ssh - this is a Marketplace / Open VSX publish only.

Version: $ARGUMENTS

Steps:
1. Determine the version `X.Y.0` from `$ARGUMENTS`. If not provided, ask the user for it. Use it consistently below (the release branch is `release-X.Y.0`, the tag is `vX.Y.0`).
2. Confirm the milestone is complete - all milestone issues are merged into `release-X.Y.0`:
   ```
   git ls-remote --heads origin 'release-*'        # confirm release-X.Y.0 exists
   gh issue list --milestone "vX.Y.0 - <theme>" --state open
   ```
   - If open milestone issues remain, stop and report them - they must be merged (or moved out of the milestone) first.
3. **Optional pre-release for QA.** Offer to tag `vX.Y.0-rc.1` on `release-X.Y.0` and publish it as a GitHub **pre-release** to signal QA is in progress (not for production). Only do this if the user asks; it is a QA gate before shipping:
   ```
   git checkout release-X.Y.0 && git pull origin release-X.Y.0
   git tag vX.Y.0-rc.1 && git push origin vX.Y.0-rc.1
   gh release create vX.Y.0-rc.1 --target release-X.Y.0 --title "vX.Y.0-rc.1" --notes "..." --prerelease
   ```
4. Update the changelog on `release-X.Y.0`. Move `CHANGELOG.md` `[Unreleased]` entries into a new `[X.Y.0] - YYYY-MM-DD` section (use today's date). Leave `[Unreleased]` empty.
5. Bump `package.json` `version` to `X.Y.0`.
6. Commit the changelog + version bump on `release-X.Y.0` (Conventional Commit format, ASCII only):
   ```
   git add CHANGELOG.md package.json
   git commit -m "chore: release vX.Y.0"
   git push origin release-X.Y.0
   ```
7. Draft release notes from the merged commits. Group by conventional-commit type:
   ```
   git log $(git describe --tags --abbrev=0)..release-X.Y.0 --oneline
   ```
   Format:
   ```
   ## What's changed
   ### Features
   - ...
   ### Bug fixes
   - ...
   ### Other
   - ...
   ```
8. Ask the user to confirm the notes and the version before proceeding to publish.
9. Open the release PR `release-X.Y.0` -> `main`:
   ```
   gh pr create --base main --head release-X.Y.0 --title "Release vX.Y.0" --body "..."
   ```
   - Do NOT add "Co-Authored-By: Claude" / "Generated with Claude Code" trailers (suppressed via `.claude/settings.json`).
   - Output the PR URL. Wait for merge confirmation via AskUserQuestion: "Did you merge the release PR into `main`?" (Merged / Not yet / Cancelled). Do not proceed until merged.
10. Tag `vX.Y.0` on `main`:
    ```
    git checkout main && git pull origin main
    git tag vX.Y.0 && git push origin vX.Y.0
    ```
11. Build and publish to the Marketplace and Open VSX. These are user-gated (`ask`) permissions - surface each command and let the user run/approve it; do not assume:
    ```
    npm run webpack-prod
    vsce package
    vsce publish
    ovsx publish
    ```
12. Create the GitHub release on the tag:
    ```
    gh release create vX.Y.0 --target main --title "vX.Y.0" --notes "..."
    ```
    Output the release URL.
13. Close the milestone:
    ```
    gh api repos/ControlForge-Systems/controlforge-structured-text/milestones/<number> --method PATCH -f state=closed
    ```
14. Delete the `release-X.Y.0` branch (local + remote):
    ```
    git branch -d release-X.Y.0
    git push origin --delete release-X.Y.0
    git fetch --prune origin
    ```
15. Confirm to the user: tag `vX.Y.0` on `main`, published to Marketplace + Open VSX, GitHub release URL, milestone closed, release branch removed.

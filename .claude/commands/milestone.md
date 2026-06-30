Create a GitHub milestone using `gh`.

Title: $ARGUMENTS

Repo: `ControlForge-Systems/controlforge-structured-text`. Milestone titles follow the format `vX.Y.0 - Short Theme`.

Steps:
1. Normalise the title to `vX.Y.0 - Short Theme` (no emoji/icons, no time estimates). Ask me for: due date (optional) and description.
2. Create it (the repo may not have `gh milestone` available - prefer the `gh api` form):
   `gh api repos/ControlForge-Systems/controlforge-structured-text/milestones --method POST --field title="vX.Y.0 - Short Theme" --field description="..." --field due_on="..."`
3. Ensure a matching `vX.Y.0` release label exists so labels and milestones stay in sync. Create it if missing: `gh label create "vX.Y.0" --description "Release vX.Y.0"`.
4. List existing milestones after creation: `gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title) (#\(.number))"'`.
5. Output the milestone URL.

Target: $ARGUMENTS

You are the orchestrator for a code review. The review analysis happens in a fresh-context subagent. No files are modified.

## Phase 1 - Resolve target (this session)

$ARGUMENTS may be:
- A PR number (e.g. "197")
- A branch name (e.g. "feature/expand-unit-tests")
- Empty (review the current branch's diff against the active release branch)

Branch model: `main` is release-only. The active integration branch is `release-X.Y.0`. Discover it with:
`git ls-remote --heads origin 'release-*'`
Use the highest `release-X.Y.0` as the default base (currently `release-1.5.0`).

1. Determine which target to review.
2. Gather metadata only (do NOT pull the full diff in main session - the subagent will do that):
   - PR number: `gh pr view <num> --json title,body,baseRefName,headRefName` for metadata, then `gh pr diff <num> --name-only` for the changed-file list
   - Branch: `git diff origin/<base>...origin/<branch> --name-only`
   - Current branch: `git diff origin/<release-X.Y.0>...HEAD --name-only`
3. Get a size summary: `git diff origin/<base>...origin/<head> --stat | tail -1` to know how big the change is.

## Phase 2 - Hand off to subagent (Agent tool)

Spawn the `reviewer` subagent via the Agent tool with `subagent_type: "reviewer"`. The prompt MUST be a complete self-contained brief but contain ONLY metadata, NOT the diff itself:

```
You are reviewing a code change. The orchestrator has gathered metadata - YOU will fetch the diff yourself using the commands below.

Target: <PR # or branch name>
Base branch: <release-X.Y.0 or other>
Head ref: <branch or HEAD>
PR title (if PR): <title>
PR description (if PR): <body>
Total size: <X files, Y insertions, Z deletions>

Changed files:
- <path 1>
- <path 2>
...

Diff fetch commands (run these yourself; do not request the full diff up front):
- All-files diff for small PRs: `gh pr diff <num>` OR `git diff origin/<base>...origin/<head>`
- Per-file diff for large PRs: `gh pr diff <num> -- <path>` OR `git diff origin/<base>...origin/<head> -- <path>`
- File contents: `Read` the file directly when the diff lacks context

Instructions:
1. Read the canonical guidance in CLAUDE.md, and docs/IEC61131_SPECIFICATION.md when the change touches language/spec behavior.
2. If the total size is over ~500 lines, do NOT pull the full diff. Review file by file, starting with the highest-risk files (LSP server request handlers, grammar/parser, public extension API, then everything else).
3. Apply the review checklist from your system prompt.
4. Do NOT modify any files.
5. Return structured feedback in the exact format your system prompt defines.
```

## Phase 3 - Display (this session)

Show the user the full review output verbatim. Do not apply any fixes - that is a separate decision by the user.

If the user wants to apply the review feedback, they can either implement themselves or invoke `/process` if it maps to existing task files.

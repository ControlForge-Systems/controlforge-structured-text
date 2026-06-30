Target: $ARGUMENTS

You are the orchestrator for a security-focused code review. Same shape as `/review` but the subagent applies a security lens.

## Phase 1 - Resolve target (this session)

$ARGUMENTS may be a PR number, a branch name, or empty (current branch vs the active release branch).

Branch model: `main` is release-only. The active integration branch is `release-X.Y.0`. Discover it with:
`git ls-remote --heads origin 'release-*'`
Use the highest `release-X.Y.0` as the default base (currently `release-1.5.0`).

1. Determine which target to review.
2. Gather metadata only (do NOT pull the full diff in main session):
   - PR: `gh pr view <num> --json title,body,baseRefName,headRefName` and `gh pr diff <num> --name-only`
   - Branch: `git diff origin/<base>...origin/<branch> --name-only`
   - Current: `git diff origin/<release-X.Y.0>...HEAD --name-only`
3. Get a size summary: `git diff origin/<base>...origin/<head> --stat | tail -1`.
4. Identify sensitive-area files in the changed list. Touch any of these and the review is high-stakes: grammar/regex (ReDoS risk), file/path handling, any spawned child process or shell invocation, LSP message handling, dependency manifests (`package.json`/lockfile), and anything reading or emitting credentials or environment variables.

## Phase 2 - Hand off to subagent (Agent tool)

Spawn the `reviewer` subagent via the Agent tool with `subagent_type: "reviewer"`. The prompt MUST be a complete self-contained brief but contain ONLY metadata, NOT the diff itself. It must specify the security focus:

```
You are conducting a SECURITY review of a code change. Focus exclusively on security implications. YOU fetch the diff yourself using the commands below.

Target: <PR # or branch name>
Base branch: <release-X.Y.0 or other>
Head ref: <branch or HEAD>
Total size: <X files, Y insertions, Z deletions>

Sensitive-area files in this diff:
- <path 1 - which security area it touches>
- <path 2 - which area>
...

Changed files (full list):
- <paths>

Diff fetch commands (run these yourself; scope by file for large PRs):
- Per-file diff: `gh pr diff <num> -- <path>` OR `git diff origin/<base>...origin/<head> -- <path>`
- File contents: `Read` the file directly when the diff lacks context

Security checklist - apply each (VS Code extension + LSP server context):
1. **Secrets** - no hardcoded API keys, tokens, or credentials. Check for accidental commits of .env, credentials, or similar. No secrets written to logs or output channels.
2. **Input validation** - LSP requests, document content, configuration values, and workspace-supplied data are validated before use. Untrusted input is never treated as trusted structure.
3. **Unsafe file/path handling** - no path traversal; paths derived from workspace or user input are normalized and constrained. No following symlinks outside the workspace. No arbitrary file read/write driven by untrusted input.
4. **ReDoS in grammar/regex** - new or changed regular expressions (TextMate grammar, tokenizer, parser) cannot catastrophically backtrack on adversarial input. Watch for nested quantifiers and overlapping alternations.
5. **Command injection** - any spawned process (`child_process`, shell, build tooling) uses argument arrays, never string interpolation of untrusted input into a shell. No `shell: true` with interpolated values.
6. **Dependency risk** - any new or bumped dependency reviewed for known CVEs and supply-chain risk. Lockfile changes are intentional. No unnecessary or unmaintained packages added.
7. **Secret/data leakage** - no sensitive data leaked through diagnostics, hover/completion output, telemetry, or error messages surfaced to the user.

Instructions:
1. Read the canonical guidance in CLAUDE.md, and docs/IEC61131_SPECIFICATION.md when the change touches language/spec behavior.
2. Prioritise sensitive-area files first. Read them in full, not just the diff.
3. For large PRs (>500 lines), review file by file - do NOT pull the entire diff at once.
4. Return structured findings in the exact format:

   Critical (must fix before merge - security exposure):
   - <file:line - issue, attack scenario, rationale>

   High (should fix before merge):
   - <file:line - issue and rationale>

   Suggestions (defence-in-depth improvements):
   - <suggestion>

   Looks good:
   - <security-positive observations>
```

## Phase 3 - Display (this session)

Show the user the full security review verbatim. For any Critical findings, recommend they fix before merging the PR. Do not apply fixes from this command.

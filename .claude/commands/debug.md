Issue description: $ARGUMENTS

You are the orchestrator for debug investigation. Evidence gathering happens in this session (it can run local commands and ask the user follow-up questions). Root-cause analysis happens in a fresh-context subagent. This is a LOCAL extension project - there are no remote servers, containers, or ssh; all evidence comes from the code, git history, test output, and reproduction in the extension.

## Phase 1 - Gather evidence (this session)

1. If $ARGUMENTS is empty, use AskUserQuestion to ask the user to describe the issue. Wait for the answer.
2. Ask the user via AskUserQuestion to confirm what evidence is available:
   - Error message or stack trace (extension host output, debug console, or test failure)
   - Steps to reproduce (which command/feature, sample Structured Text input)
   - When did this last work (commit ref, release tag, branch name, or "always broken")
   - Which surface is affected (LSP server, extension client, grammar/parser, build)
3. Gather the evidence sparingly:
   - Reproduce locally where possible: run the relevant tests rather than guessing. Unit tests: `npm run test:unit` (Mocha, `*.unit.test.ts`). End-to-end: `npm run test:e2e` (`@vscode/test-electron`). Build check: `npm run webpack-prod`. Type check via `tsc`. Capture a capped tail of the failing output - do not paste full logs; the subagent can request more.
   - Do NOT pre-fetch the full git log. If the user gave a "last worked" reference, just note the ref and pass it to the subagent. Optionally run `git rev-list --count <ref>..HEAD` to know how many commits are in range.
   - From the error/stack trace, identify the file paths implicated (e.g. lines like `at src/server/foo.ts:123`) and pass those to the subagent as `implicated_paths`. The subagent will use these to scope its git queries.
   - Read any error messages, stack traces, or reproduction steps the user provided.
4. Confirm with the user what you collected before handing off.

## Phase 2 - Hand off to subagent (Agent tool)

Spawn the `debugger` subagent via the Agent tool with `subagent_type: "debugger"`. The prompt MUST be a complete self-contained brief:

```
You are investigating a bug in this VS Code extension / LSP project. The orchestrator (main session) has already gathered evidence - do NOT re-ask the user any questions.

Issue: <one-paragraph description>

Evidence:
- Test / extension-host output (verbatim, capped to ~200 lines): <paste or "none">
- Error/stack trace: <paste or "none">
- Steps to reproduce: <paste or "none">
- Affected surface: <LSP server / extension client / grammar-parser / build>
- "Last known good" reference: <ref or "none">
- Commit count between ref and HEAD: <count or "unknown">
- Implicated file paths (extracted from the stack trace): <list or "none">

Instructions:
1. Read the canonical guidance in CLAUDE.md, and docs/IEC61131_SPECIFICATION.md when the bug touches language/spec behavior.
2. Investigate the root cause from local evidence: code, git history (`git log` / `git diff`), test output, and reasoning about reproduction. Do NOT touch code.
3. If you need git history, run scoped queries to keep context small:
   - `git log --oneline -n 30 <ref>..HEAD -- <implicated-path>` for a file-scoped history
   - `git diff <ref>..HEAD -- <implicated-path>` to see what changed in a suspect file
   - `git log --oneline -n 50 <ref>..HEAD` only if the implicated paths are not specific enough
   - Never pull more than 50 commits at a time; if the range is huge, narrow it by file or by date.
4. Identify the root cause and the commit (if any) that introduced it.
5. Propose a minimal fix - what file, what line, what change.
6. Return per the format defined in your system prompt.
7. Do NOT apply the fix.
```

## Phase 3 - Close the loop (this session)

When the subagent returns:
- Show the root cause and proposed fix to the user.
- Use AskUserQuestion: "Apply this fix, ask for more investigation, or decide separately?"
- If "apply", implement the fix in main session (or hand off to the appropriate agent if it crosses agent boundaries).
- If "more investigation", gather additional evidence and re-spawn the subagent with the expanded brief.
- Never apply multiple speculative fixes - one confirmed fix at a time.

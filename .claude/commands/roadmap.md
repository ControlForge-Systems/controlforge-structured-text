Roadmap context: $ARGUMENTS

Repo: `ControlForge-Systems/controlforge-structured-text`. Canonical guidance is `CLAUDE.md`.

You are the orchestrator for roadmap creation. The roadmap writing happens in a fresh-context subagent.

## Phase 1 - Gather business goals (this session)

Use AskUserQuestion to collect:

1. **Business outcomes** - what is the roadmap trying to drive? (adoption, reliability, language coverage, performance, new market, etc.)
2. **Timeframe** - how far out does this cover? (next quarter, 6 months, year, multi-year)
3. **Hard deadlines** - any external commitments, contracts, or fixed dates to work around?
4. **Current pain points** - what is the biggest user or team complaint right now?
5. **Already committed** - any features already in progress or pre-committed that must appear?

Optionally ask 1-2 follow-ups if the answers reveal ambiguity.

## Phase 2 - Hand off to subagent (Agent tool)

Spawn the `roadmap` subagent via the Agent tool with `subagent_type: "roadmap"`. The prompt MUST be a complete self-contained brief:

```
You are writing a product roadmap. The orchestrator has already gathered business goals - do NOT re-ask the user.

Business outcomes: <user's answer>
Timeframe: <user's answer>
Hard deadlines: <user's answer or "none">
Current pain points: <user's answer>
Already committed: <user's answer or "none">

Target file: /mnt/data/Projects/controlforge-structured-text/docs/roadmap.md

Instructions:
1. Read CLAUDE.md for canonical project guidance, stack, and conventions.
2. Read the existing docs/roadmap.md if it exists - preserve any items that are still relevant.
3. Read open GitHub issues and milestones via `gh` if useful (`gh api repos/:owner/:repo/milestones`).
4. Organise features into milestones following the title format `vX.Y.0 - Short Theme`.
5. For each item: What, Why, Size (S/M/L), Priority (MoSCoW), Dependencies.
6. Save to the target file path.
7. Return a summary: milestone names with target dates and total item counts.
8. List the GitHub milestones the user should create (format: vX.Y.0 - Theme).
```

## Phase 3 - Confirm (this session)

When the subagent returns:
- Show the user the summary and the list of GitHub milestones to create.
- Ask via AskUserQuestion: "Create the GitHub milestones now, or do that separately?"
- If yes, create each milestone with `gh api repos/:owner/:repo/milestones --method POST --field title="vX.Y.0 - Theme" --field description="..."`. After creating each, ensure a matching `vX.Y.0` release label exists so labels and milestones stay in sync.

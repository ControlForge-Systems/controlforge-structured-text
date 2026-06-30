Help select the next issue to work on. Optional filter: $ARGUMENTS (passed through to `gh issue list`, e.g. a label or milestone).

Repo: `ControlForge-Systems/controlforge-structured-text`. Canonical guidance is `CLAUDE.md`.

You are the orchestrator for the "pick the next issue" flow. Your job is to rank open GitHub issues by a fixed policy (priority, then milestone, then age), recommend the single best PRD-free issue to start now, and separately flag high-priority work that needs a PRD so the user can decide. This is read-only until the user chooses to act. Do NOT modify issues, branches, or code here.

## Ranking policy (fixed - do not improvise)

Rank candidates by, in strict order:

1. **Priority label** - `Priority: Critical` > `Priority: High` > `Priority: Medium` > `Priority: Low` > unlabelled (treat as `Priority: Medium`).
2. **Milestone order** - earlier milestone first by version number: `v1.4.0` before `v1.5.0` before `v2.0.0`. Issues with no milestone sort after milestoned ones at the same priority.
3. **Age** - older `createdAt` first (longest-waiting breaks ties).

## PRD-needed vs PRD-free

**The `needs-prd` label is authoritative.** An issue carrying `needs-prd` is PRD-needed, full stop - `/triage` maintains this label. Trust it over your own read.

Only when an issue has NO `needs-prd` label, fall back to the heuristic (same as `/work` triage). An unlabelled issue is **PRD-needed** if any hold:
- Labelled `enhancement` or `idea` AND the body implies multi-component scope.
- Touches multiple layers of the stack (grammar, LSP server, LSP client, VS Code extension surface) at once.
- Otherwise needs design alignment (ambiguous acceptance criteria).

If the heuristic and the absence of a label disagree (you think it's PRD-sized but it's unlabelled), still treat it as PRD-needed for the recommendation, and note it as a candidate for `/triage` to label.

Everything else is **PRD-free**: a clear bug or a small, well-understood change that can go straight through the lightweight `/work` flow. PRD-sized issues feed the `/prd` workflow under `tasks/01-todo/`.

## Phase 1 - Gather (this session)

1. Fetch open issues that are NOT deferred, with the fields needed to rank and classify. The `deferred` label means "do not suggest until I remove it", so exclude it at the source:
   `gh issue list --state open --limit 100 --search "-label:deferred" $ARGUMENTS --json number,title,labels,milestone,assignees,createdAt,body`
2. **Hard exclusion (do not override):** never recommend, rank, or list as a candidate any issue carrying the `deferred` label, even if it would otherwise rank first. If the user explicitly asks to see deferred issues, fetch them separately and present them clearly marked as deferred - but they are never the answer to "what's next".
3. If the list is empty, say so and stop.

Assignment is not a ranking signal. Do not treat assigned issues specially, do not exclude them, and do not call out who owns them - rank purely by the policy below.

## Phase 2 - Rank and classify (this session)

1. Apply the ranking policy above to produce an ordered list.
2. Classify each top candidate as PRD-free or PRD-needed using the heuristic above.
3. The **recommendation** is the highest-ranked **PRD-free** issue. Walk down the ranked list until you find one.

## Phase 3 - Present (this session)

Output, concisely:

1. **Recommended next issue** - the top PRD-free pick: `#<number> <title>`, its priority + milestone, why it ranks first (one line), and a 2-3 line digest of what the work is.
2. **Runner-up PRD-free issues** - the next 2-3 PRD-free candidates as a short ranked list (number, title, priority, milestone), so the user has alternatives.
3. **Needs a PRD (informational)** - any issue that outranks or sits near the recommendation but is PRD-needed. For each: `#<number> <title>`, priority + milestone, and one line on why it needs a PRD. This is the "inform me" surface - do NOT start these. Note that the user can run `/prd` when ready.

## Phase 4 - Handoff (this session)

Use AskUserQuestion to offer:
- **Start `/work <number>` on the recommended issue** - hand off to the existing `/work` flow for that issue number.
- **Pick a different issue** - let the user name a number from the shortlist, then start `/work` on it.
- **Just the list** - stop here; the user will decide later.

If the user chooses to start `/work`, invoke the `/work` command flow with that issue number. Do not bypass `/work`'s own scope-confirmation and branch steps. Never start work on a PRD-needed issue through `/work`; if the user insists on one, recommend `/prd` instead and let them decide.

Do not create branches, edit issues, or run any deploy command in this flow.

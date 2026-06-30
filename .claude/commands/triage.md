Audit and groom the open-issue backlog: fix hygiene gaps, assign milestones, mark PRD-sized issues, and clean up stale/duplicate issues. Optional filter: $ARGUMENTS (passed through to `gh issue list`, e.g. a label or milestone).

Repo: `ControlForge-Systems/controlforge-structured-text`. Canonical guidance is `CLAUDE.md`.

You are the orchestrator for backlog grooming. You audit every open issue against a hygiene checklist, then remediate. Safe, low-risk fixes are applied automatically; judgment calls (milestone, priority, closing) are proposed and applied only after the user approves the batch. This command mutates GitHub issues, so follow the apply rules below exactly - never close or re-prioritise without confirmation.

## Setup - labels this command relies on

- `needs-prd` - feature-sized issue that requires a PRD before implementation. This is the authoritative PRD marker that `/next` reads.
- `deferred` - snoozed; `/next` skips it. Do not add/remove this in grooming unless the user asks.
- Priority labels: `Priority: Critical`, `Priority: High`, `Priority: Medium`, `Priority: Low` (added manually).
- Category labels: `bug`, `enhancement`, `technical-debt`, `idea`.
- Area labels: `lsp`, `grammar`, `performance`, `language-intelligence`, `documentation`, `ui`, `export`, `platform`, `testing`, `simulation`.
- Release labels: `vX.Y.0`, kept in sync with the issue's milestone.

If `needs-prd` does not exist, create it first:
`gh label create "needs-prd" --color "5319e7" --description "Feature-sized: requires a PRD before implementation (run /prd)"`

## Milestone map (for assignment suggestions)

Milestones follow the title format `vX.Y.0 - Short Theme`. Discover the live set with:
`gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title) (#\(.number))"'`

Assign issues to the milestone whose theme best matches the work. Every issue assigned to milestone `vX.Y.0` also gets the matching `vX.Y.0` release label, so labels and milestones stay in sync.

## PRD-sized heuristic (same as `/work` and `/next`)

An issue is PRD-sized (gets `needs-prd`) if any hold:
- Labelled `enhancement` or `idea` AND the body implies multi-component scope.
- Touches multiple layers of the stack (grammar, LSP server, LSP client, VS Code extension surface) at once.
- Otherwise needs design alignment (ambiguous/open-ended acceptance criteria).

A clear bug or small, well-understood change is NOT PRD-sized. PRD-sized issues feed the `/prd` workflow under `tasks/01-todo/`.

## Phase 1 - Gather (this session)

Fetch all open issues with the fields needed to audit:
`gh issue list --state open --limit 200 $ARGUMENTS --json number,title,labels,milestone,assignees,createdAt,updatedAt,body`

If empty, say so and stop.

## Phase 2 - Audit (this session)

For each issue, evaluate against the hygiene checklist and bucket the findings:

1. **Missing category label** - no `bug`/`enhancement`/`technical-debt`/`idea`. Infer the obvious one from title/body.
2. **Missing priority** - no `Priority:` label. Suggest one from severity/impact in the body (default `Priority: Medium` if genuinely unclear).
3. **Missing milestone** - `milestone` is null. Suggest one using the milestone map above. Flag the matching release label.
4. **Milestone/label drift** - milestone and `vX.Y.0` release label disagree. Bring them back in sync.
5. **PRD classification drift** - PRD-sized per the heuristic but NOT labelled `needs-prd` (should add it), OR labelled `needs-prd` but actually a small/clear change (should remove it).
6. **Stale** - no update in 90+ days (use `updatedAt`). Flag for review.
7. **Possible duplicate** - near-identical title/scope to another open issue. Flag the pair; never auto-merge.
8. **Low-signal** - empty/one-line body with no clear ask. Flag for the user to clarify or close.

Title hygiene: flag titles that carry emoji/icons or time estimates; titles should be concise.

## Phase 3 - Apply mode (this session)

Split findings into two tiers and handle each differently:

**Tier A - auto-apply (safe, low-risk).** Apply immediately without a confirmation gate, then report what you changed:
- Adding a clearly-missing category label (e.g. an issue titled "fix: ..." with no `bug` label).
- Adding/removing `needs-prd` to match the PRD heuristic.
- Adding the `vX.Y.0` release label that matches an already-assigned milestone.

Use `gh issue edit <number> --add-label "<label>"` / `--remove-label "<label>"`. Batch with one call per issue.

**Tier B - propose, then apply on approval (judgment calls).** Present these as a grouped plan and use AskUserQuestion to approve before touching anything:
- **Priority** assignments/changes.
- **Milestone** assignments (and the matching release label).
- **Closing** stale / duplicate / low-signal issues (with an explanatory comment via `gh issue close <n> --comment "..."`). Confirm each batch; never close without explicit approval.

Present Tier B as a readable table grouped by action (e.g. "Assign milestone", "Set priority", "Propose close"), each row: `#<number> <title>` -> proposed change + one-line rationale. Then ask which batches to apply. Apply only the approved batches.

## Phase 4 - Report (this session)

Summarise:
- Tier A changes applied (count + list).
- Tier B batches applied vs skipped.
- Anything left needing the user's input (ambiguous duplicates, low-signal issues to clarify).
- Suggest running `/next` afterwards now that priorities/milestones/`needs-prd` are current.

Do not edit code, create branches, or run any deploy command in this flow. The only mutations are GitHub issue labels, milestones, and (on approval) closes.

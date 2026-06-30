Question or feature: $ARGUMENTS

You are the orchestrator for a read-only planning session. The planning analysis happens in a fresh-context subagent. No files are written by either you or the subagent.

## Phase 1 - Prepare brief (this session)

1. If $ARGUMENTS is empty, use AskUserQuestion to ask the user what they want a plan for. Wait for the answer.
2. If the question is ambiguous, ask 1-3 targeted clarifying questions via AskUserQuestion (scope, constraints, expected output detail level).

## Phase 2 - Hand off to subagent (Agent tool)

Spawn the `planner` subagent via the Agent tool with `subagent_type: "planner"`. The prompt MUST be a complete self-contained brief:

```
You are producing a read-only plan. Do NOT write or edit any files. The orchestrator has already gathered the user's question - do NOT re-ask the user.

Question: <user's question, verbatim>

Clarifying answers (if any):
1. <question>
   Answer: <user's answer>
...

Instructions:
1. Read the canonical guidance in CLAUDE.md, and docs/IEC61131_SPECIFICATION.md when the work touches language/spec behavior.
2. Explore the codebase as needed to inform the plan.
3. Produce a structured plan following the planner skill format: Understanding, Affected areas, Approach, Open questions, Task breakdown.
4. Return the plan in your message. Do NOT write files.
```

## Phase 3 - Return (this session)

When the subagent returns, show the full plan to the user verbatim. Ask whether they want to:
- Generate a PRD from this plan (-> `/prd`)
- Skip directly to task generation (-> `/tasks`)
- Iterate on the plan
- Just keep the plan as reference

---
id: "0205"
title: "Chain tickets that change the same files while shaping them"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:43:03.148Z"
approved: "2026-10-15T13:56:52.305Z"
finished: "2026-10-15T14:26:09.900Z"

---
# 0205 · Chain tickets that change the same files while shaping them

**Status:** ✅ done

## Problem
The ticket skill sets `after:` only between the tickets one idea is split into. It doesn't check a new ticket against other open tickets that change the same files. With builds running side by side, two such tickets clash when the second ships and cost a merge round, as 0188 and 0189 did on 2026-10-15.

## Outcome
When the ticket skill makes tickets, any that would change the same files as another open ticket wait for it with `after:`.

## Acceptance criteria
1. The ticket skill has a step, before presenting tickets, to list the files each new ticket is likely to change and compare them with every open ticket's (draft, ready, building, reviewing, blocked or approved), read from their Notes and the code they name.
2. For each overlap, it sets the new ticket's `after:` to the other ticket, so the two are built one after the other, and never makes a loop of `after:` links.
3. When presenting the tickets, the skill shows each `after:` it set and the files that caused it, in one line per ticket.
4. The triage steps that make tickets from inbox notes follow the same step. The copies of the skill that `speck init` installs say the same as `skills/`.
5. No test that passed before this change fails.

## Out of scope
- `speck run` choosing by itself not to build overlapping tickets at once (planned with the jobs design).
- Changing tickets that already exist.

## Notes
- Asked for 2026-10-15, for release 0.4.0. Agreed with the user after 0199 to 0201 were drafted without `after:`, though they all change `templates/panel.html`.
- The skill is `skills/speck-ticket/SKILL.md`; step 3 mentions `after:` only for splitting one idea. `.claude/skills/` holds this repo's installed copies.
- Failing before this build: none
- Self-check: said where to read open tickets' real statuses (`speck status --json`, which shows tickets under way in other worktrees), and that only the new ticket is edited, matching the rule against editing tickets being built.

## In plain words
When your agent turns an idea into tickets, it now checks which parts of the project each new ticket will touch and compares them with every ticket that's still open. If two would change the same parts, the new one is set to wait for the other, so they're built one after the other rather than side by side, where they'd clash when the second one ships. It does the same when it makes tickets while triaging the inbox. When it shows you the new tickets, each one that waits gets a line saying which ticket it waits for and which parts caused it. To see it, ask for a ticket on something an open ticket already changes. Keep an eye on whether it guesses the parts sensibly: a guess that's too broad makes tickets wait when they needn't, and one that's too narrow misses a clash.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 161,216
- Elapsed since build started: 14 min
- Changed lines: 9 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "a942ba6e01f8421bf6597e86252c8673818c5d82",
    "thread_id": "01a13fd9-70f5-7cd1-9c5c-44783f208930",
    "seconds": 28,
    "usage": {
      "input_tokens": 160495,
      "cached_input_tokens": 120320,
      "cache_write_input_tokens": 0,
      "output_tokens": 721,
      "reasoning_output_tokens": 31
    },
    "saved_at": "2026-10-15T13:56:45.012Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 6 lists likely files and compares every specified open status using speck status --json, Notes and named code. The AC1 test passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Step 6 adds dependencies only to new tickets, orders new siblings and checks transitive after: links before adding an edge. The AC2 test passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Step 8 requires one line per ticket showing dependencies and the files responsible, including omitted cyclic links. The AC3 test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Triage step 4 explicitly invokes step 6. Installed skill directories link to skills/; scripts/install.mjs installTooling copies the same source into both supported locations. The AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0205-tests.txt: 1,873 tests, 1,870 passed, three skipped and zero failed. No existing tests were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The ticket skill now instructs agents to chain overlapping work, avoid dependency loops and explain the files behind each dependency. Inbox triage follows the same rules, and installed copies receive them. The tests pass; no blocking issues found."
  }
}
```

</details>

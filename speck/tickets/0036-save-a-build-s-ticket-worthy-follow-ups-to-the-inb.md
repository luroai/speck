---
id: "0036"
title: "Save a build's ticket-worthy follow-ups to the inbox"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T17:30:58.478Z"

---
# 0036 · Save a build's ticket-worthy follow-ups to the inbox

**Status:** 👍 approved

## Problem
Most builds end with follow-up ideas in the ticket's Delivery log, but once the ticket moves to `speck/tickets/done/` nobody reads them again. The shaping chat, where tickets are made, never sees what a build learned, so real bugs and missing checks are lost.

## Outcome
Each follow-up that would need its own ticket lands in `speck/ideas/` as an inbox note, linked to the ticket it came from, while small tidy-ups stay in the Delivery log only.

## Acceptance criteria
1. When a build writes follow-up ideas to the Delivery log (`/speck-build` section 5 step 1), it also writes each one that would need its own ticket (a behaviour change, a bug or a missing check) as its own note in `speck/ideas/`, named `<YYYY-MM-DD>-<slug>.md`. Tidy-ups (such as unused code) and notes on known limits go only in the Delivery log. If none qualify, it writes no note.
2. Each note uses the `/speck-capture` format: a `# <title>` heading saying the follow-up in a few words, then `Captured: <date> · Status: inbox` on its own line, then a `From ticket: <id>` line, then `## What`, `## Why` and `## Notes` sections.
3. Before writing a note, the build skips any follow-up that clearly duplicates an idea note, a ticket in `speck/tickets/` or `speck/tickets/done/`, or a line in `speck/product.md`. It doesn't stop to ask the user. It lists each skipped follow-up and its match in the Delivery log.
4. The notes are committed on the ticket branch before `speck close`, staged by name, so they ship with the ticket. The build's final report says how many follow-ups went to the inbox, or that none did.
5. `/speck-review`'s rule for minor findings that aren't fixed points to the same step, and `speck/product.md` describes the inbox notes.

## Out of scope
- Triaging the inbox (0037) and showing it in the panel (0038).
- Copying follow-ups from tickets already done.
- Any change to the CLI. `speck status --json` already reads a note's status as `inbox`.

## Notes
- One note per follow-up, so each one can be ticketed or dropped on its own by 0037.
- The duplicate check is the agent's judgement, as in `/speck-capture`, but without asking: an auto-ship build mustn't wait for the user.
- Mostly skill instructions. Where nothing can be tested automatically, the builder says so in Notes and the reviewer checks it by reading the skills.
- No external facts: everything is in this repo.
- Testing: the criteria are skill instructions, so `test/followups-0036.test.mjs` checks the skill text and `product.md` say each rule. Whether an agent follows them can only be checked by reading `skills/speck-build/SKILL.md` section 5 step 1 and the minor-findings rule in `skills/speck-review/SKILL.md`.
- Self-check: added the rule that a note whose file name already exists gets `-2`, `-3` on its slug instead of overwriting an existing idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 266,705
- Elapsed since build started: 3 min
- Changed lines: 30 (limit 5000)
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
    "reviewed_sha": "5768f6428483e9d6a9b3098a49920a3bb8b8c7cb",
    "thread_id": "01a121ba-49f6-7203-bc19-eee80903c4ea",
    "seconds": 34,
    "usage": {
      "input_tokens": 265855,
      "cached_input_tokens": 191872,
      "cache_write_input_tokens": 0,
      "output_tokens": 850,
      "reasoning_output_tokens": 68
    },
    "saved_at": "2026-10-09T17:34:12.662Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 5 step 1 requires separate dated notes for behaviour changes, bugs and missing checks, excludes tidy-ups and known limits, and writes nothing when none qualify. The AC1 text test covers these instructions and passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Section 5 step 1 supplies the required heading, Captured/status line, From ticket line and What/Why/Notes template. The AC2 test checks their order and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 5 step 1 requires checking every idea, live and archived ticket, and product.md; skipping clear duplicates without asking; and recording each skipped follow-up and its match. The AC3 test covers these rules and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Section 5 requires committing notes and the ticket by named paths on the ticket branch before close. Both successful shipping and disabled auto-ship reports must give the inbox count or say none. The AC4 test covers these instructions and passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-review/SKILL.md directs unfixed minor findings to build section 5 step 1. speck/product.md accurately describes the new inbox workflow. The AC5 test covers both files and passed."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The new description matches the skill instructions and explicitly states that this capability lives in the skills only."
    },
    "escalation_question": "",
    "summary": "Builds now have clear instructions to save substantial follow-ups as linked inbox notes, skip duplicates and report how many were saved. The change meets all five criteria and stays within scope. Tests honestly check the instructions; whether an agent follows them remains a manual check, as the ticket specifies."
  }
}
```

</details>

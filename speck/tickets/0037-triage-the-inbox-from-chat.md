---
id: "0037"
title: "Triage the inbox from chat"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0036"]            # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T18:29:51.917Z"

---
# 0037 · Triage the inbox from chat

**Status:** 👍 approved

## Problem
Follow-ups from builds pile up in the inbox (0036). Reading every one would overwhelm the user, who wants to decide only what's worth a ticket, from their single shaping chat.

## Outcome
Asking the agent to triage the inbox clears it down to at most three decisions, and follow-ups nobody picks drop out by themselves.

## Acceptance criteria
1. When the user asks to triage the inbox (for example "triage the inbox"), the agent reads every note in `speck/ideas/` whose status is `inbox`. If there are none, it says the inbox is empty in one line and stops.
2. Without asking, it drops each inbox note that's already done or covered by another idea note, a ticket or `speck/product.md`, and keeps one of any notes that duplicate each other, dropping the rest. It names each one dropped, with the reason, in one line.
3. It then puts at most three of the remaining notes to the user, each with its title, the ticket it came from and a one-line reason it's worth doing, and asks whether to ticket it or drop it.
4. "Ticket it" makes a draft ticket from the note with `/speck-ticket`, using the note as `--source`, which sets its status to `ticketed (<id>)`. "Drop it" sets the note's status to `dropped`. Nothing is ever set to `ready`.
5. At the end of each triage, every note still `inbox` gets a `Triaged: <n>` line (added, or its number raised by one). A note that reaches `Triaged: 2` is set to `dropped` instead, and the agent lists those. It commits every note it changed, staged by name, as `speck: triage inbox`.

## Out of scope
- Writing inbox notes (0036) and the panel's Inbox tab (0038).
- Any panel button for triage. The panel stays read-only.

## Notes
- `dropped` is a new idea status. Only triage sets it.
- The builder decides whether this lives in `/speck-ticket` or a new skill installed with the others. `speck/product.md` and the skill count must match either way.
- Mostly skill instructions. Where nothing can be tested automatically, the builder says so in Notes and the reviewer checks it by reading the skill.
- No external facts: everything is in this repo.
- Triage lives in `/speck-ticket` (a "Triage the inbox" section), so the skill count stays at six.
- Testing: the criteria are skill instructions, so `test/triage-0037.test.mjs` checks the skill text and `product.md` say each rule. Whether an agent follows them can only be checked by reading the "Triage the inbox" section of `skills/speck-ticket/SKILL.md`.
- Self-check: made explicit that notes with any other status are left alone, that a note the user doesn't answer for stays `inbox` (and is counted), and recorded in `product.md` that `speck status` counts `dropped` ideas as waiting.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 195,431
- Elapsed since build started: 3 min
- Changed lines: 18 (limit 5000)
- Follow-ups:
  - `speck status` counts `dropped` ideas as waiting: saved to the inbox as `speck/ideas/2026-10-09-speck-status-counts-dropped-ideas-as-waiting.md`.
  - The panel's Ideas list showing `dropped` notes: skipped, covered by 0038 (AC3 leaves out `inbox` and `dropped`).
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
    "reviewed_sha": "6c6835b9cef164a4e51c73a62d79ed885cc02dc9",
    "thread_id": "01a121ef-fe39-79f0-a8e7-1837a7886995",
    "seconds": 29,
    "usage": {
      "input_tokens": 194733,
      "cached_input_tokens": 125696,
      "cache_write_input_tokens": 0,
      "output_tokens": 698,
      "reasoning_output_tokens": 58
    },
    "saved_at": "2026-10-09T18:32:47.424Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md, triage step 1, requires reading every inbox note and a one-line empty-inbox response followed by stopping. test/triage-0037.test.mjs AC1 checks these instructions and the skill trigger."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Triage step 2 requires automatic drops for completed or covered work, comparison with ideas, live and archived tickets and product.md, keeping one duplicate, and reporting each drop with its reason. The AC2 test checks the instruction text; manual reading confirms the rule."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Triage step 3 limits the selection to three and requires title, source ticket, reason and ticket-or-drop choices. The AC3 text test covers each requirement."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Triage step 4 uses the existing ticket workflow with --source, explicitly creates drafts and handles dropped and unanswered notes. The section explicitly prohibits ready status. The AC4 text test covers these rules; existing 0009 tests exercise CLI source-status updates."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Triage step 5 specifies adding or incrementing Triaged, dropping and listing notes at two, and committing changed notes and created tickets staged by name with the required message. The AC5 test checks these instructions."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The living spec accurately describes the instruction-based capability, preserves the six-skill count, and records that dropped ideas still count as waiting in status output."
    },
    "escalation_question": "",
    "summary": "The change adds inbox triage to the existing ticket skill: it removes covered follow-ups, presents up to three choices, creates draft tickets and retires unpicked notes after two triages. The instructions meet the ticket and the changes stay within scope. Tests check the instruction text rather than actual agent behaviour; that limitation is explicitly documented and the instructions were reviewed directly."
  }
}
```

</details>

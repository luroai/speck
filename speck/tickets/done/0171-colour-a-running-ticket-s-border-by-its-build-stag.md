---
id: "0171"
title: "Colour a running ticket's border by its build stage"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0169"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T17:40:36.095Z"
approved: "2026-10-14T17:58:29.634Z"
finished: "2026-10-14T18:10:15.837Z"

---
# 0171 · Colour a running ticket's border by its build stage

**Status:** ✅ done

## Problem
Since 0167, a running ticket's card looks the same as a queued one apart from its badge and stage line, so the user can't see at a glance which tickets are being worked on or what stage each has reached.

## Outcome
A ticket an agent is working on has a coloured border that shows its build stage. A coloured fill still means only that the ticket needs the user.

## Acceptance criteria
1. A Build card whose agent is at work has a 2px border in its stage's colour and the normal card background: writing tests and code in `--run` (blue), checking its own work in `--inbox` (teal), being reviewed (any round) in `--warn` (ochre), and shipping (by hand or by auto-ship) in `--ok` (green).
2. When a running ticket moves to its next stage, its border changes to the new stage's colour the next time the panel updates, without a reload.
3. A blocked ticket or a stopped build keeps 0167's crimson border and fill, and a ticket waiting for the user keeps 0167's purple border and fill, whatever stage it stopped or waits in. Every other Build card (ready, queued, paused, or approved and waiting for auto-ship to start) keeps the plain 1px neutral border and its current background.
4. A running card keeps its stage border while it's open and while it flashes from a linked id. In light and dark mode, each stage colour has a contrast of at least 3:1 against the card's background.
5. No test that passed before this change fails.

## Out of scope
- The colour of the stage name and sentence under the badge.
- What an approved ticket that auto-ship is about to ship says (`speck/ideas/2026-10-14-keep-an-auto-shipping-ticket-s-sentence-out-of-purple.md`).
- Plan and Shipped cards.

## Notes
- Agreed 2026-10-14: a coloured border means an agent is at work and nothing is needed from the user; a coloured fill means the ticket needs the user. Running stages never use crimson or purple, and use green only for shipping.
- `--inbox` has been unused since 0167, and the palette checks of 0126, 0134 and 0136 pin it, so reusing it for self-check keeps those checks meaningful.
- Checked 2026-10-14: each stage token has at least 7.9:1 contrast against the card background in both themes (`--run` 8.52/7.99, `--inbox` 8.60/7.98, `--warn` 8.54/7.96, `--ok` 8.54/8.00 against `#ffffff` and `#1f1f1f`; computed from `templates/panel.html`).
- The stage is already worked out for the badge and the sentence under it (`doing` and `badgeOf` in `templates/panel.html`).
- Builds after 0169, which changed the same card.
- Failing before this build: none
- Self-check: no changes. AC3's test passes before any code, as it pins what stays the same. The 0155 and 0167 browser tests pinned a running card to the plain 1px border, which AC1 replaces, so their running cards now expect their stage's 2px border; nothing else in them changed. 0128 AC3 and 0148 AC2 (speck run timing) each failed once under a full run and passed alone and on a fresh full run.

## In plain words
A ticket an agent is working on now has a thicker coloured border that shows how far along it is: blue while it writes tests and code, teal while it checks its own work, ochre while it's being reviewed, and green while it's being shipped. A coloured fill still means only that a ticket needs you: crimson when it's blocked or its build stopped, purple when it's waiting for you to ship it. To see it, start a build from the panel and watch its card's border change colour as it moves from one stage to the next. Worth keeping an eye on: the thicker border makes a card a touch taller once its build starts.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 145,836
- Elapsed since build started: 18 min
- Changed lines: 21 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- A ship started from a review pack in the panel takes the green border through the same check as any other ship, but no browser test starts one that way.
- The 2px border makes a running card 2px taller than when it was queued; padding could make up for it if the jump shows.

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
    "reviewed_sha": "7cf1ef073d2485a20dcdbf8ec4a9d32971537a43",
    "thread_id": "01a13b90-1d0c-7761-921b-de7ac92cb017",
    "seconds": 38,
    "usage": {
      "input_tokens": 145110,
      "cached_input_tokens": 100480,
      "cache_write_input_tokens": 0,
      "output_tokens": 726,
      "reasoning_output_tokens": 16
    },
    "saved_at": "2026-10-14T17:58:20.779Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: stageOf and queueItem assign the four stage classes; CSS gives each its specified 2px border without changing fill. Passing 0171 AC1 tests cover build, self-check, multiple review rounds and manual/automatic shipping, including computed browser styles."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing test '0171 AC2: when a running ticket moves to its next stage...' exercises panel timer updates through build, self-check, review and shipping without reloading. queueItem recalculates the stage when ticket data changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueItem prioritises blocked and to-ship states over stage classes; stageOf excludes non-moving cards. Passing 0171 AC3 and browser tests cover blocked, stopped, waiting, ready, paused and approved awaiting auto-ship cards."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Stage CSS follows open/highlight rules, preserving its border. Both passing 0171 browser tests verify closed, flashing and open cards, and check every stage token has at least 3:1 contrast against normal and open backgrounds in both themes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0171-tests.txt: 1614 tests, 1611 passed, zero failures, three skipped; all six 0171 tests passed. Existing test changes update superseded running-border expectations without weakening unrelated checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Running tickets now show their build stage through a coloured border, while tickets needing attention retain their existing colours and fills. Updates, open cards and flashing highlights are covered, and both themes meet the contrast requirement. The recorded full suite has no failures. No blocking concerns found."
  }
}
```

</details>

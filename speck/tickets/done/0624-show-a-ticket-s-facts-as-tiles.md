---
id: "0624"
title: "Show a ticket's facts as tiles"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0617"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T22:59:55.843Z"
approved: "2026-11-10T23:08:03.152Z"
finished: "2026-11-10T23:12:02.248Z"

---
# 0624 · Show a ticket's facts as tiles

**Status:** ✅ done

## Problem
Shipped's figures are now even grey tiles that are easy to scan (0606). A ticket's full view still lists its facts (priority, size, risk, whether it ships by itself, builder, reviewer, costs and tokens) as loose labels and values, so the two views look like different designs and the facts are harder to read.

## Outcome
A ticket's facts in its full view are tiles like Shipped's figures.

## Acceptance criteria
1. In a ticket's full view, each fact is a tile in the style of Shipped's figures (0606): the surface colour, no border, every corner rounded alike, even gaps, its label small and muted and its value under it.
2. The tiles are a grid of two columns below 480 px wide and three from 480 px, with every row full or the last tile spanning what's left, so no row ends with a gap.
3. Every fact shown today is still shown, with the same value, and a long value such as a model's name wraps within its tile rather than being cut off.
4. The tiles look right in both looks and at 320 px wide.
5. Tests that checked the full view's old facts layout are changed to check the tiles, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Which facts are shown.
- The open Plan card's facts.

## Notes
- Asked for 2026-11-10: "I really like what you've done with the stats in the shipped column … I'm wondering if that would be really useful on the expanded ticket views as well for all of the stats."
- Today: `factsOf`, `factCell` in `templates/panel.js`; Shipped's tiles are styled in `templates/panel-cards.css` (0606). Waits for 0617, which changes the full view.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a long Waits on line was still cut off in its tile, so in the full view it now wraps (a test covers it); the Delivery log's list is left to the reviewer, as no test may read this repo's tickets (0122).

## In plain words
A ticket's full view now shows its facts (priority, size, risk, builder, reviewer, costs and so on, and what it waits for) as soft grey tiles like the figures in Shipped, instead of loose labels and values. There are two tiles to a row on a phone and three on anything 480 px wide or more, and the last tile stretches so no row ends with a gap. To see it, open any ticket in full, in either look. The facts themselves haven't changed, and long ones such as a model's name wrap inside their tile.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 102,577
- Elapsed since build started: 8 min
- Changed lines: 17 (limit 5000)
Tests changed from the old facts layout to the tiles: test/panel-0583.test.mjs (0583 AC3: its facts are tiles) and test/panel-0465.test.mjs (0465 AC4: tiles two or three to a row, the last taking what's left).

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
    "reviewed_sha": "a73eaf44d4f211443f93b9351b7aa7ed1f4ccfc1",
    "session": "fresh",
    "thread_id": "01a1c7b7-6e8b-77e1-aff3-052546ad796c",
    "builder_response": "- Tests run: test/panel-0624.test.mjs test/panel-0583.test.mjs test/panel-0465.test.mjs test/panel-0161.test.mjs test/panel-0613.test.mjs test/panel-0140.test.mjs test/panel-0419.test.mjs test/panel-0587.test.mjs, plus the related files speck test --related picked and the repo checks.\n- The tiles are a wrapping flex row rather than a CSS grid: the last tile has to span what's left of its row at both two and three columns, and the only width media query allowed is the phone one (0140), so a grid couldn't choose the span. The real-browser test checks tiles sit on even columns.\n- The Waits for / Waiting on it and Waits on facts in the full view are tiles too, as AC1 says each fact; open Plan cards are unchanged.\n- AC5's Delivery log list is in the ticket; no test reads this repo's tickets (0122), so it's for you to read.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 101876,
      "cached_input_tokens": 62848,
      "cache_write_input_tokens": 0,
      "output_tokens": 701,
      "reasoning_output_tokens": 50
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 39028,
      "cached": 62848,
      "write": 0,
      "output": 701
    },
    "cost_usd": 0.0913508,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T23:07:56.331Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.css styles full-view facts with Shipped's surface, padding, borderless rounded corners and 8px gaps. panel-0624 tests check these styles and label/value placement; all passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The wrapping flex layout selects two columns below 480px and three from 480px; the last tile grows to fill its row. The passing real-browser test checks row positions, gaps and full rows at 320, 479 and 480px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "paneFacts and its value-producing functions are unchanged. Passing panel-0624 tests verify draft, building and shipped values, plus browser checks for long model names and dependency text wrapping without clipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing real-browser test checks both light and dark looks at 320px, including surface colours, corner radii, tile containment and absence of horizontal overflow."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "panel-0583 and panel-0465 now check the tile layout and are both listed in the ticket's Delivery log. /tmp/speck-0624-tests.txt confirms 297 passed, zero failed and three skipped; the new browser test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The full ticket view now shows its facts as consistent rounded tiles, with two columns on phones and three on wider screens. Existing values are preserved, long text wraps, and both looks passed browser checks. Open Plan cards remain unchanged. No blocking concerns found."
  }
}
```

</details>

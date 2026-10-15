---
id: "0213"
title: "Highlight a P0 priority tag at least as much as P1"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-highlight-p0-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:12:28.214Z"
approved: "2026-10-15T23:20:13.863Z"

---
# 0213 · Highlight a P0 priority tag at least as much as P1

**Status:** 👍 approved

## Problem
A fix ticket for a broken `main` is the most urgent thing on the board, but its P0 priority tag is plain grey, so it looks less important than a P1, whose tag is highlighted. Someone scanning the panel can miss what to deal with first.

## Outcome
A P0 priority tag stands out more than any other priority tag, wherever the panel shows one.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. Wherever the panel shows a priority tag (Plan, the Build queue and the full ticket pane), a P0 tag's text and border are in the panel's red (`--bad`), in light and dark mode.
2. A P1 tag looks as it does today (text and border in `--text`), and P2 to P5 tags stay grey (`--muted`).
3. A P0 tag's tip and screen-reader wording, its size and its tap area are unchanged, and no test that passed before this change fails.

## Out of scope
- The `fix` tag beside it: it already marks the ticket and keeps its own colour.
- Refusing a type change that leaves P0 on a ticket that's no longer a fix ticket: speck/ideas/2026-10-10-refuse-a-type-change-that-strands-p0.md.

## Notes
- The priority tag is drawn in one place, `fieldTags()` in `templates/panel.html`, which today gives only P1 an extra class (`tag p1`).
- Red for P0 is an assumption: the note asked for P0 to stand out "at least as much" as P1. A high risk tag is also red since 0151.
- Failing before this build: none
- 0143's AC2 test expected a P0 tag in the pane to have only the plain `tag` class; it now expects `tag p0`, the behaviour this ticket asks for.
- Self-check: no changes.

## In plain words
The P0 priority tag, which marks the urgent fix for a broken main, is now red wherever the panel shows it: in Plan, in the Build queue and in the full ticket view, in both the light and dark looks. It stays red when you point at it. A P1 tag looks as before, and P2 to P5 stay grey. To see it, open the panel when there's a fix ticket on the board. Its tip, its size and where you can tap it are unchanged.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Hovering a P0 tag in Plan removes its red text and border because .tag.pick:hover has greater specificity than .tag.p0.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 281,044
- Elapsed since build started: 8 min
- Changed lines: 4 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f01efd247e4b9e1eb8b483a59ca04b6febc7d5dd",
    "thread_id": "01a141da-0313-7922-8d19-132cdf70713a",
    "seconds": 22,
    "usage": {
      "input_tokens": 105675,
      "cached_input_tokens": 75264,
      "cache_write_input_tokens": 0,
      "output_tokens": 694,
      "reasoning_output_tokens": 22
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:16:30.951Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html: fieldTags() assigns p0 in all three locations, but .tag.pick:hover (line 93) overrides .tag.p0 with --text text and a --muted border in Plan. The AC1 tests check class names and isolated declarations, missing this cascade."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Existing P1 and plain tag styling remains unchanged. The passing 0213 AC2 test checks P1 styling and P2–P5 classes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The implementation changes only the priority class and two colour declarations; picker wording, dimensions and tap area remain unchanged. The AC3 test checks wording and colour-only declarations. All 12 tests in the supplied full output passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:93",
        "issue": "Hovering a P0 tag in Plan removes its red text and border because .tag.pick:hover has greater specificity than .tag.p0. This violates AC1 and makes the most urgent tag lose its distinguishing colour during interaction. The ticket's self-check acknowledges this behaviour but does not exempt it from AC1.",
        "suggested_fix": "Keep P0 text and border in --bad when hovered, without changing other priorities' existing hover behaviour. Add a regression check that accounts for the hover rule's cascade, preferably checking computed colours in both themes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "P0 tags are red in all three panel locations at rest, and the existing priority styles and accessibility wording are preserved. However, hovering a P0 tag in Plan removes its red highlight. Fix that interaction and cover it with a regression test before approval."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "a3b7f55db396a427230362dc33de57ce51ceb1b7",
    "thread_id": "01a141da-0313-7922-8d19-132cdf70713a",
    "seconds": 13,
    "usage": {
      "input_tokens": 173556,
      "cached_input_tokens": 137600,
      "cache_write_input_tokens": 0,
      "output_tokens": 1119,
      "reasoning_output_tokens": 22
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:20:05.865Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html fieldTags() assigns p0 in Plan, the Build queue and the full ticket pane. .tag.p0 and .tag.p0.pick:hover keep text and border in --bad. Passing AC1 tests cover all three locations and computed browser colours at rest and hovered in both themes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Existing P1 and P2–P5 rules remain unchanged. The passing AC2 test checks their styling and classes; the browser test also verifies existing P1 and P2 hover colours."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Changes affect classes and colour declarations only, preserving wording, size and tap area. The passing AC3 test checks accessibility wording and colour-only declarations. All 13 tests passed, with none skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:94",
        "issue": "P0 tags previously lost their red text and border when hovered in Plan.",
        "suggested_fix": "The added .tag.p0.pick:hover rule fixes the cascade; the passing browser regression test verifies both themes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "P0 priority tags now stay red across the panel, including when hovered, in light and dark mode. Other priorities and accessibility behaviour are preserved. All 13 tests passed; no blocking concerns remain."
  }
}
```

</details>

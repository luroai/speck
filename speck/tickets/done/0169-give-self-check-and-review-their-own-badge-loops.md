---
id: "0169"
title: Add the code-cloud loops to the builder badge                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0168"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T15:19:09.602Z"
approved: "2026-10-14T15:35:40.110Z"
finished: "2026-10-14T15:38:38.425Z"

---
# 0169 · Add the code-cloud loops to the builder badge

**Status:** ✅ done

## Problem
After 0168, the builder badge plays the same laptop loop through self-check and review, so the user can't tell from the badge whether the builder is checking its own work or being reviewed.

## Outcome
The badge's self-check and reviewing stages have their own loops, both built around a thin cloud of code characters, as in the mockup.

## Acceptance criteria
1. During self-check, nine faint code characters hang in a loose ring around the builder, drifting slightly. Its eye moves to one at random about every 0.65 seconds, its body turning a beat later and an ear twitching now and then; each character it looks at turns green for a moment and fades back. Every seventh glance it gives a small hop and a green tick appears.
2. During review, the reviewer (taller and squarer than the builder, two small eyes and a mouth) slides in from the right, and seven faint code characters float above the two of them. In each loop of about 6.2 seconds there are three exchanges: the reviewer looks at a character and talks (its mouth moves and it leans in) and a ring appears round that character; then the builder looks at the same character and answers with a bounce and an ear flick, and the character turns green. The loop ends with the reviewer smiling and nodding and the builder hopping, and the reviewer slides out.
3. The characters come from the same set as the laptop loop (`{ } < > ; / = ( ) [ ] *`), in the panel's monospace font and faint ink, green once checked. None of them, nor the ring, is clipped by the tile's edge.
4. With `prefers-reduced-motion: reduce`, each stage shows a still frame (self-check: the builder looking at one green character in its ring; review: both looking at one ringed character) and nothing moves.
5. No test that passed before this change fails.

## Out of scope
- The building, waiting and blocked loops (0168).

## Notes
- The design reference is `mockups/builder-badge/index.html` in the main checkout (local only: `mockups/` isn't in git, so it isn't in a build's worktree; `git worktree list` shows the main checkout first) (the Self-check and Reviewing states). Its drawing code and timings can be reused.
- Builds after 0168, which adds the badge.
- Failing before this build: none
- Self-check: no changes (checked that the tick at the mockup's height stays inside the tile, so kept it)

## In plain words
The little builder on a running ticket's card now shows which stage it's in. While it checks its own work, it looks around a faint ring of code characters, each one turning green as it looks at it, with a small hop and a green tick every so often. While it's being reviewed, a taller, squarer reviewer slides in, and the two of them take turns over a cloud of code: the reviewer points one out and talks, the builder answers, and it turns green. Writing code and shipping still show the laptop.

To see it, open the panel while a ticket is in self-check or review. If your computer is set to reduce motion, each stage shows a single still picture instead.

Worth keeping an eye on: the characters are faint by design, so on a dim screen they can be hard to make out.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 123,957
- Elapsed since build started: 17 min
- Changed lines: 102 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Earlier tests that took the laptop pose to mean "at work" (0055, 0071, 0156, 0168) now accept the self-check and review poses too; 0168's edge test leaves the review out, as its reviewer slides in past the tile's edge, and 0169's own test checks that pose's characters and rings instead.
- Follow-ups skipped as duplicates: 0128 AC3 and 0148 AC2 each failed once in a full-suite run and passed alone (speck/ideas/2026-10-13-stop-tests-checking-speck-run-stopped-too-soon.md).

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
    "reviewed_sha": "57f80c04b630a02c28d3e0b99a31fe352b112944",
    "thread_id": "01a13b0d-573f-7dc2-99cc-f165a7e18189",
    "seconds": 32,
    "usage": {
      "input_tokens": 123314,
      "cached_input_tokens": 76288,
      "cache_write_input_tokens": 0,
      "output_tokens": 643,
      "reasoning_output_tokens": 49
    },
    "saved_at": "2026-10-14T15:35:24.518Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html BADGE.POSES.check implements nine drifting glyphs, 640 ms glances, delayed body turns, occasional ear twitches and seventh-glance hops/ticks. Five AC1 drawing tests and the browser animation test in test/panel-0169.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html reviewer and BADGE.POSES.review implement the taller reviewer, seven glyphs, 6200 ms loop, three exchanges and closing smile/nod/hop. AC2 tests exercise recorded drawing output and passed; browser tests confirm animation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html glyph uses the shared GL character set, IBM Plex Mono and panel ink/green tokens. Character/font tests and the real-browser unclipped-pixel test in test/panel-0169.test.mjs passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html STILL_AT and paintBadge select fixed frames under reduced motion. The AC4 drawing test checks the green/ringed focus, and the real-browser test confirms unchanged frames; both passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0169-tests.txt: 1562 tests, 1559 passed, zero failures, three unrelated existing skips. All 13 ticket tests passed, including browser checks. Existing test changes accommodate the new poses and preserve checks for the original behaviours."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Self-check and review now have distinct code-cloud animations, with still frames for reduced motion. Tests cover the gestures, exchanges, colours and tile boundaries, and the full suite has no failures. The change stays within scope and is ready for the product owner."
  }
}
```

</details>

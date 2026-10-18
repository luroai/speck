---
id: "0308"
title: "Lighten the LCD screen in the panel's light look"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0305"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:24:45.348Z"
approved: "2026-10-18T22:29:13.686Z"

---
# 0308 · Lighten the LCD screen in the panel's light look

**Status:** 👍 approved

## Problem
In the panel's light look, the LCD screen behind the builder badges and the Foreman's builder uses the design's `#c3c9b1`, which reads as too dark on the panel's near-white cards, especially on a phone. The app icon (0305) uses the same colour.

## Outcome
The LCD screen in the panel's light look is a lighter tint the user chose (shade C), in the badges, the Foreman's builder and the app icon.

## Acceptance criteria
1. In the panel's light look, `--lcd-bg` is `#e6e9db`, `--lcd-off` is `#dde1cf` and `--lcd-shadow` is `rgba(30, 40, 15, .14)`. `--lcd-ink` and `--lcd-red` are unchanged (`#20241d`, `#d63f28`).
2. The badges and the Foreman's builder are drawn with those colours, including after switching between the light and dark looks.
3. The app icon's background (`templates/icons/icon.svg` and the three PNGs) is `#e6e9db`, with its dots unchanged.
4. The dark look's colours, and `docs/design/lcd/lcd.js`, are unchanged.

## Out of scope
- The landing page, which lives in its own repo, and the design files in `docs/design/lcd/`.

## Notes
- The user picked shade C from four drawn with the design's renderer on 2026-10-18 (A `#c3c9b1` today, B `#d9ddca`, C `#e6e9db`, D `#f0f1e8`).
- The renderer reads its colours from the page's tokens when it starts drawing, so a change of token needs the screens to pick it up (as switching looks already does).
- Failing before this build: none
- Self-check: the 512 px icon's new bytes held "O3", which the model-name scan of templates/ flags (test/review.test.mjs); the PNG writer now takes the first zlib level, from the default, whose bytes hold no such text.

## In plain words
In the panel's light look, the little LCD screens behind the builder pictures on the cards and in the header are now a paler green-grey, the shade you picked, so they no longer look heavy on the white cards. The app icon uses the same paler screen, with the same dots. The dark look is unchanged. To see it, open the panel in the light look and compare the builder pictures with the cards around them; on a phone, the home-screen icon picks up the new colour once it's added again or refreshed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 143,870
- Elapsed since build started: 4 min
- Changed lines: 6 (limit 5000)
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
    "reviewed_sha": "b2e3af9f1963b2b77107753da78b56c13478039d",
    "thread_id": "01a15121-b5ec-77e3-9ef9-7e3c038be2ce",
    "seconds": 21,
    "usage": {
      "input_tokens": 142929,
      "cached_input_tokens": 95104,
      "cache_write_input_tokens": 0,
      "output_tokens": 941,
      "reasoning_output_tokens": 66
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:29:07.397Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html defines all five light-look tokens as required. The passing 0308 AC1 test checks their exact values."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0308 AC2 test exercises the real templates/lcd.js badge and mini renderers through light, dark and light again. Screen.look() reads the tokens, and the theme observer refreshes each screen."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/icons/icon.svg uses #e6e9db. The passing 0308 AC3 test checks all three PNG backgrounds and verifies unchanged dots using pixel-position hashes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The diff leaves the dark tokens and design renderer unchanged. The passing 0308 AC4 test checks the dark palette and renderer hashes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel’s light LCD screens and app icons now use the chosen lighter shade. Theme switching retains the correct colours, while the icon dots and dark look remain unchanged. The reported tests passed with no failures. No blocking concerns found."
  }
}
```

</details>

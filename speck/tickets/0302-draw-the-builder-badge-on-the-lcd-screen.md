---
id: "0302"
title: "Draw the builder badge on the LCD screen"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0299"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T21:33:18.276Z"

---
# 0302 · Draw the builder badge on the LCD screen

**Status:** 🔍 reviewing

## Problem
The panel's builder badge is drawn on a canvas in the panel's own style. The user has designed a new look for speck, shared by the Luro landing page and the panel: speck drawn on a dot-matrix LCD screen, with each change of pose blending over 0.7 seconds with a hop and a blink. The panel needs to match that design exactly.

## Outcome
Every ticket's builder badge is drawn on the LCD screen by the design's own renderer, exactly as the design shows it, and blends into its new pose when the ticket moves on.

## Acceptance criteria
1. The panel draws every builder badge with the renderer in `docs/design/lcd/lcd.js`, served to the page unchanged: the copy the page loads has the same SHA-256 as that file (`39c97086e87535110d8a5fc9e057aa275438a60ffaabb72e2175aa109dbfcf49`). Each badge is made with its `badge(canvas, pose)`, in today's 56 px tile, with the pose the badge shows today (`type`, `check`, `review`, `ship`, `wait`, `bad` or `still`).
2. When a ticket's badge changes pose, the panel calls the same badge's `set(pose)`, so it blends into the new pose, instead of drawing a new badge. A board refresh that doesn't change a ticket's pose leaves its badge running as it was.
3. The page has the design's screen colours as tokens, with the design's values in the light and dark looks: `--lcd-bg`, `--lcd-off`, `--lcd-ink`, `--lcd-red` and `--lcd-shadow` (light `#c3c9b1`, `#b8bea6`, `#20241d`, `#d63f28`, `rgba(30, 40, 15, .22)`; dark `#0d130f`, `#151d17`, `#cfe6c6`, `#ff5a3f`, `transparent`). The panel's light and dark switch changes the badges with the rest of the page.
4. A badge waiting for you has a purple frame (the panel's `--idea`) and a blocked one a crimson frame (`--bad`), as in `docs/design/lcd/panel-mock.html`. Other badges have the panel's line colour.
5. Side by side with `docs/design/lcd/panel-mock.html` in the same browser, each of the seven poses looks and moves the same. (checked by review)

## Out of scope
- The header's mark and the Foreman's builder: 0303.
- Changing the design: the renderer is used as the user made it.

## Notes
- The design is the user's artifact, "speck LCD" (claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z). Its renderer and panel mock are copied into `docs/design/lcd/` (`lcd.js`, `panel-mock.html`), so the build doesn't need the artifact. Don't edit `lcd.js`: it's the design. It exposes `window.SpeckLCD`.
- The renderer draws one still frame per pose when reduced motion is on (`RM`), so the panel doesn't need its own check.
- Today's badge is drawn in `templates/panel.html` (search for "0168" and "badgeColours"). The page is served by `scripts/panel.mjs`, which will need to serve `lcd.js` too.
- Failing before this build: not checked
- Self-check: no changes. Tests of the old canvas drawing (0168 AC2/AC3 source checks, 0168 AC5 colours and tile edge, 0169's and 0172's drawing tests) are retired, as the design's renderer replaces that drawing; their pose-choice tests stay. 0161's outline rule allows the badge's frame, an outline as in the design, on a canvas the keyboard never reaches. The Auto-build builder keeps the old drawing until 0303.

## In plain words
Every ticket in flight on the panel's Build list now shows its little builder on a green dot-matrix screen, exactly as in the new speck design. When a ticket moves on, say from writing code to review, its builder hops and blinks into the new pose instead of jumping. A ticket waiting for you has a purple frame round its screen, and a blocked one a crimson frame. Switch between light and dark with the panel's button to see the screen change with the page. One thing to know: a builder that's scrolled off screen pauses until you scroll back to it, which is how the design works. The Auto-build button's small builder and the header's mark still use the old drawing until the next ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes):
  - 0303 should remove what's left of the old canvas drawing in `templates/panel.html` (`BADGE`, `paintBadge`, `drawBadges`, `badgeColours`) and `test/support/badge.mjs` once the Auto-build builder moves to the renderer's `mini()`.
  - Known limit: the renderer only redraws screens in view, so an off-screen badge catches up on a change of look when it's scrolled back into view.

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
    "reviewed_sha": "164f1d82d5322a75831ed2eb39d5de8d3242c289",
    "thread_id": "01a150fa-9be0-7d01-bff4-d7aa787843c9",
    "seconds": 32,
    "usage": {
      "input_tokens": 314228,
      "cached_input_tokens": 230144,
      "cache_write_input_tokens": 0,
      "output_tokens": 1168,
      "reasoning_output_tokens": 199
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T21:46:34.966Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both renderer files have the required SHA-256. scripts/panel.mjs serves templates/lcd.js unchanged; badgeFor/startBadges use badge(canvas, pose). The passing 0302 AC1 tests cover serving, all seven poses and 56 px sizing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html retains badges by ticket id and calls lcd.set only on pose changes. The passing 0302 AC2 refresh test checks canvas identity, set calls and removal."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html defines the specified light and dark tokens. Passing 0302 AC3 tests check their values and browser-rendered background changes through the theme switch."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Badge outline rules match panel-mock.html. Passing 0302 AC4 tests check line, idea and bad frame colours, including computed colours in a browser."
      },
      {
        "id": 5,
        "status": "unclear",
        "evidence": "The renderer, dimensions and frame rules match the mock by source inspection. No supplied evidence demonstrates the required side-by-side browser comparison of all seven poses and their movement; the browser test checks backgrounds, frames and dimensions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0302.test.mjs",
        "issue": "The explicit visual acceptance check remains unverified: neither the supplied results nor the builder response records comparing all seven animated poses against panel-mock.html in the same browser.",
        "suggested_fix": "Perform and record the side-by-side comparison for all seven poses, including movement and pose transitions, and provide reviewable visual evidence. No exact-pixel regression test is required.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "templates/panel.html",
        "issue": "The reduced-motion change listener updates existing badges only. Badges created afterwards use the renderer's page-load RM constant, so newly arriving tickets can animate after reduced motion has been enabled.",
        "suggested_fix": "Pass the current reduced-motion preference through badge's still option when creating each badge, and check creation after a preference change.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The LCD renderer, colours, frames and retained pose transitions are implemented and covered by passing tests. Approval needs the ticket's explicit visual comparison of all seven moving poses. There is also a small reduced-motion inconsistency for newly created badges."
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
    "reviewed_sha": "56b6ea208069228557cdcd99de9adfaa8316e50d",
    "thread_id": "01a150fa-9be0-7d01-bff4-d7aa787843c9",
    "seconds": 21,
    "usage": {
      "input_tokens": 583544,
      "cached_input_tokens": 489856,
      "cache_write_input_tokens": 0,
      "output_tokens": 1990,
      "reasoning_output_tokens": 199
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T21:48:38.747Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Verified both lcd.js files retain the required SHA-256. scripts/panel.mjs serves the template copy unchanged. Passing 0302 AC1 tests cover loading it, badge(canvas, pose), all seven poses and 56 px sizing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "badgeFor retains each ticket's canvas and calls its existing lcd.set only when the pose changes. Passing 0302 AC2 tests exercise changed and unchanged poses across refreshes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html contains all five specified tokens with the exact light and dark values. Passing AC3 tests check token values and browser-rendered theme changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The badge outline rules use --line, --idea for wait and --bad for bad, matching panel-mock.html. Passing AC4 tests verify the computed frame colours in both themes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reviewed /tmp/speck-0302-pics/compare-moving.png and its capture script: all seven poses are compared between the actual mock and panel in the same Chromium browser. The sampled movement and appearance match. Both use the identical renderer and its set(pose) transition."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0302.test.mjs",
        "issue": "The required visual comparison was previously missing.",
        "suggested_fix": "Completed: supplied side-by-side frames cover all seven poses, with a capture script showing their origin.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "templates/panel.html",
        "issue": "New badges previously used the page-load reduced-motion preference after that preference changed.",
        "suggested_fix": "Completed: startBadges passes the current preference as the still option. The new passing regression test exercises badge creation after enabling reduced motion.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The badges now match the LCD design, retain smooth pose transitions across refreshes, and follow theme and reduced-motion settings. Visual comparison covers all seven poses. Both previous findings are resolved; the reported tests have no failures."
  }
}
```

</details>

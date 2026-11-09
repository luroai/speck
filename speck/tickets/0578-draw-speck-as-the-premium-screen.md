---
id: "0578"
title: "Draw speck as the Premium screen"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0577"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:34:48.451Z"
approved: "2026-11-09T18:43:11.261Z"

---
# 0578 · Draw speck as the Premium screen

**Status:** 👍 approved

## Problem
The redesign replaces the LCD's dot-drawn speck with a new character: the Premium screen, a small dark device whose red visor is its eye. It shows wherever speck acts or speaks, so it has to be one drawing that works at every size, in both looks, and that feels alive without the device ever moving.

## Outcome
The panel has speck's new character as one reusable drawing, in six moods, alive through its red light alone.

## Acceptance criteria
1. A new panel script draws speck as the mock's Premium screen in SVG, at any size from 16 px: a softly rounded dark device with a fine rim, a recessed screen, and a red visor with a soft glow and a faint reflection across the glass, on a light or a dark background.
2. It has six moods, each shown by the visor alone: watching (a wide bar), focused (narrower and lower), pleased (curved up into a smile), sheepish (shorter, lower and tilted), asking (the visor drops to become the dot of a red question mark drawn above it inside the screen) and asleep (a dim short line, with a red z, Z, Z rising to the upper right inside the screen).
3. The device never moves and nothing is drawn outside its screen. Only the red light moves: drifting, scanning, a small lift, glancing away, the dot pulsing twice, the z's appearing one by one, the glow breathing, and a blink every few seconds, each loop lasting at least 5 seconds. With reduced motion set, nothing moves.
4. Below 24 px the question mark and the z's are left out, and the plain visor shows instead.
5. No test that passed before this change fails.

## Out of scope
- Choosing the mood from the pipeline (0579).
- Putting speck in the header (0580) or anywhere else.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- From the mock's component: viewBox -26 -50 52 52; body 44 by 34 with 11 corner radius, centred at (0, -25); screen inset 4 with radius 7; visor 15 by 5. Bezel gradient #45484F to #0D0E11 on light, #5A5C54 to #1D1E1A on dark; screen #06070A; rim #5D6169 (light) or #70726A (dark); glass reflection white at 7%; glow the visor's red at about 28% and 3.6 wide.
- Timings from the mock: watching drift 16 s, focused scan 5.2 s, glow 6.2 s, pleased lift 6.5 s, sheepish glance 9.5 s, asking pulse 5.6 s, asleep fade 9 s and line breathing 11 s, the z's on a 9 s cycle, a blink every 8.5 s, and 0.8 s easing between shapes.
- Relies on nothing outside this repo.
- Failing before this build: none
- The panel serves the script at /speck-face.js, but the page doesn't load it yet: placing speck is 0580, and a new script tag would fail the existing tests that list the page's scripts, which AC5 protects. 0580 adds the tag, and adds the file to the page's stamp in `scripts/panel.mjs` so that a change to it reloads an open page.
- Asking's dot and asleep's line don't blink: the dot pulses and the line is already closed. Below 24 px, asking shows the plain visor, which does blink.
- AC5 has no test of its own: it's the whole suite, which `speck ship` runs.
- Self-check: took the new script back out of the page's stamp, as the page doesn't load it until 0580.

## In plain words
speck's new character now exists: a small dark device whose red visor is its eye, in six moods (watching, focused, pleased, sheepish, asking and asleep). Only the red light moves, and it stays still for anyone who has asked their computer for less motion.

You won't see it in the panel yet, because putting it in the top bar is the next ticket's job. For now, the pictures in this review pack show all six moods at five sizes, in both looks.

Worth keeping an eye on: the smallest sizes, where the question mark and the z's are left out so the face stays readable.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 197,151
- Elapsed since build started: 8 min
- Changed lines: 108 (limit 5000)
Follow-ups:
- 0580, when it adds the script to the page, should also add `templates/speck-face.js` to the page's stamp in `scripts/panel.mjs`, so a change to it reloads an open page.

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
    "reviewed_sha": "2e8b9a2ec7e10763c2f52f794b53a11068e8ddba",
    "session": "fresh",
    "thread_id": "01a1c19e-32ae-7562-b697-f3e4b837be4b",
    "builder_response": "- Tests run: test/speck-face-0578.test.mjs, with `speck test --related`, which added the 16 existing test files that name scripts/panel.mjs, and the commands.checks files.\n- The panel serves templates/speck-face.js at /speck-face.js, but panel.html doesn't load it yet. Placing speck is 0580 (out of scope here), and a new script tag would fail the existing tests that list the page's scripts, which AC5 protects. See the ticket's Notes.\n- Checked in a real browser (Chromium, from a real panel): 30 faces across six moods and five sizes draw in both looks (pictures are in the review pack); 94 sf- animations run normally and 0 with reduced motion emulated, with the z's resting visible.\n- AC5 has no test of its own: it is the whole suite, which speck ship runs.\n",
    "seconds": 46,
    "usage": {
      "input_tokens": 196445,
      "cached_input_tokens": 164736,
      "cache_write_input_tokens": 0,
      "output_tokens": 706,
      "reasoning_output_tokens": 89
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 31709,
      "cached": 164736,
      "write": 0,
      "output": 706
    },
    "cost_usd": 0.0869516,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:42:58.892Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/speck-face.js draw() creates the sized SVG, bezel, rim, recessed screen, glow and reflection with both looks. The four AC1 tests passed, including serving /speck-face.js."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "VISORS, HOOK and ZS in templates/speck-face.js define all six moods through the red light. Four AC2 tests passed, checking shapes, marks and unchanged device geometry."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "STYLE confines animations to red-light elements within the screen clip, with all loops at least five seconds and all motion inside prefers-reduced-motion: no-preference. Four AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "draw() omits marks below MARKS_FROM (24) and substitutes the watching visor for asking. The AC4 test passed at 16, 23, 23.9 and 24 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded related-test run reports 260 passed, zero failed and three skipped. No existing tests were changed; the production change adds the renderer and its serving route. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The reusable Premium screen character supports all six moods, both looks and small sizes. Its red light animates while the device stays still, and reduced motion disables animation. The relevant tests pass. Placement in the panel remains for ticket 0580, as intended."
  }
}
```

</details>

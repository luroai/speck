---
id: "0441"
title: "Measure the panel's layout in a proportional font"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-measure-the-panel-s-layout-in-a-proportional-font.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:32:36.679Z"
blocked_at: ""
waited_seconds: 12
approved: "2026-10-24T08:23:41.537Z"

---
# 0441 · Measure the panel's layout in a proportional font

**Status:** 👍 approved

## Problem
On the build machine, Chrome draws the panel's interface font (`system-ui` and the rest of 0427's stack) as Liberation Mono, a monospace font. So the browser tests that measure how text wraps and how tall cards are see a panel nobody uses, and 0427 had to ease some of their checks for a monospaced panel.

## Outcome
The tests' browser draws the panel in a proportional font, as people see it.

## Acceptance criteria
1. In the browser the tests start, the panel's interface font draws proportionally: the letters `i` and `m` are different widths, on this machine, with nothing installed beyond what's here today.
2. The checks 0427 eased for a monospaced panel ask what they asked before: 0419's and 0420's long titles wrap on at most the lines they allowed before 0427, and a building ticket's details line has no exception for a monospace font.
3. No test that passed before this change fails.

## Out of scope
- The panel's own fonts (0427).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0427. Liberation Sans is installed here and is proportional; it's fontconfig's choice for `system-ui` that gives Liberation Mono.
- Changes the test support and the eased tests only, so it waits for nothing.
- Failing before this build: none
- Found while building: 0434 had already replaced the checks 0427 eased in 0419's and 0420's tests (a closed ticket's title is now one cut-off line, and the building ticket's details exception is gone), so the eased checks left are 0151's and 0155's longest-title line limits (`most + 1` when the interface font measured as a monospace).
- Found while building: 0427's monospace check measured a span added to the panel's body, which is a flex item as wide as the page whatever its text, so on the panel page it always said monospace. It now measures on a canvas.
- Found while building: with the test browser's fontconfig file preferring Liberation Sans (Arial's widths), 0151's and 0155's longest title (68 characters, bold 17 px) takes 3 lines at 375 px: about 563 px of text in a 260 px column. Every other width passes the limit it had before 0427.
- Went with the recommendation: allow 3 lines at 375 px for everyone (chosen by the Foreman, as foreman_fixing is fix, 2026-10-24 07:41 UTC).
- Found while building: in the proportional font, four other panel tests failed on real layout problems the monospace had hidden, so criterion 3 needed small panel fixes: on a phone, a linked id's tap area was 43 px wide (now at least 44, its text centred), and a comma and a space between ids were narrower than the two ids' reaches, so a tap just right of an id went to the next one (the ids in a note now have 4 px wider spaces, and each id's text reaches 5 px either side, not 6); Escape closing the full ticket moved the list 10 px to bring its button into view (focus goes back without scrolling, as 0060 asks); and 0419's list of waited-on tickets was too short to need three lines (now 20 ids, not 14).
- 0140 AC2 (at 700 px the phone rules change nothing) failed once in the related run and passes on its own, with and without this change: it measures a ticking clock's text under load.
- Merging main after a refused ship: 0443's status line test found a closed Build card's line 1 px taller than one line, as a monospace tag on the interface font's baseline reaches past the line's box. The details line's tags, and Plan's priority box, now sit at the line's top. 0140 AC2 freezes the page's clock before comparing its two snapshots, as a ticking time changes width in a proportional font (it failed under load in both related runs).
- Self-check: no changes. Checked that 0441 AC1 fails without the font settings file, that a FONTCONFIG_FILE already set is kept (fontconfig resolves the include as it would the variable) and that an & or < in its path is escaped.

## In plain words
speck's own tests now look at the panel in an ordinary proportional font, as people see it, not in the typewriter-style font this machine used to fall back on. That showed a few small problems on phones, which are now fixed: tapping a ticket number in a note always reaches that number, the numbers are a little further apart, and pressing Escape to close a full ticket no longer nudges the list. To see it, open the panel on a phone and tap the ticket numbers in a "waiting on" note. Keep an eye on the extra space: it also widens the gap in the words "waiting on" a little.

## Blocked question
In a proportional font, the longest test title ("Read the owner's private words from outside the repo in 0082's check") takes 3 lines on a 375 px phone screen, not the 2 that 0151's and 0155's tests allowed before 0427, so restoring that limit (criterion 2) makes those two tests fail (criterion 3). Should the 375 px limit become 3 lines for everyone, with no monospace exception (every other width keeps its old limit), or should the tests keep asking for 2 lines and fail until a separate ticket makes titles fit on a phone?

Recommended: allow 3 lines at 375 px for everyone
Changes what you'd notice: no
Clear winner: yes

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 893,744
- Elapsed since build started: 51 min
- Changed lines: 11 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Tidy-up: the 4 px word spacing on a note's ids also widens the space in "waiting on" and "unlocks". Spacing only after the commas would need the separators in their own elements.
  - Known limit: the test browser's font settings file is for fontconfig (Linux). Elsewhere it does nothing, and a machine whose fontconfig has neither Liberation Sans nor its own proportional sans-serif would still measure in a monospace.

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
    "reviewed_sha": "7ee6fe3c4de6e79da68aed771d0dd44c0235ed1e",
    "session": "fresh",
    "thread_id": "01a16cec-0a39-7cb2-bde7-9eb691f26a80",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0441.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0060.test.mjs test/panel-0140.test.mjs test/panel-0164.test.mjs test/panel-0419.test.mjs test/quick-waits-0232.test.mjs (281 related files, plus the commands.checks files).\n- One failure in that run: 0140 AC2 at 700 px. It passes on its own, both with and without this change (run twice with the change, once on the commit before it). It compares computed styles that include a ticking clock's text, under the load of 281 files.\n- The user's answer to the blocked question (via the Foreman) is in Notes: 3 lines at 375 px for everyone.\n- Beyond the test support: criterion 3 needed small panel fixes for real layout problems that the monospace had hidden. They are listed in Notes: `.goto` min-width and centred text, wider spaces between ids in a note on phones with a 5 px reach, returnFocus without scrolling, and a longer 0419 fixture.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 356368,
      "cached_input_tokens": 276480,
      "cache_write_input_tokens": 0,
      "output_tokens": 828,
      "reasoning_output_tokens": 68
    },
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:00:05.434Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs launch() supplies a fontconfig file preferring Liberation Sans. Passing test 0441 AC1 measures different i/m widths using canvas with the panel body's actual font stack, and verifies monospace remains monospace."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0151 AC1 and 0155 AC3 browser tests enforce unconditional line limits, including the recorded Foreman decision allowing three lines at 375 px. The 0419 and 0420 browser tests retain 0434's single-line closed titles and unconditional details checks. Passing 0441 AC2 confirms the monospace exceptions are absent."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The related run passed 2,573 tests, including the title, tap-target and scroll-preservation checks. Its single 0140 AC2 failure compares snapshots taken at different times; the differing timer width and subsequent element positions support the reported clock-related flake rather than a phone-rule regression. The builder reports isolated passes with and without this change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The test browser now measures the panel using a proportional font, and layout checks no longer allow extra lines for monospace text. Small fixes preserve phone tap targets and scroll position. The agreed three-line phone title limit is applied consistently. One timing-sensitive test failed under load; the evidence supports a flaky clock comparison rather than a regression."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "8ddfa4a10f2f8f68d26bfef4c3464fd4dfe3bb4f",
    "merge": true,
    "session": "continued",
    "thread_id": "01a16cec-0a39-7cb2-bde7-9eb691f26a80",
    "builder_response": "- Merge round after a refused ship (exit 16). On the ticket merged with main, these failed: 0443 AC3 at 375 px on a touch screen and with a mouse (\"every closed Build ticket's status line shows its words, stage and time whole\").\n- I merged main into the branch (`git merge main`), which had no conflicts.\n- Why they failed: in the proportional font, 0804's status line is one line but 15 px tall (45 px on touch) against a 14 px (44 px) line-height. The `bug` tag is in the monospace, and on the interface font's baseline its line box reaches a pixel past the line's. Fix: the details line's tags (`.item.ticket .head .checks .tag, .q .top .progress .tag, .q .top .act .tag`) now use `vertical-align: top` rather than `baseline`. Plan's priority box (`.item.ticket .head .checks .prio`) does too, as 0151 AC2 requires every tag in the line to share one row.\n- 0140 AC2 (the layout is unchanged without the phone rules) failed under load in both related runs: a time's width changed between the two snapshots as the clock ticked, which a monospace never showed. The test now freezes the page's `Date` and waits one tick before taking its snapshots. I withdrew the inbox idea I had filed for this.\n- Tests run: `speck test --related` with test/panel-0443.test.mjs test/panel-0441.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0060.test.mjs test/panel-0140.test.mjs test/panel-0164.test.mjs test/panel-0419.test.mjs (276 related files): 2524 passed, 0 failed.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 535260,
      "cached_input_tokens": 444032,
      "cache_write_input_tokens": 0,
      "output_tokens": 1288,
      "reasoning_output_tokens": 68
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:23:38.535Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs launch() retains the proportional fontconfig settings. Passing 0441 AC1 measures different i/m widths with the panel body's font stack and confirms monospace remains monospace."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "0151 AC1 and 0155 AC3 retain unconditional browser-measured title limits, including the agreed three-line limit at 375 px. The 0419 and 0420 checks retain their merged behaviour without monospace exceptions. Both 0441 tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The related run records 2,524 passes and zero failures. Previously failing 0443 AC3 passes for touch and mouse, and 0151 AC2 verifies tag alignment. The 0140 snapshot comparison still checks all styles and boxes; freezing Date removes clock movement without weakening its layout assertions. Both widths pass."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change preserves proportional-font testing and the stricter layout checks. Tags now fit within status lines, and the snapshot test holds clocks still to avoid timing failures. All tests in the related run pass; no blocking concerns remain."
  }
}
```

</details>

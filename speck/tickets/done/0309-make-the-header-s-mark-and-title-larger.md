---
id: "0309"
title: "Make the header's mark and title larger"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:23:44.151Z"
blocked_at: ""
waited_seconds: 100
approved: "2026-10-18T22:34:01.025Z"
finished: "2026-10-18T22:36:32.437Z"

---
# 0309 · Make the header's mark and title larger

**Status:** ✅ done

## Problem
The header's LCD mark (19 px) and "speck" title (18 px Doto) are small next to the header's 34 px buttons, so the brand reads weakly, especially on a phone.

## Outcome
The header's mark and "speck" title are larger, closer to the landing page's, and the mark's dots stay crisp.

## Acceptance criteria
1. The header's mark is 32 px square, two screen pixels per dot of its 16 × 16 grid, so every dot is the same size.
2. The "speck" title is 26 px Doto at weight 900, sitting on the same line as the mark, vertically centred with it.
3. The header's buttons keep their size, and the header grows no taller than the mark needs.
4. At 320 px wide and wider, the header fits without scrolling sideways or overlapping, in both looks. The "control panel" label and the repo name hide at narrow widths as they do today.

## Out of scope
- The Foreman's button and its builder.

## Notes
- The sizes are `.logo .mark` and `.logo .name` in `templates/panel.html` (0303, 0304). The landing page sets its mark at 26 px and its name at 24 px.
- Failing before this build: none
- Built so far: 32 px mark and 26 px title at every width, laid out in a row centred on the mark. Wide screens fit well. On a 375 px phone, the two-row header has about 123 px left for the project's name, so even "speck · base main" is cut short with "…", and 0140 AC3 (the project's name in full at 375 px) fails. A 14 px title on phones doesn't help, because the 32 px mark alone takes about 19 px more than before.
- Went with the recommendation: B, hide "control panel" on phones (chosen by the user in the panel, 2026-10-18 22:32 UTC).
- Self-check: at 320 px a long project name (the tests' temporary repo) is still cut short with its ellipsis, as it was before this build; from 375 px it shows in full, so the browser test checks both. The slim phone header stays within 60 px.
- Changed older tests to the new sizes: 0303 (mark 32 px), 0304 ("speck" 26 px; "control panel" beside it only on wider screens), 0170 (reads the title's own font size, and allows a mark up to 1.25 × its height).

## In plain words
The speck mark and name at the top of the panel are bigger: the mark is about two thirds larger and the name half as large again, so the brand stands out next to the buttons. The mark's dots stay sharp and even. On a phone, the small "control panel" label no longer shows, so the larger name and your project's name both fit on the top row. Open the panel on a computer and on a phone to see it. On the narrowest phones, a long project name is still shortened with "…", as before.

## Blocked question
At 26 px, "speck" and "control panel" leave too little room on a phone (375 px) for the project's name, so even "speck · base main" is cut short with "…". Which do you want on a phone? (A) Keep it like that: a long project name is cut short. (B) Hide "control panel" in the phone header too, not only once you've scrolled down, so the larger mark, the title and the full project name all fit. (C) Keep today's smaller mark and title on phones, larger only on wider screens. I recommend B: the brand gets larger where it's weakest, the project's name stays readable, and "control panel" says the least.
Recommended: B, hide "control panel" on phones
Changes what you'd notice: yes
Clear winner: no

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 137,482
- Elapsed since build started: 10 min
- Changed lines: 23 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-ups only, no inbox notes): the design mock `docs/design/lcd/panel-mock.html` still draws the header's mark at 19 px; update it if the mock should match the panel.

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
    "reviewed_sha": "ae96b553d9ead15d770e2eb442393c02ec2f22b2",
    "thread_id": "01a15126-1412-79a1-9581-07e567dac77f",
    "seconds": 20,
    "usage": {
      "input_tokens": 136717,
      "cached_input_tokens": 95744,
      "cache_write_input_tokens": 0,
      "output_tokens": 765,
      "reasoning_output_tokens": 43
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:33:52.541Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html sets .logo .mark to 32 × 32 px and initialises LCD.tile with a 16 × 16 grid. templates/lcd.js Screen.size uses an integer pixel scale. Passing panel-0309 browser test confirms both displayed and canvas dimensions at 32 × 32."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html sets .logo .name to 26 px Doto, weight 900, and centres the flex row. Passing panel-0309 static and browser tests verify typography, placement and vertical centring."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Button sizing rules are unchanged. Passing panel-0309 browser test verifies 34 px desktop buttons, 44 px phone buttons, a 32 px logo height and header heights of 63 px desktop and 105 px phone."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0309 browser test checks widths 320, 375, 400, 699, 700 and 1280 in both looks, including slim phone headers, for overflow and overlap. Phone label hiding follows the user's recorded option B; the repo hides in the slim header. Existing panel-0140 tests also passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The header now has a larger, evenly rendered mark and a larger centred title. Buttons retain their sizes, and tested layouts fit from 320 px upwards in both looks. On phones, “control panel” hides as requested to preserve space for the project name. The reported test run passed with no failures."
  }
}
```

</details>

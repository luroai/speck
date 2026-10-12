---
id: "0136"
title: Give the panel a dark look you can switch to                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-12
started: "2026-10-12T18:57:29.734Z"

---
# 0136 · Give the panel a dark look you can switch to

**Status:** 👍 approved

## Problem
Since 0134 the panel is light only. The zen mockup it copies has a dark version with a light/dark button in the top-right, and the user wants it: some people prefer a dark screen, especially when they leave the panel open in the evening.

## Outcome
A button in the top-right of the panel switches between the light zen look and a dark one, "the same garden at night" from the mockup. The panel remembers the choice, and until you choose it follows your computer's light or dark setting.

## Acceptance criteria
1. The header has a button at its right-hand end, after the pills, whose accessible name is "Switch between light and dark". It shows a moon icon while the panel is light and a sun icon while it's dark, with no visible text. Clicking it, or pressing Enter or Space on it, switches the panel to the other look.
2. In the dark look these variables have exactly these values: `--bg: #151916; --panel: #1a1f1b; --raise: #1c211d; --line: #383b37; --line-soft: #252925; --text: #e2e3d6; --muted: #b3b8a9; --faint: #7c8276; --accent: #8db391; --bad: #d4664e`. `--ok`, `--warn`, `--run`, `--idea`, `--inbox`, `--bug` and `--fix` are each a 6-digit hex colour different from the other six and from the dark `--accent` and `--bad`, with a contrast ratio of at least 3:1 against the dark `--bg`. `--accent-bg`, `--idea-bg`, `--inbox-bg` and `--bad-bg` each get a dark value against which the dark `--text` has a contrast ratio of at least 4.5:1. In a browser, the computed `background-color` of `body` is `rgb(21, 25, 22)` in the dark look and `rgb(236, 235, 223)` in the light look.
3. The light look is unchanged: the page's first `:root` block still sets the colours 0134 set, so the existing colour checks (`PALETTE` in `test/support/panel.mjs` and the 0126 AC2 test) pass unchanged.
4. The choice is remembered in the browser: after switching and reloading the page, the panel shows the look last chosen, whatever the computer's setting.
5. Until the button has been used in that browser, the panel shows the dark look when the computer's setting is dark (`prefers-color-scheme: dark`) and the light look otherwise.

## Out of scope
- Anything else in the mockup's header that the panel doesn't have yet: the "speck run · on" pill is 0127.
- Changing the light look, the layout, the wording or anything the panel does.
- The landing page and the review pack: this is the panel only.
- The section numbers: removed in 0135.

## Notes
- Design reference: `mockups/zen/panel.html` in the user's speck-site project (not in this repo). Its dark block is the source for AC2. It names the colours differently: paper → `--bg`, card → `--panel`, paper-2 → `--raise`, ink/ink-2/ink-3 → `--text`/`--muted`/`--faint`, moss → `--accent`, dot → `--bad`. `--line` and `--line-soft` are its hairlines (ink at 17% and 8% over paper) worked out as solid colours, as 0134 did for the light look. The mockup has no dark values for `--ok`, `--warn`, `--run`, `--idea`, `--inbox`, `--bug` and `--fix`, so AC2 sets rules for them rather than values.
- Copy the mockup's button: a 34px square with a 0.5px border, a 15px moon or sun outline icon in `--muted`, turning `--text` on hover. Its icons are inline SVG, so nothing is loaded from another host (0134 AC2 still holds).
- The page mustn't flash the wrong look while it loads: apply the saved or system choice before the page is first drawn.
- Remember the choice in `localStorage` under `speck-theme`, as the mockup does. It belongs to the panel's address, so a panel opened on another `--port` starts from the computer's setting again.
- `paletteProblems` reads the first `:root` block only, so the dark values must come after it.
- Hard-coded light-look shades (for example the `rgba(31, 37, 33, …)` backdrop and shadow behind the full ticket pane) need dark counterparts too, so nothing stays light-on-light or dark-on-dark in the dark look.
- Assumed from the mockup: before you choose, the panel follows the computer's setting (AC5). Change AC5 if it should always start light.
- Checked 2026-10-12: the dark colours, button and `speck-theme` storage key, read from `mockups/zen/panel.html` in the local speck-site project.
- Failing before this build: none
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 104,621
- Elapsed since build started: 5 min
- Changed lines: 39 (limit 5000)
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
    "reviewed_sha": "18c9a2a6e45504c1f6b30aa405dc5b52503bc004",
    "thread_id": "01a1317d-f634-72b2-8d7f-ba5c0125261f",
    "seconds": 29,
    "usage": {
      "input_tokens": 103806,
      "cached_input_tokens": 59136,
      "cache_write_input_tokens": 0,
      "output_tokens": 815,
      "reasoning_output_tokens": 29
    },
    "saved_at": "2026-10-12T19:02:10.372Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html places the named native button after the pills, switches icons through CSS, and toggles the theme on click. Passing tests in test/panel-0136.test.mjs verify placement, accessible name, icons, no text, and browser activation by click, Enter and Space."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html defines the exact dark palette and dark backdrop/shadow overrides. Passing AC2 tests check colour values, uniqueness and contrast; the passing browser test checks both computed body backgrounds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The diff preserves the original light :root blocks. The AC3 paletteProblems test and existing 0126 AC2 colour tests pass in /tmp/speck-0136-tests.txt; their existing checks were unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The button handler stores speck-theme in localStorage; theme-start applies valid saved values before body parsing. Passing AC4 tests exercise saved choices against opposite system settings and actual browser persistence through reload."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "theme-start uses prefers-color-scheme when no valid preference is saved and follows subsequent system changes. Passing AC5 tests exercise both initial settings and changes, including a real browser with emulated system preferences."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now switches between light and dark, remembers your choice, and follows your computer’s setting until you choose. The light colours remain unchanged. All 12 ticket tests passed, including browser checks; the full suite recorded no failures. No blocking concerns or unrelated changes found."
  }
}
```

</details>

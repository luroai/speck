---
id: "0161"
title: "Make the panel readable for low vision"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T14:11:58.303Z"

---
# 0161 · Make the panel readable for low vision

**Status:** 🔍 reviewing

## Problem
The panel is hard to read for its own user, and harder for anyone with low vision. The colours pass the basic text contrast ratio, but only just (`--faint` is 4.6:1 on the light background), much of the text is small (labels at 9 to 11 px) and light (the body weight is 300), and the borders around cards, tags, tabs and buttons are 1.1 to 1.6:1 against the background, so the edges of things are hard to see.

## Outcome
Every word and every control edge in the panel is comfortably readable in light and dark mode, meeting WCAG 2.2 AA with margin, and AAA for small text.

## Acceptance criteria
1. All text meets at least 4.5:1 against the background it sits on, and text smaller than 14 px (labels, counts, hints, tags) meets at least 7:1, in light and dark mode. A test works the ratios out from the panel's colour tokens and the backgrounds they're used on, and fails if any pair falls short.
2. The visible edge of every control and card (buttons, tags, tabs, cards, the Auto-build and light/dark buttons, the priority menu) meets at least 3:1 against the background next to it, in light and dark mode, checked by the same test.
3. No text is smaller than 12 px, and running text and labels use a weight of at least 400. The priority, size, risk, bug and fix tags are at least 14 px text in boxes at least 28 px tall, the same size wherever they appear (Plan, the Build queue and the full ticket pane).
4. Every button, link and tab shows a clearly visible focus ring when reached with the keyboard (at least 2 px, at least 3:1 against the background around it), and the page can be zoomed by the user.
5. No test that passed before this change fails, except checks of the old colour values, sizes and weights, which are changed to match.

## Out of scope
- Screen reader labels beyond what the panel already has.
- Changing the layout or what the panel shows.

## Notes
- Measured 2026-10-14 from the tokens in `templates/panel.html`. Light: `--faint` 4.82:1 on the panel and 4.58:1 on the page background, `--warn` 4.68:1, `--line` 1.62:1, `--line-soft` 1.24:1. Dark: `--accent` 4.56:1, `--faint` 4.77:1, `--line` 1.52:1, `--line-soft` 1.09:1. Font sizes in use go down to 9 px; the body is `font: 300 13px`; tags are `.tag { font-size: 10px; line-height: 17px }`.
- The larger tags were asked for on 2026-10-14: they're hard to read on a phone.
- WCAG 2.2: 1.4.3 (4.5:1 text), 1.4.6 (7:1, AAA), 1.4.11 (3:1 for control edges), 2.4.7 and 2.4.13 (focus visible and its appearance).
- Keep the panel's look: darken or lighten the existing tokens rather than replacing the palette.
- Failing before this build: none
- New colours, each text colour at least 7:1 on every background in its look (page, panel, raised rows and the open tints), and `--line` at least 3:1. Light: `--line` #87847d, `--faint` #4d4c48, `--accent` #853123, `--ok` #3f522e, `--warn` #67460b, `--bad` #921f2d, `--run` #304f6d, `--idea` #623f6c, `--inbox` #22544c, `--bug` #7a3553, `--fix` #584c0e. Dark: `--line` #737373, `--muted` #c4c4c4, `--faint` #b4b4b4, `--accent` #e5a495, `--ok` #a5bb8e, `--warn` #daac5d, `--bad` #f39ba5, `--run` #97b7d8, `--idea` #c3abd1, `--inbox` #82bfb5, `--bug` #e0a2bf. Backgrounds and `--line-soft` (used only for dividers inside cards, not for control or card edges) are unchanged.
- A waiting ticket (faded to .5) and the tickets outside a hovered chain (faded to .35) are now set back with the raised fill instead, as a fade can't keep the text at 7:1. A disabled button still fades to .6: WCAG 1.4.3 and 1.4.11 exempt inactive controls.
- Kept the existing tests' order of sizes: stat labels 13 px over 12 px counts, and review-pack and note tables 13 px under their 12 px phone labels. On a phone, "control panel" in the header has tighter letter spacing so the project's name still fits beside it at 12 px.
- Self-check: no changes

## In plain words
The panel is easier to read, in both light and dark. Grey and coloured text is darker in the light look and lighter in the dark one, nothing is smaller than 12 px or in the thin weight, and the outlines of buttons, tags and cards are clearly visible. The priority, size, risk, bug and fix tags are bigger and the same size everywhere, which helps most on a phone. Moving around with the Tab key now shows a clear ring round whatever you've reached.

To see it, open the panel and compare it with how it looked: the tags, small labels and card edges stand out most. Press Tab a few times to see the ring.

Worth keeping an eye on: the red and other accents are deeper in the light look and paler in the dark one, so the panel no longer matches the landing page's colours exactly. Tickets waiting on another, and those dimmed while you hover over a chain, are now shown with a light grey fill rather than faded.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: `speck/ideas/2026-10-14-reach-the-priority-tag-and-a-ticket-s-top-row-with-the-keyboard.md`: the priority tag and the top rows take only a click, so they get no focus ring.
- Inbox: `speck/ideas/2026-10-14-match-the-landing-page-s-colours-to-the-panel-s-again.md`: the panel no longer matches the landing page's colours (0147), and the app icon keeps the old accent.
- Known limit: `--line-soft` is unchanged (1.1 to 1.2:1). It's used only for dividers inside cards and tables, not for the edge of any control or card.
- Known limit: disabled buttons still fade to 60%, which WCAG exempts as inactive controls.

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
    "reviewed_sha": "b70139b99e1553a354339cfca7f9af90d2b5d794",
    "thread_id": "01a13ad0-78f1-74f3-b36e-e128a4a41059",
    "seconds": 39,
    "usage": {
      "input_tokens": 202148,
      "cached_input_tokens": 143488,
      "cache_write_input_tokens": 0,
      "output_tokens": 655,
      "reasoning_output_tokens": 41
    },
    "saved_at": "2026-10-14T14:29:01.900Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html strengthens both palettes and removes text-fading states. Passing 0161 AC1 token tests calculate contrast across page, panel, raised and tinted backgrounds; passing light/dark browser tests check rendered text."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html uses stronger --line and accent tokens for control and card edges. The 0161 AC2 token-ratio test and both rendered-browser edge checks passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html sets body weight 400, all explicit text sizes to at least 12px, and .tag to 14px with 27px line-height plus borders. Passing static and browser tests verify sizes, weights and consistent tag heights across Plan, Build and the full pane."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html adds a global 2px solid :focus-visible outline and allows pinch zoom on the backdrop. Passing AC4 tests check outline contrast, actual keyboard Tab focus, viewport settings and zoom-blocking styles/scripts."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0161-tests.txt: 1522 tests, 1519 passed, zero failures, three skipped; all 12 ticket tests passed, including browser tests. Existing test changes update the superseded palette, size and fading expectations."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now has stronger contrast, larger labels and tags, and visible keyboard focus rings in both themes. The tests exercise the rendered panel as well as its colour calculations, and the full suite reports no failures. No blocking concerns found."
  }
}
```

</details>

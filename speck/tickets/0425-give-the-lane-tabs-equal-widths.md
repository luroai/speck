---
id: "0425"
title: "Give the lane tabs equal widths"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0420"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T18:04:27.401Z"

---
# 0425 · Give the lane tabs equal widths

**Status:** 🔍 reviewing

## Problem
The Plan, Build and Shipped tabs (0410) are different widths and heights: Build and Shipped show their counts under their names ("1 in flight · 12 queued", "395 in total"), and Plan has none, so the row looks uneven.

## Outcome
The three tabs are the same size and share the row, and each lane's counts are at the top of the lane.

## Acceptance criteria
1. At every window width from 320 px up, the three tabs share the tab row's full width equally: each is a third of it, to within 1 px, and all three are the same height.
2. Each tab shows its name on one line, and nothing else, except Build's needs-you number. While the Foreman's status reads `Needs you <n>` and Plan or Shipped is open, Build shows `<n>` in the panel's crimson after its name, and its accessible name includes `<n> needs you`.
3. The counts that are under Build's and Shipped's names today are the first line of their lane, above its tickets: Build's `<n> in flight · <n> queued` and Shipped's `<n> in total`, with the same wording and numbers as today.
4. The tabs still open with a click, Tab and Enter or Space, and the left and right arrow keys, as 0410 made them.

## Out of scope
- Borders round a lane or its tickets (0418).
- Shipped's stats tiles (0420).

## Notes
- The user asked for this on 2026-10-23.
- Changes 0410's tab row: criterion 2 replaces 0410's `<n> needs you` text on the Build tab with the number alone, so the tabs fit a third of 320 px.
- Today: `.tabs`, `.tab`, `#queue-n`, `#shipped-n` and `#build-needs` in `templates/panel.html`.
- Waits for 0420, which also changes the Shipped count. Builds alongside 0421 to 0424 (the user, 2026-10-23), which change other parts of `templates/panel.html`.
- Failing before this build: none
- Self-check: no changes. The Build lane's panel takes its name from the Build tab, so while the number shows, a screen reader names the lane "Build, <n> needs you" too.

## In plain words
The Plan, Build and Shipped tabs are now the same size and share the row evenly, each showing just its name on one line. The counts that used to sit under Build and Shipped ("3 in flight · 5 queued", "404 in total") are now the first line inside each lane, above its tickets. When something needs you and you're looking at Plan or Shipped, the Build tab shows just the number, in red, next to its name. To see it, open the panel and switch between the tabs, including in a narrow window. Worth a look: a screen reader also names the Build lane "Build, 3 needs you" while that number shows.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox note): the Build lane takes its accessible name from the Build tab, so while the needs-you number shows, a screen reader names the lane "Build, <n> needs you" as well. Pointing the lanes at their tab's name alone would tidy that.

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
    "reviewed_sha": "d6113ad3b15e21bb948ec22dc66105a2e7bf0aca",
    "session": "fresh",
    "thread_id": "01a169f5-9c40-76e3-ba1c-0a62d6303246",
    "builder_response": "- Tests run: test/panel-0425.test.mjs test/panel-0410.test.mjs test/panel-0162.test.mjs test/panel-0417.test.mjs test/panel-0135.test.mjs test/panel-0134.test.mjs test/panel-0188.test.mjs test/panel-0418.test.mjs test/panel-0140.test.mjs test/panel-0165.test.mjs test/panel-0060.test.mjs\n- Existing tests changed because the ticket replaces what they checked (its Notes say criterion 2 replaces 0410's `<n> needs you` text): 0410 (counts no longer in the tabs; Build shows the number alone), 0162 AC2 (the empty-Build message is the lane's first line, not in the tab), 0417 (the tab's flex direction is row, name on one line), 0135 (the tabs' children).\n- The needs-you accessible name is an aria-label on the Build tab (\"Build, <n> needs you\", or \"Build\" otherwise), as the visible text is the number alone.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 102836,
      "cached_input_tokens": 62464,
      "cache_write_input_tokens": 0,
      "output_tokens": 620,
      "reasoning_output_tokens": 26
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T18:11:28.068Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html gives each .tab equal flex sizing with no gap. The passing 0425 AC1 browser test checks equal widths, full row coverage and equal heights at eight viewport widths from 320 to 1280 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Tab markup contains only names and Build's needs number. drawTabs() sets the number and accessible label; .tab .needs uses the crimson --bad colour. Both 0425 AC2 tests passed, covering lane changes and Foreman status updates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queue-n and shipped-n are the first children of their lane sections. Their existing count calculations remain unchanged. The passing 0425 AC3 test checks placement and wording for queued, building, shipped and empty states."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Native button semantics and existing click and arrow-key handlers remain intact. Passing 0425 AC4 tests check button accessibility, clicks, arrow navigation and focus; panel-0410.test.mjs provides additional regression coverage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The tabs now share the row equally, with lane counts moved above their tickets. Build retains its crimson attention number and descriptive screen-reader label. The relevant tests passed, and I found no blocking issues or unrelated changes."
  }
}
```

</details>

---
id: "0081"
title: "Centre a build's pause icon on its collapsed queue row"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:00:13.924Z"

---
# 0081 · Centre a build's pause icon on its collapsed queue row

**Status:** 🔍 reviewing

## Problem
In a collapsed queue row, a running build's pause icon, or a paused build's play icon, lines up with the title line, so it sits near the top of the row, above the progress bar. It looks out of place next to the two lines it controls.

## Outcome
The pause and play icon sits vertically centred on its collapsed queue row.

## Acceptance criteria
1. In a collapsed queue row for a running build, the pause icon's vertical centre is within 1px of the midpoint between the top of the title line and the bottom of the progress bar's stage labels.
2. The same holds for the play icon of a paused build.
3. Opening the row leaves the icon where it was when the row was collapsed. It doesn't move to the middle of the open row.
4. Clicking the icon still pauses or plays the build without opening or closing the row, and its clickable area is no smaller than today's 16 × 14px.
5. Rows without the icon look as they do today: the title, tags, counter and progress bar are where they were.

## Out of scope
- The icon's shape, size or colour.

## Notes
- Measured 2026-10-10 in the running panel: the row's title line spans 119–139px, the stage labels end at 170px (midpoint 144.5px), and the icon spans 120–134px (centre 127px), so it's about 17px high.
- The panel tests already drive a headless browser (`test/support/panel.mjs`), so positions can be measured.
- The icon is placed against the top row's middle plus half the progress bar's fixed height (the body's line height is 1.5, so a stage label is 15px). If the bar's spacing or font size changes, that offset in `.q .toggle-build` needs changing with it; the 0081 browser tests catch it.
- AC5's test compares rows without the icon against the panel as it was at commit 9ff5e4c, and skips if that commit isn't in the clone.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox note): the icon's offset in `.q .toggle-build` hard-codes the progress bar's height (8px margin, 3px border, 5px padding, 15px label). It is a known limit rather than a defect: the 0081 browser tests fail if the bar's spacing changes without it.
- Round 1 moved a refused pause or play's reason from between the top row and the progress bar to under the bar, so the icon stays centred; the 0071 tests were updated to find it there.

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
    "reviewed_sha": "5791f15569a6413437ffc23f9bd596cf431695d8",
    "thread_id": "01a125b2-d095-71e1-ad0e-05c8c87bed90",
    "seconds": 37,
    "usage": {
      "input_tokens": 228597,
      "cached_input_tokens": 146688,
      "cache_write_input_tokens": 0,
      "output_tokens": 895,
      "reasoning_output_tokens": 90
    },
    "saved_at": "2026-10-10T12:04:35.265Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html: queueItem inserts .toggle-refused between .top and .stages, while .toggle-build uses a fixed offset from .top. A refusal therefore moves the stage labels down without moving the pause icon. The 0081 AC1 browser test covers only the normal layout."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The same fixed positioning and refusal layout affect the play icon. test/panel-0081.test.mjs AC2 exercises a paused build but no refusal message."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/panel-0081.test.mjs AC3 measures both icons before and after opening; the supplied results pass. Positioning is anchored to .top rather than the expanded row."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "0081 AC4 uses real browser mouse events, verifies pause/play requests, unchanged collapsed/open state and a 16 × 14px button. toggleIcon stops click propagation; dimensions remain unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "0081 AC5 compares actual browser geometry against commit 9ff5e4c for rows without icons, including title, tags, counter and stages. The supplied run passes without skipping. The committed change contains only the ticket, CSS and new tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "A refused pause or play request breaks the required centring. queueItem places the refusal message between the title and progress bar, increasing the distance to the stage labels, but the icon remains at its fixed offset from the title. Existing refusal handling preserves this message through refreshes.",
        "suggested_fix": "Make the icon track the actual midpoint when a refusal message is present, or place the message below the progress bar. Add browser coverage for refused pause and play requests that measures the midpoint after the message appears.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The icons are centred in normal rows, stay put when opened, and remain clickable. Rows without icons retain their layout. A refused pause or play request breaks the centring, so that error case needs fixing before merge."
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
    "reviewed_sha": "d377ff208527f71308ee77cde87181386b649abc",
    "thread_id": "01a125b2-d095-71e1-ad0e-05c8c87bed90",
    "seconds": 22,
    "usage": {
      "input_tokens": 498537,
      "cached_input_tokens": 361216,
      "cache_write_input_tokens": 0,
      "output_tokens": 1432,
      "reasoning_output_tokens": 90
    },
    "saved_at": "2026-10-10T12:08:34.783Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html positions .toggle-build relative to .top; queueItem now places refusal messages after .stages. test/panel-0081.test.mjs AC1 and the refused-pause browser test measure centring within 1px; both pass in the supplied run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "0081 AC2 checks the play icon and its measured midpoint. The new refusal browser test also checks a refused play request. Both pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0081 AC3 measures both icons before and after opening, including continued centring. The new refusal test verifies their positions remain unchanged when opened with a multiline error. Both pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "0081 AC4 verifies real browser clicks send pause/play requests, preserve collapsed and open states, and hit a button at least 16 × 14px. toggleIcon retains stopPropagation. The test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "0081 AC5 compares title, tags, counter and progress-bar geometry for rows without icons against commit 9ff5e4c. It passes without skipping in the supplied run."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Refusal messages previously moved the progress bar down without moving the icon, breaking centring. Resolved: queueItem now appends the message below the progress bar, with browser regression coverage for refused pause and play requests.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The pause and play icons are centred and stay in place when rows open, including after refused requests. Clicking still works, and rows without icons retain their layout. The earlier issue is fixed; all 618 supplied tests pass with none skipped. Approved."
  }
}
```

</details>

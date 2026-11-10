---
id: "0604"
title: "Give the black bar room for its whole status"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0601"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T08:45:59.870Z"

---
# 0604 · Give the black bar room for its whole status

**Status:** 🔍 reviewing

## Problem
On a phone the black bar (0580) fits the status, the project's name, the project menu and Settings on one line, so they're cut off: the user saw "Shipping 05… · s…" and couldn't tell which ticket was shipping or which project it was. The project menu beside them also read "All projects" while the panel was showing speck.

## Outcome
The black bar is a little taller, with a larger speck and room for the whole status, the project and what's waiting, each on a line of its own.

## Acceptance criteria
1. The bar is taller, with speck at about 56 px and three lines of text beside it: the status with the ticket it's about (such as "Shipping 0599" or "Building 4"), the project's name with the base branch (such as "speck · main"), and what's queued and how many need you, the last in orange.
2. The project's name is the project menu: pressing it lists the projects, with All projects when two or more are running, and it always shows the project the panel is showing, never "All projects" unless the bridge is open.
3. At 320 px wide, a status such as "Shipping 0599" or "Waiting: other tickets" and a project name of up to 20 characters show in full; only a longer name is cut off, with an ellipsis, on its own line, and the status never is.
4. The Settings button stays at the bar's right, at least 44 px square, and pressing the status still opens the Pipeline log.
5. Tests that checked the bar's old one-line layout are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What the status words say, or how speck's mood is chosen.

## Notes
- Asked for 2026-11-10, with a phone screenshot: "make the top bar a little thicker, make the character larger and then have more space/lines to put the text on, because right now I can't see what ticket is shipping in the top bar and the project name has been concatenated."
- Today: the bar's markup is in `templates/panel.html`, drawn by `drawHeader` and the project menu by `drawProjects` and `chooseProject` in `templates/panel-header.js`, styled in `templates/panel-header.css`. The menu is a `select#project` whose visible option was "All projects" (0596's) while the panel showed speck.
- Waits for 0601, which changes the borders in `templates/panel-header.css`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a press on the project's line, which sits over the status button's middle line, did nothing with one project; it now presses the status (outside the menu), and the line keeps its tooltips. The base branch now gives way before the project's name is cut, and the menu's tooltip names the project, as it covers the name. The menu keeps 0417's 44 px each way by reaching down over the start of the line under it (what's queued), never up over the status. The brief and the README say where All projects is now.
- With one project running there's no menu, as before (0516): the name is plain text, and pressing it opens the Pipeline log.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Tests changed from the bar's old one-line layout to the new one (AC5):
- `test/panel-0580.test.mjs`: the bar is a grid, not one row; speck at 56 px; the status on its own line, the project on the next and the base branch after it; the old rule hiding the lines before the first board replaced by the status's line keeping its height; All projects in the menu's list; at 320 px the status on one line, speck 56 px and the bar up to 72 px.
- `test/panel-0596.test.mjs`: All projects is the project menu's last choice, opened by choosing it, not a button beside the menu.
- `test/panel-0516.test.mjs`: its menu lists leave out All projects, which this ticket's tests check.
- `test/panel-0413.test.mjs`: the project's name is on the project's line (`.bar-where`), which is the one thing after the status button.
- `test/panel-0140.test.mjs`: the base branch is on the project's line.
- `test/panel-0454.test.mjs`: a point on the project's line over the status counts as the status, as it passes the press on.

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
    "reviewed_sha": "f3195f020d071718386d9651c4df8c70c98eaad5",
    "session": "fresh",
    "thread_id": "01a1c4b3-7c8b-7402-92d1-e72a8fd3b21f",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0604.test.mjs test/panel-0140.test.mjs test/panel-0413.test.mjs test/panel-0454.test.mjs test/panel-0516.test.mjs test/panel-0580.test.mjs test/panel-0596.test.mjs test/panel-0161.test.mjs test/panel-0427.test.mjs, plus the 25 related files it chose (1504 pass, 0 fail). Before that, every test file naming the bar's parts (60 files) was run once to find the tests that pinned the old layout; the ones changed are listed in the ticket's Delivery log (AC5).\n- Round 1. The bar is now a three-row grid: the status button spans speck (56 px) and the three lines through a subgrid, and the project's line (`.bar-where`) sits over its middle row. A press on that line outside the menu presses the status (page script), so the line keeps its tooltips. All projects moved from a separate button into the project menu as its last choice, chosen only while the bridge is open. The menu keeps 0417's 44 px each way by reaching down over the start of the third line, never up over the status.\n- Pictures: the bar at 375 px with the project menu, light and dark.\n",
    "seconds": 44,
    "usage": {
      "input_tokens": 269723,
      "cached_input_tokens": 212352,
      "cache_write_input_tokens": 0,
      "output_tokens": 1200,
      "reasoning_output_tokens": 164
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 57371,
      "cached": 212352,
      "write": 0,
      "output": 1200
    },
    "cost_usd": 0.1479772,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T09:05:03.775Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-header.css defines three grid rows and a 56 px face; drawBar renders the counts and orange needs-you text. AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawProjects, openBridge and closeBridge select the displayed project except while the bridge is open. AC2 tests cover project lists, one project and bridge selection; all passed."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The 320 px browser test checks only 'a-twenty-char-projct'. The fixed grid leaves about 160 px for text, including the 16 px menu caret. Wider names of 20 characters are still truncated by .bar-where .repo."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The final .settings-open rule sets 44 px width and height. AC4 tests and the browser test passed, covering placement and opening the Pipeline log."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the six updated test files. The supplied output, verified in /tmp/speck-0604-tests.txt, records 1504 passes and zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.css",
        "issue": "At 320 px, names of up to 20 characters can still be cut off. The fixed face, Settings and spacing leave approximately 144 px for the name when the menu is present. A 20-character name containing wide letters, such as 'WWWWWWWWWWWWWWWWWWWW', exceeds that space. The test's single narrow example does not establish AC3's guarantee.",
        "suggested_fix": "Adjust the layout or name sizing to show wider names up to 20 characters in full, and extend the 320 px browser test with a wide-character name. Preserve ellipsis for longer names and the status's full visibility.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The taller bar, larger speck and project menu work in the tested cases, and all reported tests pass. One required phone-width case remains: wider project names can still be shortened even when they contain only 20 characters."
  }
}
```

</details>

---
id: "0470"
title: "Title the Pipeline pop-up Pipeline log in dot-matrix letters"                # one outcome, no "and"
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
after: ["0474"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:36:41.315Z"

---
# 0470 · Title the Pipeline pop-up Pipeline log in dot-matrix letters

**Status:** 🔍 reviewing

## Problem
Pressing speck's screen opens a pop-up titled `Pipeline` in small monospace text, with a separate `Log` heading on the line under it. Since 0458 the log is all it shows, so the two headings split one name over two lines, and the small title doesn't match speck's header.

## Outcome
The pop-up has one title, `Pipeline log`, on its top row, in the same dot-matrix lettering as the word "speck" in the header.

## Acceptance criteria
1. The pop-up's top row reads `Pipeline log`, beside Close, and there's no `Log` heading under it: the log box starts straight under the top row. Its dialog's accessible name is `Pipeline log`.
2. The title is in the dot-matrix font and weight the header's "speck" uses (Doto), at least 18 px, on one line beside Close at every width from 320 px, checked in a real browser in both looks.
3. Close, Escape, a click outside and the focus work as before (0415), and the top row still stays in view while the log scrolls. No test that passed before this change fails.

## Out of scope
- The log box and its lines (0459, 0460).
- The titles of the other pop-ups.

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot: "The title should read pipeline log … put them all on the top line … make the title a little bit bigger, maybe even like in the same dot matrix style text as the speck title."
- Today: `renderForeman` in `templates/panel.js` draws the top as `Pipeline` and Close, and the log section's `Log` heading. `#foreman .top .title` in `templates/panel.css` sets the title in the monospace font at 12 px. The header's word is `.bezel .name`, in `Doto` at weight 900.
- Waits for 0474, the last of the file splits (0472 to 0474), which move the Pipeline log's script and styles into the pop-ups' own files. Re-chained by the user on 2026-10-24 so it builds side by side with 0469, which leaves the pop-ups out.
- Failing before this build: none
- Self-check: no changes to the code. The older tests that named the `Pipeline` title, the `Log` heading or its `.foreman h3` style (0366, 0413, 0415, 0427, 0458, 0473) were changed to the new title, as AC1 asks.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "489b21f4bea24dc076266d850284093f7d835dfb",
    "session": "fresh",
    "thread_id": "01a16e5d-d95a-70e1-b785-f99163210df4",
    "builder_response": "- Tests run: `speck test --related` on test/pipeline-0470.test.mjs test/pipeline-0415.test.mjs test/pipeline-0458.test.mjs test/panel-0366.test.mjs test/panel-0413.test.mjs test/panel-0473.test.mjs test/panel-0427.test.mjs, plus every existing test file that names a file this branch changed (984 tests, 0 failing).\n- Older tests changed, because AC1 replaces what they asserted: 0415, 0458, 0413, 0473 named the `Pipeline` title or the `Log` heading; 0366 required `#foreman .top .title` to share `#doc-view`'s title rule (the document pop-up's title is out of scope, so it keeps the old style and the Pipeline log's title gets its own rule); 0427 listed the removed `.foreman h3` rule and now allows Doto on `#foreman .top .title` as on `.bezel .name`. No assertion about anything else was weakened.\n- AC2 is checked in a real Chromium at 320, 375, 414, 600, 768, 1024 and 1280 px, in both looks, with Doto loaded from templates/fonts/Doto.ttf. AC3's sticky top is checked there at 320×200, where the pop-up itself scrolls.\n- docs/brief.md now says \"the Pipeline log pop-up\", with a test.\n- Pictures of the pop-up on a phone in both looks are in the review pack.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 113923,
      "cached_input_tokens": 71936,
      "cache_write_input_tokens": 0,
      "output_tokens": 580,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T14:43:49.541Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.js renderForeman renders ‘Pipeline log’ beside Close without a Log heading; panel.html sets the accessible name. Passing 0470 AC1 tests cover populated and empty logs and the dialog name."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-popups.css sets Doto, weight 900 and 20px. The passing real-browser 0470 AC2/AC3 test checks loaded Doto, both looks and widths from 320 to 1280px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0470 AC3 tests cover Close, Escape, outside clicks and focus restoration; the browser test checks the sticky top row. Recorded test output confirms 981 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/pipeline-0470.test.mjs:165",
        "issue": "The new brief test requires the exact prose ‘opens the Pipeline log pop-up’. This is a document wording assertion explicitly prohibited by the review rules: a harmless rewrite of the sentence would fail it.",
        "suggested_fix": "Remove this document wording test. Keep the behavioural title and accessible-name tests, which already verify the required name.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The pop-up now has the requested larger dot-matrix title, and the behaviour and browser checks pass. Before approval, remove one test that unnecessarily locks the product brief to exact wording."
  }
}
```

</details>

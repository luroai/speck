---
id: "0379"
title: "Keep a pop-up's Close button in view"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-keep-the-document-pop-up-s-close-button-in-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:24.411Z"
approved: "2026-10-22T23:57:57.562Z"
finished: "2026-10-23T00:03:47.494Z"

---
# 0379 · Keep a pop-up's Close button in view

**Status:** ✅ done

## Problem
A long document's pop-up scrolls its path and Close button away with the document. On a phone there is no Escape key, so closing it means scrolling back to the top. The Settings pop-up and the Foreman's pop-up are the same kind of window.

## Outcome
The path and Close button stay at the top of a document pop-up, and Close stays at the top of the Settings and Foreman pop-ups, while the rest scrolls.

## Acceptance criteria
1. In a document task's pop-up, the file's path and Close stay in view at the top while the document scrolls, at every width, in both looks. Scrolling the document to its end on a 390 px wide window leaves Close visible, and pressing it still closes the pop-up.
2. The Settings pop-up from 0368 keeps its heading and Close in view at the top while the settings scroll. The Foreman's pop-up keeps its Close in view at the top while its detail scrolls. Pressing Close still closes each one.
3. Ship and Ask for changes stay with the document, and scroll with it, as they do today.
4. Escape still closes each pop-up. Nothing behind an open pop-up can be clicked, scrolled or reached with Tab, as today.
5. No test that passed before this change fails, except a check that Close scrolls with the document, which is changed to check criterion 1.

## Out of scope
- Pinning Ship and Ask for changes. They stay with the document.
- What the pop-ups show, apart from what stays in view.

## Notes
- Checked 2026-10-22: `#doc-view` and `#foreman` in `templates/panel.html` are the scrolling window (`overflow-y: auto`), and the path and Close sit inside it (0362, 0366). 0363 puts Ship and Ask for changes in that same scroll. 0368 turns Settings into a pop-up of this look.
- The Foreman's pop-up is included: it is the same window as the document's, so leaving its Close to scroll away would keep the phone problem on one of the three.
- Waits for 0375, which waits for 0368, so the Settings pop-up exists when this is built. It changes `templates/panel.html`.
- Failing before this build: none
- Self-check: a setting's explanation opening above a row just under the Settings pop-up's held top line would have gone under that line, so it now goes below its row there (test added). The pop-ups' own top padding moved into the top line, in their existing rules, so no second rule changes their size (0362's check).
- AC5: no existing test checked that Close scrolls with the document, so none needed changing.

## In plain words
When you scroll a long document, Settings or the Foreman's notes, the line at the top with Close now stays put, and only what's under it scrolls. On a phone you no longer have to scroll back to the top to close one. Ship and Ask for changes still sit above the document and scroll away with it. To see it, open a long document, or Settings on a narrow window, and scroll down: Close stays where it is. Worth a look: when you move through Settings with the keyboard, a control can scroll up under the top line; that's saved as an idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 147,145
- Elapsed since build started: 8 min
- Changed lines: 15 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- A control focused with Tab can scroll up under a pop-up's held top line: saved as speck/ideas/2026-10-22-keep-a-focused-control-clear-of-a-pop-up-s-top-line.md.

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
    "reviewed_sha": "3c6855fb708256e9a5e579af2e073c0f68279bb1",
    "session": "fresh",
    "thread_id": "01a1660c-1915-7ee2-a991-484e768a6f8a",
    "builder_response": "- Tests run: test/panel-0379.test.mjs test/panel-0371.test.mjs test/panel-0268.test.mjs test/pack-0362.test.mjs test/pack-0363.test.mjs test/panel-0366.test.mjs test/panel-0368.test.mjs (plus the configured checks)\n- Change: each pop-up's top line (#doc-view, #foreman, #settings `.top`) is `position: sticky; top: 0` with the look's background, and the pop-up's own top padding (the notch's room) moved into that line, in the pop-ups' existing rules. A setting's explanation that would open under the held line now goes below its row (placeSettingTip measures from the line's bottom).\n- AC1/AC2: the real-browser test loads the real panel.html at 390 and 1280 px, light and dark, fills each pop-up as the page draws it, scrolls it to its end and checks Close is in view and is what a tap there hits.\n- AC2 and AC4, Close and Escape still closing each pop-up, and nothing behind it reachable: unchanged code, covered by the existing 0362 AC2/AC3, 0366 AC2/AC3 and 0368 AC1/AC2 tests, all run in this round and passing.\n- AC5: no existing test checked that Close scrolls with the document, so none was changed.\n- Pictures: six in the pack (each pop-up scrolled, 390 px, both looks). The document one is the real page with the drawn markup filled in, since this board has no document ticket.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 146177,
      "cached_input_tokens": 100608,
      "cache_write_input_tokens": 0,
      "output_tokens": 968,
      "reasoning_output_tokens": 34
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:57:40.693Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html holds #doc-view .top with sticky positioning and the theme background. The passing 0379 browser test verifies visibility and hit targeting after scrolling to the end at 390 and 1280 px in both looks. pack-0362.test.mjs exercises the actual Close handler."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The shared sticky rule covers Settings and Foreman. The passing 0379 browser test checks both after scrolling; panel-0368.test.mjs and panel-0366.test.mjs exercise their Close handlers. The new placeSettingTip test checks explanations avoid the held Settings heading."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The 0379 structure test verifies doc-actions remains outside the sticky heading, before the document, without fixed or sticky positioning. Its browser test confirms Ship scrolls away. pack-0363.test.mjs verifies Ship and Ask for changes share that actions container."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Existing passing tests in pack-0362.test.mjs, panel-0366.test.mjs and panel-0368.test.mjs exercise Escape, inert background elements and page scroll locking. Their implementation is unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0379-tests.txt: 179 tests, 176 passed, 3 skipped, zero failures. No existing tests were modified. The branch changes only the ticket, relevant panel implementation and new tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The document path and Close buttons stay visible while all three pop-ups scroll, in both looks and at phone and desktop widths. Ship and Ask for changes continue scrolling with the document. Closing and background interaction protections remain covered by passing tests. No blocking issues found."
  }
}
```

</details>

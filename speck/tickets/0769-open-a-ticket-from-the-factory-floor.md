---
id: "0769"
title: "Open a ticket from the factory floor"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0765","0766"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0766"
started: "2026-11-26T20:32:49.112Z"

---
# 0769 · Open a ticket from the factory floor

**Status:** 🔍 reviewing

## Problem
The factory floor shows tickets on the line and on the board, but reading one or acting on it needs its project's panel.

## Outcome
Pressing a ticket on the factory floor opens it in its project's panel at the same address, and back returns to the floor.

## Acceptance criteria
1. Pressing a card on the board, or a lit station on the line, opens that ticket's full view in its project's panel at `speck serve`'s address.
2. The panel's back link, or the browser's back, returns to the factory floor with the same station chosen.
3. Each card and lit station is a link or button that can be reached and opened with the keyboard.
4. No test that passed before this change fails.

## Out of scope
- Actions on the floor itself.

## Notes
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- Failing before this build: not checked
- Self-check: a card of a project whose panel has stopped now says so on the floor instead of asking speck serve, and a second press while one is opening is ignored; tests added for both. The brief's speck serve row now says what pressing a card or lit station does.

## In plain words
On the factory floor, every card on a project's board, and every ticket lit up at the builder, the reviewer or QA on the line, can now be pressed. It opens that ticket in its own project's panel, at the same address, with the whole ticket showing, so you can read it or act on it there. A card in Capture opens the panel's Capture lane with that note open. The ticket's back link then reads Factory floor and takes you back to the floor, as the browser's Back does, with the same station still chosen. Every card and lit ticket can be reached with Tab and opened with Enter or Space.

To see it: open the factory floor at speck serve's address, press any card or lit ticket, then press Factory floor at the top of the ticket.

Worth watching: a project still on an older speck opens the ticket too, but its back link goes back to its own lane rather than to the floor (the browser's Back still works), and its Capture cards open the panel without opening the note. Updating speck in that project brings both.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-11-26-steady-the-0761-ac2-wide-block-swipe-test.md, the 0761 AC2 real-browser swipe test failed once in this build's related run under load and passed on its own.
- Known limit (review round 1, F1, dispute accepted): a project on an older speck opens tickets from the floor, but its back link doesn't go to the floor and its Capture cards don't unfold the note. Updating speck there fixes both.
- Not done: the line's Ship column items aren't openable; the ticket asked only for cards and lit stations.

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
    "reviewed_sha": "c29dc15f2435e8b89da36747bcf1a0fa8ebc3af6",
    "session": "fresh",
    "thread_id": "01a219a6-dc3e-7162-84a2-b3608918fa40",
    "builder_response": "- Tests run: test/floor-open-0769.test.mjs test/panel-0761.test.mjs (with commands.checks). Before that, `speck test --related test/floor-open-0769.test.mjs` ran 533 related files: 4986 passed, 1 failed, `0761 AC2: ... a sideways swipe on the list changes lane` (a real-browser swipe that timed out under load); it passes when run again on its own, in the run sent here, and this change touches neither Plan's list nor swiping.\n- How it works: each lit slot on the line, and each board card (an `li.card` now holding a `button.card-open`), is a button. Pressing one keeps `{ port, id | note, from: 'floor' }` in sessionStorage under the key 0596's bridge already uses, POSTs `api/projects/<port>` to choose that project at the address, then `location.assign('project/')`. The project's page opens the ticket's full view through the existing openAskedTicket (or, for a Capture note, opens Capture with that note unfolded), and a ticket kept with `from: 'floor'` gets a back link reading \"Factory floor\" that goes to `../floor`. The chosen station is left as it was in localStorage, so the floor, by that link or by the browser's Back, comes back with the same station chosen.\n- Checked by hand in headless Chrome against a real `speck panel` behind `startFront`: pressing the Build card on /floor opened ticket 0001's full view at /project/ with the \"Factory floor\" back link; pressing it returned to /floor with the station chosen; history Back/Back also returned to /floor. Pictures are kept with the review pack.\n- Docs: docs/brief.md's speck serve row says what pressing a card or lit station does.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 196463,
      "cached_input_tokens": 141312,
      "cache_write_input_tokens": 0,
      "output_tokens": 890,
      "reasoning_output_tokens": 70
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 55151,
      "cached": 141312,
      "write": 0,
      "output": 890
    },
    "cost_usd": 0.1333332,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T20:58:44.866Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/floor-open-0769.test.mjs covers opening tickets and Capture notes with the current panel. However, floor.js relies on new openAskedNote support in the project's panel-header.js. Older panels ignore note and attempt to open ticket 'undefined', so their Capture cards open no note."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests cover the current panel's Factory floor link and retained station. Older panels lack the new floorBack handling in panel-header.js and panel-popups.js, so their ticket back link closes the view instead of returning to the floor. scripts/serve-front.mjs passes those projects' own page scripts through unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "floor.js opener, cardOf and slotOf create named native buttons. The passing AC3 tests check every card and lit slot and verify focus survives redraws; floor.css supplies a visible focus outline."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded targeted run passed 159 tests with zero failures and three skips, including the previously failing swipe test. No changed test weakens existing coverage."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "Navigation depends on every project having this new panel code, although speck serve serves each project's own copy. A project running the preceding version opens tickets without a Factory floor back link and ignores Capture note hand-offs entirely. The new tests use only current panel scripts, hiding this supported mixed-version case.",
        "suggested_fix": "Provide compatibility handling at the serve address so older project panels can open the requested item and return to the floor. Add coverage using panel scripts from before this change, checking both ticket return navigation and Capture cards.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The buttons and navigation work with updated project panels, and the recorded tests pass. Projects running older copies of speck still have broken return links and Capture cards that do not open their notes. That compatibility gap needs fixing before merge."
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
    "reviewed_sha": "c29dc15f2435e8b89da36747bcf1a0fa8ebc3af6",
    "session": "continued",
    "thread_id": "01a219a6-dc3e-7162-84a2-b3608918fa40",
    "builder_response": "- Tests run: test/floor-open-0769.test.mjs test/panel-0761.test.mjs (with commands.checks); no code changed since round 1, so the round-1 run stands.\n- F1: disputed. Each criterion already holds on a project running an older speck, and the extra the finding asks for goes beyond the ticket:\n  - AC1 is about tickets: \"opens that ticket's full view\". Every speck that speck serve supports (it starts panels \"from speck 1.5.0 on\", docs/brief.md) already opens a ticket kept under `speck-open-ticket` as `{ port, id }` once its board arrives: `git show v1.5.0:templates/panel-header.js` lines 261-268 (openAskedTicket → openTicket(String(v.id))), and v1.7.0 lines 297-305 with 0757's atServe check. The floor writes exactly that shape (plus `from`, which older pages ignore). So pressing a ticket's card or a lit station opens its full view on an older project as well. A Capture card holds a note, not a ticket. On an older panel it still opens that project's panel; only unfolding the note needs this speck, and that is a nicety beyond AC1. (openTicket('undefined') finds nothing and opens nothing: no error.)\n  - AC2 reads \"The panel's back link, **or** the browser's back, returns to the factory floor with the same station chosen.\" The browser's Back works whatever speck the project is on: the floor goes to `project/` with `location.assign`, so Back returns to /floor (checked by hand in headless Chrome against a real panel), and the station chosen is in the floor's own localStorage, which the project's page never touches. On a current panel the back link goes there too.\n  - Making an older speck's page do new things would mean speck serve rewriting another version's HTML or scripts as it passes them on, which nothing in the ticket asks for and which 0757 deliberately avoids (it passes each project's own page through unchanged). It is also how the floor's own link in the panel works since 0765: it shows only on a speck that has it. Updating speck in a project brings both.\n- If you still think older panels need the floor back link, I'd treat that as a product question for the user rather than a fix.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 315926,
      "cached_input_tokens": 255104,
      "cache_write_input_tokens": 0,
      "output_tokens": 1419,
      "reasoning_output_tokens": 70
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5671,
      "cached": 113792,
      "write": 0,
      "output": 529
    },
    "cost_usd": 0.0280112,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T20:59:30.410Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "floor.js openIn hands the ticket id and project port to the project's panel; panel-header.js openAskedTicket opens its full view. Passing AC1 tests exercise board cards, lit stations and the receiving panel. v1.5.0's openAskedTicket already supports the ticket hand-off."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "openIn uses location.assign('project/'), retaining /floor in browser history. The selected station remains in localStorage. Passing AC2 tests verify the current panel's Factory floor back link and restoration of the chosen station. Browser Back satisfies the criterion's alternative for older panels."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "floor.js cardOf and slotOf create native buttons through opener, with accessible names. Passing AC3 tests check the buttons and focus retention across redraws; floor.css provides a visible focus outline."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The unchanged implementation's recorded targeted run has 159 passes, zero failures and three skips, including a passing rerun of the previously failing swipe test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "The previous finding required older panels to support the new floor back link and Capture note unfolding. That exceeded the ticket: AC1 concerns tickets, whose hand-off older panels support, and AC2 explicitly permits browser Back.",
        "suggested_fix": "No change required for this ticket.",
        "state": "dispute_accepted"
      }
    ],
    "escalation_question": "",
    "summary": "Ticket cards and lit stations open the correct project's ticket, keyboard access works, and returning preserves the chosen station. The compatibility objection is withdrawn: older panels support ticket opening, and browser Back meets the return requirement. The recorded tests pass."
  }
}
```

</details>

---
id: "0461"
title: "Show an open build ticket's steps as a coloured track"                # one outcome, no "and"
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
after: ["0459"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T10:33:13.858Z"

---
# 0461 · Show an open build ticket's steps as a coloured track

**Status:** 🔍 reviewing

## Problem
An open ticket in the Build lane says where it is in the pipeline only as a word in a line of facts joined by dots, which wraps untidily on a phone. You can't see at a glance how far through the five steps it is.

## Outcome
An open ticket that's in flight shows a track of its five steps, each in its own colour, so you can see at a glance where it is.

## Acceptance criteria
1. An open ticket that's in flight shows, under its title, a track of five equal bars in one row, each with its step's name under it: Build, Self-check, Review (with its round, such as `Review 2`, once there is one), Approve and Ship, from the steps the panel already works out for it. A closed ticket and a queued ticket don't show it.
2. Each step has its own colour: Build blue, Self-check cyan, Review yellow, Approve green and Ship purple. A finished step's bar and the current step's bar are in that step's colour, and the current step's name is in its colour and bold. A step not reached yet has a grey bar and name. A blocked ticket, or one whose build stopped, has its current step's bar and name in the crimson blocked tickets use.
3. A ticket that's shipping has a purple border to match its Ship bar, where it's green today. Every other card keeps its border.
4. The bars and names keep to one row at every width from 320 px: a name too long for its bar ends in `…`, and nothing wraps. Each colour reaches 3:1 against the card for the bars and the contrast 0161 sets for text, in both looks. Checked in a real browser at 320 px.
5. No test that passed before this change fails.

## Out of scope
- The line of facts under the title, which 0462 turns into a grid.
- Closed and queued tickets, and the Plan and Shipped tabs.

## Notes
- Asked for by the user on 2026-10-24, choosing option D in the mock-ups (https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "make sure the progress tracker changes colour depending on the stage … blue is build … shipping is purple … each bar is its own colour", and "as clean and as uniform as the images".
- The steps are `t.steps` from `progress` in `templates/panel-model.js`: labels `Build`, `Self-check`, `Review`/`Review <n>`, `Approve`, `Ship`, each with a state of `done`, `now` or blank.
- Colours today, in `templates/panel.css`: `.q.at-build` `--blue`, `.q.at-check` `--inbox` (cyan), `.q.at-review` `--yellow`, `.q.at-ship` `--green`, and a ticket waiting to ship `--ok`. Purple is `--idea`. 0440 moved the waiting-to-ship colour off magenta because it was too near the red: the purple chosen must still read as different from `--bad`.
- Waits for 0459, the last open ticket that changes `templates/panel.css` and `templates/panel.js`.
- Failing before this build: none
- Self-check: no changes. The track sits between an open card's title and its line of facts, so five older tests that found that line by its place (0419, 0434, 0443) now find it past the track, with their checks unchanged; 0171's and 0426's checks of the shipping border now expect the purple AC3 asks for.

## In plain words
When you open a ticket in the Build tab that's being worked on, you now see a row of five bars under its title: Build, Self-check, Review, Approve and Ship. Each step you've passed, and the one it's on now, has its own colour (blue, cyan, yellow, green and purple), and the current step's name is bold. A blocked ticket, or one whose build stopped, shows its current step in crimson. A ticket that's shipping now has a purple border instead of a green one.

To see it, open any ticket in the Build tab while a build is running. Closed cards and queued tickets look as before. On a narrow phone, longer names such as Self-check are cut short with an ellipsis so the row never wraps.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none. The mock-ups linked in the Notes weren't shared with the build session, so the track's place (straight under the title, above the line of facts) follows the criterion's wording.

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
    "reviewed_sha": "cf4febff30cd4da39d68add7af079f50e0174a6c",
    "session": "fresh",
    "thread_id": "01a16d83-5adf-7d61-9d57-25ecbb1855ee",
    "builder_response": "- Tests run: test/panel-0461.test.mjs test/panel-0171.test.mjs test/panel-0426.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0443.test.mjs, with --related (which brought in test/panel-0281, 0416, 0430, 0433, 0444 and test/pipeline-0459), plus the commands.checks files.\n- Changed existing tests, and why:\n  - test/panel-0171 and test/panel-0426 expected the shipping card's border (.q.at-ship) to be --green. AC3 asks for purple, so they now expect --purple; nothing else in them changed.\n  - test/panel-0419, 0434 and 0443 found an open card's line of facts as the top row's second child. The track now sits between the title and that line (AC1: \"under its title\"), so their helpers skip the track to find the line. Every assertion is unchanged.\n- New tokens: --purple (bar and border) and --purple-text and --cyan-text (the current step's name at 12 px, so 7:1), in both looks. The purple's hue is about 258°, more than 60° from --bad's crimson.\n- Pictures: the Build lane at 320 and 375 px with every card open, light and dark.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 110400,
      "cached_input_tokens": 68352,
      "cache_write_input_tokens": 0,
      "output_tokens": 619,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T10:45:10.361Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js queueItem and trackOf render t.steps immediately under an open in-flight ticket's title. The passing 0461 AC1 test checks five ordered labels, review rounds, and absence on closed and queued cards."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.css assigns each reached step its colour, makes the current label coloured and bold, and overrides stopped tracks with --bad. Passing 0461 AC2 tests exercise model states, blocked and stopped tickets, CSS rules and purple/crimson separation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The .q.at-ship rule uses --purple. Passing 0461 AC3 and updated 0171/0426 tests check the shipping border and preservation of other borders."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The track uses five equal minmax(0, 1fr) columns and non-wrapping labels with ellipsis. Both 0461 AC4 tests passed, including a real browser at 320 px in both themes, checking geometry, truncation and contrast."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded targeted and related run completed with 187 passed, zero failed and three skipped. Existing test changes preserve their behavioural assertions while accounting for the inserted track and requested purple shipping border."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Open build tickets now show five coloured progress bars, with the current step highlighted and blocked or stopped work shown in crimson. Shipping borders are purple. The tests confirm the track fits at 320 px and remains readable in both themes. No blocking concerns found."
  }
}
```

</details>

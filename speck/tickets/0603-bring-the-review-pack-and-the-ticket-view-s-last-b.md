---
id: "0603"
title: "Retire the panel's last old-style parts"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0602"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:17:38.700Z"
approved: "2026-11-10T09:44:39.448Z"

---
# 0603 · Retire the panel's last old-style parts

**Status:** 👍 approved

## Problem
A few parts of a ticket still have the LCD-era look: the review pack opens with a small bordered Close button instead of a back link and marks its verdict and criteria with emoji, the full view's Chain is a bordered box with filled circles, and secondary buttons (Close, Full log, Stop build, More stats, Go to Plan) are small boxes with a faint border, unlike the redesign's buttons. The old colours (`--bezel`, `--log-*`, `--purple`) are still in the styles.

## Outcome
The review pack, the ticket's chain and the panel's secondary buttons are in the new look, and the old colours are gone.

## Acceptance criteria
1. The review pack opens with a back link to its ticket, as the other full views do, instead of the bordered Close button, and its verdict and each criterion's result are marked with the panel's own tick and cross in the accent and bad colours rather than emoji.
2. A ticket's chain in its full view is a plain section in the facts' style, naming the tickets it waits for and those waiting on it, with their state, without a bordered box or filled circles.
3. Every secondary button in the panel (such as Close, Full log, Stop build, More stats and Go to Plan) has the redesign's secondary style: a 1 px border in the line colour, 10 px corners, the text colour, and at least 44 px tall.
4. No style uses `--bezel`, `--bezel-ink`, `--bezel-muted`, `--log-bg`, `--log-text`, `--log-muted`, `--log-run`, `--log-bad`, `--log-warn` or `--purple` any more, and they're removed from `templates/panel-base.css`; the Shipped step's colour is the accent.
5. Tests that checked these old looks are changed to check the new ones, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The build logs (0602).
- The review pack's content.

## Notes
- Asked for 2026-11-10, with a phone screenshot of a shipped ticket's build log: "It's the old branding", and "I think it will happen elsewhere too."
- Checked on 2026-11-10 in a real browser at 390 px, after 0577 to 0597 shipped: the Pipeline log, Decided for you, the Settings view and the top of a ticket's full view are in the new look; the places below aren't.
- Today: the pack is `packPane` in `templates/panel-popups.js`; the chain is `depsBox`, `withDeps`, `depChip` in `templates/panel.js`; the purple Shipped step is in `templates/panel-cards.css` (`.track .step.done.ship`).
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the review pack's back link no longer clears what speck ship last said, as the old Close back to the full view didn't; the chain section's class is chain-facts, as `.chain` is already the chain icon's.

## In plain words
The review pack now opens with a back link to its ticket instead of a Close box, and marks the verdict and each criterion with the panel's own blue tick or orange cross (or the word Unclear) instead of emoji. A ticket's chain in its full view is now two plain lines, the tickets it waits for and those waiting on it, each with its state, instead of a box of circles. The panel's secondary buttons, such as Full ticket, Stop build, More stats, Go to Plan and the Close of Settings, are now the same larger rounded buttons with a thin grey border, and the Shipped step on a ticket's track is blue rather than purple.

To see it, open any shipped ticket's review pack, or the full view of a ticket that waits on another. Worth a look: on a computer with a mouse these buttons are now as tall as on a phone, so a card's buttons take up more room than before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The unsaved Settings dialogue still has old-style secondary buttons.; F2 AC5 requires the Delivery log to list the updated tests, but it currently contains only its placeholder.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 514,525
- Elapsed since build started: 27 min
- Changed lines: 140 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed from the old looks to the new ones (AC5):
  - `test/pack-0562.test.mjs`, `test/panel-0357.test.mjs`, `test/panel-0583.test.mjs`, `test/panel-0158.test.mjs`: leave the review pack by its back link, not its Close.
  - `test/panel-0132.test.mjs`: a criterion's result is the panel's tick or cross, not an emoji.
  - `test/panel-0041.test.mjs`, `test/panel-0463.test.mjs`, `test/panel-0467.test.mjs`, `test/panel-0468.test.mjs`: a chain in the full view is facts, not a box of circles.
  - `test/panel-0140.test.mjs`, `test/panel-0161.test.mjs`, `test/panel-0427.test.mjs`: the pack's back link and the document's Close in place of the pack's Close.
  - `test/panel-0428.test.mjs`, `test/panel-0453.test.mjs`: secondary buttons have 10 px corners.
  - `test/panel-0461.test.mjs`, `test/panel-0167.test.mjs`: the Shipped step is in the accent, not purple, so it's among the rules 0167 lets use `--accent`.
  - `test/panel-0426.test.mjs`, `test/panel-0480.test.mjs`: `--bezel` and its shades are gone.
- Follow-ups:
  - Inbox: `speck/ideas/2026-11-10-show-the-full-view-s-waits-on-as-facts-too.md` (the full view's Waits on box is still the old box).
  - Inbox: `speck/ideas/2026-11-10-give-the-panel-s-last-small-buttons-the-redesign-s-size.md` (Settings' Save buttons, the pack's file buttons and Ask for changes are still small).
  - Tidy-up: `test/pipeline-0479.test.mjs` still measures `var(--bezel)`, which no longer exists, so its check that the Pipeline log's top isn't on the frame colour now compares against a transparent colour.
  - Known limit: an open Plan card keeps its Chain box with circles; only the full view's chain changed, as AC2 names.

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
    "reviewed_sha": "838df9bd06d4b93a5cdb2af034f25eaccf3eb65b",
    "session": "fresh",
    "thread_id": "01a1c4d0-4ae8-77e2-a23e-f8cfa236cabc",
    "builder_response": "- Tests run (speck test --related): test/pack-0562.test.mjs test/panel-0041.test.mjs test/panel-0132.test.mjs test/panel-0140.test.mjs test/panel-0158.test.mjs test/panel-0161.test.mjs test/panel-0357.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0453.test.mjs test/panel-0461.test.mjs test/panel-0463.test.mjs test/panel-0467.test.mjs test/panel-0468.test.mjs test/panel-0480.test.mjs test/panel-0583.test.mjs test/panel-0603.test.mjs \n- Round 1. Notes for the reviewer:\n  - AC1: the pack's emoji are replaced in the panel only, on the Markdown's inline runs (packMarks in templates/panel-popups.js), since the pack's content is out of scope: ✅ is the tick, ❌ and ⛔ the cross, ⚠️ the word Unclear. The back link goes to the ticket's full view wherever the pack was opened from.\n  - AC2: only a chain (one before / after) in the full view becomes facts (chainFacts in templates/panel.js); Plan cards keep their box, as the ticket names the full view. The class is chain-facts because .chain is already the chain icon's.\n  - AC3: secondary buttons taken as .full-open (Full ticket, Full log, Go to Plan, More stats), Stop build, Back to Plan, Go with the recommendation, Answer/Dismiss, Copy, Reload page, and the Close of Settings and the document pop-up. Ship, Ask for changes, Set ready, the Pipeline log's filters and Settings' Save buttons are left as they are (primary or already redesigned). The 44 px height of Reload, the document's Close and Settings' Close is set in panel-cards.css, as 0417/0469 allow a 44 px size for every pointer only in the header's and cards' rules.\n  - AC4: --purple-text went too, as it was only the Shipped step's name colour.\n  - AC5: old tests changed to the new looks: pack-0562, panel-0041, 0132, 0140, 0158, 0161, 0357, 0426, 0427, 0428, 0453, 0461, 0463, 0467, 0468, 0480, 0583. They'll be listed in the Delivery log at close.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 201828,
      "cached_input_tokens": 145408,
      "cache_write_input_tokens": 0,
      "output_tokens": 964,
      "reasoning_output_tokens": 129
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56420,
      "cached": 145408,
      "write": 0,
      "output": 964
    },
    "cost_usd": 0.1370208,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T09:36:34.994Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "packPane, packMarks and backToTicket in templates/panel-popups.js implement navigation and drawn result marks. The reported passing panel-0603 tests exercise approval, rejection, criterion results and returning to the ticket."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chainFacts in templates/panel.js renders a facts section with ticket states and navigation. Passing panel-0603 AC2 tests cover its content, links and removal of circles and the box."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The secondary Discard and Keep editing buttons created by drawSettingsLeaving in templates/panel-settings.js retain the old #settings-unsaved button styling: muted text, inherited 8 px corners and no unconditional 44 px height."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-base.css removes the listed variables; panel-cards.css uses --accent for Shipped. Passing panel-0603 AC4 tests check variable removal and Shipped styling."
      },
      {
        "id": 5,
        "status": "unclear",
        "evidence": "The changed tests exercise the new appearance, and the reported run has 429 passes, zero failures and three skips. The current ticket's Delivery log remains an empty placeholder, so its required test list cannot yet be verified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.css",
        "issue": "The unsaved Settings dialogue still has old-style secondary buttons. Discard and Keep editing are omitted from the new test's hard-coded secondary-button list, allowing AC3 to pass despite this gap.",
        "suggested_fix": "Apply the required secondary style to these buttons and extend coverage to the unsaved Settings dialogue.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0603-bring-the-review-pack-and-the-ticket-view-s-last-b.md",
        "issue": "AC5 requires the Delivery log to list the updated tests, but it currently contains only its placeholder.",
        "suggested_fix": "Ensure the Delivery log records the updated test files before the next review, using the normal speck recording mechanism.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The review pack and ticket chain have the requested new appearance, and the reported tests pass. The unsaved Settings dialogue still contains old-style secondary buttons that the new tests overlook. The required test list is also missing from the Delivery log."
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
    "reviewed_sha": "fbc1bc7f2c8a7a06fc336d7468e96ddecd5d458b",
    "session": "continued",
    "thread_id": "01a1c4d0-4ae8-77e2-a23e-f8cfa236cabc",
    "builder_response": "- Tests run (speck test --files): test/pack-0562.test.mjs test/panel-0041.test.mjs test/panel-0132.test.mjs test/panel-0140.test.mjs test/panel-0158.test.mjs test/panel-0161.test.mjs test/panel-0357.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0453.test.mjs test/panel-0461.test.mjs test/panel-0463.test.mjs test/panel-0467.test.mjs test/panel-0468.test.mjs test/panel-0480.test.mjs test/panel-0583.test.mjs test/panel-0603.test.mjs  test/panel-0368.test.mjs test/panel-0372.test.mjs test/panel-0275.test.mjs test/panel-0472.test.mjs test/settings-0370.test.mjs test/settings-0412.test.mjs\n- F1: fixed. Discard and Keep editing in Settings' unsaved-changes question now have class secondary (templates/panel-settings.js) and the secondary style (#settings-unsaved button.secondary in templates/panel-settings.css, its 44 px height in panel-cards.css). The question's Save keeps its own look, as the primary choice. test/panel-0603.test.mjs AC3 now covers '#settings-unsaved button.secondary' and checks both buttons get the class; panel-0428 and panel-0453 expect their 10 px corners. Pictures retaken, with the question in both looks.\n- F2: fixed. The ticket's Delivery log now lists every test changed from the old looks, with what each now checks; speck close keeps it.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 325940,
      "cached_input_tokens": 262912,
      "cache_write_input_tokens": 0,
      "output_tokens": 1588,
      "reasoning_output_tokens": 129
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6608,
      "cached": 117504,
      "write": 0,
      "output": 624
    },
    "cost_usd": 0.0312064,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T09:38:42.349Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "packPane, packMarks and backToTicket in templates/panel-popups.js provide the back link and drawn result marks. Passing panel-0603 AC1 tests exercise navigation, verdicts, criterion results and colours."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chainFacts in templates/panel.js renders ticket names and states as facts. Passing panel-0603 AC2 tests cover content, navigation and removal of the bordered box and circles."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The secondary styles now also cover Discard and Keep editing through renderLeaving's secondary class, panel-settings.css and the unconditional 44 px minimum height in panel-cards.css. Updated panel-0603, panel-0428 and panel-0453 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The obsolete variables remain removed from panel-base.css; Shipped uses --accent in panel-cards.css. Both panel-0603 AC4 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log now lists the updated appearance tests and what changed. The verified test output reports 349 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.css",
        "issue": "The unsaved Settings dialogue's secondary buttons previously retained the old appearance.",
        "suggested_fix": "Completed: Discard and Keep editing now receive the secondary style, with updated test coverage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0603-bring-the-review-pack-and-the-ticket-view-s-last-b.md",
        "issue": "The Delivery log previously omitted the required list of updated tests.",
        "suggested_fix": "Completed: the Delivery log lists the changed tests and their new checks.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The review pack, ticket chain and secondary buttons now meet the requested design, including the unsaved Settings dialogue. Old colours are removed, the updated tests are documented, and the review test run has no failures. Both previous findings are resolved."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "34cb7183ebeb415db66af65aba46655ea20180f8",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c4d0-4ae8-77e2-a23e-f8cfa236cabc",
    "builder_response": "- Tests run (speck test --files): test/pack-0562.test.mjs test/panel-0041.test.mjs test/panel-0132.test.mjs test/panel-0140.test.mjs test/panel-0158.test.mjs test/panel-0161.test.mjs test/panel-0357.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0453.test.mjs test/panel-0461.test.mjs test/panel-0463.test.mjs test/panel-0467.test.mjs test/panel-0468.test.mjs test/panel-0480.test.mjs test/panel-0583.test.mjs test/panel-0603.test.mjs  test/panel-0368.test.mjs test/panel-0372.test.mjs test/panel-0275.test.mjs test/panel-0472.test.mjs test/settings-0370.test.mjs test/settings-0412.test.mjs test/panel-0167.test.mjs\n- Merge round: speck ship's tests failed on the ticket merged with main on one test, 0167 AC2: the speck red is used only for the speck itself.\n- Why: that test lists every rule that uses --accent, from when --accent was speck's red; its own comment says --accent is the panel's blue now. AC4 puts the Shipped step in the accent, so its two rules now use --accent. It failed because of this ticket's own change, not main's.\n- What I changed: merged main (no conflicts), and added the Shipped step's two rules to the list in test/panel-0167.test.mjs, so the test still catches any other use of --accent. No code changed. The Delivery log lists the test with the others changed.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 512322,
      "cached_input_tokens": 417664,
      "cache_write_input_tokens": 0,
      "output_tokens": 2203,
      "reasoning_output_tokens": 129
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 31630,
      "cached": 154752,
      "write": 0,
      "output": 615
    },
    "cost_usd": 0.0848852,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T09:44:37.325Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "packPane, packMarks and backToTicket in templates/panel-popups.js preserve the back link and drawn verdict and criterion marks. All panel-0603 AC1 tests pass after the merge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chainFacts in templates/panel.js preserves the plain facts section, ticket states and navigation. All panel-0603 AC2 tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Secondary button styles retain the required border, corners, text colour and minimum height, including Settings' Discard and Keep editing. Updated panel-0603, panel-0428 and panel-0453 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The obsolete colour variables remain removed and Shipped uses --accent. Both panel-0603 AC4 tests pass. panel-0167 now explicitly allows the two required Shipped rules while retaining its other checks."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the updated tests, including panel-0167. The current test output confirms 363 passes, zero failures and three skips. The additional test change directly follows AC4's required colour change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.css",
        "issue": "The unsaved Settings dialogue's secondary buttons previously retained the old appearance.",
        "suggested_fix": "Completed: both buttons retain the required secondary styling and test coverage after the merge.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0603-bring-the-review-pack-and-the-ticket-view-s-last-b.md",
        "issue": "The Delivery log previously omitted the required list of updated tests.",
        "suggested_fix": "Completed: the log lists the changed tests, including the additional colour test updated this round.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merged change preserves the approved redesign. The additional colour test update correctly accounts for the Shipped step's required blue accent, and the review test run has no failures. Both earlier findings remain resolved."
  }
}
```

</details>

---
id: "0156"
title: "Show a running build's progress with the speck"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0155"]                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T06:28:34.965Z"
approved: "2026-10-14T06:57:06.147Z"

---
# 0156 · Show a running build's progress with the speck

**Status:** 👍 approved

## Problem
A running build's progress is a thin five-part bar with small uppercase stage labels ("SELF-CHECK", "REVIEW 1") squeezed under it. On a phone the moving part is too small to notice, and the labels make the bar look cramped. The bar was designed for several builds running side by side; speck now builds one ticket at a time, so the running build can have more room.

## Outcome
Each in-flight ticket in the Build queue shows its progress as speck's ensō: the red speck circles it while an agent is at work and rests while the ticket waits for the user, with the stage written in plain words and a row of stage dots.

## Acceptance criteria
1. Each building, reviewing, blocked or approved ticket in the Build queue shows an open ensō circle (about 112 px across, the circle drawn in a thin neutral line, open at the top left) with the build's elapsed time inside it, beside the ticket's id and title. The five-part progress bar and its labels are no longer shown for these tickets, and ready tickets show no progress at all.
2. While an agent is at work on the ticket (building, reviewing or shipping, and not paused), a red speck dot travels round the ensō, one lap about every 7 seconds. While the ticket waits for the user (approved and not shipping, or blocked), the build is paused, or its build has stopped, the dot rests at the top and doesn't move.
3. Under the title, one plain sentence says what's happening: "Writing tests and code", "Checking its own work", "<reviewer> is reviewing · round <n>", "Approved · waiting for you to ship it", "Shipping", "Paused", "Blocked · it has a question for you" or "The build stopped". It is in the card's state colour when the ticket is waiting, blocked or stopped (purple, red, red), and in the normal text colour otherwise.
4. Under the sentence, five dots for Build, Self-check, Review, Approve and Ship, then the current stage's name: dots for finished stages are green, the current stage's dot is in the state colour with a soft halo, later stages' dots are grey. While an agent is at work, the current stage's dot pulses gently; otherwise it is still. With `prefers-reduced-motion: reduce`, neither the speck nor the dot moves.
5. It fits a 375 px wide screen without overflow and looks the same at desktop width, in light and dark mode, and no test that passed before this change fails, except checks of the old progress bar, which are changed to check AC1 to AC4.

## Out of scope
- The card's border and coloured left edge (0155).
- Knowing that a ship is in progress (0153); until it ships, "Shipping" shows only for a ship the panel itself started.
- Animating anything for ready tickets.

## Notes
- Chosen on 2026-10-13 from a mockup of three options (option A1).
- Failing before this build: none
- Old tests changed (AC5): the shared helpers `stagesOf`, `stepText`, `stepState` and `nowStep` now read the stage dots, whose titles are the old labels; 0034, 0045, 0055, 0069, 0053, 0138 and 0153's bar checks follow them (shapes lose `stages`, which is now in the top row). Beyond the bar itself: 0050 and 0058's selection from the title across the timer now crosses the sentence and stage name, which come before the timer; 0140 compares two page snapshots with reduced motion on, as the speck would otherwise move between them; 0154 taps the ready card's Queued line (it has no bar now) and brings the mouse onto it from off the card; 0155 checks an in-flight card's timer in the ensō at the right padding instead of at the end of the id's row, and lets its tags wrap beside the ensō, clear of it, as the column beside it is narrow at 700 px.
- Self-check: the timer is pinned to the ensō's 112 px box, so it stays inside the circle when a long title makes the card taller; a reviewer given as a non-string or blank falls back to "The reviewer".
- Stages come from `progress()` in `templates/panel.html`; the bar is `.stages`, and its moving dot is the `sweep` animation.
- The speck dot is the accent red (`--accent`), as in the ensō on the landing site; the circle itself stays neutral so the speck is the only red thing that moves.

## In plain words
Each ticket being built in the Build queue now shows a large open circle, an ensō, at the right of its card, with how long the build has run inside it. A small red dot travels round the circle while an agent is working on the ticket, and rests at the top when the ticket is waiting for you, paused, blocked or stopped. Under the title, a short sentence says what's happening (for example "Codex is reviewing · round 2" or "Approved · waiting for you to ship it"), and a row of five dots shows which stage it has reached. Ready tickets show none of this.

To see it, open the panel while a build is running, on your phone or computer, in light or dark mode. If your device asks for reduced motion, nothing moves.

Worth keeping an eye on: when the panel's Build column is narrow (around 700 px wide), long titles and tags get squeezed beside the circle. The round number shown during a review is the last one recorded, so it can lag one round behind while the next round runs.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 An approved ticket without a recorded build exit says it is waiting for shipment, but its sentence and current stage dot do not use the purple waiting colour.
Round 2 (codex): changes requested: F2 When the panel starts shipping an approved ticket whose build has exited, t.to_ship remains true.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,241,488
- Elapsed since build started: 29 min
- Changed lines: 95 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- To the inbox: speck/ideas/2026-10-14-give-a-running-build-room-in-a-narrow-build-column.md (titles and tags squeeze beside the ensō at about 700 px).
- To the inbox: speck/ideas/2026-10-14-say-which-review-round-is-running.md ("round <n>" is the last recorded round, so it lags while the next one runs).
- Known limit: a paused build's timer inside the ensō still reads "Paused · 01:05", as 0071 and 0145 check, though the sentence under the title says "Paused" too.
- Known limit: the ensō, speck and stage dots override the panel's square-corners rule, as they must be round.

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
    "reviewed_sha": "b20ff90244154f8f6b3a498c5a54724f488542d6",
    "thread_id": "01a1392c-926f-7cc2-8482-3c18605d9449",
    "seconds": 60,
    "usage": {
      "input_tokens": 249350,
      "cached_input_tokens": 194048,
      "cache_write_input_tokens": 0,
      "output_tokens": 963,
      "reasoning_output_tokens": 45
    },
    "saved_at": "2026-10-14T06:50:44.200Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html progressOf() replaces the bar with the ensō and timer. panel-0156 AC1 and browser layout tests cover in-flight and ready tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doing() controls movement; CSS uses a seven-second orbit. Tests cover working, paused, blocked, stopped, approved and panel-started shipping states, including reduced motion."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "doing() derives waiting colour only from t.to_ship, which requires a build exit. Direct fakePage verification of an approved ticket without build_exit produces class 'say', leaving its waiting sentence in normal text colour."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The same approved-ticket path produces 'dot now' and 'stage', making the current Ship dot blue instead of the required purple waiting colour. Other stage and reduced-motion behaviour is covered by panel-0156 tests."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Browser tests cover 375 px and desktop widths in light and dark themes. /tmp/speck-0156-tests.txt confirms 1453 passing tests, zero failures and three skips. Existing test changes correspond to the progress redesign."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "An approved ticket without a recorded build exit says it is waiting for shipment, but its sentence and current stage dot do not use the purple waiting colour. The tests check waiting colours only with build_exit present, missing this supported state.",
        "suggested_fix": "Derive the progress waiting colour from approved status when not shipping, while preserving existing red failure states and leaving the out-of-scope card border unchanged. Add coverage for an approved ticket without build_exit, checking both the sentence and current dot.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The ensō progress display works across phone and desktop layouts, and the reported suite passes. One waiting state needs fixing: approved tickets without a recorded build exit show the wrong progress colours."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "2c366caa1eef296f5ce0a87ac9c376480ba80847",
    "thread_id": "01a1392c-926f-7cc2-8482-3c18605d9449",
    "seconds": 40,
    "usage": {
      "input_tokens": 429199,
      "cached_input_tokens": 367360,
      "cache_write_input_tokens": 0,
      "output_tokens": 1899,
      "reasoning_output_tokens": 136
    },
    "saved_at": "2026-10-14T06:53:46.467Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "progressOf() renders the ensō and timer for in-flight tickets only. Passing panel-0156 AC1 and browser tests cover geometry and removal of the old bar."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doing() and motion CSS provide the seven-second orbit and resting states. Passing tests cover panel-started shipping, paused/stopped states and reduced motion."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Waiting colours are fixed, but doing(t, true) retains t.to_ship for an approved ticket with build_exit. Direct verification returns Shipping with tone 'to-ship', whereas shipping requires normal text colour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progressOf() renders five stage dots with completion colours, current-stage halo and conditional pulse. Passing AC4 and browser tests cover these and reduced motion; the new regression test covers approved tickets without build_exit."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing browser tests cover 375 px and desktop widths in both themes. The full test log confirms 1454 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Approved tickets without a recorded build exit previously lacked purple waiting progress colours. The updated doing() now supplies them, and the regression test exercises this state.",
        "suggested_fix": "No further change needed for this finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "When the panel starts shipping an approved ticket whose build has exited, t.to_ship remains true. doing() consequently renders 'Shipping' in purple instead of normal text colour. The new shipping test omits build_exit, so it misses this common path.",
        "suggested_fix": "Ensure the shipping branch uses normal text colour regardless of the previous waiting tone. Extend the panel-started shipping test to use an approved ticket with build_exit and assert the Shipping sentence's colour.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The original waiting-colour issue is fixed and the suite passes. One related case remains: starting shipment from a completed build leaves the Shipping sentence purple instead of returning it to normal text colour."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f6605b467baa5e4db0883d20920786f8f6a549d5",
    "thread_id": "01a1392c-926f-7cc2-8482-3c18605d9449",
    "seconds": 33,
    "usage": {
      "input_tokens": 557505,
      "cached_input_tokens": 490880,
      "cache_write_input_tokens": 0,
      "output_tokens": 2572,
      "reasoning_output_tokens": 136
    },
    "saved_at": "2026-10-14T06:56:40.377Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html progressOf() renders the ensō and elapsed timer only for in-flight tickets. Passing AC1 and browser tests verify its geometry and that ready tickets have no progress display."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doing() controls working and resting states; CSS provides a seven-second orbit. Passing tests cover panel-started shipping, paused, blocked, stopped and approved states, plus reduced motion."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "doing() now clears the tone before rendering Shipping and gives approved waiting tickets purple independently of build_exit. Passing sentence and regression tests cover both previously reported colour defects."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progressOf() renders five stage dots and the current name. Passing AC4 and browser tests verify completion colours, current-state colour, halo, conditional pulse and reduced motion."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing browser tests cover 375 px and desktop widths in light and dark modes without overflow. The full test log confirms 1454 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Approved tickets without build_exit previously lacked purple waiting progress colours. The fix and regression coverage remain in place.",
        "suggested_fix": "No further change needed.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Panel-started shipping previously retained purple from a completed build. doing() now returns the normal shipping tone immediately; the regression test starts shipping a ticket with build_exit and verifies the transition.",
        "suggested_fix": "No further change needed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The progress display meets all five criteria. Both colour defects are fixed and covered by regression tests. Phone and desktop checks pass in both themes, with no suite failures. Ready for the product owner to consider merging."
  }
}
```

</details>

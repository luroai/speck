---
id: "0204"
title: "Show when a ship merged but couldn't push"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-show-when-a-ship-merged-but-couldn-t-push.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0203"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:57:48.916Z"

---
# 0204 · Show when a ship merged but couldn't push

**Status:** 🔍 reviewing

## Problem
`speck ship` sets a ticket done before it pushes the base branch. If the push fails, the panel moves the ticket to Shipped as if all went well. Now that `speck run`'s queue ships with nobody watching, nobody learns that the remote is behind.

## Outcome
A ticket whose ship merged but couldn't push says so in the panel, with what to do, until the base branch has been pushed.

## Acceptance criteria
1. When a ship, started by anyone, merges a ticket but the push of the base branch fails, the panel shows that ticket in Shipped with "Merged, but not pushed" and `speck ship`'s message saying how to fix it.
2. The message stays until the base branch's commit with that ticket has reached the remote; then the ticket shows as plainly shipped.
3. `speck status --json` gives the same: each such ticket with the failed push's message.
4. A ship that pushes, or a repo with no remote, shows as it does today.
5. No test that passed before this change fails.

## Out of scope
- Retrying the push.
- Ships that refuse before merging.

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Decided 2026-10-15: it covers ships the user starts too, not only auto-ships.
- The push and its error are near the end of `scripts/ship.mjs`. The ship record (`takeShip`/`endShip`) keeps an auto-ship's failure message; the panel shows it only on an approved ticket, and this one is done.
- Builds after 0203: both change how the panel shows a ship's result in `templates/panel.html`.
- Failing before this build: none
- Self-check: an unreadable or odd "unpushed" part of a ship record now counts as pushed, and remote and branch names are checked before git sees them; narrowed the brief's claim to what the tests cover.

## In plain words
If a ship merges a ticket but can't send it up to the shared copy of the project (for example, because the main branch there is protected), the panel now shows the ticket under Shipped with a crimson "Merged, but not pushed" line and the message saying how to fix it. Before, it simply looked shipped. The line stays until the change has actually reached the shared copy; then the ticket looks like any other shipped one. Trying to ship it again in the meantime is refused, and the warning stays.

To see it, ship a ticket while pushing is blocked, look at Shipped, then push by hand and watch the line go.

Worth knowing: speck notices the push the next time it looks at what git last knows about the shared copy, so a push made from another computer only clears the line after this one fetches.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- speck run's ship queue still says an auto-ship that merged but couldn't push "didn't ship" and will be tried again: speck/ideas/2026-10-15-don-t-say-speck-run-will-retry-a-ship-that-merged.md.
- Tidy-up: a ship record whose commit has since been pushed stays in `speck/.cache/runs/`, costing two quick git calls per status read; it could be removed once seen pushed.

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
    "reviewed_sha": "8e2bbd236bbbfdb17a72f072b3f522f668e4aefb",
    "thread_id": "01a14017-2045-7d01-8069-66b85bebc41d",
    "seconds": 32,
    "usage": {
      "input_tokens": 147931,
      "cached_input_tokens": 103040,
      "cache_write_input_tokens": 0,
      "output_tokens": 810,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T15:04:11.092Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket/endShip preserve failed-push details; panelModel/render display them in Shipped, including older tickets. Manual, automatic and panel tests in test/ship-0204.test.mjs passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "notPushed checks commit ancestry and the push-clearing tests pass, but takeShip replaces the saved warning when another ship is attempted for that ticket, before checking whether it can ship."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs includes shipState in status JSON. Both manual and automatic failed-push tests exercise status --json and verify the message."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise successful pushes, repositories without remotes and ordinary panel cards."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0204-tests.txt reports 1935 passed, zero failed and three skipped; no existing tests were changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "Attempting `speck ship 1` again after its push failed erases the warning without pushing anything. takeShip replaces the ended unpushed record; shipTicket then refuses because the local ticket branch was deleted, and endShip removes the replacement record. The panel consequently shows plainly shipped while the remote is still behind. The tests do not cover this persistence case.",
        "suggested_fix": "Preserve the existing unpushed record across subsequent refused ship attempts, or refuse before replacing it. Add a regression test that fails a push, attempts to ship the same ticket again and verifies that status JSON and the panel retain the original warning until the commit is pushed.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The warning appears correctly after manual and automatic push failures, and clears after a successful push. However, trying to ship the same ticket again silently removes it while the remote is still behind. Fix that persistence gap before merging."
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
    "reviewed_sha": "0259cb93c7a92e5cb046a680a3982eee60811454",
    "thread_id": "01a14017-2045-7d01-8069-66b85bebc41d",
    "seconds": 19,
    "usage": {
      "input_tokens": 247558,
      "cached_input_tokens": 194816,
      "cache_write_input_tokens": 0,
      "output_tokens": 1344,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T15:10:26.055Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket/endShip retain failed-push details for manual and automatic ships. panelModel/render show the warning and recovery message in Shipped. Passing tests cover both ship paths, panel rendering and tickets older than the latest five."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipState/notPushed retain the warning until the recorded commit reaches the remote branch. takeShip now refuses repeated attempts before replacing the record. Passing tests cover persistence, repeated ship attempts, clearing after pushing and panel updates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "status JSON includes shipState. Passing manual and automatic ship tests verify the unpushed flag and original failure message."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing tests verify successful pushes, ships without remotes and panel cards without an unpushed warning."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0204-tests.txt: 1936 passed, zero failed and three skipped. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "A repeated ship attempt previously erased the failed-push warning before the commit reached the remote.",
        "suggested_fix": "Implemented: takeShip refuses before replacing an unpushed record. The new regression test verifies the original status message survives another attempt and clears after pushing.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Failed pushes now leave a visible warning and recovery instructions for both manual and automatic ships. The warning survives repeated ship attempts and clears after the commit is pushed. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>

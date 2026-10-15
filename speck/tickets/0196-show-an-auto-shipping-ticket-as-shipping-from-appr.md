---
id: "0196"
title: "Show an auto-shipping ticket as shipping from approval until it ships"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T12:18:36.741Z"

---
# 0196 · Show an auto-shipping ticket as shipping from approval until it ships

**Status:** 🔍 reviewing

## Problem
Since 0194 a build ends at approved, and `speck run`'s ship queue ships the ticket a few seconds later. In between, the panel says "Approved · waiting for you to ship it" and the builder badge stands still, although nothing is waiting for the user. Then, while the ship tests the ticket merged with the base branch, the panel shows the ticket as Queued until the ship ends. Seen on 0178 on 2026-10-15.

## Outcome
An approved ticket that `auto_ship` covers shows as on its way out from its approval until it has shipped, never as waiting for the user or queued.

## Acceptance criteria
1. An approved ticket that `auto_ship` covers, whose build has ended and whose ship hasn't started yet, shows "Approved · waiting to ship" in the normal text colour, not the purple of a ticket waiting for the user, and its builder badge moves as it does while shipping.
2. While a ship of a ticket is running, including while its tests run on the ticket merged with the base branch, `speck status --json` gives the ticket's status as `approved`, and the panel shows it as shipping. It never shows as Queued or `ready` in that time.
3. `speck run` never launches a build of a ticket while a ship of that ticket is running, including a `speck run` started during the ship.
4. An approved ticket that `auto_ship` doesn't cover, or whose last auto-ship didn't finish, shows as it does today.
5. No test that passed before this change fails.

## Out of scope
- The badge's shipping animation itself (0172).
- How the ship queue chooses or retries tickets (0193, 0194).

## Notes
- Asked for 2026-10-15.
- Cause of AC2: to test the merged result (0192), `speck ship` checks out the merged commit detached in the ticket's own worktree (`scripts/ship.mjs`, around line 108). `ticketsElsewhere()` in `scripts/core.mjs` finds a ticket's worktree by its branch, so it misses it, and the board falls back to the base branch's copy of the ticket, which says `ready`.
- Cause of AC1: `doing()` and `to_ship` in `templates/panel.html` were written when a build shipped its own ticket, so an approved ticket whose build had ended was waiting for the user.
- The ship record (`takeShip` in `scripts/ship.mjs`) says whether a ticket's ship is running.
- Failing before this build: none
- Changed test: `0167 AC2` expected an approved ticket auto-ship covers, whose build has ended, to wait for the user (to_ship true). AC1 makes that one wait to ship instead, so its expectation for that ticket is now to_ship false. It still passes.
- Self-check: no changes

## In plain words
Once an approved ticket that ships by itself has finished building, its card in the Build queue now says "Approved · waiting to ship" in the normal colour, with the builder badge at work. It no longer turns purple as if it were waiting for you. While it ships, including while its tests run, it shows as shipping all the way through, instead of jumping back to Queued, and Auto-build won't start building it again during that time. To see it, turn Auto-build on and watch a low-risk ticket get approved: its card goes from waiting to ship, to shipping, to the Shipped table. Tickets that need you to ship them, or whose automatic ship failed, look as they did before. One thing to keep an eye on: with Auto-build off, a ticket that ships by itself still says it's waiting to ship, though nothing will ship it until Auto-build is on again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - With `speck run` off, an approved ticket `auto_ship` covers still shows as waiting to ship, with its badge at work, though nothing will ship it. Inbox: `speck/ideas/2026-10-15-say-an-auto-ship-ticket-waits-for-speck-run-when-it-s-off.md`.
- Known limit: while the build that approved a ticket is still closing out, the card says "Approved · waiting to ship" but its badge stays still (as 0168 AC3 has it); it starts moving once the build has ended.

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
    "reviewed_sha": "21d18e1a93aa2b2319b35c401ff6cd6c21394b1b",
    "thread_id": "01a13f89-b217-7521-88dd-5a93ae78f523",
    "seconds": 31,
    "usage": {
      "input_tokens": 137759,
      "cached_input_tokens": 96384,
      "cache_write_input_tokens": 0,
      "output_tokens": 913,
      "reasoning_output_tokens": 95
    },
    "saved_at": "2026-10-15T12:29:42.211Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel(), doing(), badgeOf() and stageOf() give eligible tickets the waiting-to-ship text, normal colour and shipping badge motion. Passing panel-0196 AC1 tests exercise the rendered card."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/core.mjs: shipTestBranch() and ticketsElsewhere() recognise the detached merged-result checkout. Passing ship-0196 AC2 tests include running status --json during real ship tests; panel-0196 AC2 verifies the Shipping display."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/run.mjs: tick() skips ready tickets with ship.running true. Passing ship-0196 AC3 starts a runner during an active ship record, verifies no build starts, then verifies launch after the ship ends."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html retains the existing manual-ship and failed-auto-ship paths. Passing panel-0196 AC4 checks their text, colour, badge and action labels."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0196-tests.txt: 1,816 tests, 1,813 passed, three skipped, zero failures. The changed 0167 expectation reflects AC1 rather than weakening unrelated coverage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Auto-shipping tickets now show that they are waiting to ship, then remain visibly shipping during merged-result tests. The runner avoids rebuilding a ticket being shipped. Manual shipping and failed auto-ships retain their existing display. Tests pass, with no blocking concerns found."
  }
}
```

</details>

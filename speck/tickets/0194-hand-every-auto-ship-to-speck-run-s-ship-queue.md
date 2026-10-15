---
id: "0194"
title: "Hand every auto-ship to speck run's ship queue"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0193"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T10:10:54.829Z"

---
# 0194 · Hand every auto-ship to speck run's ship queue

**Status:** 🔨 building

## Problem
Each build still ships its own ticket, holding its build slot while it merges, tests and sorts out conflicts, and ships started by different builds aren't in one ordered queue. Moving every auto-ship to one queue in `speck run` is what lets builds and shipping run separately, and later side by side, without racing for `main`.

## Outcome
Builds end at approved, `speck run`'s ship queue (0193) does every auto-ship, and it hands a ticket back to its build session only when the ship needs work on the ticket.

## Acceptance criteria
1. `/speck-build` ends at approved: its skill no longer runs `speck ship`, and its report says the ticket now waits for `speck run`'s ship queue, or for `/speck-ship` when `auto_ship` doesn't cover it.
2. When a ship that `speck run` started is refused because the merge with the base branch conflicts (exit 13), or because the tests fail on the ticket merged with the base branch while the base branch's own tests pass, `speck run` resumes that ticket's build session with a message saying which and telling it to follow the build skill's steps for it. The build skill has steps for both: merge the base branch in, fix what's needed, get a merge round, and end at approved again, after which the queue ships it as in 0193. After two such hand-backs for one ticket without it shipping, the session blocks the ticket with a plain question instead, as the build skill does today after two merges.
3. When a ship that `speck run` started exits 14, `speck run` resumes that ticket's build session once with a message to follow the build skill's "Base branch failing" steps (find or create the fix ticket and set it ready), then holds as 0193 AC3 says. A ticket handed back this way stays approved.
4. A build session that `speck run` resumes for a hand-back counts towards `max_parallel_builds` while it runs, and its output goes to the ticket's build log as a resumed build's does.
5. `docs/brief.md` section 7 says that builds end at approved and one ship queue in `speck run` ships tickets one at a time, replacing "Each build ships its own ticket: there is no separate shipping agent". No test that passed before this change fails.

## Out of scope
- Running more than one build at a time: `max_parallel_builds` stays 1.
- Showing the queue in the panel.
- `/speck-ship` and the panel's Ship button: they still run `speck ship <id>` at once for the user's own ships.

## Notes
- Asked for 2026-10-15: "those two tickets are essentially creating a separate single shipping process which handles the shipping of all things in its own queue? This was an idea we discussed a few days ago but opted to go with a single WIP limit instead. If this is correct, then start those 2 tickets."
- `speck run` already resumes a killed build's session from `build_command` (`resumeArgv` in `scripts/run.mjs`); a hand-back can resume the same way with its own message.
- "Fail together" refusals have no exit code of their own today (`testFailure` in `scripts/ship.mjs`); the builder can give them one.
- Failing before this build: none
- "Fail together" refusals, and a ticket's own failing tests with the base branch passing, exit 16, but only with `--auto` (speck run's ship queue is its only caller). `/speck-ship` and the Ship button still exit 1, as the 0099 and 0192 tests pin.
- A hand-back waits in the build's run record (`hand_back`), so a restart of speck run still carries it out. It's dropped if the ticket's branch has moved since the ship, and the conflict and failing-test hand-backs are counted in the record (`hand_backs`), so the third tells the session to block.
- AC3's "once" is read as one hand-back for each exit-14 refusal; the queue then holds, so the ticket isn't tried again until the base branch has a new commit.
- Earlier tests that pinned the build running `speck ship <id> --auto` and handling its exit codes, or the brief's "Each build ships its own ticket", now check the new behaviour instead, as AC1, AC2 and AC5 replace it: `brief-0111` AC3, `build-0116` AC1, AC3 and AC4 (a ship queue is described again), `close` 0021 AC5, `followups-0036` AC4, `ship-0048` AC4 and `ship` "auto-ship: …". Nothing they check otherwise was loosened.
- Self-check: run.mjs went over the 600-line limit for scripts, so the hand-back code moved to its own module.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

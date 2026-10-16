---
id: "0247"
title: "Switch speck run to its new code once it's idle"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16

---
# 0247 · Switch speck run to its new code once it's idle

**Status:** 📋 ready

## Problem
`speck run` keeps running the code it started with. When a ticket that changes `speck run` ships, the change isn't live until someone turns `speck run` off and on, and nothing says so. On 2026-10-16 one `speck run` had been on since the evening before, so parts of seven shipped tickets (0216 to 0220, 0235 and 0245) weren't running.

## Outcome
`speck run` switches to its new code by itself, once no build or ship it's watching is running.

## Acceptance criteria
1. While `speck run` is on, a change to the content of any `.mjs` file in the scripts folder it was started from makes it switch to the new code: once no build or ship it started or adopted is running, a `speck run` on the new code takes its place. A file saved again with the same content doesn't make it switch.
2. From the change until it switches, it starts no new build or ship, and says once in its output that it will switch to the new code when its running builds and ships have ended, naming them. Builds and ships already running carry on, and the new `speck run` carries on from where the old one left off, as a `speck run` started by hand does today.
3. There's never a moment when two `speck run`s are on or neither is: `speck run` stays on in the panel's Auto-build switch throughout, and its output carries on in the same place (the terminal it was started from, or the panel's `run.log`). Started from a terminal, Ctrl-C still stops it after a switch.
4. If the new code can't start, the old `speck run` carries on as before on its own code, says so once with the reason, and tries again at the next change.
5. The brief's description of `speck run` says it switches to new code once it's idle. No test that passed before this change fails.

## Out of scope
- Switching while builds or ships are running.
- `speck panel`, which already switches (0018), and the commands `speck run` starts, which load their code each time.
- Picking up a changed `speck/config.yml`.

## Notes
- The panel's way of noticing a change is `codeStamp()` and `codeHash()` over `panelCode()` in `scripts/panel.mjs`; its handover keeps the process you start waiting until the last server has gone (`cmdPanel`).
- `speck run` is `runOn()` in `scripts/run.mjs`. A `speck run` that starts adopts builds an earlier one launched (`adoptEarlierBuilds()`), and its lock is `takeRunLock()`. The ship queue is `scripts/ship-queue.mjs`; hand-backs wait in the run record, so a new `speck run` carries them out (0194).
- `scripts/run.mjs` is close to the 600-line limit for scripts, which a test checks.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

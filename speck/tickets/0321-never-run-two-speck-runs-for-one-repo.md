---
id: "0321"
title: "Never run two speck runs for one repo"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:33:51.917Z"

---
# 0321 · Never run two speck runs for one repo

**Status:** 🔨 building

## Problem
`speck run` keeps a lock so only one runs per repo, yet on 2026-10-18 two ran in this repo for about eight hours. One was the speck run started on 2026-10-16 (process 434685), which had switched to new code and was working through a worker process (2456375) it started. The other (1571492) was started at 14:54 from the Settings view's switch and held `run.lock`. Both launched builds and ships, saw each other's builds as "outside speck run", and took turns writing the Foreman's status, so the header changed every two or three seconds. Two speck runs can start the same build or ship twice.

## Outcome
Only one speck run is ever working in a repo, however it was started and whether or not it has switched to new code.

## Acceptance criteria
1. While a speck run is working in a repo, before or after a switch to new code, starting another one there, from a terminal or the Settings view's switch, is refused with a message naming the one that's running, and nothing else is started.
2. Turning speck run off from the Settings view stops the whole speck run, including any worker it switched to, and the switch shows it off only once all of it has stopped.
3. A speck run that finds it no longer holds the repo's lock, or that the lock names another live speck run, stops launching builds and ships at once, says so once in `run.log`, and exits, leaving its running builds and any ship to carry on.
4. Only the speck run holding the lock writes the Foreman's status.
5. Builds and ships that are running when a speck run stops carry on, and the speck run that remains picks them up, as 0300 and 0301 made it.

## Out of scope
- More than one repo: each repo has its own speck run.

## Notes
- The lock is `run.lock` in `speck/.cache/runs/` (`takeRunLock` and `holdRunLock` in `scripts/run.mjs`). The switch to new code (0247, 0301) is in `scripts/run-switch.mjs`: the process you start hosts a worker on the new code. The Settings view's switch starts speck run with `panelRunOn` in `scripts/panel.mjs`.
- Seen 2026-10-18: `run.lock` named 1571492 while 434685 and its worker 2456375 kept working, and the Foreman's record (`run.foreman.json`) alternated between `"lock": 434685` and `"lock": 1571492`. Stopping 434685 with SIGINT ended it cleanly, leaving its four builds and one ship running.
- How the second one got the lock is not known yet; finding out is part of the build.
- Failing before this build: none
- How the second one got the lock, as far as the evidence shows: `run.log` has 434685 starting from the Settings view's switch, and 1571492 starting at 14:54 without a refusal, about a minute after the ship of 0298 ended (14:52:53), with no line between saying 434685 had stopped. So by 14:54 `run.lock` was gone or named a process that had gone: the panel showed the switch off and the new one took the lock. The only code that removes `run.lock` is the exit handler (only when it names its own pid) and the take-over of a stale lock (only when the process it names has gone), so nothing in speck removes it while its holder is alive. It was most likely removed from outside that code, for example by hand or by an agent following the "delete run.lock" advice. The exact cause can't be found from what's left, so the build makes the outcome hold whatever removed it: the speck run holding the lock checks it on each check and stops once it no longer holds it, and one starting also counts the live speck run the Foreman's record names (`scripts/run-lock.mjs`).
- Self-check: a process whose folder can't be read, or isn't this repo, no longer counts as this repo's speck run, so a pid reused by a speck run in another repo never gets a start refused. Added a test.
- Pictures: none needed. The Settings switch looks the same; only when it shows off changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

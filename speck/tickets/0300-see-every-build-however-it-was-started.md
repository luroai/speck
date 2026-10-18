---
id: "0300"
title: "See every build, however it was started"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0287"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:44:56.380Z"

---
# 0300 · See every build, however it was started

**Status:** 🔨 building

## Problem
speck run looks for builds it didn't start only when it starts up or switches to new code. A build started afterwards with `/speck-build` in a conversation, or a build resumed by hand, isn't counted towards `max_parallel_builds`, isn't watched for stopping partway, and can show in the panel as stopped while it's running, because its run record says it exited. Seen on 2026-10-18 with 0290 and 0291, resumed by hand.

## Outcome
speck run sees every build of the repo's tickets, however it was started, and counts, shows and watches each one as it does its own.

## Acceptance criteria
1. A ticket whose build was started with `/speck-build` while speck run is running is counted towards `max_parallel_builds` within one of speck run's checks, and speck run doesn't start a build of it.
2. A build resumed outside speck run, for a ticket whose run record says its build exited, shows in the panel as building, not stopped, within one of speck run's checks.
3. When such a build's process ends with its ticket still building or reviewing, speck run treats it as it does a build of its own that stopped partway.
4. A build's process is found from the build itself: the speck commands every build runs (`speck start`, and the commands it runs as it works) record which process they're running in, so nothing has to be done by hand.
5. Builds speck run starts itself are counted, shown and watched exactly as today.

## Out of scope
- Starting a build from the panel.

## Notes
- Today the adoption is `adoptEarlierBuilds` in `scripts/run.mjs`, run only at start. Run records are `speck/.cache/runs/<id>.json`.
- The Foreman (0286, 0287) relies on seeing every build.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

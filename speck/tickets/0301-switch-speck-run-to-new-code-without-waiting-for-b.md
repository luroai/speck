---
id: "0301"
title: "Switch speck run to new code without waiting for builds to end"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0300"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:59:17.014Z"

---
# 0301 · Switch speck run to new code without waiting for builds to end

**Status:** 🔨 building

## Problem
When a shipped ticket changes speck's own code, speck run starts no new build or ship until every build it's running has ended, so it can switch to the new code. A ticket that's approved and ready to ship can wait a whole build for that. On 2026-10-18 it held up shipping most of the day: 0294 waited for 0300's build, and 0268 and 0269 waited for 0265's.

## Outcome
speck run switches to new code as soon as no ship is running, without waiting for builds, and carries on watching the builds that were running.

## Acceptance criteria
1. When speck run's code changes, it switches to the new code once any ship it's running has ended, whether or not builds are running. It doesn't wait for builds.
2. After the switch, every build that was running is counted towards `max_parallel_builds`, shown as building in the panel, and watched as speck run's own builds are, until it ends.
3. When such a build ends, speck run handles it as it would have before the switch: a ticket left approved goes to the ship queue, and a ticket left building or reviewing is treated as a build that stopped partway.
4. While it waits for a ship to end, speck run starts no new ship, and says so once, naming the ship. New builds may start meanwhile.
5. Nothing that's running is stopped or started again by the switch.

## Out of scope
- Seeing builds speck run didn't start: 0300.

## Notes
- The switch is in `scripts/run-switch.mjs` (0247), and builds are picked up after it by `adoptEarlierBuilds` in `scripts/run.mjs`, which 0300 makes run on every check.
- Failing before this build: none
- Self-check: added a test that a build ending while new code fails to start is handled once the switch has failed; narrowed the brief to say a carried build's end is handled as for any build speck run watches but didn't start, since its exit code can't be known after the switch.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0319"
title: "Stop calling speck run's own builds outside speck run"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:35:05.298Z"

---
# 0319 · Stop calling speck run's own builds outside speck run

**Status:** 🔨 building

## Problem
Since 0300, `speck run` says a build it has just launched itself is "being built outside speck run". On 2026-10-18 it said so of 0302, 0305 and 0309 a moment after launching each. The build is counted once and runs normally, but the message is wrong, and it makes the log and the Foreman's detail misleading.

## Outcome
`speck run` says a build is outside speck run only when it didn't start it.

## Acceptance criteria
1. A build `speck run` launches is reported as launched once, and never as being built outside speck run, for as long as it runs.
2. A build `speck run` resumes (a hand-back, a stopped build, or a recommendation taken) is reported as resumed, and never as outside speck run.
3. A build started with `/speck-build` in a conversation, or resumed by hand, is still reported once as being built outside speck run, as 0300 made it.
4. Builds that carry on through a switch to new code are reported as 0301 made them.

## Out of scope
- Anything else 0300 does.

## Notes
- The message is written where `scripts/run.mjs` adopts builds (search for "being built outside speck run").
- Failing before this build: none
- Cause found: on 2026-10-18 two speck runs were watching this repo at once (processes 434685, running since 16 Oct, and 1571492, holding the lock since 14:54), both logging to the same run.log. Each launch by one was found a check later by the other, which took it for a build outside speck run. A single speck run never mislabels its own builds (0300 AC5's test). The fix labels a found build by its record: only records marked `seen`, which only noteBuild and claimResumed write, are outside speck run; any other is "already being built". How two speck runs got past the lock is a separate follow-up.
- Self-check: no changes. Unusual records (no `seen`, `seen` not true) read as another speck run's build; carried builds (0301) and the start-up adoption are untouched.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

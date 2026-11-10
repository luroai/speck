---
id: "0619"
title: "Let a build stop only the panels it started"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-stop-builds-killing-panels-they-didnt-start.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10

---
# 0619 · Let a build stop only the panels it started

**Status:** 📋 ready

## Problem
On 2026-11-09, while clearing up after a screenshot script that hung, 0583's build stopped every speck panel on the machine. The user's speck panel restarted itself, but their Alpha panel didn't, and the project menu disappeared. The same evening 0565's build left a demo panel running in the user's project menu after it ended. Builds should touch only the panels they start.

## Outcome
A build's panels stay out of your project menu, and a build only ever stops the panels it started.

## Acceptance criteria
1. The build skill's step on pictures says to start a panel with `speck panel --port <a free port> --background` and stop it with `speck panel --stop --port <that port>`, and never to stop processes by name or pattern, such as with `pkill` or `killall`.
2. A panel started from inside a build that `speck run` launched keeps its record out of the user's project menu, as the tests' panels do with `SPECK_PANELS_DIR`.
3. When a build ends, `speck run` stops any panel that build started and left running, and no other.
4. A panel the user started, from the command line or as a service, is never stopped by a build's clean-up.
5. No test that passed before this change fails.

## Out of scope
- Panels started by hand outside builds.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: both a rule in the skill and speck enforcing what it can.
- `speck run` gives each build `SPECK_BUILD_SESSION` (`scripts/build-env.mjs`); panels record themselves in `~/.config/speck/panels/` (`registerPanel` in `scripts/panel-projects.mjs`). The skill's step is section 2's step 6, "Pictures of a visual change", in `skills/speck-build/SKILL.md`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

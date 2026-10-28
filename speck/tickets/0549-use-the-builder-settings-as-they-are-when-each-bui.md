---
id: "0549"
title: "Use the builder settings as they are when each build starts"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:44:54.157Z"

---
# 0549 · Use the builder settings as they are when each build starts

**Status:** 🔨 building

## Problem
`speck run` reads the settings once, when it starts, and builds every launch command from that reading. A change made while it's on, in the panel's Settings view or with `speck config set`, doesn't reach the builds it starts until it's restarted. The user lowered `builder_effort` from `high` to `medium`, and later builds still ran at `high`, which cost real money. Nothing said the change hadn't taken effect.

## Outcome
Every build `speck run` starts or resumes uses the builder settings as they are at that moment, so a change applies to the next build without restarting `speck run`.

## Acceptance criteria
1. With `speck run` on, after `builder_effort` or `builder_model` is changed (in the Settings view or with `speck config set`, for the project or for this machine only), the next build `speck run` starts runs with the new value, without restarting `speck run`. Setting it blank starts the next build without it.
2. The same holds for every build it resumes or starts again: a stopped build it resumes, a ticket handed back to its build, a build carried on with a recommendation (Go with the recommendation, or speck's watch), and a build speck's watch agent starts again. Each uses the settings as they are when it starts.
3. Changes to `builder`, `build_command` and `resume_command` also apply from the next build without a restart. If the changed settings can't start a build (such as no build command for the builder, or a quote not closed), `speck run` keeps running, says why in its log once, starts no build until they can, and starts builds again once they're fixed.
4. A change to `max_parallel_builds` applies from `speck run`'s next check: it starts builds up to the new limit and, when lowered, starts no more until fewer are running, without stopping any build already running.
5. A build already running carries on with the settings it started with. No test that passed before this change fails.

## Out of scope
- Changing the settings of a build that's already running.
- The reviewer's settings: each review round reads them when it starts.
- Telling the user in the Settings view when a change applies.

## Notes
- Reported by the user 2026-10-27: "I set the builder effort to medium from high but high remained because I hadn't restarted speck run. This cost me real money." They asked for it to be set ready and included in the 0.21.0 release (0539).
- Checked 2026-10-27: `runOn` in `scripts/run.mjs` calls `loadConfig(repo)` once and builds `words` (with `withBuilderModel`, which adds `--model` and `--effort`, 0279 and 0402) and `max` (`maxParallelBuilds`) from it; `handBackQueue`, `goWithQueue` and `foremanAgentQueue` are given that `cfg` and `words`. Codex builds take the effort from `codexStartWords` (`scripts/codex-build.mjs`). Machine settings are applied by `loadConfig` (`applyMachineConfig`).
- The sleep queue and the watch fixes already read the settings each time (`readConfig: () => loadConfig(repo)`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

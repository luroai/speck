---
id: "0622"
title: "Carry a build on by itself once Claude's usage limit resets"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
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
created: 2026-11-10
started: "2026-11-10T22:59:55.125Z"

---
# 0622 · Carry a build on by itself once Claude's usage limit resets

**Status:** 🔨 building

## Problem
When Claude's usage limit is reached, a build stops partway and stays stopped until someone notices: on 2026-11-10 one waited five hours after the limit had reset. The watcher makes it worse, as it looks into the stop on the same agent, hits the same limit and gives up. Yet Claude's own log says when the limit resets.

## Outcome
When a build stops on Claude's usage limit, speck waits until the limit resets, then carries the build on and starts new work again, by itself, and tells you.

## Acceptance criteria
1. When a build's log shows Claude refused it for a usage limit (a `rate_limit_event` whose status is `rejected`), `speck run` records that the limit was reached and when it resets, from that event's `resetsAt`, and says once in its log, for example "Claude's usage limit is reached until 12:30 UTC, so I'll carry on then."
2. Until then, `speck run` starts no build, and no watch agent, on Claude, and doesn't look into a build that stopped on the limit; the bar's status reads "Waiting: usage limit until 12:30".
3. From a minute after the reset time, `speck run` resumes each build that stopped on the limit, once, in its own session, telling it the limit has reset and to carry on from where it stopped, and starts launching ready tickets again. A build that hits the limit again is waited out the same way.
4. When the log shows the limit was reached but gives no reset time, `speck run` tries again after 30 minutes, and every 30 minutes after, until a build gets past it.
5. A build that stops for any other reason is handled as today, and no test that passed before this change fails.

## Out of scope
- A reviewer's usage limit (0623).
- Switching to another agent while one is limited.
- Codex and Cursor builders' limits.

## Notes
- Asked for 2026-11-10: "when the usage comes back into play, I would really like it if the builds just started them by themselves again … I've just wasted half a day there of not moving forwards because a usage limit was hit."
- Seen on 2026-11-10: 0616's build reached Claude's five-hour limit at 11:57 UTC and exited with code 1; the watcher then looked into it on Claude, hit the same limit and took no action; nothing restarted it until it was resumed by hand at 17:03. The limit had reset at 12:30. The build's stream-json log held `{"type":"rate_limit_event","rate_limit_info":{"status":"rejected","resetsAt":1794313800,"rateLimitType":"five_hour",…}}`, after an earlier one with `"status":"allowed_warning"` at 90%, and its result said "resets 12:30pm (UTC)".
- Today: `speck run` handles a build's end in `finished`/`endOf` in `scripts/run.mjs` and starts the watch agent from `lookInto`; a build is resumed in its own session with `resumeFor` in `scripts/hand-back.mjs`, as `resumeKilled` does; the status words' reasons are `SHORT` in `scripts/foreman.mjs`.
- Checked 2026-11-10: Claude Code's stream-json output includes `rate_limit_event` lines with `status` (`allowed`, `allowed_warning`, `rejected`) and `resetsAt` as Unix seconds (this repo's own build logs).
- Relies on Claude Code's stream-json `rate_limit_event`, as above.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

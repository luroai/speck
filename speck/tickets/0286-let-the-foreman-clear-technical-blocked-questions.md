---
id: "0286"
title: "Let the Foreman clear technical blocked questions"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0284"]               # ticket ids that must be done first
created: 2026-10-18

---
# 0286 · Let the Foreman clear technical blocked questions

**Status:** 📋 ready

## Problem
A build that blocks on a technical question waits for the user, though the user has always taken the build's recommendation. The work stops until they notice.

## Outcome
With the Foreman's Fixing setting on, speck run takes the recommendation for a blocked question that doesn't change anything the user would notice and has a clear winner, and starts the build again, without waiting for the user.

## Acceptance criteria
1. A new setting, `foreman_fixing`, takes `off`, `tell` or `fix`, `tell` by default. It's in the config template with a comment, `speck config set` accepts it, and the Settings view's Foreman group offers it with an explanation.
2. With `fix`, when a ticket blocks with a question that doesn't change what the user would notice and has a clear recommendation (0283), speck run resumes the build with the recommended option on its next check, as the panel's button (0284) does, and records in the ticket's Notes that the Foreman chose it.
3. A question that changes what the user would notice, is a close call, or has any of the three unknown, is left for the user, whatever the setting.
4. The Foreman takes a ticket's recommendation at most once per ticket. If the same ticket blocks again, it's left for the user.
5. With `tell` or `off`, blocked tickets wait for the user, as today. With `tell`, the Foreman's status counts them under Needs you.

## Out of scope
- Anything other than blocked questions: 0287.

## Notes
- Never: set a ticket ready, approve work, or ship beyond what `auto_ship` covers.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

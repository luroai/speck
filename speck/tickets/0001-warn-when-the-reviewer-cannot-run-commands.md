---
id: "0001"
title: "Warn when the reviewer cannot run commands"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | done
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08

---

## Problem
On machines where the Codex sandbox can't start (for example, AppArmor blocking bubblewrap on Ubuntu), the reviewer silently reviews only the diff it's given and can't inspect the repo. Users don't know their review is weaker.

## Outcome
speck detects a reviewer that couldn't run commands and says so in the round output and the review pack.

## Acceptance criteria
1. `speck review` prints a warning when the Codex event stream shows a failed command caused by the sandbox (for example, an error containing "bwrap").
2. The round record stores `sandbox_ok: false` in `meta` when that happens.
3. The review pack shows "⚠️ Reviewer could not inspect the repo; reviewed the diff only" for any such round.

## Out of scope
- Fixing the host sandbox itself

## Notes

## Blocked question

## Review log

## Delivery log

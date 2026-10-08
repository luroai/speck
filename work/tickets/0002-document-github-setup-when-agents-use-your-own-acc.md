---
id: "0002"
title: "Document GitHub setup when agents use your own account"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | done
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. work/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08

---

## Problem
GitHub doesn't let a user approve their own PR. If the builder opens PRs with the owner's own gh login, a 'require 1 approval' rule can't be met, so the documented branch protection doesn't work as written.

## Outcome
`speck init` and the README explain the two supported setups and which one to choose.

## Acceptance criteria
1. `speck init` output explains both options: (a) the owner's own account, requiring the `speck/review` check with merge as the human gate; (b) a bot account for the agent, requiring the check plus one approval.
2. The README has a "GitHub setup" section with the exact branch-protection settings for each option.

## Out of scope
- Automating branch protection through the GitHub API

## Notes

## Blocked question

## Review log

## Delivery log

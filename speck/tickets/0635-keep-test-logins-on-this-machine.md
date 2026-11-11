---
id: "0635"
title: "Keep test logins on this machine"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-virgil-checks-the-work-in-the-running-app.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0633","0634"]                # ticket ids that must be done first
created: 2026-11-11

---
# 0635 · Keep test logins on this machine

**Status:** 📋 ready

## Problem
Checking a change in an app often means signing in, and the logins for that must never end up in a ticket, a review round or a commit, which are often published.

## Outcome
Test logins for a project are kept on this machine only, where speck's agents can read them, and speck refuses to commit one.

## Acceptance criteria
1. `speck logins set <name>` asks for a username and a password, reading the password without showing it (or both piped in), never from the command line, which it refuses, and saves them in `speck/.cache/machine/logins.json` in the main checkout, which git ignores and only you can read or write.
2. `speck logins` lists each saved login's name and username, never its password; `speck logins show <name>` prints its username and password; `speck logins remove <name>` deletes it. Each names the logins it knows when given one it doesn't.
3. Each saved password counts as a private word: the pre-commit hook and `speck ship` refuse a commit or ship that adds one under `speck/`, as they do the words in `~/.config/speck/private-words`, naming the file and line without the password.
4. A review round speck saves has each saved password replaced by `[private]`.
5. With no logins saved, `speck logins` says so in one line, and nothing else changes.

## Out of scope
- Using the logins: 0636.
- Encrypting the file: it's protected as API keys are, by its permissions.

## Notes
- Decided 2026-11-11: logins live on this machine, as API keys do (`scripts/keys.mjs`, 0389).
- Private-word checks are in `scripts/private-words.mjs` and `scripts/commit-check.mjs`; 0633 adds them to saved rounds.
- Risk high: it handles secrets.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

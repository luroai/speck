---
id: "0121"
title: Refuse a ticket that contains one of your private words                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-stop-tests-depending-on-files-under-speck.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T12:18:35.680Z"

---
# 0121 · Refuse a ticket that contains one of your private words

**Status:** 🔨 building

## Problem
Tickets are committed and often published, so a ticket can leak words you'd rather keep out of the repo, such as your real name or an old alias. Today only one of speck's own tests checks for them (0084), by scanning the whole repo. Since 0112 reuses test results whenever nothing outside `speck/` has changed, that test can miss a word added in a new ticket.

## Outcome
`speck lint` refuses a ticket that contains one of your private words, so a ticket holding one can't be set ready.

## Acceptance criteria
1. `speck lint <id>` reads private words from `~/.config/speck/private-words` (the current user's home folder, as the operating system reports it): one word per line, ignoring blank lines and lines starting with `#`.
2. When the ticket's text contains one of those words (ignoring case, matched literally), lint prints a `✗` naming the line number but not the word, and exits non-zero, so `speck set <id> status ready` refuses the ticket.
3. When the file is missing, lint checks nothing for it and prints nothing about it. When the file exists but can't be read, lint prints a `!` warning saying so and how to fix it, and the rest of lint works as before.
4. A ticket that contains none of the words gets no such error.
5. The README or the brief says how to list your private words.

## Out of scope
- Checking idea notes, code or any file other than the ticket.
- Changing speck's own tests (0122).

## Notes
- Same file and format as 0084's check (`test/support/private-words.mjs`), so the words you already list there work.
- Lint already warns about your home folder's path in a ticket (0083). That stays a warning; this is an error, because the words are ones you've chosen to keep private.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

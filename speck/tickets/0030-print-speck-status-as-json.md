---
id: "0030"
title: "Print speck status as JSON"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0030 · Print speck status as JSON

**Status:** 📋 ready

## Problem
The control panel (0031) needs everything `speck status` knows in a form a program can read. Today `speck status` only prints text for people, so any tool would have to scrape it.

## Outcome
`speck status --json` prints every ticket and idea, with the details the panel shows, as one JSON object.

## Acceptance criteria
1. `speck status --json` prints a single JSON object `{"tickets": [...], "ideas": [...]}` to stdout, with nothing else on stdout, and exits 0. With no tickets it prints `"tickets": []`, and with no `speck/ideas/` folder it prints `"ideas": []`. `speck status` without `--json` prints exactly what it does today.
2. `tickets` holds the same tickets as the text output, each once, read from the same place: a ticket being built in another worktree comes from that worktree's copy, as in 0029. Each entry has every frontmatter field under its own name, plus `path` (the ticket file's path relative to the folder it was read from), `worktree` (that worktree's absolute path, or `null` if read from the current checkout), `acceptance_criteria` (an array of each criterion's text without its number), `blocked_question` (the section's text, or `null` when it has no content besides the comment), and `lint` (`{"errors": <count>, "warnings": <count>}` from the same checks as `speck lint`).
3. Each ticket entry has `rounds`: an array with one object per recorded review round, in order, with `round`, `reviewer`, `verdict`, `seconds` (or `null` if not recorded) and `tokens` (input plus output tokens from the round's usage, or `0` when there's no usage). A ticket with no rounds has `[]`.
4. Each ticket entry has `waiting_on`: the ids in its `after:` list that aren't a ticket with status `done`, including ids with no ticket at all, in the order listed. `tickets` is sorted by `priority` (lowest number first, no priority last), then by id.
5. `ideas` has one entry per `.md` file in `speck/ideas/`, sorted by file name, with `path` (relative to the repo root), `title` (the text of its first `# ` heading, or the file name if there isn't one) and `status` (its `Status:` value, or `null` if it has none).

## Out of scope
- The panel itself (0031).
- Ordering fields beyond `priority` (an `order` field comes with reordering, later).
- JSON output for any other command.

## Notes
- Field names in the criteria are the contract 0031 builds on. Don't rename them.
- Priority 1: the panel waits on this.
- No external facts: everything comes from files speck already reads.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

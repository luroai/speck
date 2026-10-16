---
id: "0256"
title: "Start each README section with a plain sentence"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0251"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T13:53:00.173Z"

---
# 0256 · Start each README section with a plain sentence

**Status:** 🔨 building

## Problem
The README's sections open with slogans or straight into detail, so a reader skimming it, the maintainer included, can't tell what each section is for without reading all of it.

## Outcome
Every section of the README starts with one plain sentence saying what it tells you or what you do with it.

## Acceptance criteria
1. Each `##` section of the README starts with one plain sentence saying what the section tells you or what you do with it, before any list, table, code block or subheading.
2. Before the first review round, the builder runs the `/no-ai-slop` skill in detect mode on the new and changed text, then fixes each pattern it names or keeps it with a reason. The ticket's Notes list each pattern found, the line and what was done, and a second detect pass names no pattern left unaddressed.
3. No fact the README gives today is dropped, and no test that passed before this change fails, apart from tests that check wording this ticket deliberately changes, which check the new wording instead.

## Out of scope
- The tagline (0255) and the opening above the image (0251).
- Reordering, merging or removing sections.
- The landing page, `docs/brief.md` and the skills' wording.

## Notes
- Split from 0251 on 2026-10-16. Plain over clever: short sentences that state the obvious. British English.
- `/no-ai-slop` is installed globally for Claude Code (`~/.claude/skills/no-ai-slop/`); see how 0250's Notes recorded its passes.
- About 26 test files read `README.md` (for example `readme-0089`, `wording-0125`, `release-0092`, `private-words-0084`): keep what they check unless the change is deliberate.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

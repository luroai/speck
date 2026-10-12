---
id: "0131"
title: "Print a plain-English review pack"                # one outcome, no "and"
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
after: ["0129", "0130"]              # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:09:23.084Z"

---
# 0131 · Print a plain-English review pack

**Status:** 🔨 building

## Problem
`speck pack <id>` is written for someone who reads code: evidence quoting files and tests, finding ids, session and token figures. A non-technical user deciding whether to ship needs to know what changed, whether it does what they asked, and whether anything needs a closer look.

## Outcome
`speck pack <id> --plain` prints a short review pack in plain English, that someone who doesn't read code can read before shipping.

## Acceptance criteria
1. `speck pack <id> --plain` prints, in this order: the ticket's id and title; one sentence saying whether the reviewer approved it ("The reviewer approved this change." or "The reviewer hasn't approved this change yet."); the ticket's Outcome; its `## In plain words` section; and each acceptance criterion as worded in the ticket, marked ✅ passed, ❌ failed or ⚠️ unclear from the latest review round.
2. Apart from text quoted from the ticket, the plain pack shows no file paths, finding ids, token counts, model names or session details.
3. When the ticket is `risk: high`, or the change touches files matching speck's sensitive file patterns, the plain pack says so in one sentence suggesting a closer look before shipping. Otherwise it says nothing about risk.
4. When the ticket's `## In plain words` section is missing or empty, the plain pack says "The builder didn't write this change up in plain words." where that section would be.
5. `speck pack <id>` without `--plain` prints exactly what it printed before this change.

## Out of scope
- Showing the plain pack in the panel.
- Changing the full review pack.
- Writing the `## In plain words` section: that's 0130.

## Notes
- Builds on 0130 (the section) and 0129 (the correct sensitive-files list).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

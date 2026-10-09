---
id: "0074"
title: "Keep a title with an apostrophe from swallowing its comment"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0074 · Keep a title with an apostrophe from swallowing its comment

**Status:** 📋 ready

## Problem
`speck set <id> title "…"` writes the title without quotes when it has no `:` or `#`. A title with an odd number of apostrophes, such as "Pause a running build until it's played", then reads back with the template's trailing comment (`# one outcome, no "and"`) on the end, in the ticket's heading, `speck status`, the panel and everywhere else the title shows. It happened on 0070 and had to be fixed by hand.

## Outcome
Every value `speck set` writes reads back exactly as given, whatever quotes it contains.

## Acceptance criteria
1. After `speck set <id> title "<t>"` on a ticket made from the template (with its trailing comment kept), the title in `speck status --json`, `speck status` and the ticket's `# <id> · <title>` heading is exactly `<t>`, for each of: `It's fine`, `A 'quoted' word`, `Say "hi" now`, `Ends with a quote'`, `Tom's and Ann's` and `plain title`.
2. The same holds for any other text field `speck set` writes, such as `source`, with the same values.
3. The trailing comment stays on the frontmatter line after the value, as today.
4. `speck lint` passes for each ticket in criterion 1 (apart from any warning about the title's wording).

## Out of scope
- Hand-edited frontmatter values with unbalanced quotes: this is only about what `speck set` writes.

## Notes
- Reproduced 2026-10-09 in a fresh `speck init` repo: `It's fine` read back as `It's fine                # one outcome, no "and"`; `A 'quoted' word`, `Say "hi" now` and `plain title` read back correctly.
- Cause: `setField` in `scripts/speck.mjs` quotes a value only when it contains `:` or `#` or is blank, and `stripComment` treats a lone `'` as opening a quoted string, so the `#` of the comment after it is never found.
- 0008 fixed the same kind of problem for `cancel_reason` by always writing it with `JSON.stringify`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

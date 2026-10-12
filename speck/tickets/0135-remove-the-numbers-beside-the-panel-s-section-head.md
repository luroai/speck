---
id: "0135"
title: "Remove the numbers beside the panel's section headings"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-12
started: "2026-10-12T18:53:30.432Z"

---
# 0135 · Remove the numbers beside the panel's section headings

**Status:** 👍 approved

## Problem
0134 put a decorative number (1, 2 and 3) beside the panel's Plan, Build and Shipped headings, copied from the zen mockup. The user doesn't want them: they add clutter without telling you anything.

## Outcome
The Plan, Build and Shipped headings show their names only, with no number beside them. Everything else about the panel looks and works as before.

## Acceptance criteria
1. In a browser, the `h2` is the first visible thing in each of the Plan, Build and Shipped section headers (`.sh`): nothing, number or otherwise, is shown before or beside it apart from what the header showed before 0134 (its live count and its hint).
2. Each section's `h2` heading text is still exactly `Plan`, `Build` or `Shipped`.
3. The page's static HTML has no `<span class="num">` element inside a `.sh` header, and the stylesheet has no rule left for it (`.sh .num`). The `td.num` rule used by the Shipped table is unchanged.
4. Nothing the panel does changes: this ticket's diff changes nothing between `<script>` and `</script>` in `templates/panel.html`, and changes no file in `scripts/`.
5. No test that passed before this change fails, except 0134's checks that the numbers are there (`test/panel-0134.test.mjs` AC3, and the parts of its AC4 and browser test that expect them), which are changed to check that the numbers are gone.

## Out of scope
- Any other part of 0134's zen look: colours, fonts, borders and spacing stay as they are.
- Dark mode: that's 0136.

## Notes
- Undoes 0134 AC3 only. The rest of 0134 stays.
- The section number spans and the `.sh .num` rule are both in `templates/panel.html`. The Shipped table's `td.num` cells are a different thing (right-aligned figures) and stay.
- AC4 is checked by the reviewer against this ticket's diff.
- Failing before this build: none
- AC4 has no automated test: the reviewer checks it against this ticket's diff (`git diff main -- templates/panel.html scripts/`), which should touch only the `.sh .num` CSS rule and the three header lines.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 86,615
- Elapsed since build started: 3 min
- Changed lines: 7 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d8f373337bf042949b5670a3a598349c84b18986",
    "thread_id": "01a13178-735e-7432-820d-d836de93f847",
    "seconds": 25,
    "usage": {
      "input_tokens": 86019,
      "cached_input_tokens": 51840,
      "cache_write_input_tokens": 0,
      "output_tokens": 596,
      "reasoning_output_tokens": 26
    },
    "saved_at": "2026-10-12T18:56:04.439Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0135.test.mjs AC1-AC2 passed in a real browser. It checks heading order, preceding text, header children, generated content and element positions."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0135.test.mjs AC2 and browser AC1-AC2 passed, checking the exact text Plan, Build and Shipped."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/panel-0135.test.mjs AC3 passed. The actual templates/panel.html diff removes all three number spans and .sh .num; td.num is unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed git diff main -- templates/panel.html scripts/: only the number CSS rule and three header lines change. No script content or scripts/ files change, as required by the ticket's manual review check."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0135-tests.txt: 1142 passed, zero failed, three skipped. Both relevant browser tests ran and passed. Changes to test/panel-0134.test.mjs replace only the permitted number expectations and retain its other checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The decorative numbers are removed from Plan, Build and Shipped. Browser tests confirm the headings come first and retain their exact names. Panel behaviour and the Shipped table styling are unchanged. The suite has no failures, and there are no blocking concerns."
  }
}
```

</details>

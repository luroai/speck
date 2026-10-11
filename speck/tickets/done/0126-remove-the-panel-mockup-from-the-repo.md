---
id: "0126"
title: "Remove the panel mockup from the repo"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T15:13:26.394Z"
finished: "2026-10-11T15:17:09.303Z"

---
# 0126 · Remove the panel mockup from the repo

**Status:** ✅ done

## Problem
`docs/panel-mockup.html` was a design reference for the control panel (0031). The real panel in `templates/panel.html` has replaced it, but the mockup is still in the public repo, and two tests read it, so it can't simply be deleted.

## Outcome
The mockup is no longer in the repo. The tests still check that the panel uses the agreed colours, without reading the mockup.

## Acceptance criteria
1. `docs/panel-mockup.html` does not exist on disk and `git ls-files docs/panel-mockup.html` prints nothing.
2. The 0031 AC3 test in `test/panel.test.mjs` checks the panel page against this exact colour block, written in the test, instead of reading it from the mockup: `--bg: #1c1d20; --panel: #232428; --raise: #2a2b30; --line: #36383e; --line-soft: #2e3035; --text: #d6d8dd; --muted: #8a8e97; --faint: #5f636c; --accent: #7aa7f0; --ok: #62b77a; --warn: #e3a04f; --bad: #e0675d; --run: #5fa8e0; --idea: #b291e6`. The test fails if any of these values is missing from the page or changed.
3. The 0082 AC5 test in `test/luro-0082.test.mjs` no longer checks the mockup for `luroai/speck`. It now checks that the mockup is gone, in the same way as AC1 of this ticket.
4. No test that passed before this change fails.

## Out of scope
- The local mockups in `mockups/`. They are already ignored by git and stay on the user's machine.
- Changing the panel's look or colours.
- Editing finished tickets in `speck/tickets/done/` or idea notes that mention the mockup. They are history.

## Notes
- The colour values in AC2 are copied from the `:root` block of `docs/panel-mockup.html` as it is today, so the panel's palette stays locked to the agreed design.
- Failing before this build: none
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 102,753
- Elapsed since build started: 3 min
- Changed lines: 223 (limit 5000)
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
    "reviewed_sha": "ff7000d3dce488941f72fae6ea08cd8032cbfba5",
    "thread_id": "01a12b88-9fae-7ad2-958e-edab5ae4c05d",
    "seconds": 25,
    "usage": {
      "input_tokens": 102157,
      "cached_input_tokens": 61184,
      "cache_write_input_tokens": 0,
      "output_tokens": 596,
      "reasoning_output_tokens": 36
    },
    "saved_at": "2026-10-11T15:16:01.448Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Confirmed docs/panel-mockup.html is absent on disk and git ls-files prints nothing. The 0126 AC1 test exercises both checks and passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "0031 AC3 in test/panel.test.mjs calls paletteProblems on the actual panel page. test/support/panel.mjs contains all 14 exact agreed colours and compares each declaration. Passing 0126 tests verify the palette and rejection of changed or missing values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0082 AC5 in test/luro-0082.test.mjs now checks both filesystem absence and empty git ls-files output. The full test log confirms it passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Inspected /tmp/speck-0126-tests.txt: 1124 tests, 1121 passed, 3 skipped, zero failures or cancellations. The diff contains no unrelated test fixes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The obsolete mockup is removed. Tests now check the panel’s agreed colours directly and verify that the mockup stays absent. The panel itself is unchanged, and the full suite reports no failures. Ready for merge."
  }
}
```

</details>

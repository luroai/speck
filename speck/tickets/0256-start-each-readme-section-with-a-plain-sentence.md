---
id: "0256"
title: "Start each README section with a plain sentence"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-16T13:55:50.471Z"

---
# 0256 · Start each README section with a plain sentence

**Status:** 👍 approved

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
- Failing before this build: none
- Sections that already opened with a plain sentence keep it: Get started, Using another reviewer, Built with speck and Design. Every other section gets a new first sentence, and its old opening stays below it, apart from two that were not facts: "Things you won't have to do." (Clever bits) and "MIT." (Licence), each replaced by a sentence that says the same. Without an agent's opening ended in a colon before the code, so it now starts with a sentence of its own.
- No-ai-slop detect, first pass: on the README's new and changed lines (41, 79, 90, 108, 132, 144, 156, 168, 188, 231, 260), checked by hand against the skill's patterns.
  - L90 "speck does these jobs for you, so you won't have to.": fails the portability test, it fits any product. Rewritten to name the jobs' range: "from raising its own fix tickets to keeping the receipts".
  - L144 "…ship them with a click.": overclaims, the Ship button asks first. Changed to "ship them from there".
  - L43 "If you can write a good ticket, you can ship.": possible kicker. Kept: the landing page's subtitle, as 0250 kept it, now after the plain sentence.
  - L134 "Most AI coding tools sell speed or autonomy.": possible weasel attribution. Kept: existing text, out of this ticket's scope, and 0250's tests keep it.
  - L108, L188 "These sections…", "These tables…": repeated sentence shape. Kept: two sections far apart, and each goes on to name different things.
- No-ai-slop detect, second pass: no pattern left unaddressed. The new lines are plain statements with no banned words, em dashes, colon reveals or kickers, and the patterns kept are listed above with their reasons.
- Self-check: no changes. Checked each new sentence against the section below it (the panel's Ship button, the Requirements list, the Under the hood subsections) and the MIT licence's terms.

## In plain words
Each section of the README now opens with one plain sentence saying what it covers or what you do with it, so you can skim the page and know where to stop. Nothing the README said before has gone: the old openings sit just below the new ones, except two short fragments that the new sentences replace. To see it, open the README and read the first line under each heading. Keep an eye on new sections added later: they should open the same way, and a test now checks that they do.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 138,748
- Elapsed since build started: 3 min
- Changed lines: 24 (limit 5000)
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
    "reviewed_sha": "c88ba2b1dfa0c1f4edb0530d0dcc407272f517bd",
    "thread_id": "01a144fe-fce1-7c53-906a-01314907e57c",
    "seconds": 20,
    "usage": {
      "input_tokens": 138221,
      "cached_input_tokens": 94080,
      "cache_write_input_tokens": 0,
      "output_tokens": 527,
      "reasoning_output_tokens": 40
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T13:55:44.269Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Reviewed every README.md ## section: each starts with a plain sentence describing its purpose or action before structured content. All three AC1 tests in test/readme-0256.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Ticket Notes record two manual detect passes against the no-ai-slop skill, with line references, fixes and reasons for retained patterns. The AC2 test verifies the recorded passes and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The README.md diff preserves existing facts, section order and excluded text. The AC3 preservation test passed; /tmp/speck-0256-tests.txt confirms 305 tests passed with no failures. No existing tests were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Every README section now opens with a plain sentence that helps readers understand its purpose. Existing information is preserved, the editorial checks are recorded, and all 305 tests run passed. No blocking concerns found."
  }
}
```

</details>

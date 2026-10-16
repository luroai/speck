---
id: "0255"
title: "Replace speck's tagline with one that says what's different"                # one outcome, no "and"
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
created: 2026-10-16
started: "2026-10-16T13:40:42.823Z"
approved: "2026-10-16T13:42:33.365Z"
finished: "2026-10-16T13:44:25.505Z"

---
# 0255 · Replace speck's tagline with one that says what's different

**Status:** ✅ done

## Problem
speck's tagline, "Your judgement, at agent speed.", only makes sense once you know there are agents doing the work and that you keep two decisions. Someone with no context, such as a reader of the README or a hiring team, can't tell what speck is or why it's different from a plain coding agent.

## Outcome
speck's tagline says what's different about it, the same way everywhere in this repo: the README, `speck help` and `package.json`.

## Acceptance criteria
1. Under the `# speck` heading, the README opens with the tagline **Ship code you can't read, and still trust it.** followed by this plain line: "speck turns ideas from a conversation into tickets, then builds, tests, reviews and ships them the same way every time, so you can set them going, walk away and trust what you come back to." The old tagline "Your judgement, at agent speed." no longer appears in the README.
2. The first line of `speck help`, the comment at the top of `scripts/speck.mjs` and the `description` in `package.json` use the new tagline in place of "Your judgement, at agent speed.", which none of them contains any more.
3. No test that passed before this change fails, apart from tests that check the old tagline, which check the new one instead.

## Out of scope
- The rest of the README's opening (0251) and its sections' first sentences (0256).
- The landing page (speck-site repo), which still has the old tagline.

## Notes
- Split from 0251 on 2026-10-16. Tagline and plain line chosen by the maintainer on 2026-10-16: use them word for word. The tagline's point is what a plain agent session doesn't give you: a second AI checks every change against agreed criteria, the same way every time, so a non-coder can trust work they can't read.
- About 26 test files read `README.md` (for example `readme-0089`, `wording-0125`, `release-0092`, `private-words-0084`): keep what they check unless the change is deliberate.
- Failing before this build: none
- Self-check: no changes. Ran the 39 test files that read the README, package.json or speck help as well as the ticket's own: all pass.

## In plain words
speck has a new tagline: "Ship code you can't read, and still trust it." The README now opens with it, followed by one plain sentence saying what speck does, and the same tagline appears in the help text and the package description. Open the README or run speck's help to see it. The landing page still has the old tagline until it's updated in its own repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 86,996
- Elapsed since build started: 2 min
- Changed lines: 10 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. The landing page (speck-site repo) still has the old tagline, as the ticket puts out of scope.

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
    "reviewed_sha": "8c8dc9a7a6761d13f2c542b46aa7c9b6e63cd09a",
    "thread_id": "01a144f2-cb74-7bf1-8942-aa2accf71ebd",
    "seconds": 20,
    "usage": {
      "input_tokens": 86477,
      "cached_input_tokens": 51456,
      "cache_write_input_tokens": 0,
      "output_tokens": 519,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T13:42:25.010Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md opens with the exact requested tagline and plain line. test/tagline-0255.test.mjs AC1 checks both verbatim and the old tagline's absence; recorded test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs top comment and HELP, and package.json description contain the new tagline. The AC2 test checks all three and absence of the old wording; recorded test passed. Independently running speck help confirmed its first line."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "/tmp/speck-0255-tests.txt confirms all 14 tests passed across the ticket's tests and both changed existing test files. Existing assertions are preserved, with expectations updated only for the requested wording and inserted plain line. The diff contains no unrelated behaviour changes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The exact new tagline appears in the README, command help and package description, with the requested explanatory line added to the README. Existing content and test coverage are preserved. All 14 recorded tests passed; no blocking concerns found."
  }
}
```

</details>

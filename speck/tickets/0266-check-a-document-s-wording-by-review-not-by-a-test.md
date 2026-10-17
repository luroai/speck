---
id: "0266"
title: "Check a document's wording by review, not by a test"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-17
started: "2026-10-17T08:35:03.733Z"

---
# 0266 · Check a document's wording by review, not by a test

**Status:** 🔍 reviewing

## Problem
speck's build skill writes at least one test for every acceptance criterion, so a criterion about a document's wording ("the README opens with the tagline, then the plain line") becomes a test that pins the exact sentence and where it sits. The next edit to that document, by hand or by a later ticket, fails the suite and holds up every ship, as a README edit made on GitHub did on 2026-10-17. Once speck takes on tasks that aren't code, such as document edits, every one would leave tests like these behind.

## Outcome
A criterion about how a document reads is checked by the reviewer reading the document, not by a test. Tests about documents check only facts that can go wrong.

## Acceptance criteria
1. The ticket skill (`skills/speck-ticket/SKILL.md`) says that a criterion about a document's wording, tone, order or layout ends with `(checked by review)`. A criterion about a fact in a document keeps no marker and is tested: a command, a setting's name, a version, a file name, a link, or a name that mustn't appear. A document here is any file written for people to read, such as the README, `docs/` and the changelog.
2. The build skill (`skills/speck-build/SKILL.md`) says that the builder writes no test for a criterion marked `(checked by review)`, and never adds a test that checks a document's exact wording, or the order of its sentences, paragraphs or headings. Its self-check asks for a test only for the facts in the docs it changed, not for every sentence it added.
3. The reviewer prompt (`templates/reviewer-prompt.md`) says that the reviewer judges a criterion marked `(checked by review)` by reading the document as it is now, and cites the passage as its evidence. A missing test is no finding for it. A test the change adds that checks a document's exact wording or order is a blocking finding.
4. `docs/brief.md` describes the rule in one place: which document criteria are checked by review, and which facts in documents are tested.

## Out of scope
- Removing the tests that already pin documents' wording: 0267.
- Tests that check the wording of the skills or the reviewer prompt. Those files are instructions to agents, not documents for people, and stay as they are.

## Notes
- This ticket's own criteria are about the wording of skills and docs. Check them by review. Don't add tests that pin the new wording, which would be the very thing this ticket rules out.
- Seen on 2026-10-17: a README edit on GitHub failed 0249 AC1, 0250 AC1, 0251 AC1–AC3 and AC5, and 0255 AC1 on main, and needed fix ticket 0262.
- Failing before this build: none
- No new tests: every criterion is about the wording of a skill, the reviewer prompt or the brief, so each is checked by review, as this ticket's first note says. A reviewer checks AC1 in `skills/speck-ticket/SKILL.md` step 4 (Acceptance criteria), AC2 in `skills/speck-build/SKILL.md` section 2 step 1 and the self-check's Claims line, AC3 in `templates/reviewer-prompt.md` points 1 and 2, and AC4 under "Criteria about documents" in `docs/brief.md`'s Ticket size rules. The existing test files that read these four files were run and pass.
- Self-check: no changes

## In plain words
When a ticket asks for a document to read a certain way, such as the README's opening lines, speck no longer turns that into a test that pins the exact sentence. The ticket marks that kind of criterion "(checked by review)", and the reviewer checks it by reading the document. Facts in documents, such as a command, a setting's name, a version or a link, are still tested. So editing the README or the docs by hand no longer fails the tests and holds up every ship.

To see it, make a ticket about a document's wording: its criterion should end with "(checked by review)", and its build should add no test for it.

Worth watching: the tests that already pin documents' wording are still there until ticket 0267 removes them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only): the brief's size-rules table still says each criterion is "testable", and the ticket skill still says each criterion "will become a test", each now with the exception written next to it. A later wording pass could fold the exception into those lines. Removing the existing tests that pin documents' wording is ticket 0267. No inbox notes.

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
    "reviewed_sha": "f7b1de91da4bb01f1981769c10695da0ba1aa7e3",
    "thread_id": "01a14901-262b-7473-85a3-83cb3e60a780",
    "seconds": 16,
    "usage": {
      "input_tokens": 90678,
      "cached_input_tokens": 54272,
      "cache_write_input_tokens": 0,
      "output_tokens": 556,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T08:36:30.139Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md:21 requires '(checked by review)' for wording, tone, order and layout, leaves factual criteria unmarked and tested, and defines documents with the requested examples."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md:25 says 'write no test for it' for marked criteria and prohibits tests of exact wording or sentence, paragraph and heading order. The Claims self-check at line 38 requires tests for facts rather than every sentence."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/reviewer-prompt.md:9 requires reading the current document, citing its passage and accepting the absence of a test for marked criteria. Point 2 makes newly added wording or order tests blocking findings and permits factual checks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md:79 contains one 'Criteria about documents' passage explaining both review-based checks and tested facts, including the distinction between documents and agent instructions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The guidance now directs builders and reviewers to check document wording by reading it, while keeping tests for factual details. All four criteria are met. No tests were added or weakened, and the recorded run shows 448 existing tests passing. The changes stay within scope."
  }
}
```

</details>

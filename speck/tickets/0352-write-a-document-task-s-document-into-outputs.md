---
id: "0352"
title: "Write a document task's document into outputs"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0351"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:08:13.414Z"

---
# 0352 · Write a document task's document into outputs

**Status:** 🔍 reviewing

## Problem
A build of a document task would write tests and code. And a document written in the build's worktree would be lost, because `outputs/` isn't in git, so nothing from it is ever merged.

## Outcome
A build of a document task writes the document, from the sources the ticket names, into the ticket's folder in the main checkout's `outputs/`.

## Acceptance criteria
1. `speck output <id>` prints the absolute path of `outputs/<output>/` in the main checkout, making the folders if they're missing, whether it's run from the main checkout or from one of its worktrees.
2. `speck output <id>` refuses, printing why and making nothing, for a code ticket or a document task whose `output` fails `speck lint`.
3. `/speck-build` tells the builder that for a document task it skips "Tests first", writes the document into the folder `speck output <id>` prints, and runs the review loop as usual. (checked by review)
4. `/speck-build` tells the builder that in a document task it only makes new files in that folder or changes files the ticket names, and never deletes or overwrites any other file there. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- What the reviewer is told to check (0353).
- Showing or linking the document (0354).
- Shipping a document task (0355).

## Notes
- Agreed with the user 2026-10-21: document tasks run through `/speck-build`, not a skill of their own, since everything but steps 2 and 3 is the same. The ticket, its review and its run record still go on its branch as usual.
- Nothing in `outputs/` is in git, so there's no undo. That's why criterion 4 matters.
- `scripts/speck.mjs` (the command and its help line), `.claude/skills/speck-build/SKILL.md` sections 2 and 3.
- Failing before this build: none
- Self-check: no changes (tried a file where the folder goes, an unknown id, no id, `.`-style and Windows paths through lint, and running from a worktree). `cmdDiffstat` moved to `scripts/diffstat.mjs` so `scripts/speck.mjs` stays under the 600-line rule.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
A ticket that writes a document, rather than code, now has a home for it: speck can say exactly which folder inside the project's outputs folder the document goes in, and makes that folder if it isn't there yet. It always points at the outputs folder in your own copy of the project, even when the build runs in a separate working copy, so the document doesn't get lost. It won't give a folder for an ordinary code ticket, or for a document ticket whose folder setting is wrong. The build instructions now tell the agent to skip writing tests for such a ticket, write the document there, and never delete or overwrite files already in that folder other than the ones the ticket names. To see it, ask speck for a document ticket's output folder and check the folder appears. Worth knowing: the reviewer isn't yet told what to check in a document, and documents can't be shipped yet; later tickets cover both.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Tidy-up: `scripts/speck.mjs` is close to the 600-line rule again; `cmdDiffstat` was moved out to make room for this command.
- No inbox notes: what the reviewer checks, showing the document and shipping it are already tickets 0353, 0354 and 0355.

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
    "reviewed_sha": "a14d483cf7707e784571bcfe0ed1b2217067b2ee",
    "thread_id": "01a15df2-26f0-7ef2-92cf-295a66ef2739",
    "seconds": 29,
    "usage": {
      "input_tokens": 146533,
      "cached_input_tokens": 100736,
      "cache_write_input_tokens": 0,
      "output_tokens": 777,
      "reasoning_output_tokens": 38
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:12:21.723Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/output.mjs outputFolder resolves the main checkout through worktreeList and creates the output directory recursively. Passing AC1 tests exercise the CLI from both the main checkout and a worktree, checking the absolute path and created folders."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "outputFolder rejects code tickets and uses lint.mjs outputProblem before making directories. Passing AC2 tests check invalid and missing outputs, explanatory errors and unchanged folder contents from both checkouts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 2 explicitly tells document-task builders to skip Tests first, write from the named sources into the folder printed by speck output, and run the usual review loop."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The document-task paragraph in skills/speck-build/SKILL.md section 2 permits new files and changes to ticket-named files, and explicitly prohibits deleting, moving or overwriting any other file there."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded test output reports 145 passed, 3 skipped and no failures. The new tests exercise real CLI behaviour without weakening existing tests; cmdDiffstat was moved unchanged. The whole-suite check remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Document tasks now get a folder in the main checkout, including when built from a worktree. Invalid requests are refused before folders are created. The build instructions explain how to write the document and protect existing files. The targeted checks passed, and I found no blocking issues."
  }
}
```

</details>

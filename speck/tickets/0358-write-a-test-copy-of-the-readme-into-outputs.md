---
id: "0358"
title: "Write a test copy of the README into outputs"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: document               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-21
output: tests
started: "2026-10-21T14:24:07.849Z"
approved: "2026-10-21T14:24:59.025Z"

---
# 0358 · Write a test copy of the README into outputs

**Status:** 👍 approved

## Problem
The document task (0350 to 0357) has shipped, but only its own tests have checked it. No real document ticket has gone through `speck run` yet: build, review, the review pack's link, and waiting to be shipped by hand.

## Outcome
A copy of the README sits in `outputs/tests/`, written and reviewed as a document task, and the ticket waits approved for the user.

## Acceptance criteria
1. `outputs/tests/README.md` in the main checkout has exactly the same text as the project's `README.md` as it is on the base branch when the build starts.
2. The build writes no other file in `outputs/tests/`, and the ticket's branch changes no file outside `speck/`.
3. The project's own `README.md` is unchanged.

## Out of scope
- Any change to the README's wording: this is a copy.
- Fixing anything the run turns up: capture it as a follow-up instead.

## Notes
- A trial run of the document task, asked for by the user 2026-10-21, to test on the Linux box before writing real documents.
- Document tasks never auto-ship (0355), so this one should stop at approved. Then try the review pack's link (0354), `speck changes` or "Ask for changes" (0356, 0357), and `speck ship` (0355).
- Failing before this build: not checked

## In plain words
This was a trial run of a document ticket, with nothing changed in speck itself. There is now an exact copy of the project's README in the `tests` folder under outputs, and the reviewer checked it word for word against the original. To see it, open the ticket's review pack and follow its link to the document. Since document tickets never ship on their own, this one waits for you: try asking for changes, or ship it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 83,768
- Elapsed since build started: 1 min
- Changed lines: 0 (limit 5000)
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
    "reviewed_sha": "2107f7b3a014899da4b02ca0cda0dd778c367d19",
    "thread_id": "01a15ed9-6435-71c3-9c54-7214cb52a355",
    "seconds": 25,
    "usage": {
      "input_tokens": 83152,
      "cached_input_tokens": 58368,
      "cache_write_input_tokens": 0,
      "output_tokens": 616,
      "reasoning_output_tokens": 0
    },
    "saved_at": "2026-10-21T14:24:52.698Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Read /home/pandabast/projects/speck/outputs/tests/README.md, beginning '# speck' and ending 'See [LICENSE](LICENSE).'. Its full 32,143 bytes exactly match README.md at build base commit 92dd17bbe5bfed3320f22e0a680db4ffcdfed492."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The outputs/tests/ directory contains only README.md. git diff main --name-only lists only speck/tickets/0358-write-a-test-copy-of-the-readme-into-outputs.md; no branch changes fall outside speck/."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "git diff main -- README.md is empty, and git status for README.md in the main checkout is clean. The project's README.md is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README copy exactly matches the version at the start of the build. The output folder contains only that copy, and the branch changes only the ticket record. Ready for the owner to inspect and ship by hand."
  }
}
```

</details>

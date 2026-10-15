---
id: "0181"
title: "Remove a ticket's scratch files once it's finished"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T12:38:23.416Z"
approved: "2026-10-15T12:50:59.523Z"

---
# 0181 · Remove a ticket's scratch files once it's finished

**Status:** 👍 approved

## Problem
A build writes scratch files for its ticket in `/tmp` (`/tmp/speck-<id>-tests.txt`, `-prompt.md`, `-response.md`, `-verdict.json` and others), and nothing removes them. About 19 MB had built up by 2026-10-14. On machines where `/tmp` is held in memory, as on this one, they use memory until the next restart.

## Outcome
A ticket's scratch files are removed once the ticket is shipped or cancelled.

## Acceptance criteria
1. When `speck ship <id>` ships, or `speck cancel <id>` cancels, every file and folder in `/tmp` whose name starts with `speck-<id>-` is removed.
2. A ship that refuses leaves them, since the build may still need them.
3. Files for other tickets are left alone, including ones whose id starts with the same digits.
4. A file that can't be removed doesn't stop the ship or the cancel: it's mentioned in one line.
5. No test that passed before this change fails.

## Out of scope
- Changing where the skills write these files.

## Notes
- The paths come from `skills/speck-build/SKILL.md` and `skills/speck-review/SKILL.md`. Builders also write others under the same prefix, for example `/tmp/speck-0164-main-tests.txt`.
- Failing before this build: none
- The clean-up looks in the temporary folder Node reports (`/tmp` unless `TMPDIR` names another), so the test runner's own `TMPDIR` keeps the tests away from the real `/tmp`.
- Self-check: added a test that a `speck-<id>-` link is removed without touching what it links to, and documented the clean-up in docs/brief.md.

## In plain words
While a ticket is being built, speck leaves working files in the computer's temporary folder: test results, the reviewer's instructions and verdicts. Until now nothing tidied them up, so they piled up and, on this machine, used memory until a restart. Now, once a ticket ships or is cancelled, its own working files are removed. Other tickets' files are left alone, and a ship that doesn't go through keeps them, because the build may still need them.

To see it, look in `/tmp` for files named after a ticket before and after it ships: they're gone afterwards. If one can't be removed, speck says so in one line and carries on. Worth knowing: speck only looks in the system's usual temporary folder, so a machine set up to use a different one keeps its files.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 131,633
- Elapsed since build started: 13 min
- Changed lines: 35 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: the clean-up looks in the folder Node reports as temporary (`/tmp` unless `TMPDIR` names another), while the skills write to `/tmp` by name. With `TMPDIR` set elsewhere, the files aren't found.
- Skipped, already captured: the `0153 AC2` second-ship test failed once and passed on retry during this build (speck/ideas/2026-10-15-fix-the-race-in-the-0153-second-ship-test.md).

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
    "reviewed_sha": "b9cb05578fb1b5b953bfb0fab12bdc0683ee4876",
    "thread_id": "01a13f9d-087c-74f0-b338-9716d6c04271",
    "seconds": 28,
    "usage": {
      "input_tokens": 130787,
      "cached_input_tokens": 91264,
      "cache_write_input_tokens": 0,
      "output_tokens": 846,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-15T12:50:45.840Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/scratch.mjs removeScratch recursively removes matching entries. shipTicket and cmdCancel invoke it after completion. AC1 tests passed for ship, cancel, nested folders and safe symlink removal."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipTicket invokes cleanup after merge and refusal checks. The AC2 test exercises a refused ship and verifies scratch entries remain; it passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "removeScratch matches the complete speck-<id>- prefix. The passing AC3 test verifies preservation of other tickets, including speck-00010 entries, through both cancel and ship."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "removeScratch catches removal errors and reports failed entries together in one line. The AC4 test uses real permission-denied folders for both commands and passed without being skipped."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0181-tests.txt: 1823 tests, 1820 passed, zero failed, three skipped. Existing tests were not changed in the ticket's diff."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipping or cancelling now removes the ticket's temporary files and folders while preserving other tickets' files and symlink targets. Refused ships retain their files, and removal failures are reported without stopping completion. All seven new tests passed, and the full suite recorded no failures."
  }
}
```

</details>

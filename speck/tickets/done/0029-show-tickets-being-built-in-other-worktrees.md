---
id: "0029"
title: "Show tickets being built in other worktrees"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0028"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:09:23.994Z"
finished: "2026-10-09T10:14:29.963Z"

---
# 0029 · Show tickets being built in other worktrees

**Status:** ✅ done

## Problem
Once builds run in their own worktrees (0028), a ticket's progress is committed on its branch in that worktree. From the main checkout, the ticket still reads `ready`, so `speck status` misleads you and another session could start the same ticket.

## Outcome
`speck status` shows tickets being built in other worktrees, with their real status.

## Acceptance criteria
1. Run from any checkout, `speck status` lists each ticket whose branch is checked out in a worktree under the status in that worktree's copy (`building`, `reviewing`, `blocked` or `approved`), not the status on the base branch, with the worktree path on the line below.
2. A ticket shows up once, under its in-progress status.
3. With no other worktrees, `speck status` output is unchanged.
4. The status skill says to resume an in-progress ticket in its worktree, and names the path.

## Out of scope
- Other commands (`next`, `pack`) reading from other worktrees.

## Notes
- Self-check: skips detached worktrees, missing worktree folders and worktrees whose ticket file can't be found, and escapes the branch prefix before matching. Found `product.md` not yet updated, and fixed that.
- Built with `speck start` in its own worktree: the first ticket built this way. The tooling check followed this repo's `.speck/scripts` symlink, and the main checkout stayed on `main` throughout.
- During the build, `/tmp` ran out of inodes again (test fixtures, now including `<repo>.worktrees` folders from `speck start` tests). 0017 should clean up those too.
- Pre-check: no ambiguities found, and no external facts.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approved, with no findings.

## Delivery log
- Review rounds: 1 (codex, `gpt-6.1-sol`), with 188,076 reviewer tokens.
- Elapsed: about 4 minutes from start to approval (from `speck pack`).
- Changed lines: 19 (excluding tests and `speck/`), against a limit of 5,000.
- The first ticket started with `speck start`, built in its own worktree and shipped from inside it.
- Follow-up ideas:
  - Codex couldn't run `speck status` itself: its sandbox denied starting git. 0024 (letting the reviewer run the tests) would cover this.

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
    "reviewed_sha": "f01fd6add8ed4ba3a8ee03ee3ce5a45ee48c9153",
    "thread_id": "01a12026-f90c-7082-8204-cc55fa26f873",
    "seconds": 33,
    "usage": {
      "input_tokens": 187278,
      "cached_input_tokens": 134912,
      "cache_write_input_tokens": 0,
      "output_tokens": 798,
      "reasoning_output_tokens": 55
    },
    "saved_at": "2026-10-09T10:13:40.077Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: ticketsElsewhere reads ticket copies from checked-out worktrees; cmdStatus uses their status and prints the path below. Tests '0029 AC1/AC2' and '0029 AC1: an approved ticket...' exercise real worktrees and passed in supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdStatus replaces the local ticket by frontmatter id. The '0029 AC1/AC2' test verifies one occurrence and no stale READY group."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Test '0029 AC3' compares exact output before and after starting a build without another worktree; both assertions passed in supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-status/SKILL.md step 3 explicitly instructs resuming in the named worktree. Test '0029 AC4' checks these instructions and passed in supplied output."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The update accurately describes replacement of stale ticket status, the worktree path, and unchanged output without other worktrees."
    },
    "escalation_question": "",
    "summary": "The change shows each build’s actual status and location without duplicating tickets. The tests exercise real worktrees, and the changes stay within scope. No blocking issues found. I inspected the repository, but could not independently run status because the sandbox denied spawning git; test results are from the supplied run."
  }
}
```

</details>

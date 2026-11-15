---
id: "0672"
title: "Chain tickets only when one needs the other's work"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:04.847Z"
approved: "2026-11-15T13:38:21.263Z"

---
# 0672 · Chain tickets only when one needs the other's work

**Status:** 👍 approved

## Problem
The ticket skill chains a new ticket after every open ticket likely to change the same part of a file, and counts any doubt as an overlap. A chained ticket can't start until the other has shipped, so ready tickets wait while build slots stand free: in this repo's history, 587 of the 714 hours tickets spent between ready and starting were spent waiting on `after:`. What the waiting avoids is small: 11 of 268 ship attempts (4%) met a conflict, and a conflict costs one merge round, about 9 minutes.

## Outcome
Tickets wait for each other only when one can't be built without the other's work, or both would rewrite the same lines, so more ready tickets build side by side.

## Acceptance criteria
1. The chaining step of `skills/speck-ticket/SKILL.md` says to add an `after:` link in two cases only: the new ticket can't be built or tested until something the other ticket makes exists (such as a command, a setting, a function or a part of a document it adds to), or both tickets are likely to rewrite the same lines. It says that two tickets changing the same function, the same style rules or the same section of a document in different lines, or adding lines in the same place, build side by side. (checked by review)
2. The step says what to do in doubt: leave the two tickets unchained, and name the shared file and part when presenting the tickets, so the user can chain them. (checked by review)
3. The words "count it as an overlap" appear nowhere in `skills/speck-ticket/SKILL.md`.
4. The step still says to change only the new ticket and never to make a loop, the triage step that makes tickets still points to it, and the copies `speck init` installs match `skills/speck-ticket/SKILL.md`.
5. No test that passed before this change fails.

## Out of scope
- How `after:` works once it's set: a chained ticket still waits until the other has shipped (0674 changes when it can start).
- Removing `after:` links from tickets already written.
- Finding overlaps by machine while tickets build.

## Notes
- Measured 2026-11-15 from this repo's tickets and git history. Of the 279 `after:` links whose two tickets' changes could be compared line by line, 69 (25%) changed lines next to each other's. 284 of all 778 links joined tickets that changed no file in common outside `test/`. Since 29 Oct, ready tickets were held only by a chain during 24 of the 30 hours builds ran.
- The line comparison can't see a ticket that needs another's work without touching its lines, which is why the first case stays.
- The step's wording today is what 0205 and 0475 wrote. `test/ticket-0475.test.mjs` pins the loop rule, the triage pointer and the installed copies, not the overlap wording.
- A conflict costs more while a merge round re-reviews the whole change: 0673 shortens that, and matters more once fewer tickets are chained.
- Failing before this build: none
- Self-check: no changes. The step keeps the words older tests pin (its title's start, "each overlap", the open statuses), and the Present step and the triage pointer now match the new rule.

## In plain words
When you turn an idea into tickets, speck now makes a ticket wait for another only when it really needs that other ticket's work first, or when both would rewrite the very same lines. Tickets that merely touch the same file or the same part of it are left free to build at the same time, so more of your ready tickets build at once instead of queueing. When speck isn't sure, it leaves them unchained and tells you which file and part they share, so you can chain them yourself. To see it, make a few tickets that touch the same area and look at the one-line summary speck gives for each when presenting them. Keep an eye on whether two tickets building side by side now clash more often when they ship; each clash costs one extra review round.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new AC4 rule test pins exact prose, including 'Change only the new ticket', 'never edit the other' and 'lead back to the new ticket'.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 140,235
- Elapsed since build started: 2 min
- Changed lines: 6 (limit 5000)
- Follow-ups: none. The older tests for 0205 still pin some of the step's wording (its title's start and "each overlap"); a later rewrite of the step may need to loosen them.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9f26821265a21b9a57e0b81bc6725088051566b1",
    "session": "fresh",
    "thread_id": "01a1df6d-347a-7822-b546-f65766b597ba",
    "builder_response": "- Tests run: test/ticket-0672.test.mjs, via `speck test --related`, which also ran every existing test file naming skills/speck-ticket/SKILL.md (including test/ticket-0205.test.mjs and test/ticket-0475.test.mjs). 259 pass, 0 fail.\n- The chaining step (step 6) of skills/speck-ticket/SKILL.md now chains in two cases only, says what builds side by side, and says to leave doubtful pairs unchained and name the shared file and part when presenting. The Present step and the triage \"Ticket it\" pointer were brought in line with the new rule. The step keeps the words 0205's tests pin (its title's start \"Chain tickets that change the same files\", \"each overlap\", the open statuses). .claude/skills/speck-ticket is a symlink to skills/, and speck init's copies are checked by the AC4 test.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 77701,
      "cached_input_tokens": 49664,
      "cache_write_input_tokens": 0,
      "output_tokens": 588,
      "reasoning_output_tokens": 12
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 28037,
      "cached": 49664,
      "write": 0,
      "output": 588
    },
    "cost_usd": 0.0669204,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:37:40.914Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 6 limits chaining to required prior work or rewriting the same lines, and explicitly allows the listed parallel changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Step 6 says to leave doubtful pairs unchained and name the shared file and part when presenting them; step 8 reinforces this."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The prohibited phrase is absent from the skill; the reported passing AC3 test checks its absence."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Step 6 retains the new-ticket-only and loop rules; triage step 4 references step 6. The reported passing installation test compares both installed copies with the source."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied related-test run reports 259 passed, 0 failed and 3 skipped. No regression is evident in the scoped change; whole-suite verification remains the ship check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/ticket-0672.test.mjs",
        "issue": "The new AC4 rule test pins exact prose, including 'Change only the new ticket', 'never edit the other' and 'lead back to the new ticket'. These are document wording assertions explicitly prohibited by the review rules: an equivalent rewrite would fail them.",
        "suggested_fix": "Remove the exact-prose assertions and check these instructional rules by review. Retain tests of permitted facts, including the triage step reference, prohibited phrase and installed-copy equality.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The instructions implement the requested narrower chaining policy and the reported tests pass. Before approval, remove the new tests that freeze instructional wording, because harmless edits would break them."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d8b759f13fe3e93bcc1b33da89258ea7dda5d254",
    "session": "continued",
    "thread_id": "01a1df6d-347a-7822-b546-f65766b597ba",
    "builder_response": "- Tests run: test/ticket-0672.test.mjs (with the commands.checks files speck test adds). All pass.\n- F1: fixed. Removed the AC4 test that pinned the step's wording; the step's new-ticket-only and loop rules are now checked by review. Kept the tests for the triage step's number, the absent phrase and the installed copies.\n",
    "seconds": 16,
    "usage": {
      "input_tokens": 139168,
      "cached_input_tokens": 106752,
      "cache_write_input_tokens": 0,
      "output_tokens": 1067,
      "reasoning_output_tokens": 12
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4379,
      "cached": 57088,
      "write": 0,
      "output": 479
    },
    "cost_usd": 0.0192568,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:38:13.872Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Reviewed skills/speck-ticket/SKILL.md step 6: chaining is limited to required prior work or likely rewrites of the same lines. It explicitly allows changes to different lines within the same function, style rules or document section, and additions in the same place."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Step 6 says to leave doubtful pairs unchained and name the shared file and part so the user can chain them. Step 8 also requires presenting uncertain shared parts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The prohibited phrase is absent from the current skill. The AC3 absence test passed in the supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed step 6 retains changing only the new ticket and following dependency links to prevent loops. Triage step 4 points to step 6. The triage-reference and installed-copy tests both passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Round 2 reports 146 passed, 0 failed and 3 skipped; the earlier related-test run also had no failures. The only substantive revision removes the prohibited prose assertions. Whole-suite verification remains the ship check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/ticket-0672.test.mjs",
        "issue": "The exact-prose AC4 assertions identified in round 1 have been removed.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The instructions now chain tickets only for required prior work or overlapping line rewrites, leaving doubtful cases available to build side by side. The brittle wording test has been removed, the reported tests pass, and no blocking concerns remain."
  }
}
```

</details>

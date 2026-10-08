---
id: "0008"
title: "Cancel a ticket with a recorded reason"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:00:31.803Z"

---
# 0008 · Cancel a ticket with a recorded reason

**Status:** ⛔ blocked

## Problem
Once you decide not to build a ticket, the only options are to delete it or leave it as a draft. Either way, there's no lasting record that the idea was considered and turned down, or why, so it can come back later as new work.

## Outcome
A ticket you decide against can be cancelled with a reason. It's filed away with finished work and stays visible as cancelled, with that reason, so later ideas and tickets can be checked against it.

## Acceptance criteria
1. `speck cancel <id> "<reason>"` sets the ticket's status to `cancelled`, stores the reason and the date it was cancelled in the ticket, moves the file into `speck/tickets/done/` and rewrites the header as `**Status:** ❌ cancelled`. It works from any status except `done`.
2. `speck cancel` refuses and changes nothing when the reason is missing or blank, when the ticket is already `done` (delivered work can't be cancelled) or when it's already `cancelled`.
3. `speck set <id> status cancelled` refuses and points to `speck cancel`. Setting a cancelled ticket to any other status moves it back to `speck/tickets/` and keeps the recorded reason.
4. `speck status` lists cancelled tickets in a `CANCELLED` group after `DONE`, with each ticket's reason on the line below it. `speck new` never reuses a cancelled ticket's number.

## Out of scope
- Updating the source idea when its tickets are cancelled (0009 records which tickets an idea became).
- Checking new ideas or tickets against cancelled ones (0010).
- Cleaning up branches or review rounds for a ticket cancelled mid-build.

## Notes
- Round 4 allowed by the user (answer to the round-3 block): `max_review_rounds` raised from 3 to 4 in `speck/config.yml`, F1 fixed, re-review in a fresh session.
- Cancelled tickets sit in `speck/tickets/done/` with finished ones, so `speck/tickets/` holds only live work. That folder now means "closed" rather than strictly "delivered".
- `speck ship` already refuses anything that isn't `approved`, so it needs no change.
- Update `speck/product.md`, `docs/brief.md`, the status comment in `templates/ticket.md` and the `/speck-status` skill to cover the new status.

## Blocked question
Round 4 (fresh Codex session, working sandbox) found one more edge case in F1: a reason with an embedded `"` followed by ` #` (for example `say " # later`) was truncated, because `stripComment` didn't skip escaped quotes. The extra round you allowed is used up (`max_review_rounds: 4`). I have fixed `stripComment` (backslash escapes inside double quotes) and added three awkward reasons to the regression test; 66 tests pass, but that fix is unreviewed. Options: (a) allow one more round (limit 5) and re-review in a fresh session; (b) ship as is and accept that the last fix is unreviewed. Recommendation: (a), since each round has found something real and the fix is small.

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->
Round 1 (codex, model gpt-6.1-sol, effort default): approved. Four criteria pass and no blocking findings, so `speck next` said ship. Caveat: the Codex sandbox failed to start, so it reviewed the diff and the supplied `npm test` output without inspecting the repo or re-running the tests itself (see the Delivery log).

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Build: one sitting, one implementation commit plus the ticket commits. 64 tests pass (56 before, 8 new). 49 changed lines excluding tests, lockfiles and `speck/` (limit 1000).
- Review rounds: 1 of 3. Reviewer tokens: 64,849. Elapsed since build started: 4 min.
- Follow-ups, not done here:
  - The round-1 reviewer reported "repository inspection and independent test execution were unavailable because the sandbox failed to start". It still read the diff and the test output, but a reviewer that can't run anything can't check a claim beyond what the builder hands it. That is ticket 0001, and this round is a live example.
  - `speck status` prints a cancelled ticket's reason but not the date it was cancelled, though `speck cancel` records both. Worth adding if the date ever matters at a glance.
  - A ticket cancelled mid-build keeps its branch and any review rounds, as the ticket's Out of scope says. Nothing cleans those up.

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
    "reviewed_sha": "64686a158fac7da068ba4ac9726baba8a55c9bd8",
    "thread_id": "01a11d1d-7b01-79c0-824c-838385429dfb",
    "seconds": 34,
    "usage": {
      "input_tokens": 64050,
      "cached_input_tokens": 31744,
      "cache_write_input_tokens": 0,
      "output_tokens": 799,
      "reasoning_output_tokens": 240
    },
    "saved_at": "2026-10-08T20:04:27.750Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdCancel records cancel_reason and the cancellation date, synchronises the cancelled header, and calls placeTicket to archive the file. The two AC1 integration tests cover the stored fields, move, header and all eligible statuses; both passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdCancel checks the missing or blank reason, done status and cancelled status before writing. Both AC2 integration tests assert refusal and unchanged ticket contents; they passed in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdSet rejects status cancelled with a speck cancel instruction. placeTicket returns reopened tickets to the live folder, while field updates preserve cancel_reason. The AC3 integration tests exercise rejection and reopening to ready; both passed in the supplied output. Setting done continues to archive delivered work, consistent with the ticket's closed-folder definition."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdStatus places CANCELLED after DONE and prints cancel_reason below each ticket. The AC4 integration tests verify output order and that new allocates 0002 after cancelling 0001; both passed in the supplied output."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The living spec covers cancellation, recorded reasons, reopening, archived tickets and the new header. The requested brief, template and status skill updates are included."
    },
    "escalation_question": "",
    "summary": "Cancellation records why a ticket was declined, files it with closed work and shows the reason on the status board. The added tests exercise the actual CLI and cover the acceptance criteria. No blocking issue found in the supplied diff. Repository inspection and independent test execution were unavailable because the sandbox failed to start, so this review relies on the supplied diff and test output."
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
    "reviewed_sha": "c6e1a18b89766347e64d92e0d948c58e3948fe19",
    "thread_id": "01a11d1d-7b01-79c0-824c-838385429dfb",
    "seconds": 16,
    "usage": {
      "input_tokens": 102787,
      "cached_input_tokens": 63744,
      "cache_write_input_tokens": 0,
      "output_tokens": 1209,
      "reasoning_output_tokens": 262
    },
    "saved_at": "2026-10-08T20:13:04.753Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdCancel records cancel_reason and the cancellation date, updates the header and archives the ticket through placeTicket. AC1 integration tests 57–58 exercise these changes and every eligible starting status; supplied results show both passing. Implementation unchanged since round 1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdCancel checks missing or blank reasons, done tickets and already-cancelled tickets before writing. AC2 integration tests 59–60 verify refusal and unchanged contents; supplied results show both passing. Implementation unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdSet rejects status cancelled and directs the user to speck cancel. placeTicket moves reopened live work back while preserving cancel_reason. AC3 integration tests 61–62 cover rejection and reopening to ready; both pass. Setting done retains the closed-folder behaviour described in the ticket notes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdStatus prints CANCELLED after DONE with each reason below its ticket. AC4 integration tests 63–64 verify ordering, reason placement and allocation of a fresh number after cancellation; both pass. Implementation unchanged."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The previously reviewed living spec remains unchanged and describes the cancellation capability accurately. This round changes only the ticket status, header and delivery/review logs."
    },
    "escalation_question": "",
    "summary": "Approval stands. Cancellation and reopening remain covered by the eight CLI integration tests, all reported passing. This round adds only ticket bookkeeping and introduces no new implementation concerns. Independent repository inspection and test execution remain unavailable because of the sandbox failure reported in round 1; the verdict relies on the supplied diffs and test results."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "c21a70224a6c5f181f2077b9dc709baf828189bd",
    "saved_at": "2026-10-08T20:14:10.923Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs cmdCancel implements cancellation, date, header and filing; two AC1 integration tests cover ordinary reasons and live statuses. However, independent setField/parseTicket probes show reasons are not reliably preserved: 'false' becomes boolean false, and quoted text containing a colon gains backslashes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdCancel checks blank reasons, done and cancelled before writing. Both AC2 tests exercise the actual CLI and compare ticket contents before and after refusal. Independent execution was attempted but these tests could not create temporary repositories in the read-only filesystem."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdSet refuses status cancelled with a speck cancel instruction; placeTicket returns revived live statuses to tickets/, and writeField retains cancellation metadata. Both AC3 integration tests exercise these behaviours. The existing done-status archival rule is preserved."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "cmdStatus orders CANCELLED after DONE and nextId includes both folders; both AC4 integration tests cover ordinary cases. However, cmdStatus checks cancel_reason for truthiness, so accepted reasons 'false' and '0', parsed as false and 0, have no reason line."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "cmdCancel passes arbitrary reason text through setField and the minimal YAML parser without a reliable string round trip. Independently verified examples: 'false' becomes boolean false; '123' becomes a number; 'Use option: \"B\"' returns extra backslashes. Reasons 'false' and '0' then disappear from status output because cmdStatus uses a truthiness check. The new tests cover only simple prose and miss these failures.",
        "suggested_fix": "Store cancellation reasons as strings with encoding and decoding that preserve their exact contents, and display any recorded non-blank reason. Add real CLI regression tests for false, 0, quotes, backslashes and multiline text, asserting both stored reason and status output.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The requested capability and documentation updates are present and within scope, but the promise that cancellation records and displays its reason is inaccurate for accepted inputs such as false and quoted text."
    },
    "escalation_question": "",
    "summary": "Cancellation works for ordinary prose, but some valid reasons are altered or disappear from the status list. Fix reason preservation before merge. I ran git diff main...HEAD -- . ':!speck', inspected the relevant functions and tests, ran npm test, and ran node test/speck.test.mjs plus independent in-memory encoding probes. Test execution failed because temporary directories are read-only; the direct run reported 17 passes and 47 filesystem-related failures. The encoding probes independently confirmed the reported bug."
  }
}
```

</details>

<details><summary>Round 4 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "dacab3fe539769896cc6da6aa986f68d02cf231c",
    "saved_at": "2026-10-08T20:19:44.968Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs cmdCancel records and archives cancellations; test/speck.test.mjs exercises all eligible statuses, dates and headers. However, an independent in-memory setField/parseTicket probe with reason 'say \" # later' returned 'say \\\\', losing part of the reason."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdCancel checks blank reasons, done and cancelled before writing. The two AC2 CLI tests verify refusals and unchanged file contents and locations."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdSet refuses status cancelled and points to speck cancel; placeTicket restores live statuses to the live folder. AC3 CLI tests exercise refusal, reopening and preservation of an awkward recorded reason."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "cmdStatus orders CANCELLED after DONE, and nextId includes both ticket folders; dedicated AC4 CLI tests cover these behaviours. However, cmdStatus reads the corrupted cancel_reason demonstrated by the independent probe, so some reasons are displayed incompletely."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The string round-trip fix is incomplete. stripComment treats escaped double quotes as quote delimiters. A reason containing an odd number of embedded double quotes followed by a whitespace-prefixed #, such as 'say \" # later', is truncated before scalar reaches JSON.parse. Existing regression tests cover quotes and hashes separately but miss this combination.",
        "suggested_fix": "Make stripComment recognise escaped quotes inside double-quoted strings, including backslash parity. Add a CLI regression test combining an embedded quote and a subsequent #, checking exact stored and displayed text.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The living spec covers the intended cancellation capability and scope. The implementation still has the reason-preservation defect described in F1."
    },
    "escalation_question": "",
    "summary": "Cancellation, refusal checks, reopening and numbering have meaningful CLI tests, but some reasons still lose text, so this is not ready to merge. I ran cat and sed to inspect the spec, review instructions and implementation; git diff main...HEAD -- . ':!speck'; git status --short; npm test; and Node in-memory probes. npm test exited before reporting individual tests, so I could not independently confirm the builder's 66 passing tests. The probes confirmed ordinary config values and the previously failing numeric-looking reasons work, but reproduced the remaining quote-and-hash corruption."
  }
}
```

</details>

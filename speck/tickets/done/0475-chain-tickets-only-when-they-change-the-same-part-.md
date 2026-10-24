---
id: "0475"
title: "Chain tickets only when they change the same part of a file"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T13:47:26.942Z"
approved: "2026-10-24T13:49:20.502Z"
finished: "2026-10-24T13:52:36.016Z"

---
# 0475 · Chain tickets only when they change the same part of a file

**Status:** ✅ done

## Problem
The ticket skill chains a new ticket after every open ticket that changes the same files, so they're built one after another. Two tickets that change different parts of one file, which git usually merges cleanly, still wait for each other, and most of a release's panel tickets end up in one long chain while the other build slots sit idle.

## Outcome
The ticket skill chains tickets only when they're likely to change the same part of a file, so tickets that change different parts of one file can build side by side.

## Acceptance criteria
1. The ticket skill's chaining step compares, for each file a new ticket and an open ticket are both likely to change, the parts of it each will change: the same functions, the same style rules for the same elements, or the same section of a document. It sets `after:` only when those parts overlap, or when it can't tell which parts a ticket will change (checked by review).
2. A file both change in different parts doesn't chain them. When presenting tickets, the skill says, in one line per ticket, each `after:` it set with the file and part that caused it, and each file it shares with another open ticket but left unchained, with the parts that differ (checked by review).
3. The rest of the step stays: it never makes a loop of `after:` links, changes only the new ticket, and the triage steps that make tickets from inbox notes follow it too. The copies of the skill that `speck init` installs say the same as `skills/speck-ticket/SKILL.md`.
4. No test that passed before this change fails.

## Out of scope
- `speck run` deciding by itself which tickets to build at once.
- Changing tickets that already exist.
- Splitting the panel's files (0472 to 0474), which makes this step chain less often.

## Notes
- Asked for by the user on 2026-10-24, so that more tickets build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots.
- Today: step 6 of `skills/speck-ticket/SKILL.md`, "Chain tickets that change the same files" (0205), which came from 0188 and 0189 clashing at ship on 2026-10-15.
- The risk: tickets left unchained that do clash cost a merge round when the second ships, as about a quarter of 0450 to 0467 did, at about a minute of review each. The step should chain when in doubt.
- Moved into 0.15.0 by the user on 2026-10-24, to build alongside the file splits (0472 to 0474): it changes only the ticket skill and its installed copies, which no other open ticket changes. It doesn't re-chain the tickets already queued.
- Failing before this build: none
- Self-check: no changes. The installed skill copies come from `skills/` (symlinks here, copies via `speck init` elsewhere), so only `skills/speck-ticket/SKILL.md` changes. No docs describe the chaining step.

## In plain words
When you shape new tickets, speck now only makes one wait for another if both are likely to change the same part of a file, such as the same function, the same styles or the same section of a document. Two tickets that touch different parts of one file can now be built at the same time, so more of the build slots stay busy.

To see it, shape a ticket that touches a file another open ticket also changes, in a different place: the summary lists the shared file, says it was left unchained and names the part each ticket changes.

Worth watching: if two unchained tickets do clash, the second one needs an extra review round when it ships. When speck can't tell which part a ticket will change, it still makes them wait, to be safe.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 88,254
- Elapsed since build started: 2 min
- Changed lines: 6 (limit 5000)
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
    "reviewed_sha": "6ab7c4c0653f4cee8ea8d7f5cc48d53a31e449bf",
    "session": "fresh",
    "thread_id": "01a16e2b-f53c-7a63-acc1-c5f132cd2c3a",
    "builder_response": "- Tests run: `speck test --related test/ticket-0475.test.mjs` (test/ticket-0475.test.mjs plus every test file naming skills/speck-ticket/SKILL.md: fix-0100, ideas-0057, lint-0096, product-0068, ready-gate-0252, set-0114, skills, ticket-0205, triage-0037, type-0049, and commands.checks). 200 pass, 0 fail.\n- AC1 and AC2 are checked by review: the change is in step 6 and step 8 of skills/speck-ticket/SKILL.md. AC3's facts are tested in test/ticket-0475.test.mjs, and 0205's tests still pass on the reworded step. AC4 is the whole suite, which ship runs.\n- The installed copies in .claude/skills and .agents/skills are symlinks to skills/ in this repo, and `speck init` copies skills/ elsewhere; the test installs into a temp folder and compares.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 87608,
      "cached_input_tokens": 53888,
      "cache_write_input_tokens": 0,
      "output_tokens": 646,
      "reasoning_output_tokens": 36
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T13:49:13.783Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 6 compares functions, style rules for the same elements and document sections within each shared file. Unknown parts and additions in the same place count as overlaps."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Step 6 explicitly leaves different parts unchained. Step 8 requires one line per ticket showing dependencies with their file and part, and shared files left unchained with the differing parts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Step 6 retains transitive loop checking and changes only the new ticket; triage step 4 follows it. All three 0475 tests passed, including a real installTooling installation comparing both installed copies with the source. scripts/install.mjs confirms that installation copies skills/, while this repository uses symlinks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded related-test run reports 200 passed, zero failed and three skipped. The diff is confined to the ticket skill, its tests and ticket bookkeeping; no regression is apparent. Ship performs the whole-suite check."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The skill now lets tickets change separate parts of the same file in parallel, while keeping dependencies when changes overlap or their location is uncertain. It explains those decisions to the user and preserves loop prevention and installed copies. The relevant tests passed; no blocking concerns found."
  }
}
```

</details>

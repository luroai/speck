---
id: "0010"
title: "Flag overlapping work before capturing or ticketing"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0008", "0009"]                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:37:08.677Z"
finished: "2026-10-08T20:45:31.595Z"

---
# 0010 · Flag overlapping work before capturing or ticketing

**Status:** ✅ done

## Problem
`/speck-capture` writes a new idea note without looking at what already exists. `/speck-ticket` only checks the one-line titles in `speck status`. The same work can be captured or ticketed twice, or picked up again after it has shipped or been turned down.

## Outcome
Before capturing an idea or creating a ticket, the agent checks existing ideas, tickets (including done and cancelled ones) and `speck/product.md`. It tells you about any overlap and lets you decide before anything is written.

## Acceptance criteria
1. Before writing a note, `/speck-capture` checks the idea against every note in `speck/ideas/`, every ticket in `speck/tickets/` and `speck/tickets/done/` (problem, outcome and acceptance criteria, not only titles) and `speck/product.md`.
2. `/speck-ticket` runs the same check before it calls `speck new`.
3. When the check finds an overlap, the agent names each match: the idea's path with its status, the ticket's id with its status (plus the reason, if cancelled) or the line in `speck/product.md` that already covers it. It then asks whether to add to the existing item, go ahead anyway or stop, and writes nothing until you answer.
4. When nothing overlaps, the skill continues as it does today and says in one line that it found no overlap.

## Out of scope
- A CLI command that finds similar text. This ticket changes skill instructions only.
- Merging or deleting existing ideas or tickets automatically.

## Notes
- Built after 0008 (cancelled tickets and their reasons) and 0009 (idea status shows which tickets an idea became), since the check reports both.
- Overlap is the agent's judgement of the same or largely the same outcome, not an exact text match.
- **Behavioural smoke test, 8 October 2026.** The Node tests can only check the skill wording, so the builder also ran the skills in fresh headless Claude Code sessions (`claude -p --model sonnet --dangerously-skip-permissions`, so writing nothing was the agent's choice and not a permission block). Each scenario ran in its own copy of a fixture repo set up with `speck init --skip-checks` and committed, so `git status` shows exactly what the agent wrote. The fixture held an idea note `2026-10-01-dark-mode.md` ("Dark theme for the dashboard", `Status: idea`), ticket 0001 "Send a weekly summary email" (ready), 0002 "Import contacts from a spreadsheet" (done) and 0003 "Remind users before a booking" (cancelled: "SMS costs too much; revisit with push notifications"), plus a `product.md` line: "**Export:** users can download all their bookings as a PDF report from the Reports page." Every request was worded differently from its match:
  - C1, capture "a night-time look for the app so it's easier on the eyes": named `speck/ideas/2026-10-01-dark-mode.md (idea)`, offered add to it, go ahead or stop. No files changed. (AC1, AC3)
  - C2, capture "text people a heads-up the evening before they're due in": named `0003 (cancelled: "SMS costs too much; revisit with push notifications")`, noted that a cancelled ticket can't be reopened, and offered go ahead with a note that refers to it, or stop. No files changed. (AC1, AC3)
  - C3, capture "get their appointments out of the system as a printable file": quoted the `product.md` Export line and asked. No files changed. (AC1, AC3)
  - C4, capture "let each staff member set their own working hours": wrote `speck/ideas/2026-10-08-staff-working-hours.md`. The first run didn't print the no-overlap line in its final reply, so step 5 of `/speck-capture` and step 6 of `/speck-ticket` now include the check's one-line result. Two reruns both replied "No overlap with existing ideas, tickets or product.md." (AC4)
  - T1, ticket "load their customer list from an Excel or CSV export" at sign-up: named `0002 (done)` with its outcome and criteria, and asked before `speck new`. No ticket created. (AC2, AC3)
  - T2, ticket "email owners a round-up every Monday morning": named `0001 (ready)`, offered add to 0001, go ahead or stop. No ticket created. (AC2, AC3)
  - T3, ticket "let staff block out their holidays in the calendar": said there was no overlap with existing ideas, tickets or `product.md`, ran `speck new` and created 0004 as a draft (the original run and the rerun). (AC2, AC4)

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->
- Round 1 (codex, model gpt-6.1-sol, effort default): changes requested. F1: the tests check only the skill wording, and no behavioural smoke test exercises either skill.
- Round 2: approved. F1 resolved by a recorded seven-scenario smoke test in Notes. It also caught a missing one-line no-overlap reply, which is fixed in both skills.

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Attempts: 1. Review rounds: 2 (of 3). Reviewer tokens: 316,749. Elapsed: about 7 min of build and review, plus the smoke-test runs.
- Changed lines: about 45 (limit 1000), excluding tests and speck/.
- Built before 0009 (still a draft) even though `after:` lists it, because the user asked for the build. The check reads each idea's existing `Status:` line, so it will report `ticketed (…)` once 0009 lands, with no change needed here.
- Follow-up ideas: none from the review. The check relies on the agent following the instructions, and there's no CLI support, by design (out of scope).

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
    "reviewed_sha": "aae31cbb04f9133a3b4200c00d906c0d8f5b7308",
    "thread_id": "01a11d3e-443c-7c21-8ba8-6685cfce7e31",
    "seconds": 49,
    "usage": {
      "input_tokens": 107557,
      "cached_input_tokens": 66816,
      "cache_write_input_tokens": 0,
      "output_tokens": 909,
      "reasoning_output_tokens": 99
    },
    "saved_at": "2026-10-08T20:40:31.137Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "unclear",
        "evidence": "skills/speck-capture/SKILL.md, 'Check for overlap first', requires all specified sources and full ticket sections. test/speck.test.mjs '0010 AC1' checks wording only; it does not exercise a capture invocation."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "skills/speck-ticket/SKILL.md step 2 references the shared check before speck new. '0010 AC2' checks text position, without exercising ticket creation."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "The capture skill specifies match details, all three choices and no writes before an answer. '0010 AC3' matches phrases only; no scenario demonstrates reporting matches or waiting without writing."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "Both skills instruct a one-line no-overlap message and continuation. '0010 AC4' checks phrases in the capture skill only; neither skill's no-overlap flow is exercised."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The four new tests verify instruction wording, not the behaviour required by the acceptance criteria. No recorded behavioural smoke test demonstrates that either skill reads all sources, reports overlaps accurately, waits without writing, or continues when there is no overlap.",
        "suggested_fix": "Keep the wording checks, but add and record scenario-based skill smoke tests in an isolated fixture repo. Exercise both skills with differently worded overlaps in ideas, live/done/cancelled tickets and product.md, verify reported statuses and cancellation reasons, and verify no files change before the answer. Also exercise no-overlap continuation for both skills. This needs no similarity CLI.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The new capability description accurately reflects the skill instructions and correctly identifies the check as agent judgement implemented in instructions only."
    },
    "escalation_question": "",
    "summary": "The instructions cover the requested overlap checks and stay within scope. However, the tests only look for words in those instructions. Behavioural smoke tests are needed before approval to show that both skills actually identify existing work and wait for your decision before writing."
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
    "reviewed_sha": "9977253b9054c724c5663dcd9b5d1a37dca84af3",
    "thread_id": "01a11d3e-443c-7c21-8ba8-6685cfce7e31",
    "seconds": 25,
    "usage": {
      "input_tokens": 206704,
      "cached_input_tokens": 154880,
      "cache_write_input_tokens": 0,
      "output_tokens": 1579,
      "reasoning_output_tokens": 99
    },
    "saved_at": "2026-10-08T20:44:18.868Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-capture/SKILL.md requires reading every idea, live and archived ticket, full problem/outcome/criteria and product.md before writing. Ticket 0010 Notes records behavioural scenarios C1–C3 exercising differently worded idea, cancelled-ticket and product overlaps without writes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 2 invokes the shared check before speck new. Recorded scenarios T1 and T2 identify done and ready tickets without creating files; T3 proceeds to speck new only after finding no overlap."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The shared check requires each match's path/id, status, cancellation reason or covering product line, the three choices and no writes pending an answer. Recorded overlap scenarios C1–C3 and T1–T2 exercise reporting and waiting; wording test '0010 AC3' preserves the instruction contract."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Capture step 5 and ticket step 6 now explicitly include the check result in the final reply. Recorded C4 reruns and T3 demonstrate the one-line no-overlap result and normal creation. '0010 AC4' checks both skills' reporting instructions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The original wording tests lacked behavioural smoke-test coverage.",
        "suggested_fix": "Completed: ticket Notes now records seven behavioural scenarios, including overlap waiting and no-overlap continuation for both skills.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The capability description matches the instructions and accurately states that overlap detection relies on agent judgement."
    },
    "escalation_question": "",
    "summary": "Both skills now check existing work before creating anything and ask for your decision when they find overlap. Recorded smoke tests cover matching and normal creation, and caught a missing reply message that has been fixed. Approved; reliability still depends on the agent following the instructions."
  }
}
```

</details>

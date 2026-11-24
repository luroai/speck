---
id: "0752"
title: "File fewer, unduplicated follow-up notes from builds"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-11-24
started: "2026-11-24T23:12:03.874Z"
approved: "2026-11-24T23:15:46.385Z"
finished: "2026-11-24T23:27:53.151Z"

---
# 0752 · File fewer, unduplicated follow-up notes from builds

**Status:** ✅ done

## Problem
On 2026-11-24, 31 tickets left 15 inbox notes, five of them the same problem, because builds running side by side can't see each other's notes until they ship, and builds save a note for every small thing they notice. The user had cleared Capture down to 8 and it went back to 23.

## Outcome
Builds save an inbox note only for a follow-up worth its own ticket that no other note or ticket covers, including those of builds still running.

## Acceptance criteria
1. The speck-build skill tells the builder, before saving a follow-up as an inbox note, to check it also against the notes on the base branch and in the worktrees of tickets being built, reviewed or approved, and to skip one that duplicates any of them, listing the match in the Delivery log. (checked by review)
2. The skill says to save as an inbox note only a follow-up someone using speck would notice (a behaviour change or a bug), or a test that fails or is unsteady on the base branch; everything else stays in the Delivery log only. (checked by review)
3. A test that already fails on the base branch and that another note or open ticket already names is never saved again. (checked by review)
4. No test that passed before this change fails.

## Out of scope
- Triage, and notes the user captures.

## Notes
- Asked for by the user on 2026-11-24 after the Capture list grew from 8 to 23.
- The follow-up steps are in `skills/speck-build/SKILL.md`, section 5 step 1. Other open tickets' worktrees are under `<repo>.worktrees/`, and `speck status --json` lists them.
- Failing before this build: none
- No new tests: AC1–AC3 are skill wording (checked by review), and AC4 is checked by the existing tests that read `skills/speck-build/SKILL.md` (followups-0036 among them), run with `speck test --related`.
- Self-check: no changes. The rewording keeps the phrases followups-0036 checks (behaviour change, bug, missing check, tidy-ups, unused code, known limits); `speck status --json` does give `status` and `worktree` per ticket.

## In plain words
Builds now save far fewer notes to your Capture inbox. A build saves a note only for something you'd notice using speck (a bug or a change in how it behaves) or for a test that fails or is unsteady on main. Small things like tidy-ups, missing checks or wording go only in the ticket's Delivery log. Before saving a note, a build now also looks at what other builds running at the same time have written and at anything shipped since it started, so the same problem is no longer saved five times over. A failing test that a note or open ticket already names is never saved again.

To see it, run several builds at once and watch the Capture list: notes should be rare and not repeat each other. Keep an eye out for a real bug landing only in a Delivery log, which would mean the new bar is too strict.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 144,450
- Elapsed since build started: 4 min
- Changed lines: 11 (limit 5000)
Follow-ups (Delivery log only, no inbox note):
- 0161's light-look browser test once failed with "panel didn't start" during `speck test --related`, while three other builds were running, and passed on a rerun. It passed in the recorded full-suite run on main, so it isn't shown to be unsteady there. Checked against notes and open tickets on main and in other builds' worktrees: none names it.

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
    "reviewed_sha": "56a7df2aa9b27e481e21f117efb44b1eeaecb5ad",
    "session": "fresh",
    "thread_id": "01a20fd7-74c9-7060-a9eb-69328a4471b0",
    "builder_response": "- Tests run: `speck test --related test/followups-0036.test.mjs` (683 tests: every test file that reads skills/speck-build/SKILL.md, plus the checks). One failure, 0161's light-look browser test, timed out starting a panel while three other builds were running; it touches nothing this change does. Re-ran it with followups-0036 via `speck test --files test/followups-0036.test.mjs test/panel-0161.test.mjs`: all pass. That rerun is the output attached.\n- No new tests: AC1–AC3 are skill wording, marked (checked by review). AC4 is covered by the existing tests that read the skill.\n- The change is section 5 step 1 of skills/speck-build/SKILL.md only.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 143770,
      "cached_input_tokens": 111232,
      "cache_write_input_tokens": 0,
      "output_tokens": 680,
      "reasoning_output_tokens": 13
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 32538,
      "cached": 111232,
      "write": 0,
      "output": 680
    },
    "cost_usd": 0.0829992,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T23:15:31.692Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md:70–75 requires checks on this branch, the current base branch and worktrees of building, reviewing or approved tickets; duplicates are skipped and their matches listed in the Delivery log."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md:67–69 limits inbox notes to user-visible behaviour changes or bugs, and tests failing or unsteady on the base branch. Everything else stays in the Delivery log."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md:75 explicitly forbids saving a base-branch failing or unsteady test again whenever another note or open ticket names it, regardless of wording."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Saved test output confirms 152 tests: 149 passed, 3 skipped, 0 failed. Existing followups-0036 tests exercise the changed skill; no tests were added or weakened. The reported browser timeout passed on rerun."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The build instructions now restrict follow-up notes to worthwhile user-visible issues or unreliable base-branch tests, and require duplicate checks across the base branch and other active builds. The wording meets all criteria, the recorded tests pass, and the change stays within scope."
  }
}
```

</details>

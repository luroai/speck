---
id: "0687"
title: "Let a fix ticket fix the failing tests it names"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-let-a-fix-ticket-fix-the-failing-tests-it-names.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T20:50:21.778Z"

---
# 0687 · Let a fix ticket fix the failing tests it names

**Status:** 🔍 reviewing

## Problem
A fix ticket that speck makes when the full suite fails names the tests it must fix, and those tests are listed as failing before its build. The build and review rules say a test failing before the build is never changed or fixed, so the reviewer escalates a fix ticket for doing exactly its job: 0671 blocked on this and went on only because speck took the recommendation.

## Outcome
A `type: fix` ticket may change or fix the failing tests it names, and other failing-before tests stay off limits.

## Acceptance criteria
1. `skills/speck-build/SKILL.md`, `skills/speck-review/SKILL.md` and `templates/reviewer-prompt.md` each say that a ticket with `type: fix` may change or fix the tests its acceptance criteria name, even when they're listed as failing before the build, and that every other failing-before test stays unchanged (checked by review).
2. The reviewer's prompt as speck builds it for a `type: fix` ticket contains that exception, and for any other ticket it doesn't.
3. No test that passed before this change fails.

## Out of scope
- Changing how speck writes fix tickets or which tests they name.

## Notes
- From 0671's round 1 and 0683, which hit the same rule.
- `.claude/skills/` is this repo's installed copy of `skills/`; keep them the same.
- Failing before this build: none
- AC1 is a wording criterion, checked by review. `.claude/skills/` holds symlinks to `skills/`, so editing `skills/` keeps them the same.
- Self-check: no changes (checked quoted and commented `type: fix` values and that no `{{` marker reaches either prompt).

## In plain words
When the full suite fails and speck makes a fix ticket for it, that ticket may now repair the failing tests it was made to fix, without the reviewer holding it up for touching them. Every other test that was already failing stays off limits, as before, and other tickets get no such leeway. You'll notice it as fix tickets going through review without being escalated over this rule. Worth watching: a fix ticket's criteria should name its tests clearly, since those are the only ones it may change.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. The reviewer's one minor finding (a sentence repeated in the build skill) was fixed in round 2.
- During the `--related` run, 0630 AC3, 0657 AC3, 0148 AC4 and 0177 AC3 failed on timing under a 176-file load and passed when run on their own.

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
    "reviewed_sha": "d9ee2359338a0163795ae3213a421297968432ae",
    "session": "fresh",
    "thread_id": "01a1e105-6158-7142-b3fb-0d7c26fd5810",
    "builder_response": "- Tests run: test/fix-0687.test.mjs test/full-suite-0630.test.mjs test/house-rules-full-0657.test.mjs test/panel-0148.test.mjs test/panel-0177.test.mjs test/prompt-0353.test.mjs (after one `speck test --related` run; 0630, 0657, 0148 and 0177 failed there on timing under the 176-file load and pass on their own; 0353 AC3 failed because it fills the raw template, so it now drops the fix-only block as a non-fix prompt does)\n- The template marks the exception with `{{#FIX}}…{{/FIX}}`; `reviewerPrompt` keeps its text only when the ticket's `type` is `fix`, and drops it otherwise. Later rounds don't resend the template, so round 1 carries it.\n- `.claude/skills/` entries are symlinks to `skills/`, so both copies changed together.\n- AC1 is checked by review: speck-build section 1 step 6 and section 3 step 5, speck-review \"Before every round\", and the template's Scope item.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 94294,
      "cached_input_tokens": 58624,
      "cache_write_input_tokens": 0,
      "output_tokens": 582,
      "reasoning_output_tokens": 48
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35670,
      "cached": 58624,
      "write": 0,
      "output": 582
    },
    "cost_usd": 0.0830224,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:03:32.042Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "speck-build section 1 step 6 and section 3 step 5, speck-review's 'Before every round', and reviewer-prompt.md's Scope item explicitly permit type: fix tickets to fix named tests while preserving other failing-before tests. Installed skill entries are symlinks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/review.mjs reviewerPrompt includes the FIX block only when parsed.fm.type equals 'fix'. Both passing 0687 AC2 tests exercise generated prompts for fix, bug and blank types."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Reported targeted run: 191 passed, zero failed, three skipped. The existing prompt-0353 test retains its full-prompt comparison with the conditional block removed for a non-fix ticket. No regression evident in the scoped change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "skills/speck-build/SKILL.md",
        "issue": "Section 1 step 6 repeats the complete fix-ticket exception twice consecutively.",
        "suggested_fix": "Remove the second copy of the exception and its following sentence.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change lets fix tickets repair the failing tests their criteria name, while keeping other existing failures off limits. Generated prompts apply the exception only to fix tickets, and the reported tests pass. One duplicated instruction is a minor tidy-up."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "89e54b7565f5e6da8248c4c0cf02307f38d0bb25",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1e105-6158-7142-b3fb-0d7c26fd5810",
    "builder_response": "- Tests run: test/fix-0687.test.mjs test/prompt-0353.test.mjs\n- F1: fixed. Section 1 step 6 of skills/speck-build/SKILL.md now states the fix-ticket exception once (the edit had gone through the `.claude/skills` symlink a second time).\n",
    "seconds": 16,
    "usage": {
      "input_tokens": 170850,
      "cached_input_tokens": 131712,
      "cache_write_input_tokens": 0,
      "output_tokens": 992,
      "reasoning_output_tokens": 48
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 3468,
      "cached": 73088,
      "write": 0,
      "output": 410
    },
    "cost_usd": 0.0183448,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:04:29.825Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md:19, skills/speck-review/SKILL.md:17 and templates/reviewer-prompt.md:12 each permit fix tickets to repair tests named by their acceptance criteria while keeping every other failing-before test unchanged."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/review.mjs reviewerPrompt retains the exception only for parsed.fm.type === 'fix'. Both 0687 AC2 prompt-generation tests passed, covering fix, bug and blank ticket types."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The reported round-2 run has 154 passes, zero failures and three skips. The only instruction change since round 1 removes duplicated text; no regression is evident."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "skills/speck-build/SKILL.md",
        "issue": "Section 1 step 6 previously repeated the fix-ticket exception twice.",
        "suggested_fix": "Remove the second copy of the exception and its following sentence.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Fix tickets may repair the failing tests their criteria name, while other existing failures remain off limits. The prompts apply this exception only to fix tickets, the reported tests pass, and the duplicated instruction is fixed. No outstanding concerns."
  }
}
```

</details>

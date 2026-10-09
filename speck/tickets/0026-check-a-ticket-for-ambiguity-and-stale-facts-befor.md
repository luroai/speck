---
id: "0026"
title: "Pre-check every ticket before it goes ready"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T09:41:07.148Z"

---
# 0026 · Pre-check every ticket before it goes ready

**Status:** 👍 approved

## Problem
Two kinds of ticket problem cost review rounds and builder time. A criterion that can be read two ways leads to a dispute: 0012's "send the full round-1 prompt again" did. An external fact written into a ticket can be stale by build time: 0014 named Cursor's CLI `cursor-agent`, and its docs now call it `agent`.

## Outcome
Before a ticket is presented for approval, the agent checks it for criteria with more than one reading and for external facts, and records what it checked.

## Acceptance criteria
1. The ticket skill has a step before presenting the ticket. For each acceptance criterion, the agent asks whether a builder and reviewer could read it differently, and rewrites it or asks the user if so.
2. The same step lists external facts the ticket relies on (tool and command names, flags, file formats, URLs, versions), checks each against current documentation or the installed tool where possible, and records each in Notes as checked, with the date, or as unverified.
3. The build skill's pre-flight re-checks any fact marked unverified, and stops to tell the user if one turns out to be wrong.

## Out of scope
- Automated checking by the CLI.

## Notes
- Self-check: the build pre-flight first said to stop only if a wrong fact "changes what to build", which is narrower than AC3. It now stops for any wrong fact, and the AC3 test checks that wording.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 recording a checked fact edited the ticket before the clean-tree check, so the build would trip over its own change. Round 2 (codex): approved, with checks recorded on the branch in the start commit.

## Delivery log
- Review rounds: 2 (codex, `gpt-6.1-sol`), with 360,208 reviewer tokens.
- Elapsed: about 4 minutes from start to approval (from `speck pack`).
- Changed lines: 14 (excluding tests and `speck/`), against a limit of 5,000.
- The self-check (0023) caught one claim narrower than AC3 before review. It didn't catch F1, an ordering problem between steps; "State over time" covers it in spirit, but an explicit "do the steps still work in the order written?" item may be worth adding.
- Follow-up ideas:
  - Add "steps in order: does each step leave the state the next one expects?" to the self-check list.

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
    "reviewed_sha": "70531772ab6ca311c9efbbcdb1e4f00b83877130",
    "thread_id": "01a1200b-a98c-76f0-bd2e-e6f5a503d26d",
    "seconds": 38,
    "usage": {
      "input_tokens": 122686,
      "cached_input_tokens": 76672,
      "cache_write_input_tokens": 0,
      "output_tokens": 791,
      "reasoning_output_tokens": 33
    },
    "saved_at": "2026-10-09T09:43:55.173Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 6 checks every criterion for differing interpretations and requires rewriting or asking the user before presentation. test/speck.test.mjs '0026 AC1' checks these instructions and their ordering."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 6 lists the required external facts, verification sources and dated Checked or Unverified Notes entries. '0026 AC2' tests these instruction requirements."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md pre-flight step 3 requires rechecking Unverified facts and stopping for any wrong fact. '0026 AC3' checks this wording. The surrounding workflow has the separate ordering defect in F1."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md:16",
        "issue": "When an unverified fact proves correct, step 3 instructs the builder to edit the ticket's Notes before step 4 requires a clean working tree and creates the ticket branch. Following these instructions dirties the working tree on the base branch and prevents the next pre-flight requirement from being satisfied. The new tests check wording but miss this workflow contradiction.",
        "suggested_fix": "Check cleanliness before making changes. Verify facts without editing the ticket, stop if any are wrong, then create the ticket branch and record successful checks there in the start commit. Add an instruction-order test covering this successful verification path.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The added capability description accurately reflects the skill instructions and correctly states that checking is confined to skills."
    },
    "escalation_question": "",
    "summary": "The ticket adds the requested ambiguity and external-fact checks, with tests covering the instructions. One workflow defect needs fixing: recording a successful fact check changes the ticket before the build requires a clean working tree. Move that recording onto the ticket branch so a successful check can proceed into development."
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
    "reviewed_sha": "aa8f093fb24e0ab6ad5cb200c44a5f39fc16426a",
    "thread_id": "01a1200b-a98c-76f0-bd2e-e6f5a503d26d",
    "seconds": 25,
    "usage": {
      "input_tokens": 235318,
      "cached_input_tokens": 177024,
      "cache_write_input_tokens": 0,
      "output_tokens": 1413,
      "reasoning_output_tokens": 59
    },
    "saved_at": "2026-10-09T09:45:06.858Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 6 checks each criterion for differing builder/reviewer interpretations and requires rewriting or asking the user before presentation. Test '0026 AC1' covers the instructions and ordering; supplied test output reports pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 6 lists external fact categories, requires checking against current documentation or the installed tool where possible, and records dated Checked or Unverified entries in Notes. Test '0026 AC2' covers these requirements; supplied test output reports pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md pre-flight step 3 rechecks Unverified facts without edits and stops to inform the user if any are wrong. Steps 4–5 create the branch before recording checks in the start commit. Updated test '0026 AC3' covers the stop requirement and recording order; supplied test output reports pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md:16",
        "issue": "Resolved: verification now leaves the checkout untouched, and successful checks are recorded only after creating the ticket branch, in the start commit.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The ticket pre-check capability matches the revised skills and accurately describes checking as instruction-based rather than CLI automation."
    },
    "escalation_question": "",
    "summary": "Tickets now receive ambiguity and external-fact checks before presentation, and builds recheck unverified facts before proceeding. The workflow ordering problem is fixed. All acceptance criteria pass, with no blocking concerns remaining."
  }
}
```

</details>

---
id: "0026"
title: "Pre-check every ticket before it goes ready"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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

---
id: "0106"
title: Prepare release 0.3.0                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0124", "0125"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-11T14:35:05.249Z"

---
# 0106 · Prepare release 0.3.0

**Status:** 👍 approved

## Problem
speck has no release process. Every ship pushes straight to `main`, so anyone installing from `main` gets whatever shipped minutes ago, and the 0.2.0 tag was only created on 11 October, a day after the README's setup prompt started pointing at it. A lot has shipped since 0.2.0, and none of it is in a release.

## Outcome
speck is ready to be released as 0.3.0, with a repeatable way to release that keeps the version, the changelog and the setup prompt in step.

## Acceptance criteria
1. `package.json` has version `0.3.0`, and `speck init` prints `speck 0.3.0`.
2. `CHANGELOG.md` has a 0.3.0 section above the 0.2.0 one. It describes, in plain English and under a few headings, what someone using speck can do or will notice that's new since the `v0.2.0` tag. The 0.2.0 section is unchanged.
3. The README's setup prompt names `v0.3.0`, and the README's and the brief's status lines say 0.3.0, a public preview.
4. A test fails when the version in `package.json`, the newest section of `CHANGELOG.md` and the version in the README's setup prompt don't all match. Tests that pinned 0.2.0 check against the current version instead.
5. The brief has a short "Releases" section: `main` moves with every ship, releases are tagged versions, the README always points at the latest release, and the maintainer creates and pushes the tag once the release ticket has shipped, as shipping is theirs.

## Out of scope
- Creating and pushing the `v0.3.0` tag, which the maintainer does.
- A release command or skill: the user's own steps stay capture, ticket, build and ship.

## Notes
- `v0.2.0` was tagged on 11 October 2026 on `3250c9a` (0092's ship).
- Between this ticket shipping and the tag being pushed, the README's prompt points at a tag that doesn't exist yet, so tag straight after it ships.
- Waits for 0124 and 0125, so they're in the release.
- Failing before this build: none
- Self-check: checked each changelog line against its ticket's criteria, and narrowed the staged-changes line to say `speck ship` waits only up to `ship_wait_minutes`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 138,145
- Elapsed since build started: 4 min
- Changed lines: 48 (limit 5000)
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
    "reviewed_sha": "0c46b9254bbcc0ce68716204b3c5db178bb8cb84",
    "thread_id": "01a12b66-3491-7763-a918-20c17764aaab",
    "seconds": 35,
    "usage": {
      "input_tokens": 137390,
      "cached_input_tokens": 95104,
      "cache_write_input_tokens": 0,
      "output_tokens": 755,
      "reasoning_output_tokens": 34
    },
    "saved_at": "2026-10-11T14:38:35.469Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json sets 0.3.0. test/release-0106.test.mjs exercises the real init command and checks its 0.3.0 output; the saved full test output confirms both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds four plain-English groups covering changes recorded since v0.2.0. git diff v0.2.0 -- CHANGELOG.md confirms the old section is unchanged. Both AC2 tests passed, including the section hash check."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md names v0.3.0 in the setup prompt; README.md and docs/brief.md describe 0.3.0 as a public preview. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "test/support/release.mjs compares all three release versions. Passing AC4 tests exercise mismatches and missing values, including an older matching changelog section. test/release-0092.test.mjs now checks the current package version."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md's Releases section covers moving main, tagged releases, the README's release reference and maintainer tagging after shipping. The AC5 content test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, setup prompt and documentation agree on 0.3.0. The changelog preserves 0.2.0 and describes the new features, and tests guard against version mismatches. The saved full suite output confirms zero failures. Ready for merge; the maintainer must create and push the release tag immediately after shipping."
  }
}
```

</details>

---
id: "0254"
title: "Prepare release 0.5.4"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0249", "0250", "0255", "0251", "0256", "0252", "0253"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T14:05:31.389Z"
approved: "2026-10-16T14:08:10.391Z"

---
# 0254 · Prepare release 0.5.4

**Status:** 👍 approved

## Problem
Since `v0.5.3`, the README has gained a picture of speck at work (0249), the landing page's story (0250) and a new tagline (0255), a plain opening (0251) and a plain first sentence for each section (0256); agents set tickets ready only when told to (0252); and every install command installs the latest release (0253). Anyone following the setup prompt today gets 0.5.3 without them.

## Outcome
speck is ready to be released as 0.5.4.

## Acceptance criteria
1. `package.json` has version `0.5.4`, and `speck init` prints `speck 0.5.4`.
2. `CHANGELOG.md` has a 0.5.4 section above the 0.5.3 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.5.3` tag, from the tickets shipped since. The 0.5.3 and 0.5.2 sections are unchanged.
3. The README's and the brief's status lines say 0.5.4, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews or ships that the tickets shipped since `v0.5.3` have made untrue.
4. `docs/releases/v0.5.4.md` holds the notes for the GitHub release page: one short paragraph saying what this patch release is for, each change in it and why it matters, how to install it, anything that changes for someone upgrading from 0.5.3, and a link to the 0.5.4 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0248 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.5.4.

## Out of scope
- Creating the `v0.5.4` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.4.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- New features, which wait for 0.6.0.

## Notes
- Asked for 2026-10-16, for patch release 0.5.4. Follows 0248 (0.5.3).
- Waits for every ticket planned for this release (0249, 0250, 0255, 0251, 0256, 0252, 0253), so they're all in it. 0249 and 0250 have already shipped.
- After 0253, the setup prompt names no version, so this release doesn't change it. In the release notes, "how to install it" can give the fixed command for this release (`npx 'github:luroai/speck#v0.5.4' init`) as earlier notes did, or the latest one: either is fine.
- After it ships, check that the `v0.5.4` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.4 --target main --title "speck 0.5.4" --notes-file docs/releases/v0.5.4.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Built from main at `speck(0253): Make every speck install command use the latest release`: 239 shipped, 16 cancelled, 14 minutes median, 1 round median, 123 approved in the first round.
- 0248's checks that named 0.5.3 as the current version now check the current version, and its figures check the README as 0.5.3 shipped it, as 0248 did for 0243.
- Self-check: no changes

## In plain words
speck is ready to go out as version 0.5.4. It gathers everything shipped since 0.5.3: every install command now gets the newest release, agents set a ticket ready only when your latest message tells them to, and the README has a new tagline, a plain opening, a picture of speck at work and a plain first sentence for each section. The changelog, the release notes and the README's figures (239 tickets shipped) are up to date.

To see it, read the new 0.5.4 section at the top of the changelog. Nothing needs changing for someone upgrading beyond running the install command again, which also brings the new rule about setting tickets ready into their project's agent guide. After it ships, check that the v0.5.4 release page appeared on GitHub; if it didn't, the ticket's Notes say how to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 160,352
- Elapsed since build started: 3 min
- Changed lines: 53 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "8d7529b26f3aaec6c7464dc48d801ae001a2669f",
    "thread_id": "01a1450a-2334-7c70-9502-7ba28d25812d",
    "seconds": 29,
    "usage": {
      "input_tokens": 159322,
      "cached_input_tokens": 107904,
      "cache_write_input_tokens": 0,
      "output_tokens": 1030,
      "reasoning_output_tokens": 30
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T14:08:03.901Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.5.4; scripts/install.mjs reads that version and prints it during init. Both AC1 tests passed, including an actual CLI invocation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.5.4 above 0.5.3 and accurately covers shipped tickets 0249–0253, 0255 and 0256. Passing AC2 tests check coverage and preservation of the 0.5.3 and 0.5.2 sections."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md name 0.5.4 as a public preview. The setup prompt retains the quoted latest-release command. README workflow claims remain consistent with the shipped changes; corresponding AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.5.4.md supplies the purpose, changes and benefits, installation, upgrade guidance and correct changelog link, without personal names. Claims match the shipped tickets. All AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated figures from the current done directory: 239 shipped, 16 cancelled, 14 minutes median, 1 review round median, 123 first-round approvals; README matches. Version/changelog checks passed. All 124 reported targeted tests passed; historical test updates preserve relevant checks. Whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change prepares 0.5.4 with accurate release notes, updated status lines and independently verified delivery figures. All 124 targeted tests passed. No blocking concerns found."
  }
}
```

</details>

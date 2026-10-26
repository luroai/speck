---
id: "0522"
title: "Prepare release 0.18.0"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0519","0520","0521"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T22:59:46.286Z"
approved: "2026-10-26T23:03:23.849Z"

---
# 0522 · Prepare release 0.18.0

**Status:** 👍 approved

## Problem
Since 0.17.0, every closed card in the panel is the same height, with a Plan card's priority, size, risk and type as small labels (0519), ideas and the inbox have their own Capture lane left of Plan (0520), and ideas an agent raised are labelled as an agent's there (0521). Anyone following the setup prompt, or updating speck in another project, still gets 0.17.0 without them.

## Outcome
speck is ready to be released as 0.18.0.

## Acceptance criteria
1. `package.json` has version `0.18.0`, and `speck init` prints `speck 0.18.0`.
2. `CHANGELOG.md` has a 0.18.0 section above the 0.17.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.17.0` tag, from the tickets shipped since (checked by review). The 0.17.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.18.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.18.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.17.0, including that ideas and the inbox have moved from Plan to the Capture lane, and a link to the 0.18.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.18.0.

## Out of scope
- Creating the `v0.18.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.18.0.md` when this lands on `main`.
- Updating speck in the user's other projects.
- The landing page, which lives in its own repo.
- The changes themselves: 0519, 0520 and 0521.

## Notes
- Asked for 2026-10-26: "Create a release ticket after these and set them all as ready." A minor release, as 0520 adds a lane and 0521 a label. Follows 0518 (0.17.0).
- Covers every ticket shipped since `v0.17.0`: 0519, 0520 and 0521, which it waits for (`after:` names 0521, which waits for 0520, which waits for 0519), and any other that ships before this is built.
- After it ships, check that the `v0.18.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.18.0 --target main --title "speck 0.18.0" --notes-file docs/releases/v0.18.0.md`.
- Checked 2026-10-26: `package.json` is `0.17.0`.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC5's README figures aren't tested in the README, as 0491 left the rule: `test/release-0522.test.mjs` checks the figures worked out from `speck/tickets/done/` at the commit this was built from (505 shipped, 16 cancelled, 13 minutes, 1 round, 257 in round 1), and the reviewer checks the README gives them.
- `test/release-0518.test.mjs`'s checks of the current version now follow `package.json`, as 0518 did for 0515, and `test/docs-0491.test.mjs` lets `test/release-0522.test.mjs` read the README for its status line and setup prompt, as it does every release test.
- Shipped since `v0.17.0`: 0519, 0520 and 0521, and no others.
- Self-check: no changes. Each claim in the changelog and release notes checked against 0519, 0520 and 0521.
- Pictures: none, because nothing anyone sees in the panel changes.
## In plain words
speck is now ready to go out as version 0.18.0. It gathers the three changes since 0.17.0: a new Capture lane, left of Plan, holding every idea and inbox note so Plan holds only tickets; an "agent" label on ideas an agent came up with by itself; and closed cards that are all the same height, with a Plan card's priority, size, risk and type as small labels. The changelog, the release page's notes, the version shown when you install speck and the "Built with speck" figures in the README are all updated.

Once this lands, the release page and its tag should appear by themselves. Check the repository's Actions tab afterwards: if they didn't, the ticket's Notes give the one command to publish it by hand. Other projects keep 0.17.0, with ideas still in Plan, until you update them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 155,763
- Elapsed since build started: 4 min
- Changed lines: 55 (limit 5000)
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
    "reviewed_sha": "c2c28783a05094f8e0bc72a19083b4fcb56746af",
    "session": "fresh",
    "thread_id": "01a17a73-bcc1-7181-9975-1807e07524f4",
    "builder_response": "- Tests run: test/release-0522.test.mjs test/release-0518.test.mjs test/docs-0491.test.mjs, with `--related` (every test file naming CHANGELOG.md, README.md, docs/brief.md or package.json) and the repo checks: 973 tests, 970 pass, 3 skipped, 0 fail.\n- Shipped since v0.17.0: 0519, 0520 and 0521 only (`git log v0.17.0..main`). The changelog and release notes describe those three.\n- README figures worked out from speck/tickets/done/ at \"speck(0521): Label ideas an agent raised in Capture\": 505 shipped, 16 cancelled, 13 minutes, 1 round, 257 in round 1.\n- test/release-0518.test.mjs's current-version checks now follow package.json, as 0518 did for 0515.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 154918,
      "cached_input_tokens": 106752,
      "cache_write_input_tokens": 0,
      "output_tokens": 845,
      "reasoning_output_tokens": 36
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T23:03:17.417Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.18.0. Passing release-0522 AC1 tests check the version and execute speck init to verify its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.18.0 above 0.17.0 and describes shipped tickets 0519–0521 in plain English. Git history confirms these are the shipped changes since v0.17.0. Passing AC2 tests verify release facts and preservation of earlier sections."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines both say 0.18.0, a public preview. The README setup prompt retains the quoted semver:* install command. Passing AC3 tests check versions and the setup prompt."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.18.0.md explains the three shipped changes, their benefits, installation in each project and upgrading from 0.17.0, including the move to Capture. It names no person. Passing AC4 tests check install facts and the changelog anchor; document review confirms the claims match shipped tickets."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent calculation from the current done tickets gives 505 shipped, 16 cancelled, 13 median minutes, 1 median review round and 257 first-round approvals, matching README.md. The recorded run reports 970 passes, 3 skips and no failures, including the version/changelog consistency test."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, release notes and README figures are consistent and supported by the shipped tickets. The relevant tests pass, and the setup prompt still installs the latest release. No blocking concerns found."
  }
}
```

</details>

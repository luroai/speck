---
id: "0346"
title: "Prepare release 0.10.3"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0344","0345","0347","0348","0349"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T22:09:45.885Z"

---
# 0346 · Prepare release 0.10.3

**Status:** 🔍 reviewing

## Problem
0344 leaves the time a machine was asleep out of a build's time, so closing a laptop's lid during a build no longer adds hours to the panel's and the README's figures, and 0345 has setup offer a first ticket that sets up tests for an existing folder's code, and 0347 and 0348 let the panel's Settings view offer a Cursor reviewer's and the Foreman's models in a list, and 0349 stops speck run restarting a build each time the Foreman asks a question about its ticket. Anyone following the setup prompt, or updating speck on another machine, gets 0.10.2 without them.

## Outcome
speck is ready to be released as 0.10.3.

## Acceptance criteria
1. `package.json` has version `0.10.3`, and `speck init` prints `speck 0.10.3`.
2. `CHANGELOG.md` has a 0.10.3 section above the 0.10.2 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.10.2` tag, from the tickets shipped since (checked by review). The 0.10.2 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.10.3, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.10.3.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.10.2, and a link to the 0.10.3 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.10.3.

## Out of scope
- Creating the `v0.10.3` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.10.3.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-20 as a patch release. Follows 0343 (0.10.2).
- Covers every ticket shipped since `v0.10.2`: 0344, 0345, 0347, 0348 and 0349, which it waits for (`after:`), and any other that ships before this is built.
- After it ships, check that the `v0.10.3` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.10.3 --target main --title "speck 0.10.3" --notes-file docs/releases/v0.10.3.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.10.2`: 0344, 0345, 0347, 0348 and 0349, and no others.
- Built from main at `speck(0349): Don't restart a ticket's build while a Foreman question on it is waiting`: 332 shipped, 16 cancelled, 12 minutes median (leaving out `waited_seconds`, as 0344 made the figures do), 1.5 rounds median, 164 approved in the first round, worked out as 0307 did, with its figures test.
- 0343's checks that named 0.10.2 as the current version now check the current version, and its figures test checks only the figures 0.10.2 was built from, as 0343 did for 0339.
- Self-check: the changelog's and release notes' opening said "two small additions" while listing three things, two of them fixes; reworded so the fixes and the additions are told apart. Narrowed the Settings line to choosing Cursor as the reviewer, or another Foreman agent, which 0347 and 0348 back.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as 0.10.3, a bug-fix release. Closing a laptop's lid during a build no longer adds the hours asleep to the build's time, and speck run no longer keeps restarting a build while the Foreman waits for your answer about its ticket. It also has small additions: setup offers a first ticket that adds tests in a folder with code but no tests, and the panel's Settings let you choose Cursor as the reviewer and pick the reviewer's and the Foreman's models from a list. The changelog has a 0.10.3 section, and the release page's notes say what's fixed, how to update and what changes when upgrading. The README and the brief now say 0.10.3, and the README's "Built with speck" figures are up to date: 332 tickets shipped, 12 minutes median and 164 approved in the first review round. Once this lands, the release page should appear on GitHub by itself. Worth checking that it did: the ticket's Notes say how to publish it by hand if not. The sleep fix hasn't been tried on a real Mac yet.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none.
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
    "reviewed_sha": "62fde611d141a8e088878308537c7f1f77db05be",
    "thread_id": "01a15b5f-e0d8-7250-a7d8-b7384a5ee931",
    "seconds": 29,
    "usage": {
      "input_tokens": 151216,
      "cached_input_tokens": 104320,
      "cache_write_input_tokens": 0,
      "output_tokens": 1233,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T22:13:21.560Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json declares 0.10.3. Both passing 0346 AC1 tests check the version and exercise speck init's printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.10.3 above 0.10.2 and describes shipped tickets 0344, 0345, 0347, 0348 and 0349, including the sleep fix's limitations. Git history confirms these are the tickets shipped since v0.10.2. Independently verified that 0.10.2 and earlier sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say '0.10.3, a public preview'. README's setup prompt retains the quoted semver:* install command. Both 0346 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.10.3.md opens with a short bug-fix release paragraph, explains all five shipped changes and their benefits, gives the update command for each project, documents upgrade implications and links to the correct changelog anchor. Claims match the shipped tickets; no person's name appears. All three 0346 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated current done-ticket figures: 332 shipped, 16 cancelled, median 12.4148 minutes rounded to 12, median 1.5 review rounds and 164 first-round approvals. These match README.md. Both 0346 AC5 tests passed. The reported run had 129 passes, zero failures and three skips; existing release-test updates appropriately preserve historical checks while allowing the current version to advance."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, update notes and project status agree on 0.10.3. The notes accurately cover the five shipped changes and their limitations. The refreshed README figures match the ticket records, and the reported tests pass. No blocking concerns found."
  }
}
```

</details>

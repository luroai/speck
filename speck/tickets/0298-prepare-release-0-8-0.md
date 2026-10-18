---
id: "0298"
title: "Prepare release 0.8.0"                # one outcome, no "and"
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
after: ["0297", "0283", "0284", "0285", "0286", "0287", "0294", "0295", "0296", "0299", "0300", "0301"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T14:43:21.385Z"

---
# 0298 · Prepare release 0.8.0

**Status:** 🔍 reviewing

## Problem
Once the Foreman (0283–0287), pictures in review packs (0294) and pull request mode (0295, 0296) ship, speck shows one status for the pipeline and clears technical blockages itself, shows what a visual change looks like before you ship it, and can ship through GitHub pull requests. Anyone following the setup prompt, or updating speck on another machine, gets 0.7.0 without it.

## Outcome
speck is ready to be released as 0.8.0.

## Acceptance criteria
1. `package.json` has version `0.8.0`, and `speck init` prints `speck 0.8.0`.
2. `CHANGELOG.md` has a 0.8.0 section above the 0.7.0 one. It describes, in plain English, what someone using speck will notice is new, fixed or changed since the `v0.7.0` tag, from the tickets shipped since. The 0.7.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.8.0, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews, ships or is set up that the tickets shipped since `v0.7.0` have made untrue.
4. `docs/releases/v0.8.0.md` holds the notes for the GitHub release page: one short paragraph saying what this release is for, each change in it and why it matters, how to install or update it (running the install command again in each project), anything that changes for someone upgrading from 0.7.0 (such as new settings and their defaults), and a link to the 0.8.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0297 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.8.0.

## Out of scope
- Creating the `v0.8.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.8.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-18, so the user can update speck on their other machines. Follows 0297 (0.7.0).
- Covers: 0283–0287, 0294, 0295 and 0296. It waits for all of them (`after:`), so they're all in it.
- After it ships, check that the `v0.8.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.8.0 --target main --title "speck 0.8.0" --notes-file docs/releases/v0.8.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.7.0`: 0284–0287, 0294–0296 and 0299–0301. 0283 shipped just before the `v0.7.0` tag but 0.7.0's changelog and notes didn't list it, so 0.8.0's changelog describes it and says it first came in 0.7.0.
- Built from main at `speck(0296): Ship a pull request mode ticket by merging its pull request`: 284 shipped, 16 cancelled, 13 minutes median, 1 round median, 141 approved in the first round, worked out as 0297 did, with its figures test.
- 0297's checks that named 0.7.0 as the current version now check the current version, and its figures test checks only the figures 0.7.0 was built from, as 0297 did for 0282.
- README: the ship paragraph and the `/speck-ship` row no longer say every ship merges locally (`ship_mode: pr` merges the pull request), and starting a build yourself now says `speck run` counts and watches it (0300).
- Self-check: the release notes no longer say a repo whose main branch only takes pull requests can use speck without a catch: the "done" commit can't be pushed there, and they say so.

## In plain words
speck is now ready to be released as 0.8.0. Once this ships, the release page appears on GitHub by itself, and anyone who installs or updates speck gets the Foreman, pictures in review packs, shipping through pull requests and the other changes since 0.7.0. The changelog and the release notes describe each change in plain words, and how to upgrade: nothing changes unless you choose it, apart from the speck run switch moving from the panel's header into Settings. The README's "Built with speck" figures are up to date: 284 tickets shipped.

To see it, after it ships, check that the 0.8.0 release appears on the repository's Releases page on GitHub. If it doesn't, the ticket's notes give the command to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "b73ecb70657cd72870623a714b552b62e5058e57",
    "thread_id": "01a14f7a-6656-7c93-a016-510a797772a3",
    "seconds": 35,
    "usage": {
      "input_tokens": 167486,
      "cached_input_tokens": 113152,
      "cache_write_input_tokens": 0,
      "output_tokens": 765,
      "reasoning_output_tokens": 75
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:46:58.536Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json sets 0.8.0. Both 0298 AC1 tests passed, including invoking init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.8.0 above 0.7.0 and covers the shipped Foreman, pictures, pull request and build-watching tickets. It identifies 0283 as first released in 0.7.0. The tagged-history preservation test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md state 0.8.0, a public preview. README retains the latest-release setup command and describes pull request shipping and externally started builds accurately. All three AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.8.0.md provides the release purpose, changes and benefits, installation, per-project updates, settings and defaults, and changelog link. Claims match the shipped tickets, including the protected-branch limitation; no person's name appears. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README figures match the calculation using the same helper as 0297 and the recorded build-base commit: 284 shipped, 16 cancelled, 13 minutes median, one review round median, 141 first-round approvals. Both AC5 tests passed. The reported run had 133 passes, no failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, README and release notes are consistent with the shipped changes. Installation and upgrade instructions include the new defaults and the pull request shipping limitation. The figures were recalculated, and the reported tests pass. Ready for the owner's merge decision."
  }
}
```

</details>

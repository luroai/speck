---
id: "0760"
title: "Prepare release 1.7.0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0755","0756","0757","0758","0759","0762","0763"]                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-26T12:11:44.540Z"

---
# 0760 · Prepare release 1.7.0

**Status:** 🔍 reviewing

## Problem
Since 1.6.1, `speck projects` and `speck serve` run every project on a machine from one service at one address, keep each project's `speck run` going, can leave a project out without forgetting it, and can start at boot. Anyone following the setup prompt, or updating speck in a project, still gets 1.6.1.

## Outcome
speck is ready to be released as 1.7.0.

## Acceptance criteria
1. `package.json` has version `1.7.0`, and `speck init` prints `speck 1.7.0`.
2. `CHANGELOG.md` has a 1.7.0 section above the 1.6.1 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.6.1` tag, from the tickets shipped since (checked by review). The 1.6.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.7.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.7.0.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), how to move from a panel per project to `speck serve`, and a link to the 1.7.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.7.0.

## Out of scope
- Creating the `v1.7.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.7.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-25: step 1 of the factory, released as 1.7.0, not 2.0, at the user's request.
- Covers every ticket shipped since `v1.6.1`, the step 1 tickets it waits for included, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them.
- If one of the tickets it waits for is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.7.0` tag and its GitHub release page appeared. If not: `gh release create v1.7.0 --target main --title "speck 1.7.0" --notes-file docs/releases/v1.7.0.md`.
- Checked 2026-11-25: `v1.6.1` is tagged on origin.
- Failing before this build: none
- Self-check: no changes
- Pictures: none, because nothing anyone sees in the panel changes; the README changes only its status line and figures.

## In plain words
speck is ready to go out as 1.7.0. Once this lands, the release page appears on GitHub and the setup prompt installs 1.7.0, whose headline is running every project on your machine from one speck service: a list of your projects, one address that opens on All projects from this machine or your phone, each project's automatic building kept going, starting with the machine, and turning a project off without forgetting it. The changelog and release notes describe each change, and the notes walk through moving from a panel per project to the one service. The README's figures and the price table are up to date as of today.

To see it, open the GitHub releases page once it has shipped and check that 1.7.0 is there. Worth keeping an eye on: if the release page doesn't appear, it can be made by hand from the release notes, as the ticket's Notes say.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none.

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
    "reviewed_sha": "9f2103318ee1f86597ab5e0636590ea086c06e3f",
    "session": "fresh",
    "thread_id": "01a217c9-eae6-7552-9fe4-b4c9c03541b6",
    "builder_response": "- Tests run: test/release-0760.test.mjs test/release-0753.test.mjs test/docs-0491.test.mjs, with `--related` (which added every test file naming a changed file) and the repo checks.\n- Shipped since v1.6.1: 0755, 0756, 0757, 0758, 0759, 0761, 0762, 0763 (no fix tickets). Each is in the changelog; 0761 and 0763 under smaller sections.\n- test/release-0753.test.mjs: its checks that named 1.6.1 as the current version now check the current version, as 0753 did for 0732.\n- Figures worked out from speck/tickets/done/ at commit \"speck(0762): Leave a project out of speck serve without removing it\" (main when this was built): 744 shipped, 18 cancelled, 16 min median, 2 rounds median, 354 first round. Prices refreshed with `npm run prices` on 2026-11-26.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 165821,
      "cached_input_tokens": 113536,
      "cache_write_input_tokens": 0,
      "output_tokens": 959,
      "reasoning_output_tokens": 32
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 52285,
      "cached": 113536,
      "write": 0,
      "output": 959
    },
    "cost_usd": 0.1255136,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T12:17:48.586Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.7.0. Both AC1 tests passed, including executing speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 1.7.0 above 1.6.1 without altering older sections. Reviewed its descriptions against all eight tickets shipped since v1.6.1: 0755–0759 and 0761–0763."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines name 1.7.0; status and latest-release setup-prompt tests passed. scripts/prices.json records 2026-11-26 and contains newly fetched model entries, consistent with the reported npm run prices refresh."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.7.0.md explains the release, shipped changes and benefits, per-project update command, migration to speck serve and changelog link. Claims match the shipped tickets; no person's name appears. Command and link tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recomputed figures from current done tickets: 744 shipped, 18 cancelled, 16 minutes median, 2 review rounds median and 354 first-round approvals, matching README.md. Full recorded test output confirms 1771 passed, zero failed and three skipped; version/changelog matching passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The 1.7.0 release preparation is ready for merge. The notes accurately describe the shipped changes and explain updating and moving to one service. Published figures match the ticket records, prices are refreshed, and the recorded tests pass."
  }
}
```

</details>

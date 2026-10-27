---
id: "0531"
title: "Prepare release 0.19.0"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0528"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T13:32:37.023Z"
approved: "2026-10-27T13:36:15.999Z"
finished: "2026-10-27T13:40:08.712Z"

---
# 0531 · Prepare release 0.19.0

**Status:** ✅ done

## Problem
Since 0.18.0, speck records what each ticket's AI work cost, for builds, review rounds and the watch agent, on any agent and model (0523–0530): it prices tokens from a price table that ships with speck (0524), shows each shipped ticket's total cost in the panel (0526), adds spend up by ticket, model, week or month with `speck spend` (0527), and backfills earlier spend with `speck spend --backfill` (0528). Anyone following the setup prompt, or updating speck in a project, still gets 0.18.0 without them.

## Outcome
speck is ready to be released as 0.19.0.

## Acceptance criteria
1. `package.json` has version `0.19.0`, and `speck init` prints `speck 0.19.0`.
2. `CHANGELOG.md` has a 0.19.0 section above the 0.18.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.18.0` tag, from the tickets shipped since (checked by review). The 0.18.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.19.0, a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v0.19.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.18.0, including running `speck spend --backfill` once after updating to recover spend from before it, and that costs are estimates at API list prices, and a link to the 0.19.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.19.0.

## Out of scope
- Creating the `v0.19.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.19.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The changes themselves: 0523 to 0530.

## Notes
- A minor release, as 0524 and 0527 add the `speck prices` and `speck spend` commands. Follows 0522 (0.18.0).
- Covers every ticket shipped since `v0.18.0`: 0523 to 0530, which it waits for (`after:` names 0528, the last in their chain), and any other that ships before this is built.
- It's the first release ticket to run `npm run prices`, as 0524's change to the brief's Releases section asks.
- After it ships, check that the `v0.19.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.19.0 --target main --title "speck 0.19.0" --notes-file docs/releases/v0.19.0.md`.
- Checked 2026-10-27: `package.json` is `0.18.0`.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- Failing before this build: none
- Shipped since `v0.18.0`: 0523 to 0530, and no others.
- `npm run prices` ran on 2026-10-27 and wrote the same table 0524 had taken that morning (taken 2026-10-27), so `scripts/prices.json` has no diff. `test/release-0531.test.mjs` checks the table's date is on or after the day this was built, so a later release's refresh doesn't break it.
- AC5's README figures aren't tested in the README, as 0491 left the rule: `test/release-0531.test.mjs` checks the figures worked out from `speck/tickets/done/` at the commit this was built from (514 shipped, 16 cancelled, 13 minutes, 1 round, 260 in round 1), and the reviewer checks the README gives them.
- `test/release-0522.test.mjs`'s checks of the current version now follow `package.json`, as 0522 did for 0518, and `test/docs-0491.test.mjs` lets `test/release-0531.test.mjs` read the README for its status line and setup prompt, as it does every release test.
- Self-check: no changes. Each claim in the changelog and release notes checked against 0523 to 0530, the `speck status --json` field names against its output, and `speck prices` against a known model and `auto`.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is now ready to go out as version 0.19.0. It gathers the eight changes since 0.18.0, all about what AI work costs: speck now carries a price list for AI models, records the cost of every build, review and watch agent run whichever agent did it, shows each shipped ticket's total cost in the panel, and has a new `speck spend` command that adds it up by ticket, model, week or month, and can fill in spend from before the update. The changelog, the release page's notes, the version shown when you install speck, the price list and the "Built with speck" figures in the README are all updated.

Once this lands, the release page and its tag should appear by themselves. Check the repository's Actions tab afterwards: if they didn't, the ticket's Notes give the one command to publish it by hand. The release notes ask people updating to run the backfill once, soon, since Claude Code clears its old conversation records after 30 days by default.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 148,346
- Elapsed since build started: 4 min
- Changed lines: 72 (limit 5000)
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
    "reviewed_sha": "0758c14c5127644fca106524bf3ca64bb6add264",
    "session": "fresh",
    "thread_id": "01a17d92-c48c-7de3-93d4-76e6422d26cb",
    "builder_response": "- Tests run: `speck test --related test/release-0531.test.mjs test/release-0522.test.mjs test/docs-0491.test.mjs` (109 related files plus the checks): 1072 pass, 0 fail, 3 skipped.\n- Price table: `npm run prices` ran today (2026-10-27) and wrote a table identical to the one 0524 took this morning, so `scripts/prices.json` has no diff; its `taken` is 2026-10-27.\n- Built with speck figures: worked out with `builtWithSpeckFigures(doneTicketsAt(57fe6b80))` (main when this was built): 514 shipped, 16 cancelled, 13 min median, 1 round median, 260 approved in round 1.\n- test/release-0522.test.mjs's checks of the current version now follow package.json, as 0522 did for 0518.\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 147470,
      "cached_input_tokens": 102272,
      "cache_write_input_tokens": 0,
      "output_tokens": 876,
      "reasoning_output_tokens": 16
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45198,
      "cached": 102272,
      "write": 0,
      "output": 876
    },
    "cost_usd": 0.1093832,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T13:36:09.425Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json specifies 0.19.0. Both AC1 tests in test/release-0531.test.mjs passed, including invoking speck init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.19.0 above 0.18.0 and describes the user-facing changes from shipped tickets 0523–0530. The test comparing 0.18.0 and earlier sections with v0.18.0 passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md state 0.19.0, a public preview. The setup prompt retains the quoted semver:* install command. scripts/prices.json is dated 2026-10-27; the builder reports refreshing it that day with identical results. All AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.19.0.md provides an introductory paragraph, changes and their benefits, per-project update instructions, backfill guidance, estimate caveats and the changelog link. Claims match tickets 0523–0530, and no person's name appears. AC4 fact and link tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculating builtWithSpeckFigures from the current done tickets produced 514 shipped, 16 cancelled, 13 minutes, 1 review round and 260 first-round approvals, matching README.md. Version/changelog consistency passed. The recorded related test run reports 1072 passed, zero failed and three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release is ready for the owner's merge decision. Versions, release notes, upgrade instructions and README figures agree with the shipped work. The related tests passed, and I found no blocking issues."
  }
}
```

</details>

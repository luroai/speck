---
id: "0653"
title: "Prepare release 1.2.0"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0642","0643","0644","0645","0646","0647","0648","0649","0650","0651","0652"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T16:20:03.074Z"
approved: "2026-11-11T16:25:37.642Z"

---
# 0653 · Prepare release 1.2.0

**Status:** 👍 approved

## Problem
1.2, "Your team", turns Settings into a team page with a character for each member, shows each subscription's usage, and moves builds, reviews, the watch agent and QA to another agent on their bench when one runs out (0642 to 0652). Anyone following the setup prompt, or updating speck in a project, still gets 1.1.0.

## Outcome
speck is ready to be released as 1.2.0.

## Acceptance criteria
1. `package.json` has version `1.2.0`, and `speck init` prints `speck 1.2.0`.
2. `CHANGELOG.md` has a 1.2.0 section above the 1.1.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.1.0` tag, from the tickets shipped since (checked by review). The 1.1.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.2.0, the README says in plain words that you set up your team once and speck keeps it working when an agent runs out of usage (checked by review), the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.2.0.md` holds the notes for the GitHub release page: a short paragraph on your team, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 1.1.0 (the benches and what blank means, `qa_agent`, and that Cursor's usage is read from its usage screen), and a link to the 1.2.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.2.0.

## Out of scope
- Creating the `v1.2.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.2.0.md` when this lands on `main`.
- Taking the README's demo pictures again: the Build lane they show isn't changed by 1.2.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-11: "get a new release ticket created and set ready too". A minor release after 0640 (1.1.0): 1.2 on the roadmap, "Your team".
- Covers every ticket shipped since `v1.1.0`: 0642 to 0652, which it waits for, and any other that ships before this is built, such as 0641 once it's shipped.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.2.0` tag and its GitHub release page appeared. If not: `gh release create v1.2.0 --target main --title "speck 1.2.0" --notes-file docs/releases/v1.2.0.md`.
- Checked 2026-11-11: `package.json` is `1.1.0`, and `v1.1.0` is tagged.
- Failing before this build: none
- Covers every ticket shipped since `v1.1.0`: 0641 to 0652, 0654 and 0655, and no others. 0654 (the tests of `speck run` no longer finding this machine's agents) changes nothing for someone using speck, so the changelog leaves it out.
- Built from main at `speck(0652): Turn Settings into your team`: 638 shipped, 16 cancelled, 14 minutes median, 2 rounds median, 305 approved in the first round, worked out with `test/support/figures.mjs` as 0598 did.
- `npm run prices` on 2026-11-11 wrote the rates of 3622 models, and `scripts/prices.json`'s `taken` is 2026-11-11.
- 0640's checks that named 1.1.0 as the current version now check the current version, as 0640 did for 0598, and `test/docs-0491.test.mjs` allows `test/release-0653.test.mjs` to name the version.
- The README's usage-limit paragraph, clever bit, Your agents and Settings lines now describe the team and benches, as 1.1.0's said speck only waited out limits.
- Self-check: the README says a stopped build is handed on only when its limit is more than an hour from resetting and that new work (not a moved build) goes back once it resets; the release notes drop a "half a day becomes minutes" claim no ticket backs.
- Pictures: none, because nothing anyone sees in the panel changes.
- Also failing on the base code, found by the related run (not in the recorded quick result): `test/foreman-0285.test.mjs`'s two 0285 AC3 Settings switch tests, as 0652, 0654 and 0655 found; draft fix ticket 0656 covers them. Left as they are.

## In plain words
speck is ready to go out as version 1.2.0, the release where you set up your team. The changelog and the release page's notes describe everything since 1.1.0: Settings opening on a card for each team member with its own character, each member's bench of agents that take over when its own runs out of usage, builds, reviews and app checks moving to the next agent on the bench instead of waiting, QA as a member of its own, each subscription's usage in Settings and `speck agents`, Codex and Cursor limits being waited out, a row under Needs you for a failing full suite and the trackpad swipe fix. The README's and the brief's status lines say 1.2.0, the README says you set up your team once and speck keeps it working, the prices are today's and the "Built with speck" figures are up to date (638 tickets shipped, 305 approved in the first round).

To see it, read the 1.2.0 section at the top of the changelog. Once this lands on the main branch, check that the 1.2.0 release page appears on GitHub; if it doesn't, it can be published by hand as the ticket's Notes say.

Worth knowing: after updating, the benches start blank, which means your other signed-in agents. So with Codex or Cursor signed in, work moves to them while Claude is out of usage, where 1.1.0 waited. The release notes say how to choose who stands in.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 181,200
- Elapsed since build started: 6 min
- Changed lines: 102 (limit 5000)
- Follow-ups: none new. The two 0285 AC3 Settings switch tests failing on main are already draft fix ticket 0656.
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
    "reviewed_sha": "f5ad185cef3145b63bbe8243b1d855cdcc582067",
    "session": "fresh",
    "thread_id": "01a1cb6d-3014-7063-8dce-d22f95f0c750",
    "builder_response": "- Tests run (speck test --related): test/release-0653.test.mjs test/release-0640.test.mjs test/docs-0491.test.mjs, plus every existing test file naming a changed file (1442 tests, 2 failing, 3 skipped).\n- The two failures are `test/foreman-0285.test.mjs`'s 0285 AC3 Settings switch tests. They fail on main without this change since 0646 added the /api/usage request the fake page answers out of turn (found by 0652, 0654 and 0655; draft fix ticket 0656). This change touches no panel code.\n- Tickets shipped since v1.1.0: 0641 to 0652, 0654 and 0655; no others. 0654 (speck run's tests no longer finding this machine's agents) changes nothing for someone using speck, so the changelog leaves it out.\n- test/release-0640.test.mjs: its checks that named 1.1.0 as the current version now check the current version, as 0640 did for 0598.\n- test/docs-0491.test.mjs: release-0653 added to the release tests allowed to name the version.\n- Price table refreshed today with `npm run prices` (taken 2026-11-11, 3622 models).\n- Built with speck figures computed with test/support/figures.mjs from main at \"speck(0652): Turn Settings into your team\": 638 shipped, 16 cancelled, 14 min median, 2 rounds median, 305 first-round approvals.\n- README and brief status lines say 1.2.0. The README's usage-limit paragraph, its clever bit, Your agents and the Settings line now describe the team and benches. No demo pictures retaken (out of scope).\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 180189,
      "cached_input_tokens": 123392,
      "cache_write_input_tokens": 0,
      "output_tokens": 1011,
      "reasoning_output_tokens": 30
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56797,
      "cached": 123392,
      "write": 0,
      "output": 1011
    },
    "cost_usd": 0.1360432,
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-11-11T16:25:28.677Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json specifies 1.2.0. The two AC1 tests in test/release-0653.test.mjs passed, including running speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 1.2.0 above 1.1.0 without changing older sections. Its descriptions match shipped tickets 0641–0652 and 0655; 0654 only changes tests. AC2 tests check the release section, commands and settings."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines say 1.2.0. The README explains setting up the team once and continuing through usage limits. AC3 tests passed for status versions, the latest-release setup prompt and price-table date. scripts/prices.json records 2026-11-11 and contains refreshed rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.2.0.md explains the team, shipped changes and their benefits, updating each project, blank benches, QA settings and Cursor's usage screen. It names no person and links to the correct changelog anchor. All three AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated figures from speck/tickets/done/: 638 shipped, 16 cancelled, 14 minutes median, 2 rounds median and 305 first-round approvals, matching README.md. AC5 tests passed, including version/changelog agreement. The two related-run failures are documented on the unchanged base code in shipped tickets 0652 and 0654; no new regression is evident."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release is ready for the owner's merge decision. Version numbers, release notes, upgrade guidance, prices and published figures are consistent. All release checks passed. The two reported test failures already exist on the base branch and are unrelated to this change."
  }
}
```

</details>

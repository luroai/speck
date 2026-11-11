---
id: "0640"
title: "Prepare release 1.1.0"                # one outcome, no "and"
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
after: ["0638","0639"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T13:24:37.152Z"
approved: "2026-11-11T13:31:20.291Z"

---
# 0640 · Prepare release 1.1.0

**Status:** 👍 approved

## Problem
speck has grown since 1.0.0: it checks the work in the running app, works out how to start each app, keeps test logins on your machine, carries on after usage limits, and ships faster on quick tests. Anyone following the setup prompt, or updating speck in a project, still gets 1.0.0.

## Outcome
speck is ready to be released as 1.1.0.

## Acceptance criteria
1. `package.json` has version `1.1.0`, and `speck init` prints `speck 1.1.0`.
2. `CHANGELOG.md` has a 1.1.0 section above the 1.0.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.0.0` tag, from the tickets shipped since (checked by review). The 1.0.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.1.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.1.0.md` holds the notes for the GitHub release page: a short paragraph on speck checking the work, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 1.0.0 (setting `commands.start` or letting speck work it out, `speck logins`, `commands.test_full`, and that a round saved with `speck record` no longer ships by itself), and a link to the 1.1.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.1.0.

## Out of scope
- Creating the `v1.1.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.1.0.md` when this lands on `main`.
- Taking the README's demo pictures again: the Build lane they show hasn't changed since 1.0.0.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-11: "create a release ticket … for 1.1". A minor release after 0598 (1.0.0): 1.1 on the roadmap, "Checks the work".
- Covers every ticket shipped since `v1.0.0`: 0622 to 0637, plus 0638 and the README ticket, which it waits for, and any other that ships before this is built.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.1.0` tag and its GitHub release page appeared. If not: `gh release create v1.1.0 --target main --title "speck 1.1.0" --notes-file docs/releases/v1.1.0.md`.
- Checked 2026-11-11: `package.json` is `1.0.0`; the README's status line reads "Status: 1.0.0. It works end to end on your own machine."
- Failing before this build: none
- Covers every ticket shipped since `v1.0.0`: 0622 to 0639, and no others. 0626 (test sample names) and 0628 (the repo's own owner-name check) change nothing for someone using speck, so the changelog leaves them out.
- Built from main at `speck(0639): Bring the README up to date for 1.1`: 623 shipped, 16 cancelled, 14 minutes median, 2 rounds median, 303 approved in the first round, worked out with `test/support/figures.mjs` as 0598 did.
- `npm run prices` on 2026-11-11 wrote the rates of 3620 models, and `scripts/prices.json`'s `taken` is 2026-11-11.
- 0598's checks that named 1.0.0 as the current version now check the current version, as 0598 did for 0574, and `test/docs-0491.test.mjs` allows `test/release-0640.test.mjs` to name the version.
- Self-check: the changelog says the black bar shows a reviewer's usage-limit wait only once nothing else is building, and names failing full-suite tests only when the suite reports in TAP, as the code does; the release notes say auto-ship's receipts stop a builder's own approval shipping by itself rather than claiming more.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is ready to go out as version 1.1.0, the release where it checks the work. The changelog and the release page's notes describe everything since 1.0.0: speck checking a build's question in the running app itself, starting your app and working out how the first time, test logins kept on your machine, carrying on by itself after usage limits, shipping only what its own reviewer run approved, letting ships wait for just the quick tests while the full suite runs afterwards, wider private-word checks and a ticket's facts as tiles. The README's and the brief's status lines say 1.1.0, the prices are today's, and the "Built with speck" figures are up to date (623 tickets shipped, 303 approved in the first round).

To see it, read the 1.1.0 section at the top of the changelog. Once this lands on the main branch, check that the 1.1.0 release page appears on GitHub; if it doesn't, it can be published by hand as the ticket's Notes say.

Worth knowing: anyone upgrading should run the install command again in every project. Tickets approved before they update wait for them at Ship once, as they have no review receipts.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new test explicitly checks changelog heading order with newer < older.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 354,053
- Elapsed since build started: 7 min
- Changed lines: 165 (limit 5000)
- Follow-ups: the 0630 AC3 test "a full run doesn't wait for the max_parallel_tests turns" failed once on its 900 ms wall-clock limit during this build's related run, and passed on its own twice. Skipped as a new idea: it duplicates speck/ideas/2026-11-11-steady-the-0630-full-run-turn-test-under-load.md.
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
    "reviewed_sha": "33755a58c5a5de55c291405c73b1fead8d9ce20b",
    "session": "fresh",
    "thread_id": "01a1cacc-bbf6-7010-a815-1d1181a29cb8",
    "builder_response": "- Tests run (speck test --related): test/release-0640.test.mjs test/release-0598.test.mjs test/docs-0491.test.mjs, plus every existing test file naming a changed file (1395 tests, 1 failing, 3 skipped).\n- The one failure, `0630 AC3: a full run doesn't wait for the max_parallel_tests turns`, asserts its run took under 900 ms of wall time and failed at 1224 ms under the load of that big run. This change touches nothing it uses (scripts/full-suite.mjs and its config); `node --test test/full-suite-0630.test.mjs` on its own passed 15/15 twice right after.\n- Tickets shipped since v1.0.0: 0622 to 0639; no others. 0626 (test sample names) and 0628 (this repo's own owner-name check) change nothing for someone using speck, so the changelog leaves them out.\n- test/release-0598.test.mjs: its checks that named 1.0.0 as the current version now check the current version, as 0598 did for 0574.\n- test/docs-0491.test.mjs: release-0640 added to the release tests allowed to name the version.\n- Price table refreshed today with `npm run prices` (taken 2026-11-11, 3620 models).\n- Built with speck figures computed with test/support/figures.mjs from main at \"speck(0639): Bring the README up to date for 1.1\": 623 shipped, 16 cancelled, 14 min median, 2 rounds median, 303 first-round approvals.\n- README and brief status lines say 1.1.0; the brief's date is 11 November 2026. No demo pictures retaken (out of scope).\n",
    "seconds": 44,
    "usage": {
      "input_tokens": 231725,
      "cached_input_tokens": 175104,
      "cache_write_input_tokens": 0,
      "output_tokens": 1153,
      "reasoning_output_tokens": 75
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56621,
      "cached": 175104,
      "write": 0,
      "output": 1153
    },
    "cost_usd": 0.1422824,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-11T13:30:20.966Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.1.0. Both 0640 AC1 tests passed, including invoking speck init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 1.1.0 above 1.0.0 and describes the user-facing changes from shipped tickets 0622–0639. The diff against v1.0.0 only adds the new section; earlier sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 1.1.0; the setup prompt retains semver:*. scripts/prices.json is dated 2026-11-11 and contains refreshed rates. All three corresponding AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.1.0.md covers checking the app, the shipped changes, updating each project, all required upgrade settings and commands, and the changelog link. Its claims correspond to shipped tickets and it uses no person's name. The AC4 command, link and private-word tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated the done-ticket figures: 623 shipped, 16 cancelled, 14 minutes median, 2 rounds median and 303 first-round approvals, matching README.md. Version/changelog tests passed. The reported 0630 failure is a wall-clock threshold in unchanged code; its file subsequently passed twice in isolation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0640.test.mjs:48",
        "issue": "The new test explicitly checks changelog heading order with newer < older. The review rules prohibit added tests that enforce the order of headings in a document, even when the criterion specifies that order.",
        "suggested_fix": "Remove the heading-order assertion and leave ordering to review. Checks that the version sections exist may remain.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release content, version, refreshed prices and published figures meet the ticket. One test must change before approval: it enforces document heading order, which the review rules explicitly prohibit."
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
    "reviewed_sha": "a1036f8785a4df988553f789d28898c0f7ec8ca8",
    "session": "continued",
    "thread_id": "01a1cacc-bbf6-7010-a815-1d1181a29cb8",
    "builder_response": "- Tests run: test/release-0640.test.mjs test/release-0598.test.mjs test/docs-0491.test.mjs test/full-suite-0630.test.mjs (155 pass, 0 fail; the 0630 file included as it failed on timing in the last run, and passed here).\n- F1: fixed. The heading-order assertion is gone; the test now only checks that both the 1.1.0 and 1.0.0 sections exist, and its comment says where the section sits is checked by review.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 352232,
      "cached_input_tokens": 290048,
      "cache_write_input_tokens": 0,
      "output_tokens": 1821,
      "reasoning_output_tokens": 75
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5563,
      "cached": 114944,
      "write": 0,
      "output": 668
    },
    "cost_usd": 0.0293004,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T13:31:07.321Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json remains at 1.1.0. Both AC1 tests passed, including invoking speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Reviewed CHANGELOG.md: 1.1.0 appears above 1.0.0, covers the user-facing shipped changes, and leaves earlier sections unchanged. Section-existence and command/setting tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines say 1.1.0. The setup prompt retains semver:*. The refreshed price table is dated 2026-11-11. Corresponding AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed docs/releases/v1.1.0.md: it explains checking the work, shipped changes and their benefits, updating each project, all required upgrade details, and links to the correct changelog section. It uses no person's name. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README figures match the independently verified done-ticket totals from round 1. The figures and version/changelog tests passed again. The latest run reports 155 passed, zero failed and three skipped, including the previously failing 0630 test file."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0640.test.mjs:48",
        "issue": "The previous test enforced changelog heading order, contrary to the document-testing rules.",
        "suggested_fix": "Completed: the test now checks only that both version sections exist; ordering is checked by review.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The release is ready for the owner's merge decision. Version numbers, release notes, prices and published figures meet the ticket. The prohibited heading-order test has been fixed, and the latest checks have no failures."
  }
}
```

</details>

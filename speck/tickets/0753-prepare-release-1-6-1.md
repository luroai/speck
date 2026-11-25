---
id: "0753"
title: "Prepare release 1.6.1"                # one outcome, no "and"
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
after: ["0741","0742","0743","0744","0745","0746","0747","0748","0749","0750","0751","0752","0737"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0737"
started: "2026-11-25T07:54:47.119Z"

---
# 0753 · Prepare release 1.6.1

**Status:** 🔍 reviewing

## Problem
Since 1.6.0, 0737 and 0741 to 0752 start a waiting ticket only on approved work that merges cleanly, fix a test that failed every build on current Node, steady two timing tests, let a waiting test run hand back before the builder's shell limit, name only tests that still fail after a full-suite retry, show the machine-wide build limit in Settings, name Settings controls for screen readers, swap the builder's and reviewer's agents in one step, say under Needs you when the main checkout is bare, and file fewer duplicate follow-ups. Anyone updating speck still gets 1.6.0.

## Outcome
speck is ready to be released as 1.6.1.

## Acceptance criteria
1. `package.json` has version `1.6.1`, and `speck init` prints `speck 1.6.1`.
2. `CHANGELOG.md` has a 1.6.1 section above the 1.6.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.6.0` tag, from the tickets shipped since (checked by review). The 1.6.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.6.1, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.6.1.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.6.0 (if anything), and a link to the 1.6.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.6.1.

## Out of scope
- Creating the `v1.6.1` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.6.1.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the lanes they show have changed.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-24, after triaging the follow-ups from 1.6.0's builds.
- Covers every ticket shipped since `v1.6.0`: 0741 to 0752, which it waits for, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them.
- If one of 0741 to 0752 is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- A patch release, as the user asked for on 2026-11-24.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.6.1` tag and its GitHub release page appeared. If not: `gh release create v1.6.1 --target main --title "speck 1.6.1" --notes-file docs/releases/v1.6.1.md`.
- Checked 2026-11-24: `v1.6.0` is tagged on origin.
- 0732's checks that name 1.6.0 as the current version should check the current version, as 0732 did for 0695's.
- Failing before this build: not checked
- Built from main at `speck(0754): ship` (the 0754 fix's ship), with 0737's approved work under it: `speck start` started this on 0737, so 0737 ships first and is in the changelog. 0754 is a test-only fix, so it's only in the changelog's Tests line. `npm run prices` ran on 2026-11-25. The README's demo pictures show the Build lane, which these tickets don't change apart from a row that appears only when the main checkout is bare, so they weren't taken again.
- Self-check: no changes

## In plain words
speck is ready to go out as 1.6.1. Once this ships, the release page appears on GitHub with notes on everything since 1.6.0: waiting tickets that no longer stall on clashing work, test runs that step out of a long queue, shorter fix tickets, the machine-wide build limit and the agent swap in Settings, Settings named for screen readers, a warning under Needs you when the main checkout goes bare, and fewer repeated notes in Capture. The price table and the README's "Built with speck" figures are up to date.

To see it, read the 1.6.1 section at the top of the changelog, or the release page once it's published. Worth checking after it ships that the 1.6.1 tag and release page actually appeared on GitHub.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- "0176: the board stays quick to read however many tickets are built" (test/build-log-0176.test.mjs) failed once in this build's `--related` run (a 530 s run of 5,378 tests on a loaded machine) and passed when run again with only a few files. Skipped as an inbox note: speck/ideas/2026-10-17-count-tests-that-start-a-panel-through-another-helper-as-heavy.md already names that file missing its time limits under load.
- After it ships, check that the `v1.6.1` tag and its GitHub release page appeared (see Notes).

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
    "reviewed_sha": "2820d1fa641efd1b487a41649cda8eb9f4904b2d",
    "session": "fresh",
    "thread_id": "01a211be-6a1a-7c90-b4b4-b80bef75b137",
    "builder_response": "- Tests run: test/release-0753.test.mjs test/release-0732.test.mjs test/docs-0491.test.mjs test/build-log-0176.test.mjs\n- Round 1. `speck test --related` ran first (5377 pass, 1 fail: \"0176: the board stays quick to read however many tickets are built\", a timing check in test/build-log-0176.test.mjs during a 530 s run on a loaded machine). Re-run with the ticket's own files as speck suggested, it passed (179 pass, 0 fail): that output is attached.\n- This build was started by `speck start` on 0737's approved work (0753's `after:` names 0737), so the diff against main includes 0737's commits (scripts/build-records.mjs, built-on.mjs, run.mjs, speck.mjs, templates/panel*.js, docs/brief.md lines). 0737 is in the changelog because it ships first.\n- Tickets covered: 0737, 0741–0752 and the 0754 fix (test-only, in the Tests line). 0741, 0742, 0743 are test-only and summarised in one line.\n- `npm run prices` ran on 2026-11-25; Built with speck figures from `speck(0754): ship`: 734 shipped, 18 cancelled, 16 min median, 2 rounds median, 351 first-round.\n- 0732's checks that named 1.6.0 as the current version now check the current version, as the ticket's Notes ask.\n",
    "seconds": 68,
    "usage": {
      "input_tokens": 277458,
      "cached_input_tokens": 232448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1790,
      "reasoning_output_tokens": 120
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45010,
      "cached": 232448,
      "write": 0,
      "output": 1790
    },
    "cost_usd": 0.1311648,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T08:08:09.503Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.6.1. Both 0753 AC1 tests passed, including invoking speck init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md puts 1.6.1 above 1.6.0 and describes the changes covered by 0737, 0741–0752 and 0754. The diff only inserts the new section; earlier sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines name 1.6.1. AC3 tests passed for both lines, the latest-release setup prompt and the price table date. scripts/prices.json records 2026-11-25 and includes refreshed rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.6.1.md covers the release, individual changes, updating each project, upgrade implications and the changelog link. Claims match the dependency tickets; no person's name appears. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The figures test passed against done tickets at speck(0754): ship, matching the README's 734 shipped, 18 cancelled, 16 minutes, 2 rounds and 351 first-round approvals. Version consistency passed. The final selected-file run passed 179 tests with no failures, including the previously failing timing test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0753.test.mjs:49",
        "issue": "The new AC2 test asserts the order of document headings with indexOf. The review rules explicitly prohibit added tests that check heading order; this requirement is marked checked by review.",
        "suggested_fix": "Remove the heading-order assertion and verify placement by review. Keep the permitted checks that the version sections exist.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release documents, version and refreshed figures meet the ticket, and the reported tests pass. One new test checks document heading order, which the review rules prohibit. Remove that assertion before approval."
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
    "reviewed_sha": "37ac2bc845ac2d3e0f8b6866d801b6f6a25b69d4",
    "session": "continued",
    "thread_id": "01a211be-6a1a-7c90-b4b4-b80bef75b137",
    "builder_response": "- Tests run: test/release-0753.test.mjs test/release-0732.test.mjs test/docs-0491.test.mjs test/build-log-0176.test.mjs\n- F1: fixed. Removed the heading-order assertion from test/release-0753.test.mjs's AC2 test (renamed \"beside\", as 0732's is); it now checks only that both sections exist. Placement is left to review.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 377365,
      "cached_input_tokens": 324864,
      "cache_write_input_tokens": 0,
      "output_tokens": 2398,
      "reasoning_output_tokens": 120
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7491,
      "cached": 92416,
      "write": 0,
      "output": 608
    },
    "cost_usd": 0.0303036,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T08:08:49.409Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.6.1. Both AC1 tests passed, including running speck init and checking that it prints speck 1.6.1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 1.6.1 above 1.6.0 and describes the shipped changes in plain English. The release diff leaves 1.6.0 and earlier sections unchanged. Section existence and release facts are tested; placement was checked by review."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines say 1.6.1. The setup prompt retains the latest-release command. scripts/prices.json records 2026-11-25 with refreshed rates; the ticket records npm run prices on that date. All AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.6.1.md contains the release overview, changes and their benefits, update instructions for each project, upgrade implications and the changelog link. Claims match the covered tickets and no person's name appears. All AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing figures test calculates the build-time totals from done tickets: 734 shipped, 18 cancelled, 16 minutes median, 2 review rounds median and 351 first-round approvals, matching README.md. Version consistency passed. The selected-file run passed 179 tests with no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0753.test.mjs",
        "issue": "The added heading-order assertion violated the document-testing rules.",
        "suggested_fix": "Remove the heading-order assertion and leave placement to review.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Release 1.6.1 is ready for the owner's merge decision. The documents, version, refreshed prices and figures meet the ticket. The prohibited heading-order test has been removed, and all tests in the review run pass."
  }
}
```

</details>

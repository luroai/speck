---
id: "0732"
title: "Prepare release 1.6.0"                # one outcome, no "and"
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
after: ["0701","0702","0703","0704","0705","0706","0707","0708","0709","0710","0711","0712","0713","0714","0715","0716","0717","0718","0719","0720","0721","0722","0723","0724","0725","0726","0727","0728","0729","0730","0731","0740"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0731"
started: "2026-11-24T21:43:19.190Z"

---
# 0732 · Prepare release 1.6.0

**Status:** 🔍 reviewing

## Problem
Since 1.5.0, speck's Claude models are named properly (0700), and 0701 to 0731 make the panel look and work like part of Cursor (Settings laid out like Cursor's and saving each change straight away, a soft highlight for chained tickets, Set ready only on an open ticket), add Try it from a review pack, a build limit across projects and a usage warning on the bridge, and fix stalls around tickets built on others. Anyone following the setup prompt, or updating speck in a project, still gets 1.5.0.

## Outcome
speck is ready to be released as 1.6.0.

## Acceptance criteria
1. `package.json` has version `1.6.0`, and `speck init` prints `speck 1.6.0`.
2. `CHANGELOG.md` has a 1.6.0 section above the 1.5.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.5.0` tag, from the tickets shipped since (checked by review). The 1.5.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.6.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.6.0.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.5.0 (such as Settings saving each change straight away, and the new `machine_parallel_builds` setting), and a link to the 1.6.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.6.0.

## Out of scope
- Creating the `v1.6.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.6.0.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the lanes they show have changed (0727 and 0728 change Plan's rows, so check them).
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-24, after the idea sweep and the Cursor look tickets.
- Covers every ticket shipped since `v1.5.0`: 0700, and 0701 to 0731, which it waits for, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them; the steadied tests (0723, 0724) can be one line.
- If one of 0701 to 0731 is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- A minor release rather than a patch: it adds features (Try it, instant saving in Settings, a machine-wide build limit, the bridge's usage warning).
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.6.0` tag and its GitHub release page appeared. If not: `gh release create v1.6.0 --target main --title "speck 1.6.0" --notes-file docs/releases/v1.6.0.md`.
- Checked 2026-11-24: `v1.5.0` is tagged on origin.
- 0695's checks that name 1.5.0 as the current version should check the current version, as 0695 did for 0684's.
- Failing before this build: not checked
- Built from main at `speck(0730): Make Settings' controls look like Cursor's`, with 0731's approved work under it (`speck start` started this on 0731, so 0731 ships first and is in the changelog). 0733 was cancelled and 0737 is still a draft, so neither is in it. `npm run prices` ran on 2026-11-24. The README's demo pictures show the Build lane, not Plan's rows, so 0727 and 0728 don't change them and they weren't taken again.
- Self-check: no changes

## In plain words
speck is ready to go out as version 1.6.0. Once it lands, anyone who follows the setup prompt or runs the install command again in a project gets 1.6.0, with a changelog section and release notes covering what's new since 1.5.0: Settings laid out like Cursor's and saving each change straight away, Try it from a review pack, a build limit across every project on the machine, a usage warning on the bridge, Sonnet really meaning Sonnet, softer chain highlights, and fewer stalls around tickets built on others. The README's "Built with speck" figures are brought up to date (719 tickets shipped). It ships after the "save each setting" ticket it was built on. To see it, open the GitHub releases page after it ships: a 1.6.0 release should appear. If it doesn't, it needs creating by hand from the release notes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none.

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
    "reviewed_sha": "d7e4ce571ac5a16da0be0d8b7284e995981cbfcd",
    "session": "fresh",
    "thread_id": "01a20f8e-73ac-7b22-a8ea-5d815674008b",
    "builder_response": "- Tests run: `speck test --related test/release-0732.test.mjs test/release-0695.test.mjs test/docs-0491.test.mjs` (4869 pass, 0 fail), with the related tests it brought in.\n- Built on 0731's approved work (`speck start` started it there), so 0731 is in the changelog. 0733 was cancelled and 0737 is a draft, so they are left out. Fix tickets 0734–0739 are test-only apart from 0735 (Plan card chain spacing, folded into the Plan card line).\n- `npm run prices` ran today (2026-11-24); the Built with speck figures come from `builtWithSpeckFigures(doneTicketsAt(<main at speck(0730)>))`: 719 shipped, 18 cancelled, 15 min, 2 rounds, 341 first-round.\n- README demo pictures show the Build lane, not Plan's rows, so they were not retaken.\n- 0695's checks that named 1.5.0 as current now check the current version, as 0695 did for 0684's.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 488461,
      "cached_input_tokens": 394752,
      "cache_write_input_tokens": 0,
      "output_tokens": 1287,
      "reasoning_output_tokens": 86
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 93709,
      "cached": 394752,
      "write": 0,
      "output": 1287
    },
    "cost_usd": 0.2397632,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T21:56:02.289Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.6.0; the passing 0732 AC1 tests check the version and run speck init to verify its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 1.6.0 above 1.5.0 and covers the shipped panel, settings, build and command changes. Direct comparison against main confirms the 1.5.0 and earlier sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0732 AC3 tests check both status lines, the latest-release setup prompt and the price-table date. scripts/prices.json says 2026-11-24 and contains refreshed rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.6.0.md describes the release, benefits, per-project update command and upgrade changes, including instant saving and machine_parallel_builds. Claims align with the shipped tickets and approved prerequisite 0731. Passing AC4 tests cover commands, settings and the changelog link; review found no person's name."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation from speck/tickets/done gives 719 shipped, 18 cancelled, 15 median minutes, 2 median rounds and 341 first-round approvals, matching README.md. The version/changelog test passed; the reported run has 4869 passes and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0732.test.mjs",
        "issue": "The new test “0732 AC2: the 1.5.0 section is still there beside the 1.6.0 one” asserts heading order using indexOf. The review rules explicitly prohibit new tests that check the order of headings in documents.",
        "suggested_fix": "Remove the heading-order assertion and check the section ordering by review. Keep the permitted tests checking that the version sections exist.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release version, notes, refreshed prices and published figures meet the ticket. One new test checks document heading order, which the review rules prohibit. Remove that assertion before approval."
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
    "reviewed_sha": "6e175663925457b306df5e4c11db376523c639e5",
    "session": "continued",
    "thread_id": "01a20f8e-73ac-7b22-a8ea-5d815674008b",
    "builder_response": "- Tests run: test/release-0732.test.mjs test/release-0695.test.mjs test/docs-0491.test.mjs (175 pass, 0 fail)\n- F1: fixed. Removed the heading-order assertion from \"0732 AC2: the 1.5.0 section is still there beside the 1.6.0 one\"; it now only checks both sections exist. Where the section sits is left to review, as the comment above those tests says.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 712029,
      "cached_input_tokens": 610688,
      "cache_write_input_tokens": 0,
      "output_tokens": 1841,
      "reasoning_output_tokens": 86
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7632,
      "cached": 215936,
      "write": 0,
      "output": 554
    },
    "cost_usd": 0.0423976,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T21:56:52.070Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json remains at 1.6.0. Both AC1 tests passed, including running speck init and checking its version output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md retains the reviewed 1.6.0 section above 1.5.0, describing the shipped changes. Earlier sections were verified unchanged in round 1; this round changes only one test assertion."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md name 1.6.0; the setup prompt still uses semver:*; scripts/prices.json retains the refreshed rates dated 2026-11-24. All AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.6.0.md retains the reviewed release overview, changes and benefits, per-project update command, upgrade details and changelog link. Its claims match the prerequisite tickets and it uses no person's name. All AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README figures still match the independent round-1 calculation: 719 shipped, 18 cancelled, 15 median minutes, 2 median rounds and 341 first-round approvals. AC5 tests passed. This round reports 175 passes and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0732.test.mjs",
        "issue": "The new changelog test previously asserted document heading order.",
        "suggested_fix": "Remove the heading-order assertion and leave ordering to review.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Release 1.6.0 is ready for the owner's merge decision. The version, release notes, refreshed prices and published figures meet the ticket. The prohibited test assertion has been removed, and all tests run this round passed."
  }
}
```

</details>

---
id: "0598"
title: "Prepare release 1.0.0"                # one outcome, no "and"
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
after: ["0575","0576","0577","0578","0579","0580","0581","0582","0583","0584","0585","0586","0587","0588","0589","0590","0591","0592","0593","0594","0595","0596","0597","0599","0600","0601","0602","0603","0604","0605","0606","0607","0608","0609","0610","0611","0612","0613","0614","0615","0616","0617","0618","0619","0620","0621"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-10T17:40:35.346Z"
approved: "2026-11-10T17:48:18.624Z"

---
# 0598 · Prepare release 1.0.0

**Status:** 👍 approved

## Problem
speck has grown up: it works as your engineering manager, which you can name (0575, 0576), the panel is redesigned around it, with the black bar, the Premium character and the bridge across every project (0577 to 0597), and since 0.22.0 it decides and tells you. Anyone following the setup prompt, or updating speck in a project, still gets 0.22.0.

## Outcome
speck is ready to be released as 1.0.0.

## Acceptance criteria
1. `package.json` has version `1.0.0`, and `speck init` prints `speck 1.0.0`.
2. `CHANGELOG.md` has a 1.0.0 section above the 0.22.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.22.0` tag, from the tickets shipped since (checked by review). The 0.22.0 and earlier sections are unchanged.
3. The README's demo pictures, `docs/images/demo-light.png` and `docs/images/demo-dark.png`, are taken again from the panel as it is when this is built, one in each look, as 0597 took them. The README's and the brief's status lines say 1.0.0 and no longer call speck a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v1.0.0.md` holds the notes for the GitHub release page: a short paragraph on speck as your engineering manager, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 0.22.0 (the LCD screen is gone, and the name setting), that costs are estimates at API list prices, and a link to the 1.0.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.0.0.

## Out of scope
- Creating the `v1.0.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v1.0.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-09: "do you think this is a candidate for a 1.0.0 release? … let's make it a big one." A major release after 0574 (0.22.0).
- Covers every ticket shipped since `v0.22.0`: 0575 to 0597 and 0599 to 0621, which it waits for, and any other that ships before this is built.
- After it ships, check that the `v1.0.0` tag and its GitHub release page appeared (0240's workflow). If it failed: `gh release create v1.0.0 --target main --title "speck 1.0.0" --notes-file docs/releases/v1.0.0.md`.
- Checked 2026-11-09: `package.json` is `0.22.0`; the README's status line reads "Status: 0.22.0, a public preview."
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- Failing before this build: none
- Covers every ticket shipped since `v0.22.0`: 0575 to 0597 and 0599 to 0621, and no others.
- Built from main at `speck(0617): End a draft's full view in Set ready`: 604 shipped, 16 cancelled, 14 minutes median, 2 rounds median, 296 approved in the first round, worked out with `test/support/figures.mjs` as 0307 did.
- `npm run prices` on 2026-11-10 wrote the rates of 3564 models, and `scripts/prices.json`'s `taken` is 2026-11-10.
- Demo pictures taken as 0597 took them, from a copy of the demo outside the repo in a temporary folder, its server changed to serve the woff2 fonts, fill in `{{panel}}` and give two made-up calls under Decided for you: a 430 px pane at 2×, 1440 × 900.
- 0574's checks that named 0.22.0 as the current version now check the current version, as 0574 did for 0560, and `test/docs-0491.test.mjs` allows `test/release-0598.test.mjs` to name the version.
- Self-check: the status-line test finds the line by its `Status: 1.0.0` text, so a reworded brief still passes 0267's check; the changelog's example of a named manager says `<name>` rather than a made-up person's name; the Shipped figures line names the four extra figures rather than "costs included", and the buttons line says what 0612 changed rather than that every button is the same size.

## In plain words
speck is ready to go out as version 1.0.0, the release where it becomes your engineering manager. The changelog and the release page's notes describe everything since 0.22.0: naming your manager, the black bar and speck's new face in place of the LCD screen, the lanes as tabs and short rows, each ticket's full view, Decided for you and the Pipeline log as speck's own reports, the bridge across every project, the new look and two fixes to speck run. The README's and the brief's status lines say 1.0.0 and no longer call it a public preview, the README's demo pictures were taken again from today's panel, the prices are today's, and the "Built with speck" figures are up to date (604 tickets shipped).

To see it, read the 1.0.0 section at the top of the changelog and look at the README's pictures. Once this lands on the main branch, check that the 1.0.0 release page appears on GitHub; if it doesn't, it can be published by hand as the ticket's Notes say.

Worth knowing: the median review rounds in the README went from 1 to 2. Anyone upgrading should run the install command again in every project, as the All projects view shows a project on an older speck as not answering.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new status-line test reads README.md and asserts that its text does not contain 'preview'.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 392,717
- Elapsed since build started: 8 min
- Changed lines: 155 (limit 5000)
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
    "reviewed_sha": "7e6c0e15a24c93e888a63486285f99c8db2282f2",
    "session": "fresh",
    "thread_id": "01a1c691-5513-7762-b1e9-6fbccbe0cd3c",
    "builder_response": "- Tests run (speck test --related): test/release-0598.test.mjs test/release-0574.test.mjs test/docs-0491.test.mjs test/docs-0267.test.mjs, plus every existing test file naming a changed file (1263 tests, 0 failing, 3 skipped).\n- Tickets shipped since v0.22.0: 0575 to 0597 and 0599 to 0621; no others.\n- test/release-0574.test.mjs: its checks that named 0.22.0 as the current version now check the current version, as 0574 did for 0560.\n- test/docs-0491.test.mjs: release-0598 added to the release tests allowed to name the version.\n- Price table refreshed today with `npm run prices` (taken 2026-11-10, 3564 models).\n- Built with speck figures computed with test/support/figures.mjs from main at \"speck(0617): End a draft's full view in Set ready\": 604 shipped, 16 cancelled, 14 min median, 2 rounds median, 296 first-round approvals.\n- Demo pictures retaken from the panel as it is in this branch, with the demo 0597 used (outside the repo), at 2880 × 1800; also kept with the review pack.\n- README and brief status lines say 1.0.0 without \"a public preview\".\n",
    "seconds": 46,
    "usage": {
      "input_tokens": 254882,
      "cached_input_tokens": 191488,
      "cache_write_input_tokens": 0,
      "output_tokens": 1332,
      "reasoning_output_tokens": 74
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 63394,
      "cached": 191488,
      "write": 0,
      "output": 1332
    },
    "cost_usd": 0.1592568,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:47:01.870Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.0.0. Both AC1 tests passed, including running speck init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 1.0.0 above 0.22.0 without changing older sections. Its descriptions cover the shipped naming, panel redesign, bridge and run improvements since v0.22.0."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Inspected both refreshed PNGs: they show the current compact Build rows, black bar, tabs and decision strip in light and dark. README and brief status lines say 1.0.0 without public preview. Setup-prompt tests passed; prices.json records 2026-11-10 with refreshed rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.0.0.md covers the engineering manager, shipped changes, per-project update command, LCD removal, speck_name, estimated costs and changelog link. No person's name appears. Command, setting and link tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recomputed the current done-ticket figures: 604 shipped, 16 cancelled, 14 minutes median, 2 rounds median, 296 first-round approvals, matching README. The reported run has 1260 passes, zero failures and three skips; version/changelog matching passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0598.test.mjs",
        "issue": "The new status-line test reads README.md and asserts that its text does not contain 'preview'. The review rules permit testing the README status line's version, but require other wording and facts there to be checked by review. test/docs-0491.test.mjs also explicitly limits release tests to the version and setup prompt.",
        "suggested_fix": "Keep the README version assertion, but remove its preview-word assertion and check that wording by review. The brief's assertion may remain.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release content, refreshed pictures, prices and published figures look correct, and the reported tests pass. One new test checks README wording that the project's rules reserve for human review; remove that assertion before approval."
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
    "reviewed_sha": "089855787cee26987d2e2bbf725f97e341b8d59a",
    "session": "continued",
    "thread_id": "01a1c691-5513-7762-b1e9-6fbccbe0cd3c",
    "builder_response": "- Tests run: test/release-0598.test.mjs test/release-0574.test.mjs test/docs-0491.test.mjs test/docs-0267.test.mjs\n- F1: fixed. The README's status line is now checked only for its version; that it no longer says public preview is left to review, as the test's comment says. The brief's status line keeps the preview check.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 390702,
      "cached_input_tokens": 320256,
      "cache_write_input_tokens": 0,
      "output_tokens": 2015,
      "reasoning_output_tokens": 74
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7052,
      "cached": 128768,
      "write": 0,
      "output": 683
    },
    "cost_usd": 0.0338108,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:48:11.214Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json remains at 1.0.0. Both AC1 tests passed, including executing speck init and checking it prints speck 1.0.0."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md retains the reviewed 1.0.0 section above 0.22.0, describing the shipped changes since v0.22.0. Older sections are unchanged. Both AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both demo pictures, inspected in round 1, remain unchanged and show the current panel in light and dark. README and brief status lines say 1.0.0 without public preview. Setup-prompt and picture tests passed. prices.json records the build date, 2026-11-10."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.0.0.md retains the reviewed engineering-manager introduction, shipped changes, per-project update instructions, upgrade differences, estimated-cost explanation and changelog link. No person's name appears. All AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README figures match the independently verified done-ticket figures: 604 shipped, 16 cancelled, 14 minutes median, 2 review rounds median and 296 first-round approvals. Figure and version/changelog tests passed. This round reports 142 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0598.test.mjs",
        "issue": "The previous test checked README wording beyond the permitted status-line version.",
        "suggested_fix": "Remove the README preview-word assertion and check that wording by review.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The release preparation meets all five criteria. The test issue is fixed, the release content and pictures remain correct, and the latest checks pass. No blocking concerns remain."
  }
}
```

</details>

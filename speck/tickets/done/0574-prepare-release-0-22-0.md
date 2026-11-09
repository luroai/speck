---
id: "0574"
title: "Prepare release 0.22.0"                # one outcome, no "and"
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
after: ["0563","0564","0565","0566","0567","0568","0569","0570","0571","0572","0573"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-09T00:51:48.142Z"
approved: "2026-11-09T00:57:19.230Z"
finished: "2026-11-09T01:01:25.491Z"

---
# 0574 · Prepare release 0.22.0

**Status:** ✅ done

## Problem
Since 0.21.1, speck is on its way to deciding for you rather than asking: `watch: decide` takes every recommendation (0564), and its agent acts on its own (0567), asking about a stop only once (0566). A ticket whose criteria changed waits for you at Ship (0565), the panel lists what speck decided (0568), a size-guard split is taken by itself (0563), and speck looks into a build that runs long (0569). `speck doctor` says whether the commit check is on (0570), lint is now the ready check (0573), and two more tests are steadier (0571, 0572). Anyone following the setup prompt, or updating speck in a project, still gets 0.21.1 without them.

## Outcome
speck is ready to be released as 0.22.0.

## Acceptance criteria
1. `package.json` has version `0.22.0`, and `speck init` prints `speck 0.22.0`.
2. `CHANGELOG.md` has a 0.22.0 section above the 0.21.1 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.21.1` tag, from the tickets shipped since (checked by review). The 0.21.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.22.0, a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v0.22.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, leading with speck deciding for you and telling you, each change in it and why it matters, how to update (running the install command again in each project, then `watch: decide` in Settings to try it), anything that changes for someone upgrading from 0.21.1 (`speck lint` is now `speck check`, and still works), that costs are estimates at API list prices, and a link to the 0.22.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.22.0.

## Out of scope
- Creating the `v0.22.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.22.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The panel's new look and taking out the LCD screen, which come in a later release.
- The changes themselves: 0563 to 0573.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- A minor release, as it adds `watch: decide`, `speck watch decide` and `tell`, `speck check` and `criteria_changed` in `speck status --json`. Follows 0560 (0.21.1).
- Covers every ticket shipped since `v0.21.1`: 0563 to 0573, which it waits for, and any other that ships before this is built.
- After it ships, check that the `v0.22.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.22.0 --target main --title "speck 0.22.0" --notes-file docs/releases/v0.22.0.md`.
- Checked 2026-11-08: `package.json` is `0.21.1`.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- Failing before this build: none
- Covers every ticket shipped since `v0.21.1`: 0563 to 0573, and no others.
- Built from main at `speck(0573): Rename lint to the ready check`: 557 shipped, 16 cancelled, 13 minutes median, 1 round median, 284 approved in the first round, worked out with `test/support/figures.mjs` as 0307 did.
- `npm run prices` on 2026-11-09 wrote the rates of 3534 models, and `scripts/prices.json`'s `taken` is 2026-11-09.
- 0560's checks that named 0.21.1 as the current version now check the current version, as 0560 did for 0539, and `test/docs-0491.test.mjs` allows `test/release-0574.test.mjs` to name the version.
- Pictures: none, because the README's only changes are its status line's version and two figures, which change no layout.
- Self-check: the changelog and release notes first said a size-guard split never waits with `decide`, but a high-risk ticket's does, so both now say so; the changelog says the panel's Decided for you line shows only when speck has taken one in the last 7 days.

## In plain words
speck is now ready to go out as version 0.22.0, the release where speck can decide for you and tell you what it chose. The changelog and the release page's notes describe what's new since 0.21.1: the decide choice for the watch setting, the list of what speck decided in the panel, tickets with changed criteria waiting for you at Ship, speck asking about a stop only once, speck noticing a build that runs long, the doctor's line on the commit check and the ready check's new name. The README's and the brief's status lines say 0.22.0, the prices are today's, and the README's "Built with speck" figures are up to date (557 tickets shipped).

To see it, read the 0.22.0 section at the top of the changelog. Once this lands on the main branch, check that the 0.22.0 release page appears on GitHub; if it doesn't, it can be published by hand as the ticket's Notes say.

Worth knowing: nothing decides for you until you pick decide under Watching in Settings. Anyone already on fix will notice that size-limit splits are taken for them and that long builds get looked into.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new test "CHANGELOG.md's 0.21.1 and earlier sections are as v0.21.1 left them" compares the entire historical document text character for character.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 609,781
- Elapsed since build started: 6 min
- Changed lines: 733 (limit 5000)
- Follow-up (tidy-up): earlier release tests, such as 0560 AC2, still compare older changelog sections in full; review round 1 of this ticket found that against the rule on exact wording, so 0574 doesn't, and the older ones could go too.
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
    "reviewed_sha": "24490300dd31a1a5d9db60feab283bc231937c4d",
    "session": "fresh",
    "thread_id": "01a1bdcd-ba6f-7821-b5c3-e5a0ab379cc0",
    "builder_response": "- Tests run (speck test --related): test/release-0574.test.mjs test/release-0560.test.mjs test/docs-0491.test.mjs, plus every existing test file naming a changed file (1230 tests, 0 failing).\n- test/release-0560.test.mjs: its checks that named 0.21.1 as the current version now check the current version, as 0560 did for 0539.\n- test/docs-0491.test.mjs: release-0574 added to the release tests allowed to name the version.\n- Price table refreshed today with `npm run prices` (taken 2026-11-09, 3534 models).\n- Built with speck figures computed with test/support/figures.mjs from main at \"speck(0573): Rename lint to the ready check\": 557 shipped, 16 cancelled, 13 min median, 1 round median, 284 first-round approvals.\n- Tickets shipped since v0.21.1: 0563 to 0573; no others.\n",
    "seconds": 52,
    "usage": {
      "input_tokens": 417285,
      "cached_input_tokens": 327424,
      "cache_write_input_tokens": 0,
      "output_tokens": 1639,
      "reasoning_output_tokens": 193
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 89861,
      "cached": 327424,
      "write": 0,
      "output": 1639
    },
    "cost_usd": 0.2288544,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:56:31.027Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.22.0. The reported passing 0574 AC1 tests check both the package version and actual speck init output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.22.0 above 0.21.1 and describes shipped tickets 0563–0573. Git history confirms that scope; independent comparison confirms all earlier sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.22.0, a public preview. Passing AC3 tests cover versions and the latest-release setup prompt. scripts/prices.json contains 3534 models dated 2026-11-09, consistent with the refresh recorded in the ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.22.0.md leads with deciding and reporting choices, covers the shipped changes and upgrade instructions, explains the lint alias and estimated costs, and links to the changelog. It uses no person's name. Passing AC4 tests cover commands, installation and the changelog anchor."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation from speck/tickets/done matches the README: 557 shipped, 16 cancelled, 13 minutes median, 1 round median and 284 first-round approvals. Reported tests have zero failures, including the version/changelog consistency check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0574.test.mjs",
        "issue": "The new test \"CHANGELOG.md's 0.21.1 and earlier sections are as v0.21.1 left them\" compares the entire historical document text character for character. This freezes its wording and paragraph order, contrary to the explicit review rule prohibiting newly added exact-wording document tests.",
        "suggested_fix": "Remove the full-text equality test and verify preservation of the older sections by review of the release diff. Retain tests of document facts such as versions, commands and links.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release content, versions, prices and published figures meet the ticket, and the reported tests pass. One new test must be removed because it would make future editorial corrections to older changelog entries fail the suite."
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
    "reviewed_sha": "452400e7f2ba52fde0bb26f8537bff01f51c2d05",
    "session": "continued",
    "thread_id": "01a1bdcd-ba6f-7821-b5c3-e5a0ab379cc0",
    "builder_response": "- Tests run: test/release-0574.test.mjs test/release-0560.test.mjs test/docs-0491.test.mjs\n- F1: fixed. Removed the full-text comparison of the older changelog sections from test/release-0574.test.mjs; that the 0.21.1 and earlier sections are unchanged is left to review of the diff, and the test file's comment says so.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 607380,
      "cached_input_tokens": 509952,
      "cache_write_input_tokens": 0,
      "output_tokens": 2401,
      "reasoning_output_tokens": 193
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7567,
      "cached": 182528,
      "write": 0,
      "output": 762
    },
    "cost_usd": 0.0410068,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:57:07.808Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.22.0. Both AC1 tests passed, including running speck init and checking its version output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.22.0 above 0.21.1 and describes shipped tickets 0563–0573 in plain English. Independent comparison with v0.21.1 confirms the older sections remain unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines say 0.22.0, a public preview. AC3 version and setup-prompt tests passed. scripts/prices.json contains 3534 models dated 2026-11-09, matching the recorded refresh."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.22.0.md leads with speck deciding and reporting its choices, explains the shipped changes, update steps, watch setting, lint alias and estimated costs, and links to the changelog. It names no person. All three AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README figures match the previously independently recalculated done-ticket figures: 557 shipped, 16 cancelled, 13 minutes median, 1 round median and 284 first-round approvals. Both AC5 tests passed. This round reports 138 passing tests, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0574.test.mjs",
        "issue": "The added full-text comparison froze the wording of older changelog sections.",
        "suggested_fix": "Remove the full-text comparison and verify preservation through review of the diff.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The release preparation meets all five criteria. The test that froze older changelog wording has been removed, and the remaining checks pass. The change is ready for the product owner's merge decision."
  }
}
```

</details>

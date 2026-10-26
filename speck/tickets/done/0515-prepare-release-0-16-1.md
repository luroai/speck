---
id: "0515"
title: "Prepare release 0.16.1"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-26-prepare-release-0-16-1.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0514"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T14:47:39.378Z"
approved: "2026-10-26T14:51:31.143Z"
finished: "2026-10-26T14:55:52.851Z"

---
# 0515 · Prepare release 0.16.1

**Status:** ✅ done

## Problem
Since 0.16.0, Settings can turn same-model review on or off, speck's watching is slower, the Auto-build-off dot is grey, and a trackpad lane-swipe fix is on the way. Anyone following the setup prompt, or updating speck on another machine, still gets 0.16.0 without them.

## Outcome
speck is ready to be released as 0.16.1.

## Acceptance criteria
1. `package.json` has version `0.16.1`, and `speck init` prints `speck 0.16.1`.
2. `CHANGELOG.md` has a 0.16.1 section above the 0.16.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.16.0` tag, from the tickets shipped since (checked by review). The 0.16.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.16.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.16.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix or small change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.16.0, and a link to the 0.16.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.16.1.

## Out of scope
- Creating the `v0.16.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.16.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The fixes themselves: 0511, 0512, 0513 and 0514.

## Notes
- Asked for 2026-10-26 as a patch after 0.16.0, once everything else open is done. Follows 0507 (0.16.0). The open work when this was written was 0514; 0511 to 0513 had already shipped.
- Covers every ticket shipped since `v0.16.0`: 0511, 0512, 0513 and 0514, which it waits for (`after:` includes 0514), and any other that ships before this is built.
- After it ships, check that the `v0.16.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.16.1 --target main --title "speck 0.16.1" --notes-file docs/releases/v0.16.1.md`.
- Checked 2026-10-26: `package.json` is `0.16.0`. 0346 prepared the 0.10.3 patch the same way.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC5's README figures aren't tested in the README, as 0491 left the rule: `test/release-0515.test.mjs` checks the figures worked out from `speck/tickets/done/` at the commit this was built from (498 shipped, 16 cancelled, 13 minutes, 1 round, 254 in round 1), and the reviewer checks the README gives them.
- `test/release-0507.test.mjs`'s checks of the current version now follow `package.json`, as 0507 did for 0452, and `test/docs-0491.test.mjs` lets `test/release-0515.test.mjs` read the README for its status line and setup prompt, as it does every release test.
- Shipped since `v0.16.0`: 0511, 0512, 0513 and 0514, and no others.
- Self-check: dropped an upgrade note saying to reload an open panel, as the panel already picks up its own new code; each other claim checked against the four shipped tickets.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is now ready to go out as version 0.16.1, a small bug-fix release. It gathers the four fixes since 0.16.0: a calmer speck while builds run, trackpad swipes between lanes that keep working without a click, a dot by speck's name that goes grey while Auto-build is off, and a switch in Settings for letting the reviewer use the same model as the builder. The changelog, the release page's notes, the version shown when you install speck and the "Built with speck" figures in the README are all updated.

Once this lands, the release page and its tag should appear by themselves. Check the repository's Actions tab afterwards: if they didn't, the ticket's Notes give the one command to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 206,410
- Elapsed since build started: 4 min
- Changed lines: 57 (limit 5000)
- Follow-ups: none. After it ships, check that the `v0.16.1` tag and GitHub release appeared.

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
    "reviewed_sha": "3695d3cb4716c1643b6361deb2b35a102f8c8212",
    "session": "fresh",
    "thread_id": "01a178b1-61f8-7c21-be85-36becb21f9a4",
    "builder_response": "- Tests run: test/release-0515.test.mjs test/release-0507.test.mjs test/docs-0491.test.mjs, with `--related` (938 tests, 935 pass, 3 skipped, 0 fail).\n- Shipped since v0.16.0: 0511, 0512, 0513, 0514 (git log v0.16.0..HEAD, \"speck(<id>): ship\").\n- README figures recomputed with test/support/figures.mjs at 7fefb3d9 (main's head when built): 498 shipped, 16 cancelled, 13 min, 1 round, 254 first round.\n- test/release-0507.test.mjs's current-version checks now follow package.json, as 0507 did for 0452.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 205524,
      "cached_input_tokens": 154880,
      "cache_write_input_tokens": 0,
      "output_tokens": 886,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T14:51:22.515Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.16.1. Both 0515 AC1 tests passed, including running init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.16.1 above 0.16.0 and describes the changes from shipped tickets 0511–0514. Git history confirms no other tickets shipped since v0.16.0. The passing AC2 preservation test confirms older sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say '0.16.1, a public preview'. Passing AC3 tests verify their versions and that the setup prompt retains the quoted latest-release install command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.16.1.md introduces the bug-fix release, explains all four shipped changes, gives the per-project update command and upgrade implications, and names no person. Passing AC4 tests check commands, settings and the changelog anchor."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation using builtWithSpeckFigures over current done tickets gives 498 shipped, 16 cancelled, 13 median minutes, 1 median round and 254 first-round approvals, matching README.md. AC5 tests passed. The full supplied output confirms 935 passes, 3 skips and no failures."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, release notes and published figures are consistent with the shipped work. Tests cover the release checks and report no failures. No blocking concerns found; tagging and publishing remain for the release workflow after merge."
  }
}
```

</details>

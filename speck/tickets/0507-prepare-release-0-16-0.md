---
id: "0507"
title: "Prepare release 0.16.0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0502", "0503", "0504", "0505", "0506", "0508", "0509", "0510"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T23:37:58.835Z"

---
# 0507 · Prepare release 0.16.0

**Status:** 🔍 reviewing

## Problem
Since 0.15.0, speck has a new watching animation, the scene it's in most of the time while builds run, and a ship check that keeps private words and home folder paths out of what it publishes. None of it is in a release yet, so projects that install speck don't get it.

## Outcome
speck 0.16.0 is ready to tag, with its changelog and release notes.

## Acceptance criteria
1. `package.json` has version `0.16.0`, and `speck init` prints `speck 0.16.0`.
2. `CHANGELOG.md` has a 0.16.0 section above the 0.15.0 one. It describes, in plain English, what someone using speck can now do since the `v0.15.0` tag, from the tickets shipped since (checked by review). The 0.15.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.16.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.16.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release, what's new and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.15.0, and a link to the 0.16.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.16.0.

## Out of scope
- Tagging and publishing the release: the release workflow does both when this ships to main (0240).

## Notes
- Asked for by the user on 2026-10-25: "Set all tickets in plan as ready, then create a release."
- What's new since `v0.15.0`, for the changelog: speck watches a little retro TV for each build, with 21 things it does at random while it watches, from ticking off its checklist and popcorn to Pong, a spider and a drumroll (0502 to 0505); and `speck ship` refuses to publish a private word or your home folder's path in anything under `speck/`, writing home paths as `~/` (0506); and a not-pushed warning clears once its ticket is on the remote, even if its commit was rewritten (0508); `speck panel --background` and `--stop` (0509); and setup ending with the panel open, in the agent's own browser where it has one, and `speck run` on (0510). Check each against `git log v0.15.0..HEAD`.
- Same shape as 0452 (release 0.15.0).
- Waits for 0502 to 0506, and 0508 to 0510, added by the user on 2026-10-25.
- Failing before this build: none
- AC5's README figures aren't tested in the README, as 0491 left the rule: `test/release-0507.test.mjs` checks the figures worked out from `speck/tickets/done/` at the commit this was built from (493 shipped, 16 cancelled, 13 minutes, 1 round, 251 in round 1), and the reviewer checks the README gives them.
- `test/release-0452.test.mjs`'s checks of the current version now follow `package.json`, as 0452 did for 0394, and `test/docs-0491.test.mjs` lets `test/release-0507.test.mjs` read the README for its status line and setup prompt, as it does every release test.
- The 21 things speck does while it watches: 0502's 3 beats, 0503's 8, 0504's 4 and 0505's 6.
- Self-check: no changes. Each claim was checked against the shipped tickets and the code (the ship check, `~/` paths in review, close and changes, and `speck panel --background`'s log file).
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is ready to go out as version 0.16.0, a minor release. Its headline is speck watching a little retro TV for each build, with 21 things it does at random while it watches. It also brings the ship check that keeps private words and home folder paths out of what speck publishes, the panel running in the background, and setup ending with the panel open and automatic building on. The changelog and release notes describe the eight tickets shipped since 0.15.0, the version shown everywhere now says 0.16.0, and the "Built with speck" figures in the README are up to date. Once it ships, check that the 0.16.0 release page appears on GitHub.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none.

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
    "reviewed_sha": "9dea60757cc689a120b037017adc801f896dd5d8",
    "session": "fresh",
    "thread_id": "01a17570-7828-77d1-a152-ebb49ee70c50",
    "builder_response": "- Tests run: test/release-0507.test.mjs test/release-0452.test.mjs test/docs-0491.test.mjs, with `--related` (every test file naming README.md, docs/brief.md, CHANGELOG.md or package.json) and the checks files.\n- README figures worked out with `builtWithSpeckFigures(doneTicketsAt(...))` at `speck(0505): Let speck's TVs play tricks while it watches` (main when built): 493 shipped, 16 cancelled, 13 min, 1 round, 251 first round.\n- The 0.15.0 and earlier changelog sections are compared byte for byte against `v0.15.0:CHANGELOG.md`.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 155933,
      "cached_input_tokens": 104320,
      "cache_write_input_tokens": 0,
      "output_tokens": 1054,
      "reasoning_output_tokens": 82
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T23:41:35.389Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json sets 0.16.0. Both 0507 AC1 tests passed, including running speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.16.0 above 0.15.0 and describes the shipped changes from tickets 0502–0506 and 0508–0510, confirmed against git log v0.15.0..HEAD and the done tickets. The older-sections comparison test passed; the git diff confirms only a new section was added."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md both say 0.16.0, a public preview. The status-version and latest-release setup-prompt tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.16.0.md introduces the minor release, explains its benefits, gives the per-project update command and upgrade implications, and links to the correct changelog anchor. Its claims match the shipped tickets and it names no person. The command, feature-name and link tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated the done-ticket figures: 493 shipped, 16 cancelled, 13 minutes median, 1 review round median and 251 first-round approvals; README.md matches. The figures and version/changelog tests passed. The supplied run reports 923 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, release notes and README figures are consistent with the shipped work. The reported tests pass, and I found no blocking issues. Ready for the owner's merge decision."
  }
}
```

</details>

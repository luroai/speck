---
id: "0360"
title: "Prepare release 0.11.0"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0359"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T14:46:34.885Z"
approved: "2026-10-21T14:50:07.356Z"
finished: "2026-10-21T14:52:47.878Z"

---
# 0360 · Prepare release 0.11.0

**Status:** ✅ done

## Problem
0350 to 0357 and 0359 add document tasks: a ticket can write a document instead of code, into a folder it names inside `outputs/`, which git ignores. The reviewer checks the document passage by passage, the review pack opens it, and it waits for the user to ship it or ask for changes. Anyone following the setup prompt, or updating speck on another machine, gets 0.10.3 without them.

## Outcome
speck is ready to be released as 0.11.0.

## Acceptance criteria
1. `package.json` has version `0.11.0`, and `speck init` prints `speck 0.11.0`.
2. `CHANGELOG.md` has a 0.11.0 section above the 0.10.3 one. It describes, in plain English, what someone using speck can now do since the `v0.10.3` tag, from the tickets shipped since: what a document task is, how to make one, where its document goes, how it's reviewed, and shipping it or asking for changes, which works for code tickets too (checked by review). The 0.10.3 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.11.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.11.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release that adds document tasks, what's new and why it matters, how to update (running the install command again in each project, which also adds `/outputs/` to `.gitignore`), anything that changes for someone upgrading from 0.10.3, and a link to the 0.11.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.11.0.

## Out of scope
- Creating the `v0.11.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.11.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- Writing document tasks into the brief's principles or the positioning: that waits until more tasks have shipped.

## Notes
- Asked for 2026-10-21 as a minor release, the first with document tasks. Follows 0346 (0.10.3).
- Covers every ticket shipped since `v0.10.3`: 0350 to 0357, 0359, which it waits for (`after:`), and any other that ships before this is built. 0358 was a trial run of a document task, which changed nothing in speck, so it needn't be mentioned.
- The two follow-up notes from 0356 and 0357 (the brief's description of Ask for changes, and calling the next round a changes round) are still ideas, not in this release.
- After it ships, check that the `v0.11.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.11.0 --target main --title "speck 0.11.0" --notes-file docs/releases/v0.11.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.10.3`: 0350 to 0357 and 0359, with 0358 left out as the ticket says, and no others.
- Built from main at `speck(0359): Open a document task's document from the top of its review pack`: 343 shipped, 16 cancelled, 12 minutes median, 1 review round median (written "1 review round", as the README had it before 0307), 170 approved in the first round, worked out as 0307 did, with its figures test.
- 0346's checks that named 0.10.3 as the current version now check the current version, and its figures test checks only the figures 0.10.3 was built from, as 0346 did for 0343.
- Self-check: narrowed the changelog's line on when `speck changes` refuses: a session that can't be resumed is the reason, of which a ticket `speck run` didn't build is one example.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as 0.11.0, the first release with document tasks. A ticket can now have its build write a document, such as an email or a plan, into a folder of your choosing inside the project's outputs folder, rather than changing code. The reviewer reads it and quotes the passages behind each verdict, the review pack opens with a button for it, and it always waits for you to read it and ship it yourself. You can also send any approved ticket back with a note saying what to change. The changelog has a 0.11.0 section, the release page's notes say what's new, how to update and what changes when upgrading, and the README and the brief now say 0.11.0. The README's "Built with speck" figures are up to date: 343 tickets shipped, 12 minutes median and 170 approved in the first review round. Once this lands, the release page should appear on GitHub by itself: worth checking it did, and the ticket's Notes say how to publish it by hand if not.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 148,723
- Elapsed since build started: 4 min
- Changed lines: 73 (limit 5000)
- Follow-ups: none.
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
    "reviewed_sha": "03ad975231e4aedbac3fbb48fa9eb64b77c18f90",
    "thread_id": "01a15ef0-2148-7ae2-b70f-a3d130109d93",
    "seconds": 42,
    "usage": {
      "input_tokens": 147532,
      "cached_input_tokens": 103296,
      "cache_write_input_tokens": 0,
      "output_tokens": 1191,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T14:49:59.659Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.11.0. Both 0360 AC1 tests passed, including running the real init command and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.11.0 above 0.10.3 and explains creating, storing, reviewing and shipping documents, plus requesting changes for code and documents. Claims match shipped tickets 0350–0357 and 0359. Independently compared the 0.10.3-and-earlier text against main: unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md both say '0.11.0, a public preview'. The passing 0360 AC3 tests check both versions and verify that the setup prompt retains the quoted latest-release install command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.11.0.md opens with a short paragraph explaining the minor release and its value, then provides features, installation, upgrade implications and a changelog link. Its claims agree with the shipped tickets and scripts/changes.mjs, scripts/run-switch.mjs and the panel's sandboxed document serving. No person's name appears. All four AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated from the current speck/tickets/done/: 343 shipped, 16 cancelled, 12 minutes median, 1 review round median and 170 first-round approvals, matching README.md. The figures and version/changelog tests passed. Full recorded targeted output confirms 130 passed, zero failed and three skipped; changes to the previous release tests appropriately preserve historical checks while allowing the current version to advance."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release is ready for the owner's merge decision. Version numbers, release notes and changelog consistently describe document tasks and asking for changes. The published usage figures match the shipped tickets, older changelog entries are unchanged, and the targeted tests pass."
  }
}
```

</details>

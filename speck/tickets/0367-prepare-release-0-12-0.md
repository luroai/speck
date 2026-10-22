---
id: "0367"
title: "Prepare release 0.12.0"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0366"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T16:23:48.883Z"
approved: "2026-10-22T16:27:20.702Z"

---
# 0367 · Prepare release 0.12.0

**Status:** 👍 approved

## Problem
0361 to 0366 make the panel calmer in a narrow pane, such as Cursor's or the Claude desktop app's: a finished document task is a short row, a document opens in a pop-up you can ship it from, the header is one row with the project always shown, and the Foreman's status scrolls across a dot-matrix notice board whose detail opens in a pop-up. Anyone following the setup prompt, or updating speck on another machine, gets 0.11.0 without them.

## Outcome
speck is ready to be released as 0.12.0.

## Acceptance criteria
1. `package.json` has version `0.12.0`, and `speck init` prints `speck 0.12.0`.
2. `CHANGELOG.md` has a 0.12.0 section above the 0.11.0 one. It describes, in plain English, what someone using speck can now do since the `v0.11.0` tag, from the tickets shipped since (checked by review). The 0.11.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.12.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.12.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release that reworks the panel for narrow panes, what's new and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.11.0, and a link to the 0.12.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.12.0.

## Out of scope
- Creating the `v0.12.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.12.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-22 as a release of the panel changes found using speck in Cursor. A minor release, as it adds features (pop-ups, shipping from a document, the notice board) without breaking anything. Follows 0360 (0.11.0).
- Covers every ticket shipped since `v0.11.0`: 0361 to 0366, which it waits for (`after:`), and any other that ships before this is built.
- After it ships, check that the `v0.12.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.12.0 --target main --title "speck 0.12.0" --notes-file docs/releases/v0.12.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.11.0`: 0361 to 0366, and no others.
- Built from main at `speck(0366): Open the Foreman's detail in a pop-up over the whole panel`: 350 shipped, 16 cancelled, 12 minutes median, 1 review round median, 174 approved in the first round, worked out as 0307 did, with its figures test.
- 0360's checks that named 0.11.0 as the current version now check the current version, and its figures test checks only the figures 0.11.0 was built from, as 0360 did for 0346.
- Checked that an open panel page notices the new release: the page compares its own copy with `templates/panel.html`, which 0361 to 0366 changed, and the Foreman's button then says Reload page.
- Self-check: widened the changelog's line on which document-task rows look as before to match 0361 AC4 (blocked and shipping too).
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as version 0.12.0, the release with the panel changes for narrow panes such as Cursor's: the calm row for a finished document, documents in a pop-up you can ship from, the one-row header and the Foreman's scrolling notice board. The changelog has a 0.12.0 section, the README and the brief say 0.12.0, the README's "Built with speck" figures are up to date (350 tickets shipped), and the notes for the GitHub release page are written. Nothing about how speck works changes in this ticket. Once it lands, the release workflow should tag 0.12.0 and publish its release page: check it appeared in the repository's Actions tab.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 155,393
- Elapsed since build started: 4 min
- Changed lines: 64 (limit 5000)
- Follow-ups: none.

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
    "reviewed_sha": "ab1648b8db3e785416c37023b244468c26e12277",
    "thread_id": "01a1646f-9420-7da2-8633-1dd17d9fd74a",
    "seconds": 36,
    "usage": {
      "input_tokens": 154512,
      "cached_input_tokens": 104960,
      "cache_write_input_tokens": 0,
      "output_tokens": 881,
      "reasoning_output_tokens": 24
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T16:27:12.601Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json specifies 0.12.0. Both 0367 AC1 tests passed, including running speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.12.0 above 0.11.0 and leaves older sections unchanged. Its descriptions match shipped tickets 0361–0366, verified as the only tickets shipped since v0.11.0. The changelog fact checks passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say '0.12.0, a public preview'. Passing AC3 tests verify the version lines and unchanged latest-release setup prompt."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.12.0.md opens with a short paragraph explaining the minor release and narrow-pane improvements. It includes update instructions for each project, upgrade details and the changelog link, without personal names. Claims match tickets 0361–0366; release-note fact and link tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recomputed figures from current done tickets: 350 shipped, 16 cancelled, 12 minutes median, 1 review round median and 174 first-round approvals, matching README.md. The figures and version/changelog tests passed. Reported targeted run: 141 passed, zero failed, three skipped; existing test changes appropriately accommodate the new release."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, release notes and project statistics are consistent with the six shipped panel improvements. The targeted tests pass, and no blocking issues were found. Tagging and publication remain with the existing release workflow."
  }
}
```

</details>

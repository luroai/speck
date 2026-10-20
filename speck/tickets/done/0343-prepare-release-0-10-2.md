---
id: "0343"
title: "Prepare release 0.10.2"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0340","0341","0342"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T20:56:29.718Z"
approved: "2026-10-20T20:58:47.177Z"
finished: "2026-10-20T21:01:19.567Z"

---
# 0343 · Prepare release 0.10.2

**Status:** ✅ done

## Problem
0340 to 0342 make a build's log in the panel read the same whichever agent builds it: Cursor and Codex lines get times, and their reads, edits and searches show as Claude Code's do. Anyone following the setup prompt, or updating speck on another machine, gets 0.10.1 without the fixes.

## Outcome
speck is ready to be released as 0.10.2.

## Acceptance criteria
1. `package.json` has version `0.10.2`, and `speck init` prints `speck 0.10.2`.
2. `CHANGELOG.md` has a 0.10.2 section above the 0.10.1 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.10.1` tag, from the tickets shipped since (checked by review). The 0.10.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.10.2, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.10.2.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.10.1, and a link to the 0.10.2 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.10.2.

## Out of scope
- Creating the `v0.10.2` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.10.2.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-20 as a patch release. Follows 0339 (0.10.1).
- Covers every ticket shipped since `v0.10.1`: 0340, 0341 and 0342, which it waits for (`after:`), and any other that ships before this is built.
- After it ships, check that the `v0.10.2` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.10.2 --target main --title "speck 0.10.2" --notes-file docs/releases/v0.10.2.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.10.1`: 0340, 0341 and 0342, and no others.
- Built from main at `speck(0342): Show when each Codex build log entry happened`: 326 shipped, 16 cancelled, 13 minutes median, 1.5 rounds median, 161 approved in the first round, worked out as 0307 did, with its figures test.
- 0339's checks that named 0.10.1 as the current version now check the current version, and its figures test checks only the figures 0.10.1 was built from, as 0339 did for 0336.
- Self-check: narrowed the claim that every Cursor step gets a time to its messages and commands, which 0340 backs, and added that a `speck run` still on its old code starts Codex builds without times.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as 0.10.2, a bug-fix release. Its fixes make a build's log in the panel read the same whichever agent builds: Cursor and Codex builds' lines now show the time they happened, and their commands, file reads, edits and searches show under the same names as a Claude Code build's. The changelog has a 0.10.2 section, and the release page's notes say what's fixed, how to update and what changes when upgrading. The README and the brief now say 0.10.2, and the README's "Built with speck" figures are up to date: 326 tickets shipped and 161 approved in the first review round. Once this lands, the release page should appear on GitHub by itself. Worth checking that it did: the ticket's Notes say how to publish it by hand if not.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 199,753
- Elapsed since build started: 2 min
- Changed lines: 51 (limit 5000)
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
    "reviewed_sha": "22ca86281bcb72214f888f9901a6f7581719fe83",
    "thread_id": "01a15b1b-7558-74b1-bfad-749915296036",
    "seconds": 32,
    "usage": {
      "input_tokens": 198543,
      "cached_input_tokens": 150272,
      "cache_write_input_tokens": 0,
      "output_tokens": 1210,
      "reasoning_output_tokens": 56
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T20:58:40.001Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.10.2. Both 0343 AC1 tests passed, including invoking speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.10.2 above 0.10.1 without changing older sections. Its claims match shipped tickets 0340–0342 and the build-log and timestamp code. The section/install-command test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.10.2, a public preview. The setup prompt is unchanged. Both 0343 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.10.2.md explains the bug-fix release, log improvements, update command for each project and upgrade caveats, and links to the changelog. Claims agree with shipped tickets and code; no person's name appears. All three 0343 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculating the current done tickets gives 326 shipped, 16 cancelled, 13 minutes median, 1.5 rounds median and 161 first-round approvals, matching README.md. Both AC5 tests passed. Recorded targeted output confirms 129 passed, three skipped and no failures; historical test updates preserve relevant coverage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Release 0.10.2 is ready for the owner's merge decision. The version, release notes and README figures are consistent with the shipped changes. All targeted checks passed, and no blocking issues were found."
  }
}
```

</details>

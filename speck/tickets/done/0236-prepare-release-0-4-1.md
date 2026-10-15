---
id: "0236"
title: Prepare release 0.5.0                # one outcome, no "and"
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
after: ["0227","0228","0229","0230","0231","0232","0233","0234","0235","0237","0238","0239","0240"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:00:22.014Z"
approved: "2026-10-15T23:04:00.196Z"
finished: "2026-10-15T23:05:49.141Z"

---
# 0236 · Prepare release 0.5.0

**Status:** ✅ done

## Problem
Builds spend most of their time running speck's test suite: about 8 minutes on an 8 GB MacBook Air, several times per ticket, with test runs from builds side by side taking over the computer. A build could also end itself while its suite ran in the background. The 0.5.0 tickets run the whole suite once per ticket, when it ships, make test runs take turns at a low priority, make the suite faster and keep test runs in the foreground, and anyone following the README's setup prompt still gets 0.4.0.

## Outcome
speck is ready to be released as 0.5.0.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `package.json` has version `0.5.0`, and `speck init` prints `speck 0.5.0`.
2. `CHANGELOG.md` has a 0.5.0 section above the 0.4.0 one. It describes, in plain English and under a few headings, what someone using speck will notice is fixed or changed since the `v0.4.0` tag, from the tickets shipped since. The 0.4.0 section is unchanged.
3. The README's setup prompt names `v0.5.0`, and the README's and the brief's status lines say 0.5.0, a public preview, and the README's "How you work with it" says that a build runs the ticket's own tests and that the whole suite runs when a ticket ships.
4. `docs/releases/v0.5.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release in which a ticket gets one whole test run, when it ships, and test runs no longer take over the computer, the three to five changes that matter most, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.4.0 (including that the reviewer no longer sees a whole-suite run, and that `speck test --files` waits its turn), and a link to the 0.5.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0210 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.5.0.

## Out of scope
- Creating the `v0.5.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.0.md` when this lands on `main`.
- The fixes planned for 0.5.1 (0213 to 0225, released by 0226).

## Notes
- Asked for 2026-10-15, for minor release 0.5.0, renamed from patch release 0.4.1 once 0235, 0238 and 0239 changed how builds run tests. Follows 0210 (0.4.0) and 0106 (0.3.0).
- Waits for every ticket planned for this release (0227 to 0235, and 0237 to 0239), so they're in it. Changes for speck's own test suite only (0229 to 0234) belong under a short heading for people working on speck, or are left out of the release notes.
- After it ships, check that the `v0.5.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.0 --target main --title "speck 0.5.0" --notes-file docs/releases/v0.5.0.md`.
- Failing before this build: none
- The 0210 release tests named 0.4.0 as the current version and checked the README's figures as they are now; they now check the current version, and the figures as 0210 shipped them, as 0210 did for 0106's. Their helper that reads done tickets from a commit moved to `test/support/release.mjs` for 0236's tests to share.
- Built with speck figures worked out from `speck/tickets/done/` at `speck(0239): Keep the computer usable while speck runs tests`, the same way as 0210: 209 shipped, 16 cancelled, 15 minutes, 1 round, 105 approved in the first round.
- Self-check: narrowed the changelog's and release notes' claim that builds wait for their test runs, since 0227 tells the builder to rather than enforcing it. Also ran the other test files that read the README (18 files): all pass.

## In plain words
speck is ready to be released as version 0.5.0. Once this lands, the setup instructions in the README install 0.5.0, and the version's tag and release page should appear on GitHub by themselves a minute or so later. The changelog and the release page explain what's changed since 0.4.0: a ticket's full set of tests runs once, when it ships, rather than several times while it's built, and test runs take turns and give way to your own programs. The README's figures on how speck is built with speck are brought up to date. To see it, read the new changelog section and the release notes, and after it ships check the repository's Releases page. Worth keeping an eye on: this is the first release the automatic publishing has handled, so if no release page appears, it can be published by hand as the ticket's notes say.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 220,514
- Elapsed since build started: 4 min
- Changed lines: 70 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The brief's "Releases" section still says the maintainer tags each release by hand, which 0240 automated. Saved to the inbox: `speck/ideas/2026-10-15-say-in-the-brief-that-releases-publish-themselves.md`.

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
    "reviewed_sha": "c6fbe7d5fd73203d5bfa53f9dd192ae1da6428fe",
    "thread_id": "01a141ce-28af-70d3-979e-b257c54f2586",
    "seconds": 33,
    "usage": {
      "input_tokens": 219040,
      "cached_input_tokens": 165120,
      "cache_write_input_tokens": 0,
      "output_tokens": 1474,
      "reasoning_output_tokens": 45
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:03:45.085Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.5.0. Both 0236 AC1 tests passed, including invoking speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.5.0 above 0.4.0 under four headings, covering shipped tickets 0227–0235 and 0237–0240. Both AC2 tests passed; independent comparison with v0.4.0 confirms its section is unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md updates the setup prompt, public-preview status and build/ship testing description; docs/brief.md updates its status. All three AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.5.0.md contains the requested paragraph, five main changes, installation command, upgrade guidance and changelog link, without personal names. Claims match the shipped tickets. All three AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation from the current done directory confirms 209 shipped, 16 cancelled, 15 minutes median, one review round median and 105 first-round approvals. Both AC5 tests passed; all 25 tests in the supplied release-test output passed. Historical 0210 checks retain coverage appropriate to that release."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The version, setup instructions, changelog and release notes consistently prepare speck 0.5.0. The notes reflect the shipped changes, the published figures match the ticket records, and the release tests pass. Ready for the owner's merge decision."
  }
}
```

</details>

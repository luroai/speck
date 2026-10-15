---
id: "0210"
title: "Prepare release 0.4.0"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0198", "0199", "0200", "0201", "0202", "0203", "0204", "0205", "0206", "0207", "0208", "0209", "0211", "0212"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T15:58:43.144Z"
approved: "2026-10-15T16:09:28.696Z"

---
# 0210 · Prepare release 0.4.0

**Status:** 👍 approved

## Problem
Over 70 tickets have shipped since the `v0.3.0` tag on 11 October, including speck run's ship queue, testing the merged result before a ship, retrying chance test failures and the fixes for leaked processes. Anyone following the README's setup prompt still gets 0.3.0.

## Outcome
speck is ready to be released as 0.4.0.

## Acceptance criteria
1. `package.json` has version `0.4.0`, and `speck init` prints `speck 0.4.0`.
2. `CHANGELOG.md` has a 0.4.0 section above the 0.3.0 one. It describes, in plain English and under a few headings, what someone using speck can do or will notice that's new since the `v0.3.0` tag, from the tickets shipped since. The 0.3.0 section is unchanged.
3. The README's setup prompt names `v0.4.0`, and the README's and the brief's status lines say 0.4.0, a public preview.
4. The brief's principle 7 describes how builds and shipping work in this release: builds end at approved, one ship queue in `speck run` ships tickets one at a time, and `max_parallel_builds` sets how many builds run at once (1 unless changed).
5. No test that passed before this change fails. The test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.4.0.
6. `docs/releases/v0.4.0.md` holds the notes for the GitHub release page, written for someone deciding whether to try speck or upgrade: one short paragraph on what speck is and what this release is about, the three to five changes that matter most and why, how to install it (the setup prompt's command), what changes for someone upgrading from 0.3.0 (including that only `speck run` ships auto-ship tickets now, so it must be on), and a link to the full 0.4.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
7. The README's "Built with speck" figures (tickets shipped and cancelled, the median time from a build starting to its ticket shipping, and the median review rounds with how many were approved first time) are worked out again from `speck/tickets/done/` as it is when this is built, the same way as before, and match it.

## Out of scope
- Creating and pushing the `v0.4.0` tag, and publishing the GitHub release from `docs/releases/v0.4.0.md`, which the maintainer does once this has shipped.
- The jobs design (planned for 0.5.0).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Follows the release process in the brief's "Releases" section and 0106 (0.3.0).
- Waits for every ticket planned for this release, so they're in it.
- The tag goes on straight after this ships, since until then the README points at a tag that doesn't exist yet. Then the GitHub release: `gh release create v0.4.0 --verify-tag --title "speck 0.4.0" --notes-file docs/releases/v0.4.0.md`.
- Checked 2026-10-15: the repo has tags `v0.2.0` and `v0.3.0` but no GitHub releases yet (`gh release list`), so this is the first release page.
- Failing before this build: none
- The 0106 release tests named 0.3.0 as the current version; they now check the current version, as 0106 did for 0092's. 0106's checks that the 0.3.0 section sits above 0.2.0 and that 0.2.0 is unchanged stay.
- Built with speck figures worked out from `speck/tickets/done/` at the commit this was built from (`speck(0212): Recover a ship that was stopped partway`): shipped = status done, cancelled = status cancelled, minutes = median of `finished` − `started`, rounds = median of the Delivery log's "Review rounds", first time = rounds of 1. The same method gives the figures last set in `Lead with judgement: new tagline and README opening` exactly (131, 13, 10 minutes, 1 round, 67).
- Self-check: the changelog and release notes claimed every failing run gets a second try; narrowed to when `commands.test_files` is set, and added an upgrade note saying so. Principle 7's wording avoids phrases the 0111 check treats as parallel builds. The full suite then caught the new tests naming commits by id (0085 AC3); they now find them by message.

## In plain words
speck is ready to go out as version 0.4.0. Its version number, the setup instructions in the README and the design notes all say 0.4.0, and the changelog has a new section describing, in plain words, everything someone using speck will notice since 0.3.0. There's also a ready-written page of release notes for the GitHub release, covering what speck is, the five changes that matter most, how to install it and what to know when upgrading, chiefly that auto-shipped tickets now only ship while speck run is on. The "Built with speck" figures in the README are up to date: 195 tickets shipped, 16 cancelled, a median of 14 minutes from a build starting to shipping, and 100 approved in the first review round.
To see it, read the top of the changelog and the new release notes page. Nothing changes until the 0.4.0 tag is created and pushed, which should happen straight after this ships, since until then the README points at a version that doesn't exist yet.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 235,597
- Elapsed since build started: 11 min
- Changed lines: 87 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The brief's principle 7 reasons and the README's "One build at a time" point still say builds never run side by side, while `max_parallel_builds` can raise it (reviewer's minor F1). Inbox: speck/ideas/2026-10-15-say-how-many-builds-run-at-once-the-same-way-everywhere.md.
  - Tidy-up: the brief's Success measures still quote the figures as of 11 October (104 tickets), and its Releases section uses `v0.3.0` as its example tag.
  - After shipping: create and push the `v0.4.0` tag, then `gh release create v0.4.0 --verify-tag --title "speck 0.4.0" --notes-file docs/releases/v0.4.0.md`.

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
    "reviewed_sha": "ec4709694e5af0d52098c7e297e410323ae372a8",
    "thread_id": "01a14052-65c4-7890-af84-cc64a5e6e818",
    "seconds": 47,
    "usage": {
      "input_tokens": 234039,
      "cached_input_tokens": 186624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1558,
      "reasoning_output_tokens": 113
    },
    "tests": {
      "failing": 0,
      "second_try": [
        "0176: the board stays quick to read however many tickets are built > 0176 AC1 and AC2 > 0176 AC1: with 200 finished builds, logs 10 times bigger add less than 10% to how long speck status --json takes"
      ]
    },
    "saved_at": "2026-10-15T16:09:10.846Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json specifies 0.4.0. Both 0210 AC1 tests passed, including running init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds a grouped, plain-English 0.4.0 section matching shipped tickets. Both AC2 tests passed, including the hash check preserving the 0.3.0 section."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md names v0.4.0 in the setup prompt; README.md and docs/brief.md identify 0.4.0 as a public preview. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Principle 7 states that builds end at approved, one speck run queue ships serially, and max_parallel_builds controls concurrent builds with a default of 1. AC4 passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0210-tests.txt confirms all 13 release tests passed. The full suite passed under the existing retry policy: its sole failing performance test passed on retry."
      },
      {
        "id": 6,
        "status": "pass",
        "evidence": "docs/releases/v0.4.0.md contains the introduction, five main changes, installation command, upgrade guidance and changelog link, without personal names. Claims align with shipped tickets including 0148, 0192–0195 and 0212. All three AC6 tests passed."
      },
      {
        "id": 7,
        "status": "pass",
        "evidence": "Independent recalculation from current done tickets matches README.md: 195 shipped, 16 cancelled, 14 median minutes, 1 median round and 100 first-round approvals. AC7 tests also validate the historical calculation method."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "docs/brief.md",
        "issue": "Principle 7's retained bullets say tickets build one after another and parallel builds would return only as a future feature, contradicting its updated description of configurable concurrent builds.",
        "suggested_fix": "Adjust those bullets to describe the default of one build while acknowledging that max_parallel_builds can increase it.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release preparation meets all seven criteria. Versions agree, release notes explain the changes and upgrade requirements, and the refreshed figures match the ticket records. Tests pass under the existing retry policy. One minor wording inconsistency remains in the brief."
  }
}
```

</details>

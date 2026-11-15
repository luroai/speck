---
id: "0695"
title: "Prepare release 1.5.0"                # one outcome, no "and"
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
after: ["0685","0686","0687","0688","0689","0690","0691","0692","0693","0694"]                # ticket ids that must be done first
created: 2026-11-15
built_on: "0693"
started: "2026-11-15T22:20:30.820Z"

---
# 0695 · Prepare release 1.5.0

**Status:** 🔍 reviewing

## Problem
Since 1.4.0, the ticket writer suggests a level for each ticket, Shipped compares builder models by their results, a ticket cancelled during its build no longer leaves others waiting, fix tickets may fix the tests they name, builds and reviews carry on through more usage limits, and the tests that failed by chance under load are steady (0685 to 0694). Anyone following the setup prompt, or updating speck in a project, still gets 1.4.0.

## Outcome
speck is ready to be released as 1.5.0.

## Acceptance criteria
1. `package.json` has version `1.5.0`, and `speck init` prints `speck 1.5.0`.
2. `CHANGELOG.md` has a 1.5.0 section above the 1.4.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.4.0` tag, from the tickets shipped since (checked by review). The 1.4.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.5.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.5.0.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.4.0, and a link to the 1.5.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.5.0.

## Out of scope
- Creating the `v1.5.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.5.0.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the Build lane they show has changed.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-15: the 1.5.0 plan, finishing "Picks the crew" with a reliability sweep, before a week away from speck.
- Covers every ticket shipped since `v1.4.0`: 0685 to 0694, which it waits for, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them; the steadied tests (0688 to 0690) can be one line.
- If one of 0685 to 0694 is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.5.0` tag and its GitHub release page appeared. If not: `gh release create v1.5.0 --target main --title "speck 1.5.0" --notes-file docs/releases/v1.5.0.md`.
- Checked 2026-11-15: `v1.4.0` is tagged on origin.
- 0684's checks that name 1.4.0 as the current version should check the current version, as 0684 did for 0668's.
- Failing before this build: not checked
- Built from main at `speck(0694): Compare builder models by their results in Shipped`, with 0693's approved work under it (`speck start` started this on 0693, so 0693 ships first and is in the changelog). `npm run prices` ran on 2026-11-15 and found the same rates as the table 0684 took that morning, so `scripts/prices.json` is unchanged.
- Self-check: no changes

## In plain words
speck is ready to go out as version 1.5.0. Once it lands, anyone who follows the setup prompt or runs the install command again in a project gets 1.5.0, with a changelog section and release notes covering what's new since 1.4.0: suggested build levels for tickets, the By model table in Shipped, reviews carrying on through more usage limits, cancelled and fix tickets no longer holding things up, and steadier tests. The README's "Built with speck" figures are brought up to date (677 tickets shipped). To see it, open the GitHub releases page after it ships: a 1.5.0 release should appear. If it doesn't, it needs creating by hand from the release notes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. After it ships, check that the `v1.5.0` tag and its GitHub release page appeared (see Notes).

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
    "reviewed_sha": "d37b26c0ebcdcc6d7d07bba0260d5d3773834da7",
    "session": "fresh",
    "thread_id": "01a1e157-d7bc-7162-b12f-7cbebcb779c8",
    "builder_response": "- Tests run: test/release-0695.test.mjs test/release-0684.test.mjs test/docs-0491.test.mjs test/docs-0267.test.mjs\n- `speck test --related` ran first (2711 tests): only docs-0267's rewording check failed, on a heading check I'd put in 0695's AC4 test (a document's heading wording); I removed that check and re-ran the files above, all passing.\n- `speck start` started this on 0693's approved work (0693 ships first), so 0693 is in the changelog and release notes.\n- `npm run prices` ran on 2026-11-15 and found the same rates as the table 0684 took that morning, so `scripts/prices.json` is unchanged; its `taken` date is today.\n- Built with speck figures from `speck/tickets/done/` at `speck(0694): Compare builder models by their results in Shipped`: 677 shipped, 17 cancelled, 14 minutes, 2 rounds, 319 first-round.\n- 0684's tests that named 1.4.0 as current now check the current version, as 0684 did for 0668's.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 258646,
      "cached_input_tokens": 204416,
      "cache_write_input_tokens": 0,
      "output_tokens": 1429,
      "reasoning_output_tokens": 119
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54230,
      "cached": 204416,
      "write": 0,
      "output": 1429
    },
    "cost_usd": 0.1431916,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T22:34:00.286Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json specifies 1.5.0. Both AC1 tests in test/release-0695.test.mjs passed, including running speck init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 1.5.0 above 1.4.0 and describes tickets 0685–0694 plus shipped ticket 0696. Review confirmed the 1.4.0 and earlier content is unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines name 1.5.0. AC3 tests passed for both versions, the latest-release setup prompt and scripts/prices.json dated 2026-11-15. The ticket records the price refresh returning unchanged rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.5.0.md contains the overview, changes and benefits, per-project install command, upgrading guidance and changelog link, with no person's name. Claims match the corresponding tickets, including approved prerequisite 0693. All AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation from speck/tickets/done/ confirms 677 shipped, 17 cancelled, 14 median minutes, 2 median rounds and 319 first-round approvals, matching README.md. Version/changelog checks passed. Recorded run: 178 passed, zero failed, three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, notes and published figures are consistent. The notes explain the new model comparisons, level suggestions and reliability improvements, with clear upgrade instructions. Relevant tests pass, older changelog entries are preserved, and no blocking issues were found."
  }
}
```

</details>

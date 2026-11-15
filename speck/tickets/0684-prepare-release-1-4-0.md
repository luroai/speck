---
id: "0684"
title: "Prepare release 1.4.0"                # one outcome, no "and"
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
after: ["0672","0673","0674","0675","0676","0677","0678","0679","0680","0681","0682"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T20:10:04.519Z"

---
# 0684 · Prepare release 1.4.0

**Status:** 🔍 reviewing

## Problem
Since 1.3.1, speck chains tickets only when one needs the other's work, can build a ticket on an approved one it waits for, re-reviews and re-tests only what changed, shares test turns across projects, carries on when it can't do an app check itself or when you let a build past the review limit, and sets several tickets ready with one command (0672 to 0682). Anyone following the setup prompt, or updating speck in a project, still gets 1.3.1.

## Outcome
speck is ready to be released as 1.4.0.

## Acceptance criteria
1. `package.json` has version `1.4.0`, and `speck init` prints `speck 1.4.0`.
2. `CHANGELOG.md` has a 1.4.0 section above the 1.3.1 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.3.1` tag, from the tickets shipped since (checked by review). The 1.3.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.4.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.4.0.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.3.1, and a link to the 1.4.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.4.0.

## Out of scope
- Creating the `v1.4.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.4.0.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the Build lane they show has changed.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-15: "Create a release ticket after it all. And set it ready too". A minor release, as the tickets add features.
- Covers every ticket shipped since `v1.3.1`: 0672 to 0682, which it waits for, the fix ticket 0683, and any other that ships before this is built. Fix tickets that only make this repo's own tests pass are left out of the changelog unless someone using speck would notice them.
- If one of them is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.4.0` tag and its GitHub release page appeared. If not: `gh release create v1.4.0 --target main --title "speck 1.4.0" --notes-file docs/releases/v1.4.0.md`.
- Checked 2026-11-15: `package.json` is `1.3.1`, `v1.3.1` is tagged, and `CHANGELOG.md`'s newest section is 1.3.1.
- 0668's checks that name 1.3.1 as the current version should check the current version, as 0668 did for 0665's.
- Failing before this build: none
- Covers 0672 to 0682. The test-only fix 0683 changes nothing anyone using speck would notice, and 0664 was cancelled, so both are left out of the changelog. The figures were worked out from main at "speck(0664): cancelled on main, and 0684 no longer waits for it": 666 shipped, 17 cancelled, 14 minutes, 2 rounds, 314 first-round. The price table was refreshed with `npm run prices` on 2026-11-15.
- The README also says several ids can be set ready at once (0681) and that with `watch: decide` a check speck can't make is left for you (0679).
- Self-check: the README's sentence on leaving a check now says it's only with `watch` set to decide; the 1.4.0 changelog test looks for `machine_parallel_tests` as a name, since it appears inside a longer command there.
- Pictures: none, because nothing anyone sees in the panel changes; the README's wording changes but not how it renders.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "d2a62bba213e7c387bc93570c022926bcffe1a13",
    "session": "fresh",
    "thread_id": "01a1e0d9-0ee8-7a33-a370-a210adf60734",
    "builder_response": "- Tests run: speck test --related test/release-0684.test.mjs test/release-0668.test.mjs test/docs-0491.test.mjs once (1622 tests: 2 failures, both the one 0684 AC2 check, as `machine_parallel_tests` only appears inside a longer code span in the changelog, also seen through 0267's rewording run). After fixing that check and a README sentence, ran speck test --files test/release-0684.test.mjs test/release-0668.test.mjs test/docs-0491.test.mjs test/docs-0267.test.mjs test/private-words-0628.test.mjs and every test/readme*.test.mjs: 193 pass, 0 fail, 3 skipped (0078's split checks).\n- Shipped since v1.3.1: 0672 to 0682 (user-facing) and 0683 (test-only fix). 0664 was cancelled, so it is left out.\n- Built with speck figures worked out from main at \"speck(0664): cancelled on main, and 0684 no longer waits for it\" with test/support/figures.mjs: 666 shipped, 17 cancelled, 14 min, 2 rounds, 314 first-round.\n- The price table was refreshed with `npm run prices` on 2026-11-15 (taken: 2026-11-15).\n- As the ticket's Notes ask, 0668's checks that named 1.3.1 as the current version now check the current version.\n- The README also says several ids can be set ready at once (0681) and that with `watch` set to decide a check speck can't make is left for you (0679).\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 177196,
      "cached_input_tokens": 124800,
      "cache_write_input_tokens": 0,
      "output_tokens": 1253,
      "reasoning_output_tokens": 47
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 52396,
      "cached": 124800,
      "write": 0,
      "output": 1253
    },
    "cost_usd": 0.129802,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T20:15:24.221Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.4.0; both 0684 AC1 tests passed, including executing init and checking its output."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "CHANGELOG.md places 1.4.0 above 1.3.1 and older sections are byte-for-byte unchanged. Feature descriptions match shipped tickets 0672–0682, but its Tests section includes 0683 despite the ticket's explicit exclusion of test-only fixes users would not notice."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines name 1.4.0. Setup-prompt and price-table tests passed; scripts/prices.json records 2026-11-15 and contains refreshed model entries."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.4.0.md describes the shipped features and their benefits, gives the per-project update command, explains upgrade changes and links to the correct changelog anchor. No person's name appears. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated done-ticket figures: 666 shipped, 17 cancelled, 14 minutes median, 2 rounds median, 314 first-round approvals, matching README.md. Reported tests: 193 passed, zero failed, three skipped; version/changelog matching passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "CHANGELOG.md",
        "issue": "The new Tests subsection describes 0683's internal test repairs and explicitly says nothing changes in speck itself. The ticket's Notes require test-only fix tickets to be left out unless someone using speck would notice them.",
        "suggested_fix": "Remove the 1.4.0 Tests subsection describing 0683.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The version, release notes, refreshed prices and published figures check out, and the reported tests pass. Remove the internal test-fix entry from the changelog to meet the ticket's explicit scope."
  }
}
```

</details>

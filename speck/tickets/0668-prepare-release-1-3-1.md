---
id: "0668"
title: "Prepare release 1.3.1"                # one outcome, no "and"
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
after: ["0666","0667","0669"]                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-15T13:14:36.232Z"

---
# 0668 · Prepare release 1.3.1

**Status:** 🔍 reviewing

## Problem
1.3.0's build levels are hard to set: the Builder's card asks for each level's model as free text and says "settings" everywhere without explaining it, and a ticket's Level menu doesn't say what each level builds with. 0666 and 0667 fix that, and 0669 shows and lets you pick a ticket's builder model in the panel, which 0659 only made possible in the ticket file. Anyone following the setup prompt, or updating speck in a project, still gets 1.3.0 without the fixes.

## Outcome
speck is ready to be released as 1.3.1.

## Acceptance criteria
1. `package.json` has version `1.3.1`, and `speck init` prints `speck 1.3.1`.
2. `CHANGELOG.md` has a 1.3.1 section above the 1.3.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v1.3.0` tag, from the tickets shipped since (checked by review). The 1.3.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.3.1, and the setup prompt still installs the latest release.
4. `docs/releases/v1.3.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.3.0, and a link to the 1.3.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.3.1.

## Out of scope
- Creating the `v1.3.1` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.3.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The fixes themselves: 0666, 0667 and 0669.

## Notes
- Asked for 2026-11-12: fix the levels' screens "as a patch release".
- Covers every ticket shipped since `v1.3.0`: 0666, 0667 and 0669, which it waits for, and any other that ships before this is built.
- After it ships, check that the `v1.3.1` tag and its GitHub release page appeared. If not: `gh release create v1.3.1 --target main --title "speck 1.3.1" --notes-file docs/releases/v1.3.1.md`.
- Checked 2026-11-12: `package.json` is `1.3.0`, `v1.3.0` is tagged on origin, and `CHANGELOG.md`'s newest section is 1.3.0.
- 0665's checks that name 1.3.0 as the current version should check the current version, as 0665 did for 0653's.
- Failing before this build: none
- Covers 0666, 0667 and 0669, and the test-only fixes 0670 and 0671: nothing else shipped since `v1.3.0`. The figures were worked out from main at "speck(0669): Choose a ticket's builder model in the panel": 653 shipped, 16 cancelled, 14 minutes, 2 rounds, 311 first-round. The price table isn't refreshed: no criterion asks for it.
- Self-check: no changes. A first related run had one timing failure in 0630 AC3, which passed alone and on the re-run; nothing in this change touches it.
- Pictures: none, because nothing anyone sees in the panel changes; the README's wording changes but not how it renders.

## In plain words
speck is ready to go out as 1.3.1, a bug-fix release of the build levels 1.3.0 added. Its changelog and release notes describe the three fixes: levels set from labelled lists on the Builder's card, a Level menu that says what each level builds with, and a ticket's builder shown and picked in the panel. The README and the design brief now say 1.3.1, the README's "Built with speck" figures are up to date (653 tickets shipped), and its paragraph on your agents mentions picking a ticket's builder in the panel.

Once this ships, the release workflow should tag 1.3.1 and publish its release page; check the page appeared on GitHub.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "786aa6920163acd4fb207713bf38a7946fb279b8",
    "session": "fresh",
    "thread_id": "01a1df5e-2e29-78e1-a02f-752e84ea2e18",
    "builder_response": "- Tests run: speck test --related test/release-0668.test.mjs test/release-0665.test.mjs test/docs-0491.test.mjs (the ticket's own test file, the existing test files it changed, and every test file naming a file this branch changed). 1519 pass, 0 fail.\n- Shipped since v1.3.0: 0666, 0667, 0669 (user-facing) and 0670, 0671 (test-only fixes).\n- Built with speck figures worked out from main at \"speck(0669): Choose a ticket's builder model in the panel\" with test/support/figures.mjs: 653 shipped, 16 cancelled, 14 min, 2 rounds, 311 first-round.\n- As the ticket's Notes ask, 0665's checks that named 1.3.0 as the current version now check the current version, as 0665 did for 0653's.\n- The README's \"Your agents\" paragraph also says a ticket's facts show what it will be built with and that its builder and model can be picked in the panel (0669).\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 198689,
      "cached_input_tokens": 147712,
      "cache_write_input_tokens": 0,
      "output_tokens": 1056,
      "reasoning_output_tokens": 62
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50977,
      "cached": 147712,
      "write": 0,
      "output": 1056
    },
    "cost_usd": 0.1272852,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:21:33.643Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json sets 1.3.1. Both 0668 AC1 tests passed, including running speck init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 1.3.1 above 1.3.0 and leaves all older sections unchanged. Its descriptions match shipped tickets 0666, 0667, 0669, 0670 and 0671."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines say 1.3.1. Both AC3 tests passed, including setupPromptProblems checking installation of the latest release."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.3.1.md explains the bug-fix release, each shipped fix, updating in each project and upgrade behaviour without naming anyone. AC4 tests passed for installation details, settings and the changelog anchor; the remaining prose matches the shipped tickets."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated figures from speck/tickets/done/: 653 shipped, 16 cancelled, 14 minutes median, 2 review rounds median and 311 first-round approvals, matching README.md. The figures and version/changelog tests passed. Reported related run: 1519 passed, zero failed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change prepares version 1.3.1 with accurate release notes, update instructions and refreshed project figures. The tests cover the release checks and report no failures. No blocking concerns found."
  }
}
```

</details>

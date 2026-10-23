---
id: "0380"
title: "Prepare release 0.13.1"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-22-prepare-release-0-13-1.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375","0376","0377","0378","0379"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-23T00:04:00.884Z"
approved: "2026-10-23T00:06:33.259Z"

---
# 0380 · Prepare release 0.13.1

**Status:** 👍 approved

## Problem
0376 launches a stopped ticket again without restarting speck run, 0377 stops a chance failure handing a ticket back, 0378 makes doctor check a Cursor reviewer, and 0379 keeps a pop-up's Close button in view. Anyone following the setup prompt, or updating speck on another machine, gets 0.13.0 without them.

## Outcome
speck is ready to be released as 0.13.1.

## Acceptance criteria
1. `package.json` has version `0.13.1`, and `speck init` prints `speck 0.13.1`.
2. `CHANGELOG.md` has a 0.13.1 section above the 0.13.0 one. It describes, in plain English, what someone using speck will notice is fixed since the `v0.13.0` tag, from the tickets shipped since (checked by review). The 0.13.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.13.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.13.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.13.0, and a link to the 0.13.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.13.1.

## Out of scope
- Creating the `v0.13.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.13.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The fixes themselves: 0376, 0377, 0378 and 0379.

## Notes
- Asked for 2026-10-22 as a patch after 0.13.0 (0375). The four fixes are defects, not new behaviour. Nothing changes config or the commands.
- Covers every ticket shipped since `v0.13.0`: 0376, 0377, 0378 and 0379, which it waits for, and 0375, and any other that ships before this is built.
- After it ships, check that the `v0.13.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.13.1 --target main --title "speck 0.13.1" --notes-file docs/releases/v0.13.1.md`.
- Checked 2026-10-22: `package.json` is `0.12.0` until 0375 ships `0.13.0`. 0346 prepared the 0.10.3 patch the same way.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: dropped an unbacked claim from the release notes that a running `speck run` keeps the old code until restarted. `test/release-0375.test.mjs`'s checks of the current version now follow `package.json`, and its figures check covers only the figures 0.13.0 was built from, as 0360 did for 0346.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is ready to go out as version 0.13.1, a bug-fix release with the four fixes made since 0.13.0: a stopped build starts again without restarting speck run, a test that fails once by chance no longer sends a ticket back, the setup check looks for Cursor's tool when Cursor reviews, and a pop-up's Close button stays in view. The changelog, the release notes and the version shown everywhere now say 0.13.1, and the "Built with speck" figures in the README are up to date. Once it ships, check that the 0.13.1 release page appears on GitHub; if it doesn't, the ticket's notes say how to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 199,146
- Elapsed since build started: 3 min
- Changed lines: 54 (limit 5000)
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
    "reviewed_sha": "11664584bbd8c736aabfede202d3790b3b0ccddc",
    "session": "fresh",
    "thread_id": "01a16614-0f06-72f3-a33a-852d283d77ab",
    "builder_response": "- Tests run: test/release-0380.test.mjs test/release-0375.test.mjs test/release-0346.test.mjs (plus the configured checks)\n- Round 1. Covers every ticket shipped since v0.13.0: 0376, 0377, 0378 and 0379 (git diff v0.13.0..HEAD -- speck/tickets/done lists only these).\n- test/release-0375.test.mjs: its checks that named 0.13.0 as the current version now follow package.json, and its README figures check now checks only the figures 0.13.0 was built from, the same way 0360 changed release-0346 for 0.10.3.\n- README figures recomputed with test/support/figures.mjs at the build's base commit: 371 shipped, 16 cancelled, 12 min median, 1 review round median, 186 first-round approvals.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 198177,
      "cached_input_tokens": 161536,
      "cache_write_input_tokens": 0,
      "output_tokens": 969,
      "reasoning_output_tokens": 49
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T00:06:25.670Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.13.1. scripts/install.mjs reads that version and prints it during init; both 0380 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.13.1 above 0.13.0 and accurately describes shipped tickets 0376–0379. Git confirms these are the only done tickets added since v0.13.0, and the older changelog sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.13.1, a public preview. The README setup prompt retains the quoted semver:* install command. Both 0380 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.13.1.md includes a short introduction, all four fixes and their benefits, per-project update instructions, upgrade implications and the correct changelog link. Its claims match the shipped tickets and it contains no person's name. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recomputation from the current done tickets matches the README: 371 shipped, 16 cancelled, 12 minutes median, 1 review round median and 186 first-round approvals. AC5 tests passed. The recorded targeted run reports 141 passed, 3 skipped and no failures; changes to historical release tests appropriately preserve their historical checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Release 0.13.1 is ready for the owner's merge decision. The version, release notes and status lines agree, all four shipped fixes are accurately described, and the README figures match the ticket records. The targeted tests passed. No blocking concerns found."
  }
}
```

</details>

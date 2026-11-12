---
id: "0665"
title: "Prepare release 1.3.0"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T16:12:50.872Z"
approved: "2026-11-12T16:17:02.630Z"
finished: "2026-11-12T16:19:31.898Z"

---
# 0665 · Prepare release 1.3.0

**Status:** ✅ done

## Problem
1.3, "Picks the crew", lets each ticket build on its own model and effort, adds build levels you set on the team page and pick per ticket, and has speck fix main itself when the full suite fails (0656 to 0663). Anyone following the setup prompt, or updating speck in a project, still gets 1.2.0.

## Outcome
speck is ready to be released as 1.3.0.

## Acceptance criteria
1. `package.json` has version `1.3.0`, and `speck init` prints `speck 1.3.0`.
2. `CHANGELOG.md` has a 1.3.0 section above the 1.2.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.2.0` tag, from the tickets shipped since (checked by review). The 1.2.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.3.0, the README says in plain words that you can build a ticket at a level, such as quick, deep or one of your own, or on a model of its own (checked by review), the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.3.0.md` holds the notes for the GitHub release page: a short paragraph on picking the crew, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 1.2.0 (the `level`, `builder_model` and `builder_effort` lines on a ticket and what blank means, the three default levels and `levels:` in `speck/config.yml`, and that speck makes and readies a fix ticket when the full suite fails, with `watch` set to fix or decide), and a link to the 1.3.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.3.0.

## Out of scope
- Creating the `v1.3.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.3.0.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the Build lane they show has changed.
- The landing page, which lives in its own repo.
- The Sonnet and DeepSeek trial and choosing the crew from results, which come in a later release.

## Notes
- Asked for 2026-11-12: "create a release ticket to just get everything else that we've achieved out". A minor release after 0653 (1.2.0): 1.3 on the roadmap, "Picks the crew".
- Covers every ticket shipped since `v1.2.0`: 0656 to 0663, and any other that ships before this is built, such as 0664 if it ships first. 0656 and 0663 fix this repo's own tests, so the changelog leaves them out unless someone using speck would notice them.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.3.0` tag and its GitHub release page appeared. If not: `gh release create v1.3.0 --target main --title "speck 1.3.0" --notes-file docs/releases/v1.3.0.md`.
- Checked 2026-11-12: `package.json` is `1.2.0`, `v1.2.0` is tagged, and `CHANGELOG.md`'s newest section is 1.2.0.
- 0653's checks that name 1.2.0 as the current version should check the current version, as 0653 did for 0640's, and `test/docs-0491.test.mjs` should allow this ticket's test to name the version.
- Failing before this build: none
- Self-check: narrowed the claims about which tickets stop a level being removed (any not done or cancelled, not only those in progress) and about the seven facts in Plan (an open draft's) to match 0661 and 0662.
- Left out of the changelog as nothing someone using speck notices: 0657 (this repo's own quick test run) and 0663 (a test fix). 0656 is in only for the smaller text in the Full suite fails view.
- Pictures: none, because nothing in the panel changes; the README's demo pictures show the Build lane, which hasn't changed.
- Built with speck figures worked out from speck/tickets/done/ at 681d87c: 647 shipped, 16 cancelled, 14 minutes median, 2 rounds median, 309 approved in round 1.

## In plain words
speck is ready to go out as 1.3.0. Once this ships, anyone who installs or updates speck gets build levels (quick, balanced, deep or your own, set on the Builder's card and picked per ticket in the panel), a model and effort of a ticket's own, and speck fixing main itself when its full set of checks fails there. The changelog, the release notes and the README say so, the price table has today's rates and the README's figures are up to date. To check, once it has shipped, look for the 1.3.0 release on the project's GitHub page. Worth watching: if that release page doesn't appear, it can be made by hand from the release notes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 174,826
- Elapsed since build started: 4 min
- Changed lines: 90 (limit 5000)
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
    "reviewed_sha": "a23e52f4fd5dc7ae5489c2fbccb895a1175fcc49",
    "session": "fresh",
    "thread_id": "01a1d08b-a9db-7c30-a4ec-b5c7ae792338",
    "builder_response": "- Tests run: `speck test --related test/release-0665.test.mjs test/release-0653.test.mjs test/docs-0491.test.mjs` (this ticket's own file, the two existing files it changed, every test file naming a changed file, and the commands.checks files): 1516 pass, 0 fail, 3 skipped.\n- Notes for the reviewer:\n  - Release follows 0653's pattern: version, changelog section, README and brief status lines, `npm run prices` (taken 2026-11-12), `docs/releases/v1.3.0.md`, and 0653's checks that named 1.2.0 now check the current version; `test/docs-0491.test.mjs` allows `test/release-0665.test.mjs` to name the version.\n  - Tickets shipped since `v1.2.0`: 0656 to 0663 (0664 is still ready, not shipped). Left out as nothing a user notices: 0657 (this repo's own quick test runner) and 0663 (a test fix). 0656 is in only for the smaller text in the Full suite fails view.\n  - Built with speck figures worked out from speck/tickets/done/ at 681d87c (the base commit's done tickets): 647 shipped, 16 cancelled, 14 min median, 2 rounds median, 309 first-round approvals.\n  - README: status line, a sentence in \"Your agents\" and a clever bit on levels and a ticket's own model, and the full-suite sentence now says speck raises a fix ticket itself once you've let it take calls.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 173584,
      "cached_input_tokens": 119168,
      "cache_write_input_tokens": 0,
      "output_tokens": 1242,
      "reasoning_output_tokens": 54
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54416,
      "cached": 119168,
      "write": 0,
      "output": 1242
    },
    "cost_usd": 0.1331688,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T16:16:56.077Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.3.0. Both 0665 AC1 tests passed, including running speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 1.3.0 above 1.2.0 and describes the shipped 0656–0663 changes that users notice. Git comparison confirms the 1.2.0 and earlier sections are unchanged. All three AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines name 1.3.0. The README's Your agents paragraph explains default and custom levels and per-ticket models. Passing AC3 tests check status versions, the latest-release setup prompt and the price table date; scripts/prices.json is dated 2026-11-12 and contains refreshed rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.3.0.md covers picking the crew, changes and benefits, installation in each project, blank ticket fields, precedence, default and custom levels, and automatic fix tickets under watch fix/decide. Claims match shipped tickets and the levels.mjs and full-fix.mjs implementations. It names no person. All three AC4 tests passed, including the changelog link check."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent calculation from speck/tickets/done gives 647 shipped, 16 cancelled, 14 minutes rounded median, 2 median review rounds and 309 first-round approvals, matching the README. AC5 tests passed, including package/changelog agreement. The relevant run recorded 1516 passes, zero failures and three skips; no unrelated changes or dishonest tests found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release preparation is ready for merge. Version numbers, release notes, upgrade instructions, refreshed prices and README figures agree with the shipped work. The relevant tests passed, and no blocking concerns were found."
  }
}
```

</details>

---
id: "0770"
title: "Prepare release 1.8.0"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0764","0765","0766","0767","0768","0769"]                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T21:22:17.067Z"
approved: "2026-11-26T21:28:01.942Z"

---
# 0770 · Prepare release 1.8.0

**Status:** 👍 approved

## Problem
Since 1.7.0, `speck serve`'s address has a factory floor page for a laptop: project stations, the line with the model on every station, Virgil's dial, your subscriptions and each project's board side by side. Anyone updating speck still gets 1.7.0.

## Outcome
speck is ready to be released as 1.8.0.

## Acceptance criteria
1. `package.json` has version `1.8.0`, and `speck init` prints `speck 1.8.0`.
2. `CHANGELOG.md` has a 1.8.0 section above the 1.7.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.7.0` tag, from the tickets shipped since (checked by review). The 1.7.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.8.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.8.0.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), how to open the factory floor, and a link to the 1.8.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.8.0.

## Out of scope
- Creating the `v1.8.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.8.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-26: the factory floor as a new page, after 1.7.0's `speck serve`.
- Covers every ticket shipped since `v1.7.0`, the factory floor tickets it waits for included, and any other that ships before this is built. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them.
- If one of the tickets it waits for is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.8.0` tag and its GitHub release page appeared. If not: `gh release create v1.8.0 --target main --title "speck 1.8.0" --notes-file docs/releases/v1.8.0.md`.
- Checked 2026-11-26: `v1.7.0` is tagged on origin.
- speck (2026-11-26 21:09 UTC) I'll resume 0770 at 22:00 UTC: 0770 has to come after 0768 and 0769, which are approved but still shipping (0769 is shipping now and 0768's ship was handed back to its build), so starting now would only be refused again; by 22:00 UTC both should have landed. Its instruction: Check that 0768 and 0769 have both shipped to main, then start 0770 on top of the latest main and build it; if either still hasn't shipped, stop again without changing anything.
- 2026-11-26: its first build stopped before starting, as 0768 and 0769 were approved but not yet shipped. Set ready again once both shipped.
- Failing before this build: none
- Self-check: narrowed the release notes' claim that the floor's back link works from Virgil's lines: only cards and lit tickets carry it (0769).
- Pictures: none, because nothing anyone sees in the panel or on the floor changes; the README changes only its status line and figures.

## In plain words
speck is ready to go out as 1.8.0. Once this lands, the release page appears on GitHub and the setup prompt installs 1.8.0, whose headline is the factory floor: a page for a laptop at speck serve's address that shows every project at once, with who is working on which ticket and on which model, Virgil's count of what needs you, how much of each subscription is used, and a project's whole board side by side, where any ticket opens in its panel. The changelog and release notes describe each change, and the notes say how to update every project and restart speck serve so the floor appears. The README's figures and the price table are up to date as of today.

To see it, open the GitHub releases page once it has shipped and check that 1.8.0 is there. Worth keeping an eye on: if the release page doesn't appear, it can be made by hand from the release notes, as the ticket's Notes say.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 210,517
- Elapsed since build started: 6 min
- Changed lines: 68 (limit 5000)
Follow-ups: none.

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
    "reviewed_sha": "ba7198fabc8aa5e3556bed0dd7d4c8e640539b62",
    "session": "fresh",
    "thread_id": "01a219c1-7ff8-7242-814d-b854d4134722",
    "builder_response": "- Tests run: test/release-0770.test.mjs test/release-0760.test.mjs test/docs-0491.test.mjs, with `--related` (which added every test file naming a changed file) and the repo checks.\n- Shipped since v1.7.0: 0764, 0765, 0766, 0767, 0768, 0769 (no fix tickets). All are the factory floor and are in the changelog; 0764 has nothing visible on its own, so it appears through the line's \"why it's on them\" and stand-in wording.\n- test/release-0760.test.mjs: its checks that named 1.7.0 as the current version now check the current version, as 0760 did for 0753.\n- Figures worked out from speck/tickets/done/ at commit \"speck(0768): Show your subscriptions on the factory floor\" (main when this was built): 751 shipped, 18 cancelled, 16 min median, 2 rounds median, 359 first round. Prices refreshed with `npm run prices` on 2026-11-26; the table was already taken today by 1.7.0's build and LiteLLM's rates hadn't changed since, so scripts/prices.json has no diff.\n- Release notes' upgrade step: `speck serve --install` records the speck.mjs it was run from (scripts/serve-install.mjs, unitText/plistText) and restarts the service, so running it again from an updated project moves the service to 1.8.0.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 209413,
      "cached_input_tokens": 156672,
      "cache_write_input_tokens": 0,
      "output_tokens": 1104,
      "reasoning_output_tokens": 151
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 52741,
      "cached": 156672,
      "write": 0,
      "output": 1104
    },
    "cost_usd": 0.1321892,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T21:27:53.803Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.8.0. Both 0770 AC1 tests passed, including running init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 1.8.0 above 1.7.0 without changing older sections. Its factory floor descriptions match shipped tickets 0764–0769; release tests check the version and commands."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines name 1.8.0. Passing AC3 tests check both, the latest-release setup prompt and scripts/prices.json's 2026-11-26 date. The builder reports refreshing prices that day with unchanged rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.8.0.md explains the factory floor changes, their benefits, updating each project, restarting serve and opening /floor. Claims correspond to shipped tickets 0764–0769; no personal names appear. Passing AC4 tests check commands, address, changelog link and private words."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated done-ticket figures match the README: 751 shipped, 18 cancelled, 16 minutes median, 2 review rounds median and 359 first-round approvals. The version/changelog test passed; recorded output confirms 1,788 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release preparation is ready for the owner's merge decision. Version numbers, release notes and project figures agree, and the changelog covers the shipped factory floor features. The reported tests pass, with no blocking concerns found."
  }
}
```

</details>

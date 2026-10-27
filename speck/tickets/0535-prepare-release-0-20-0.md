---
id: "0535"
title: "Prepare release 0.20.0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0534"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T19:01:13.908Z"

---
# 0535 · Prepare release 0.20.0

**Status:** 🔍 reviewing

## Problem
Since 0.19.0, a ticket's spend counts the sub-agents its build fans work out to: Codex builds' sub-agents (0532), Claude Code builds' sub-agents, now checked against a real build (0533), and Codex sessions a build starts in its ticket's worktree, such as research handed to Codex from a Claude build (0534). Anyone following the setup prompt, or updating speck in a project, still gets 0.19.0, whose spend leaves those out.

## Outcome
speck is ready to be released as 0.20.0.

## Acceptance criteria
1. `package.json` has version `0.20.0`, and `speck init` prints `speck 0.20.0`.
2. `CHANGELOG.md` has a 0.20.0 section above the 0.19.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.19.0` tag, from the tickets shipped since (checked by review). The 0.19.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.20.0, a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v0.20.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.19.0, that costs are estimates at API list prices, and a link to the 0.20.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.20.0.

## Out of scope
- Creating the `v0.20.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.20.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The changes themselves: 0532 to 0534.

## Notes
- Asked for 2026-10-27: "Set them all as ready. Create a new release and get it all out, please."
- A minor release, as 0534 adds `delegated_tokens` and `delegated_cost_usd` to `speck status --json` and a `delegated` part to `speck spend`. Follows 0531 (0.19.0).
- Covers every ticket shipped since `v0.19.0`: 0532 to 0534, which it waits for (`after:` names 0534, the last in their chain), and any other that ships before this is built.
- After it ships, check that the `v0.20.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.20.0 --target main --title "speck 0.20.0" --notes-file docs/releases/v0.20.0.md`.
- Checked 2026-10-27: `package.json` is `0.19.0`.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- Failing before this build: none
- `npm run prices` on 2026-10-27 wrote a table identical to the one 0.19.0 shipped (taken the same day, no rates changed since), so `scripts/prices.json` is unchanged and its `taken` is 2026-10-27.
- Self-check: narrowed two claims in the release notes: the share of tokens 0532's test left out (29%, not "nearly a third"), and that the new counting applies to builds that end after updating, not only to new tickets.

## In plain words
speck is ready to go out as version 0.20.0. Once it lands, anyone installing or updating speck gets the spend changes from the last three tickets: a ticket's cost now includes the helper agents its build starts, and Codex runs started in the ticket's own folder. The changelog, the release notes, the version in the README and the brief, and the README's "Built with speck" figures (518 tickets shipped) are all updated. To check it, read the 0.20.0 section at the top of the changelog and the release notes. Worth keeping an eye on: after it ships, check that the 0.20.0 release page appeared on GitHub.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
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
    "reviewed_sha": "e0838ffdbac8a9c364022235e73eca2fbb997dbf",
    "session": "fresh",
    "thread_id": "01a17ebf-3b58-7d01-a206-9578a0dd6534",
    "builder_response": "- Tests run: test/release-0535.test.mjs test/release-0531.test.mjs test/docs-0491.test.mjs, with `--related` (113 related files, 1112 pass, 0 fail, 3 skipped).\n- Covers 0532, 0533 and 0534, the only tickets shipped since `v0.19.0` (`git log v0.19.0..main`).\n- `npm run prices` ran on 2026-10-27 and wrote a table identical to the one 0.19.0 shipped (same day, no rates changed), so `scripts/prices.json` has no diff; its `taken` is 2026-10-27.\n- \"Built with speck\" figures recomputed with test/support/figures.mjs from `speck/tickets/done/` at main's commit 719bb297: 518 shipped, 16 cancelled, 13 min median, 1 round median, 263 first-round approvals.\n- release-0531's checks naming 0.19.0 as the current version now check the current version, as 0531 did for 0522.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 154079,
      "cached_input_tokens": 105344,
      "cache_write_input_tokens": 0,
      "output_tokens": 975,
      "reasoning_output_tokens": 20
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 48735,
      "cached": 105344,
      "write": 0,
      "output": 975
    },
    "cost_usd": 0.1177544,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T19:04:07.127Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.20.0. Passing release-0535 AC1 tests check the version and invoke speck init to verify its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.20.0 above 0.19.0 and accurately describes shipped tickets 0532–0534, verified against their records and git log v0.19.0..main. The passing preservation test compares all earlier sections with the tag."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say '0.20.0, a public preview'. The setup prompt retains the quoted semver:* install command. Passing AC3 tests cover versions, setup and price-table date; scripts/prices.json records 2026-10-27. The builder reports that day's refresh produced identical rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.20.0.md explains each shipped change, its benefit, per-project reinstallation, upgrade behaviour, worktree limitation and estimated API list prices. It contains no person's name and links to the correct changelog anchor. Passing AC4 tests check commands, pricing facts and the link."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recomputed figures from current done tickets: 518 shipped, 16 cancelled, 13-minute median, one review round median and 263 first-round approvals, matching README.md. The version/changelog test passes. The recorded related run reports 1112 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Release 0.20.0 is ready for the owner's merge decision. The notes accurately explain the improved spend accounting and update steps, the published figures match the ticket records, and the relevant tests pass. No blocking concerns found."
  }
}
```

</details>

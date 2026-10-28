---
id: "0539"
title: "Prepare release 0.21.0"                # one outcome, no "and"
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
after: ["0540","0541","0542","0543","0544","0546","0547","0548","0549","0550"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T13:50:35.119Z"

---
# 0539 · Prepare release 0.21.0

**Status:** 🔍 reviewing

## Problem
Since 0.20.0, the panel's Capture lane shows how many notes it holds (0536), lists notes captured on the same day newest first (0537) and lets you star the notes you like (0538). `speck run --background` turns `speck run` on from the command line (0544), the facts grid names the builder's model (0545), each review round's tokens are counted as it saved them (0546), setup leaves shipping and limits at their defaults (0547), a ticket's build log opens in a full-screen pop-up like the Pipeline log (0548), changes to the builder's settings apply to the next build without restarting `speck run` (0549), the panel loads its font and files from addresses relative to the page (0543), four tests that failed by chance are steady (0540 to 0542), and a commit that adds a private word under `speck/` is refused (0550). Anyone following the setup prompt, or updating speck in a project, still gets 0.20.0 without them.

## Outcome
speck is ready to be released as 0.21.0.

## Acceptance criteria
1. `package.json` has version `0.21.0`, and `speck init` prints `speck 0.21.0`.
2. `CHANGELOG.md` has a 0.21.0 section above the 0.20.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.20.0` tag, from the tickets shipped since (checked by review). The 0.20.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.21.0, a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v0.21.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.20.0, that costs are estimates at API list prices, and a link to the 0.21.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.21.0.

## Out of scope
- Creating the `v0.21.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.21.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The changes themselves: 0536 to 0538 and 0540 to 0550.

## Notes
- Asked for 2026-10-27: "Create another release ticket and set all tickets to ready." Then: "Ticket up everything in 2 and add it to the next release", which added 0540 to 0547, 0548, the full-screen build log, and 0549, the builder settings fix. On 2026-10-28: "add that as a ticket right now to be built in the next release", which added 0550, the private-words check on commits.
- A minor release, as 0537 adds a time to the `Captured:` line of new notes, 0538 lets the panel write a note's `Starred:` line, 0544 adds `speck run --background` and 0545 adds `builder_model` to `speck status --json`. Follows 0535 (0.20.0).
- Covers every ticket shipped since `v0.20.0`: 0536 to 0538 and 0540 to 0550, which it waits for (`after:` names the last ticket of each chain: 0546, 0548, and the unchained 0540 to 0544, 0547, 0549 and 0550), and any other that ships before this is built.
- After it ships, check that the `v0.21.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.21.0 --target main --title "speck 0.21.0" --notes-file docs/releases/v0.21.0.md`.
- Checked 2026-10-27: `package.json` is `0.20.0`.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- Failing before this build: none
- Self-check: no changes. Checked each changelog and release-notes claim against the shipped tickets (0536 to 0538, 0540 to 0550; no other ticket shipped since v0.20.0), that 0529's saved round tokens arrived in 0.19.0, and that `speck init` writes `auto_ship: false`. Figures from main at "speck(0548): View a ticket's build log in a full-screen pop-up": 533 shipped, 16 cancelled, 13 minutes, 1 round, 271 first-round. Price table refreshed 2026-10-28 (3148 models).
- Pictures: none, because the change is to docs and the version, not to how anything looks.

## In plain words
speck is ready to go out as version 0.21.0. Once it ships, anyone installing or updating speck gets the last day's work: a count, newest-first order and stars in Capture, a command to turn automatic building on, builder settings that apply without a restart, a full-screen build log, and private words kept out of every commit. The changelog and the release page describe each change, and the price list and the "Built with speck" figures in the README are up to date. To see it, read the new 0.21.0 section at the top of the changelog. Worth checking after it ships: that the 0.21.0 release page appeared on GitHub.

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
    "reviewed_sha": "78d1ab4bd3624f414cacdb3fd63df3304841441c",
    "session": "fresh",
    "thread_id": "01a182c9-addc-7482-bfab-fd1bea3b0295",
    "builder_response": "- Tests run (speck test --related): test/release-0539.test.mjs test/release-0535.test.mjs test/docs-0491.test.mjs, plus every existing test file naming a changed file (1169 tests, 0 failing).\n- test/release-0535.test.mjs: its checks that named 0.20.0 as the current version now check the current version, as 0535 did for 0531.\n- test/docs-0491.test.mjs: release-0539 added to the release tests allowed to name the version.\n- Price table refreshed today with `npm run prices` (taken 2026-10-28, 3148 models).\n- Built with speck figures computed with test/support/figures.mjs from main at \"speck(0548): View a ticket's build log in a full-screen pop-up\": 533 shipped, 16 cancelled, 13 min median, 1 round median, 271 first-round approvals.\n- Tickets shipped since v0.20.0: 0536, 0537, 0538, 0540 to 0550; no others.\n",
    "seconds": 43,
    "usage": {
      "input_tokens": 164838,
      "cached_input_tokens": 114304,
      "cache_write_input_tokens": 0,
      "output_tokens": 1172,
      "reasoning_output_tokens": 79
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50534,
      "cached": 114304,
      "write": 0,
      "output": 1172
    },
    "cost_usd": 0.1242184,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T13:54:21.029Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json specifies 0.21.0. Both 0539 AC1 tests passed, including running speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.21.0 above 0.20.0 and describes the changes in shipped tickets 0536–0538 and 0540–0550. Git history confirms that release scope. The diff against v0.20.0 and the passing preservation test confirm earlier sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.21.0, a public preview. The setup prompt retains the quoted semver:* install command; its test passed. scripts/prices.json contains 3148 models dated 2026-10-28, with updated rates consistent with the reported refresh."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.21.0.md includes a short introduction, changes and their benefits, per-project update instructions, upgrade considerations, the API-list-price estimate statement and the changelog link. Claims match the shipped tickets, and no person's name appears. All four AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculating the current done tickets with builtWithSpeckFigures produced 533 shipped, 16 cancelled, 13 median minutes, 1 median review round and 271 first-round approvals, matching README.md. The recorded run reports 1166 passes, zero failures and three skips; both 0539 AC5 tests passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, upgrade notes, prices and README figures are ready for 0.21.0. The notes match the shipped work, the figures check out, and the recorded tests have no failures. No blocking concerns found."
  }
}
```

</details>

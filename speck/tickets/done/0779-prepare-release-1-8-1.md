---
id: "0779"
title: "Prepare release 1.8.1"                # one outcome, no "and"
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
after: ["0771","0772","0773","0774","0775","0776","0777","0778"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0772"
started: "2026-11-27T01:50:57.520Z"
approved: "2026-11-27T01:56:31.345Z"
finished: "2026-11-27T02:03:09.086Z"

---
# 0779 · Prepare release 1.8.1

**Status:** ✅ done

## Problem
Since 1.8.0, `speck serve` switches to new code by itself and its `--stop` stops an installed service, test summaries work on Node 24, related test runs stay small, several unsteady tests are steady and the Waits for fact says approved. Anyone updating speck still gets 1.8.0.

## Outcome
speck is ready to be released as 1.8.1.

## Acceptance criteria
1. `package.json` has version `1.8.1`, and `speck init` prints `speck 1.8.1`.
2. `CHANGELOG.md` has a 1.8.1 section above the 1.8.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.8.0` tag, from the tickets shipped since (checked by review). The 1.8.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.8.1, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.8.1.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project, and restarting `speck serve` once if it was installed before this release), and a link to the 1.8.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.8.1.

## Out of scope
- Creating the `v1.8.1` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.8.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-26: an overnight batch of small, low-risk fixes after 1.8.0.
- Covers every ticket shipped since `v1.8.0`, the ones it waits for included, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them; the steadied tests can be one line.
- If one of the tickets it waits for is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.8.1` tag and its GitHub release page appeared. If not: `gh release create v1.8.1 --target main --title "speck 1.8.1" --notes-file docs/releases/v1.8.1.md`.
- Checked 2026-11-26: `v1.8.0` is tagged on origin.
- Failing before this build: not checked
- Self-check: narrowed the claim that `speck serve` switches when speck is updated to updates in the project it runs from, as it watches only the code beside it (0771).
- Pictures: none, because nothing anyone sees in the panel or on the floor changes; the README changes only its status line and figures.

## In plain words
speck is ready to go out as 1.8.1. Once this lands, the release page appears on GitHub and the setup prompt installs 1.8.1. It's a small release: speck serve now picks up a new version of speck by itself, stopping an installed speck serve really stops it, test summaries work again on Node 24, a build's related test run stays small when a page changes, and a ticket waiting on approved work says approved. The changelog and release notes describe each change, and the notes say to restart speck serve once after updating, as one started on an older release can't switch by itself yet. The README's figures and the price table are up to date as of today.

To see it, open the GitHub releases page once it has shipped and check that 1.8.1 is there. Worth keeping an eye on: if the release page doesn't appear, it can be made by hand from the release notes, as the ticket's Notes say.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 275,600
- Elapsed since build started: 6 min
- Changed lines: 71 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (not saved to the inbox, wording only): the release notes' bullet on `speck serve --stop` says the service starts again at the next boot without adding "(or next login on a Mac)", as the changelog does (round 1, F1, minor). Left as approved, since changing the notes after approval needs another round.

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
    "reviewed_sha": "1e5d08597dcc0733a904fed35123796ceadc14f4",
    "session": "fresh",
    "thread_id": "01a21ab7-3f6e-7fc3-9ea5-52bb53f8ab6b",
    "builder_response": "- Tests run: `speck test --related test/release-0779.test.mjs test/release-0770.test.mjs test/docs-0491.test.mjs` (182 related files, 1842 tests, all passing).\n- Built on 0772's approved work (`speck start` merged it in, as 0779 waits for it); 0772 ships before this does. Its changes in the diff are 0772's, already reviewed.\n- Covered since `v1.8.0`: 0771, 0772, 0773, 0777, 0778 as user-facing changes; 0774, 0775, 0776 (test-only) as one line under Tests; 0780 (fix ticket) was cancelled, so it's left out.\n- Figures worked out with `builtWithSpeckFigures(doneTicketsAt(<main at \"speck(0771): Switch speck serve to new code by itself\">))`: 759 shipped, 19 cancelled, 16 min median, 2 rounds median, 365 first-round.\n- `npm run prices` ran on 2026-11-27; only the `taken` date changed in the table.\n- 0770's release tests that named 1.8.0 as the current version now check the current version, as 0770 did for 0760's; `test/release-0779.test.mjs` added to 0491's allowed list.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 274350,
      "cached_input_tokens": 213376,
      "cache_write_input_tokens": 0,
      "output_tokens": 1250,
      "reasoning_output_tokens": 55
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 60974,
      "cached": 213376,
      "write": 0,
      "output": 1250
    },
    "cost_usd": 0.1557856,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-27T01:56:21.036Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 1.8.1; both 0779 AC1 tests passed, including running speck init."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 1.8.1 above 1.8.0 and covers tickets 0771–0778. Independently verified that 1.8.0 and earlier sections match v1.8.0 unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0779 AC3 tests passed for both status lines, the latest-release setup prompt and price-table date. scripts/prices.json says 2026-11-27; the builder reports running npm run prices that day."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v1.8.1.md explains the changes, updating each project and the one-time serve restart, and links to the changelog. Claims correspond to the dependency tickets; no person's name appears. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated the done-ticket figures: 759 shipped, 19 cancelled, 16 median minutes, 2 median rounds and 365 first-round approvals, matching README.md. The recorded run has 1839 passes, zero failures and three skips; the version/changelog test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "docs/releases/v1.8.1.md",
        "issue": "The installed-service bullet says it starts again at the next boot, without mentioning that on a Mac it starts at the next login.",
        "suggested_fix": "Say 'at the next boot (or next login on a Mac)', as the changelog does.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release preparation meets all five criteria. The figures match the ticket records, older changelog entries are unchanged, and the recorded tests pass. One minor wording correction would clarify when the Mac service starts again."
  }
}
```

</details>

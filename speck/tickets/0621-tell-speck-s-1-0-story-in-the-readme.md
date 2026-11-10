---
id: "0621"
title: "Tell speck's 1.0 story in the README"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:42:30.541Z"
approved: "2026-11-10T10:47:25.801Z"

---
# 0621 · Tell speck's 1.0 story in the README

**Status:** 👍 approved

## Problem
1.0 changes what speck is: it works as your engineering manager, which you can name, takes the obvious calls itself and reports them in Decided for you, looks into stops and slow builds, and asks you only when there's no clear answer. The README still tells the 0.x story: "How it works" says speck waits for you at two decisions, "speck asks, then moves on" is its headline behaviour, the watcher is one bullet about `watch: fix`, and the engineering manager is a single sentence tacked onto the first paragraph. Anyone arriving at 1.0 wouldn't learn its main idea, or how to switch it on.

## Outcome
The README leads with speck as your engineering manager, who gets your tickets shipped, makes the obvious calls and tells you what it did, and says how to turn that on.

## Acceptance criteria
1. The README's opening introduces speck as your engineering manager: you decide what gets built with your own agent; speck runs the builder and reviewer you chose, makes the obvious calls, gets stuck work moving and tells you what it did, asking only when there's no clear answer; and you can give it a name of your own (checked by review).
2. "How it works" describes the 1.0 flow: your decision on what gets built, then speck managing everything between, taking a build's recommendation and reporting it in Decided for you, and shipping by itself once you trust it with auto-ship, which waits for you on high-risk tickets and changed criteria (checked by review).
3. The README says how to have speck take the obvious calls, by choosing `decide` for `watch` in the panel's Settings or with `speck config set watch decide`, and how to name it, with `speck_name` (checked by review).
4. "The clever bits" describes what speck does as your engineering manager in 1.0, including looking into stops and builds that run long and holding back a ticket whose criteria changed, and no longer presents asking as its main behaviour (checked by review).
5. The README's setup prompt, status line, pictures and links still pass their tests, and no other test that passed before this change fails.

## Out of scope
- The status line, the demo pictures and the release notes, which the 1.0.0 release ticket (0598) updates.
- The landing page, which lives in its own repo.
- Changing `watch`'s default.

## Notes
- Asked for 2026-11-10: "Is there also something that's going to update the README text with the new feature, the main watcher concept?" Nothing was: 0575 added one sentence, 0597 updated only the panel section and the pictures, and 0598 writes the changelog and release notes.
- The role, as agreed on 2026-11-09: speck is your engineering manager. Once you set a ticket ready, getting it shipped is its job: it runs the builder and reviewer you've chosen, makes the obvious calls when a build asks, gets stuck work moving again, checks the result and tells you what it did and why. You decide what gets built; your own agent is who you plan it with. You can call it whatever you like (the user's is Virgil).
- Keep the README's voice: plain British English, written for product managers, no one's name. Use the no-ai-slop pass the README has had before if it helps.
- Relies on nothing outside this repo.
- Failing before this build: none
- Tests: every criterion except 5 is about how the README reads, so it has no test of its own: the reviewer checks it by reading the README. Criterion 5 is checked by the existing README tests (setup prompt, status line, pictures, links), run with `speck test --related`.
- Self-check: said that speck takes calls and looks into stops only once `watch` lets it, as `tell` is the default; said the name shows wherever it speaks for you (panel, `speck status`, `speck run`'s log), as 0576 did, rather than everywhere; added asking you to what its agent can do.
- Pictures: none, because the change is wording only and the demo pictures are out of scope.

## In plain words
The README now tells speck's 1.0 story. It opens with speck as your engineering manager: you decide what gets built, and speck gets it shipped, makes the obvious calls, gets stuck work moving and tells you what it did. "How it works" walks through that flow, and a new part says how to switch it on (choose `decide` for `watch` in Settings) and how to give it a name of your own. "The clever bits" now leads with the calls speck makes, how it looks into stops and slow builds, and how it holds back a ticket whose criteria changed.

To see it, open the README on GitHub once this ships. Nothing in the product itself changes. The status line and demo pictures still show 0.22.0: the 1.0.0 release ticket updates those.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 98,164
- Elapsed since build started: 5 min
- Changed lines: 41 (limit 5000)
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
    "reviewed_sha": "ccdc8eb6285106507fb4f3d9f5df0715bcdc5b43",
    "session": "fresh",
    "thread_id": "01a1c511-4967-7c41-85dc-d30b9ae26b40",
    "builder_response": "- Tests run: `speck test --related` with no ticket test files: the 41 existing test files that name README.md (setup prompt, status line, pictures, links and the repo-wide checks). All pass.\n- Criteria 1–4 are \"(checked by review)\": no tests, as the build skill forbids tests of a document's wording. Criterion 5 is covered by the existing README tests above.\n- Facts checked against docs/brief.md: `watch: decide` takes a recommendation only on a low-risk ticket, with a recommendation, up to 3 per ticket; `tell` is the default; `fix` takes only \"changes nothing you'd notice\" + \"clear winner\" calls; the agent can resume, reship, raise a fix ticket, tell or ask; long builds are >2× median and ≥20 min; auto-ship waits for tasks, changed criteria and risks not in `auto_ship_risk` (default [low]); `speck_name` is in the Your engineering manager group and 0576 uses it in the panel, `speck status` and `speck run`'s log.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 97387,
      "cached_input_tokens": 66560,
      "cache_write_input_tokens": 0,
      "output_tokens": 777,
      "reasoning_output_tokens": 9
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 30827,
      "cached": 66560,
      "write": 0,
      "output": 777
    },
    "cost_usd": 0.07608,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:47:18.286Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md:5 introduces the engineering manager, planning with your own agent, chosen builder and reviewer, decisions, recovery, reporting and naming."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md:35–71 describes choosing work, managed builds and reviews, recommendations reported in Decided for you, and optional auto-ship with safeguards for high-risk tickets and changed criteria."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md:55–59 gives the Settings location, `speck config set watch decide` and `speck_name`; explicitly states that `tell` remains the default. Settings agree with scripts/settings.mjs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README.md:73–84 leads with taking and reporting calls, investigating stops and long builds, and holding changed-criteria tickets for manual shipping. Asking is no longer the headline behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0621-tests.txt confirms 478 tests: 475 passed, 3 skipped, none failed, including existing setup-prompt, picture, link and release checks. No tests were changed or added. The diff preserves the setup prompt, status line and pictures and changes only README prose and ticket metadata."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now explains speck as your engineering manager, how to enable its decisions and give it a name, and when shipping still waits for you. The documented safeguards match the repository. Existing relevant tests pass, and the change stays within scope."
  }
}
```

</details>

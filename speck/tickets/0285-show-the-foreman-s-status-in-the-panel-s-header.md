---
id: "0285"
title: "Show the Foreman's status in the panel's header"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0283"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:34:13.900Z"

---
# 0285 · Show the Foreman's status in the panel's header

**Status:** 🔍 reviewing

## Problem
When nothing is building or shipping, the panel doesn't say why: the reason is in `speck/.cache/runs/run.log`. On 2026-10-17 it took a conversation with an agent to find out each time: `main` had diverged from GitHub, shipping was on hold, speck run was waiting to switch to new code, and the panel page was too old to show a new setting.

## Outcome
The panel's header shows the Foreman, speck run's single status for the whole pipeline, and its detail says what's moving, what's waiting and why. The speck run switch moves into Settings.

## Acceptance criteria
1. The header shows one Foreman status in place of the speck run switch, in one or two words and a colour: Off, Idle, Building <n>, Shipping <id>, Waiting (with the reason in a word or two, such as "on hold" or "new code"), or Needs you <n>, for blocked tickets.
2. Pressing it opens its detail: each ready ticket that isn't building, with why (waiting for <ids>, all build slots in use, speck run off, speck run switching to new code once <builds> end); shipping's state (on hold until main has a new commit, or a refusal waiting for a new commit, with its message); and blocked tickets, with their questions.
3. The Settings view has a "Foreman" group, first, with the speck run on/off switch that today's header button has, working as it does today.
4. When the panel's server is running newer code than the page shows, the status says so and offers to reload the page.
5. Every reason in criterion 2 comes from what speck run itself records as it works, not from the panel working it out separately, so `speck status` can show the same.

## Out of scope
- The Foreman acting on anything: 0286 and 0287.

## Notes
- From `speck/ideas/2026-10-17-a-foreman-that-keeps-the-work-moving.md`, step 1. The switch is `.run-state` in `templates/panel.html` and `panelRunOn` in `scripts/panel.mjs`.
- Failing before this build: none
- Self-check: named the record run.foreman.json, not <name>.json, so speck run never adopts it as a build's run record; a record counts only while the speck run that wrote it holds the lock; the detail's heading is "Blocked" (0034 keeps "Needs you" out of the page as a heading); its headings are 12 px (0161).

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
    "reviewed_sha": "324e5738f17172cce1e681e140589f807b1a9c45",
    "thread_id": "01a14f0f-e026-79c0-aab0-9aaaa34afd57",
    "seconds": 46,
    "usage": {
      "input_tokens": 314733,
      "cached_input_tokens": 242688,
      "cache_write_input_tokens": 0,
      "output_tokens": 1274,
      "reasoning_output_tokens": 266
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T12:50:48.475Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "foremanView() and the AC1 tests cover the listed statuses, but shipQueue.state() reports only its own current ship. A ship started through the panel or CLI can leave the header saying Idle."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "renderForeman() and the AC2 tests cover ready reasons, refusals, holds and blocked questions. However, shipping started outside the queue is absent from the detail."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: renderSettings() places foremanGroup() first. The two AC3 tests exercise switching on/off and displaying a refusal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/panel.mjs stamps the served page and state; pageStale() and renderForeman() offer reload. AC4 tests cover matching stamps, changed page code and pressing reload."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/run.mjs records ready-ticket reasons through saveForeman(), using shipQueue.state() for shipping reasons. The AC5 integration test exercises actual run records; foremanLines() shares their presentation with plain speck status."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship-queue.mjs",
        "issue": "state() returns running: current, which tracks only ships this queue launched. check() recognises ships started elsewhere through otherShipRunning(), but never records them. Consequently, while speck run is on, pressing Ship in the panel or running speck ship can produce an Idle header and an empty Shipping detail throughout an active ship. A direct foremanView() check with a ticket whose ship.running is true reproduces this.",
        "suggested_fix": "Have speck run record active shipping from all launch sources, using the existing ship records, and expose that through the shared Foreman view. Add coverage for a ship started outside this queue.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The status display, Settings switch and reload offer are implemented with passing tests. One gap needs fixing: shipping started through the panel or command line can be invisible to the Foreman, making the pipeline appear idle while it is shipping."
  }
}
```

</details>

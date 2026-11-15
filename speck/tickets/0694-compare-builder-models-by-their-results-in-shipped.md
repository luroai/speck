---
id: "0694"
title: "Compare builder models by their results in Shipped"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
source: "speck/ideas/done/2026-11-15-show-what-a-shipped-ticket-was-built-with.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:26:35.853Z"

---
# 0694 · Compare builder models by their results in Shipped

**Status:** 🔍 reviewing

## Problem
Since 1.3 tickets can build on different models and levels, but nothing compares how they do. Shipped gives one set of figures for every ticket, and a shipped ticket doesn't say which model built it, so you can't tell whether a cheaper model holds up or only looks cheaper, for example after a few days of quick tickets on Sonnet.

## Outcome
Shipped shows how each builder model does, and each shipped ticket says what built it.

## Acceptance criteria
1. Shipped has a By model table, under its figures and for the same tickets they count, with one row per builder model: the number of tickets, median minutes from start to approval, median review rounds, the share approved in the first round and median builder cost per ticket, worked out as Shipped's own figures are.
2. A ticket counts under the builder model that cost most across its builds, as `speck spend --by=model` names models. Tickets with no recorded builder model count in one last row, Unknown, shown only when there are some.
3. A row with fewer than 5 tickets says "few tickets" beside its count, so a model isn't judged on two or three.
4. A shipped ticket's full view has a Built with fact naming the builder model or models its builds ran on, as recorded, or "Not recorded".
5. At 375 pixels wide the table fits the lane without a horizontal scroll, wrapping or shortening its headings as Shipped's figures do.

## Out of scope
- Grouping by level or effort.
- Choosing a ticket's level from these figures: for later, once enough tickets have run on each model.
- Recording the builder and model at the start of a build: the models come from the builds' own records, as `speck spend` reads them.

## Notes
- Asked for 2026-11-15, as part of the 1.5.0 plan: "results per model". From `speck/ideas/2026-11-15-show-what-a-shipped-ticket-was-built-with.md`.
- The board already gives each ticket `builder_models` (`scripts/speck.mjs`), and Shipped's figures are worked out in `templates/panel-model.js` (`stats`).
- Checked 2026-11-15: `speck spend --by=model` since 1 November gives claude-opus-5-5 $355.98, claude-sonnet-5-5 $11.88 and gpt-6.1-sol $21.03.
- Failing before this build: none
- Self-check: the brief now describes the By model table and the Built with fact; the table's text kept to 12 and 14 px to meet the panel's text-size rules.

## In plain words
Shipped now has a By model table under its figures: one row for each AI model that built tickets, with how many it built, how long they took, how many review rounds they needed, how often the first review approved them and what the builder cost. A model with fewer than 5 tickets says "few tickets", so you don't judge it too early. A shipped ticket's full view also says which model built it.

To see it, open the Shipped lane and look under the figures, or open any shipped ticket. Most older tickets were built before speck recorded models, so for now they sit in a large Unknown row at the bottom; the comparison gets more useful as new tickets ship.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: most tickets shipped before builder models were recorded count under Unknown, so the table compares only recent tickets for now.
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
    "reviewed_sha": "3eded24f7b7540a1a61814cb8377129d18e3a6c9",
    "session": "fresh",
    "thread_id": "01a1e12e-86f2-7311-9dee-ee684ef8c0dd",
    "builder_response": "- Tests run: test/panel-0694.test.mjs test/house-rules-full-0657.test.mjs (with commands.checks). The --related run before this round passed everything but one nested real-browser check in house-rules-full-0657, whose panel didn't start under load; re-run on its own, it passed.\n- Pictures: four in the review pack, the By model table and a shipped ticket's Built with fact, light and dark, at 375 px with the real board.\n- docs/brief.md: the Shipped and full-view descriptions name the By model table and the Built with fact.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 184580,
      "cached_input_tokens": 144896,
      "cache_write_input_tokens": 0,
      "output_tokens": 826,
      "reasoning_output_tokens": 27
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 39684,
      "cached": 144896,
      "write": 0,
      "output": 826
    },
    "cost_usd": 0.1021176,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:48:34.786Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-model.js: byModel uses the same done tickets, median helper, exclusions and rounding as Shipped's figures. drawByModel renders all six columns beneath the figures. Three passing AC1 tests cover calculations, shipping exclusions and missing data."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/spend.mjs: builderSpent aggregates model costs across builds; templates/panel-model.js: costliestModel selects the largest. panelBoard preserves names and costs for older tickets. Both AC2 tests passed, covering attribution, Unknown ordering and older tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "byModel marks counts below five; drawByModel displays 'few tickets' beside the count. The passing AC3 test checks both sides of the threshold."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.js: shippedFacts adds Built with using recorded model names or Not recorded. Both AC4 tests passed for multiple models and absent names."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/panel-cards.css provides short headings and wrapping model names. The real-browser AC5 test passed at 375 px, checking table, lane, page and cell overflow, including a long model name."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipped now compares builder models using its existing figures, flags small samples and shows which models built each ticket. The tests exercise the requested behaviour, including the phone layout, and all nine ticket tests passed. No blocking issues found."
  }
}
```

</details>

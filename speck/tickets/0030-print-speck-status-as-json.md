---
id: "0030"
title: "Print speck status as JSON"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:47:45.752Z"

---
# 0030 · Print speck status as JSON

**Status:** 🔍 reviewing

## Problem
The control panel (0031) needs everything `speck status` knows in a form a program can read. Today `speck status` only prints text for people, so any tool would have to scrape it.

## Outcome
`speck status --json` prints every ticket and idea, with the details the panel shows, as one JSON object.

## Acceptance criteria
1. `speck status --json` prints a single JSON object `{"tickets": [...], "ideas": [...]}` to stdout, with nothing else on stdout, and exits 0. With no tickets it prints `"tickets": []`, and with no `speck/ideas/` folder it prints `"ideas": []`. `speck status` without `--json` prints exactly what it does today.
2. `tickets` holds the same tickets as the text output, each once, read from the same place: a ticket being built in another worktree comes from that worktree's copy, as in 0029. Each entry has every frontmatter field under its own name, plus `path` (the ticket file's path relative to the folder it was read from), `worktree` (that worktree's absolute path, or `null` if read from the current checkout), `acceptance_criteria` (an array of each criterion's text without its number), `blocked_question` (the section's text, or `null` when it has no content besides the comment), and `lint` (`{"errors": <count>, "warnings": <count>}` from the same checks as `speck lint`).
3. Each ticket entry has `rounds`: an array with one object per recorded review round, in order, with `round`, `reviewer`, `verdict`, `seconds` (or `null` if not recorded) and `tokens` (input plus output tokens from the round's usage, or `0` when there's no usage). A ticket with no rounds has `[]`.
4. Each ticket entry has `waiting_on`: the ids in its `after:` list that aren't a ticket with status `done`, including ids with no ticket at all, in the order listed. `tickets` is sorted by `priority` (lowest number first, no priority last), then by id.
5. `ideas` has one entry per `.md` file in `speck/ideas/`, sorted by file name, with `path` (relative to the repo root), `title` (the text of its first `# ` heading, or the file name if there isn't one) and `status` (its `Status:` value, or `null` if it has none).

## Out of scope
- The panel itself (0031).
- Ordering fields beyond `priority` (an `order` field comes with reordering, later).
- JSON output for any other command.

## Notes
- Field names in the criteria are the contract 0031 builds on. Don't rename them.
- Priority 1: the panel waits on this.
- No external facts: everything comes from files speck already reads.
- Self-check: no changes. Checked empty and missing folders, tickets with no `after`, no priority or a non-list `after` (treated as none), malformed review rounds (counted by lint, listed as parsed), ideas with no heading or no `Status:` line, and built-in names (`constructor` comes through as a field, `__proto__` is dropped by the existing YAML parser).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: `parseYaml` silently drops a frontmatter key named `__proto__`, so it never reaches `--json` (or any command). Low priority.

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
    "reviewed_sha": "a1bc3c033aa66441cb04efa9f8fc896de927c6bb",
    "thread_id": "01a1204a-a6cf-7e80-831e-122dae3216d1",
    "seconds": 49,
    "usage": {
      "input_tokens": 262808,
      "cached_input_tokens": 204032,
      "cache_write_input_tokens": 0,
      "output_tokens": 1207,
      "reasoning_output_tokens": 129
    },
    "saved_at": "2026-10-09T10:52:54.490Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdStatus handles --json before text output. Test '0030 AC1' checks JSON parsing, exit 0, empty folders and unchanged text output. Live CLI verification was prevented by sandbox git EPERM."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "statusTickets shares text output's worktree selection; AC2 tests exercise fields, paths and lint counts. However, statusData derives acceptance_criteria from lintTicket.acceptanceCriteria, which discards continuation lines and nested lists."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "statusData maps ticketRounds records in order. Test '0030 AC3' checks recorded values, token totals, absent usage and empty rounds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData filters dependencies against done tickets and sorts by numeric priority then id. Test '0030 AC4' exercises missing dependencies, ordering and absent priority."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "statusData reads sorted Markdown idea notes. Test '0030 AC5' checks paths, first heading, filename fallback, status and excluded non-Markdown files."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "acceptance_criteria silently loses parts of multiline criteria. A read-only probe with '1. Export a CSV with:' followed by nested bullets for names and dates returned only the opening line. The panel would receive an incomplete requirement. Existing tests use single-line criteria exclusively.",
        "suggested_fix": "Extract complete numbered criterion blocks, retaining their continuation text and nested lists while removing the leading criterion number. Add a regression test covering multiline criteria.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The new capability is documented, but the claim that acceptance_criteria contains criterion text is incomplete while continuation text is discarded."
    },
    "escalation_question": "",
    "summary": "The JSON export covers tickets, worktrees, review history, dependencies and ideas, with meaningful tests. One fix is needed: multiline acceptance criteria currently lose their details, so the panel could show incomplete requirements. I verified the code and parsing behaviour; sandbox restrictions prevented rerunning the CLI integration checks."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "777234ced45c02c2bd0d89f1a941e7ca0147c540",
    "thread_id": "01a1204a-a6cf-7e80-831e-122dae3216d1",
    "seconds": 24,
    "usage": {
      "input_tokens": 412814,
      "cached_input_tokens": 334336,
      "cache_write_input_tokens": 0,
      "output_tokens": 1764,
      "reasoning_output_tokens": 129
    },
    "saved_at": "2026-10-09T10:54:24.592Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdStatus prints only the JSON object when --json is present. Test '0030 AC1' covers exit 0, JSON-only stdout, empty folders and unchanged text output; supplied run passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "statusTickets shares text output's ticket and worktree selection. statusData includes frontmatter, paths, questions and lint counts. AC2 integration tests cover these fields; the new passing multiline regression exercises criteriaText with nested lists and wrapped text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "statusData maps ticketRounds in recorded order with the required defaults and token sum. Passing test '0030 AC3' covers two rounds, missing seconds and usage, and no rounds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData filters after against done ticket ids, preserves dependency order, and sorts by priority then id. Passing test '0030 AC4' covers missing dependencies, ties and absent priority."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "statusData sorts Markdown idea filenames and extracts paths, first headings and statuses with fallbacks. Passing test '0030 AC5' exercises each behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Multiline acceptance criteria previously lost continuation text and nested lists. criteriaText now preserves them, and the new CLI regression checks the complete returned text.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The JSON capability and preservation of multiline criterion text accurately describe the current implementation."
    },
    "escalation_question": "",
    "summary": "Approved. The JSON export meets all five criteria, and the incomplete acceptance text is fixed with a meaningful regression test. No blocking concerns remain. I inspected the current code and tests and verified syntax; the supplied test run passes all 158 tests, but sandbox restrictions prevented independently rerunning integration tests."
  }
}
```

</details>

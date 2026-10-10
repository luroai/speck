---
id: "0087"
title: "Change a speck setting from the command line"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:56:59.164Z"

---
# 0087 · Change a speck setting from the command line

**Status:** 👍 approved

## Problem
Changing a setting today means editing `speck/config.yml` by hand. An agent setting speck up for someone (0088) would have to edit YAML directly, where one wrong indent or unquoted value breaks every speck command, and nothing checks the value is one speck accepts.

## Outcome
`speck config set <key> <value>` changes one setting safely: it checks the value, keeps the rest of the file as it was, and refuses anything speck wouldn't accept.

## Acceptance criteria
1. `speck config set <key> <value>` changes that one setting in `speck/config.yml`, including nested ones named with dots (for example `commands.test` or `limits.max_review_rounds`). Every other line, comment and the order of settings stay exactly as they were, and it prints `<key>: <old> → <new>`.
2. A value that needs quoting in YAML (for example one containing `#`, `: ` or quotes, like `build_command`) is written so the file reads back with exactly that value.
3. Values are checked as speck reads them: an unknown key, `reviewer_effort` outside blank, low, medium, high, xhigh or max, a true/false setting given anything else, a limit that isn't a whole number of 1 or more, or `auto_ship_risk` not made of low and high, is refused with a plain message, and the file is unchanged.
4. A known key missing from an older config file is added under its section, so the file still loads.
5. It doesn't commit. Without `speck/config.yml`, it says to run `speck init` first and changes nothing.

## Out of scope
- Editing settings from the panel (`speck/ideas/2026-10-09-edit-settings-from-the-panel.md`), which could reuse this later.
- `reviewer_options` and other free-form maps.

## Notes
- Used by the setup skill (0088) for every choice the user makes.
- Self-check: added a test that a value holding a newline is written on one line and reads back exactly.
- Three tests in luro-0082 and private-words-0084 already fail on main: they read speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md, which was filed into speck/ideas/done/. Not this ticket's change.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 setConfigText updates a shadowed child in an earlier duplicate section instead of adding it to the section speck actually reads.
Round 2 (codex): approve.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,880,023
- Elapsed since build started: 73 min
- Changed lines: 138 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Three tests (luro-0082 AC4, and two in private-words-0084 that run it) fail on main because the idea note they read was filed into speck/ideas/done/. Sent to the inbox: speck/ideas/2026-10-10-fix-the-test-that-reads-a-filed-idea-note.md.
- `speck config set` doesn't check text settings: a blank base_branch or reviewer is accepted, as speck reads them today. Known limit.

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
    "reviewed_sha": "b8aa76a328355b6c8dacdc48071578313f047e84",
    "thread_id": "01a12621-7db7-76f1-9293-56d685940ab9",
    "seconds": 42,
    "usage": {
      "input_tokens": 269596,
      "cached_input_tokens": 175104,
      "cache_write_input_tokens": 0,
      "output_tokens": 982,
      "reasoning_output_tokens": 116
    },
    "saved_at": "2026-10-10T14:05:32.701Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs cmdConfig and setConfigText implement single-line updates and old → new output. AC1 CLI tests cover top-level and dotted keys, comments, duplicate scalar keys and Windows line endings; builder output reports them passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "yamlValue checks values against parseYaml before writing. AC2 CLI tests cover hashes, colons, both quote types, whitespace, YAML-like strings and newlines; all pass in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "checkConfigValue validates known keys, efforts, flags, positive integers and risks before writing. AC3 tests exercise refusals and assert the entire file remains unchanged; supplied results pass."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "AC4 tests pass for ordinary older files, missing sections and {} sections. However, setConfigText searches all matching child lines before selecting the effective section. A key present only in an earlier duplicate section is treated as present, although parseYaml discards that section. The command consequently refuses to add the missing effective key."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdConfig contains no commit operation, and findRepoRoot supplies the speck init message. Both AC5 CLI tests pass in the supplied results and check git history and absence of created files respectively."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/config.mjs",
        "issue": "setConfigText updates a shadowed child in an earlier duplicate section instead of adding it to the section speck actually reads. Reproduced read-only with `commands:\\n  test: old\\ncommands:\\n  other: keep\\n`: setting commands.test edits the first section, while parseYaml still returns only commands.other. cmdConfig's read-back guard then refuses this valid setting, violating AC4.",
        "suggested_fix": "Find the effective parent section first and restrict existing-child lookup to that section. Add a CLI regression test showing a key shadowed by a later section is added there, preserving all other lines and settings.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The command validates values and preserves formatting in the tested cases. One older-file edge case needs fixing: repeated sections can prevent a missing setting from being added. The tests exercise real CLI behaviour, and the change stays within scope. The supplied full suite also reports three unrelated failures; I did not rerun tests that write temporary files in this read-only review."
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
    "reviewed_sha": "53a9575a8014b4e78477dba635c0d45198413a48",
    "thread_id": "01a12621-7db7-76f1-9293-56d685940ab9",
    "seconds": 25,
    "usage": {
      "input_tokens": 580378,
      "cached_input_tokens": 423168,
      "cache_write_input_tokens": 0,
      "output_tokens": 1666,
      "reasoning_output_tokens": 116
    },
    "saved_at": "2026-10-10T14:07:51.325Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs setConfigText and cmdConfig preserve unrelated lines and print old → new. Passing AC1 CLI tests cover top-level and nested settings, comments, ordering, duplicate keys and Windows line endings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "yamlValue and cmdConfig verify exact read-back before writing. All AC2 CLI tests pass, including hashes, colons, quotes, padded strings and newlines."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "checkConfigValue validates keys, efforts, booleans, positive whole numbers and risk lists before writing. Passing AC3 CLI tests check plain refusal messages and byte-for-byte unchanged files."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "setConfigText now selects the last parent section before looking for its child. All AC4 tests pass, including the new F1 CLI regression. An independent read-only reproduction confirms the setting is added to the effective section and other values remain intact."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdConfig performs no commit; findRepoRoot supplies the speck init instruction. Both AC5 CLI tests pass, checking unchanged commit history and no files created when config is absent."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/config.mjs",
        "issue": "The earlier repeated-section bug is fixed: shadowed children no longer prevent adding a setting to the effective section.",
        "suggested_fix": "Implemented and covered by the passing AC4 regression test for review F1.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. The command changes one setting, checks its value, preserves the rest of the file and handles missing settings in older files. The repeated-section problem is fixed and tested. All ticket-specific tests pass; the supplied full suite still reports three failures in unrelated tests."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b753a337feae0807f5c605f6a0185a65ddf5967f",
    "thread_id": "01a12621-7db7-76f1-9293-56d685940ab9",
    "seconds": 22,
    "usage": {
      "input_tokens": 1025181,
      "cached_input_tokens": 645248,
      "cache_write_input_tokens": 0,
      "output_tokens": 2220,
      "reasoning_output_tokens": 116
    },
    "saved_at": "2026-10-10T15:10:18.404Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs setConfigText and cmdConfig remain unchanged by the merge. Passing AC1 CLI tests verify top-level and dotted-key updates, old → new output, preservation of unrelated lines and comments, duplicate keys and line endings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "yamlValue quotes strings and cmdConfig checks exact read-back before writing. All AC2 CLI tests pass, covering hashes, colons, quotes, whitespace, YAML-like strings and newlines."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "checkConfigValue validates known keys, efforts, booleans, positive whole numbers and risk lists. All AC3 CLI tests pass and verify plain refusal messages and unchanged file contents."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "setConfigText adds missing keys to their effective section. Passing AC4 tests cover older files, absent sections, empty sections, missing final newlines and the F1 repeated-section regression."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdConfig has no commit operation; findRepoRoot supplies the speck init message. Both AC5 CLI tests pass, verifying commit history and no files created when config is absent."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/config.mjs",
        "issue": "The repeated-section bug remains fixed after the merge. Existing-child lookup is restricted to the effective parent section.",
        "suggested_fix": "No further change required; the F1 CLI regression passes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved after the merge. The command meets all five criteria, and the earlier bug remains fixed. Git comparisons confirm the implementation is unchanged and the files brought in from main are preserved exactly. The supplied full test run reports 745 passes, no failures and three skips. No blocking findings remain."
  }
}
```

</details>

---
id: "0123"
title: "Bring an old speck section in AGENTS.md up to date"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-refresh-an-old-speck-pointer-in-agents-md.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T12:36:02.784Z"

---
# 0123 · Bring an old speck section in AGENTS.md up to date

**Status:** 🔍 reviewing

## Problem
`speck init` adds a speck section to a project's AGENTS.md, but once one is there it never updates it. Projects set up with an older speck keep its old instructions, such as "Read `speck/product.md` first", a file speck no longer creates. Their agents follow stale rules before every build, and re-running `speck init` to update speck doesn't fix it.

## Outcome
Re-running `speck init` brings the speck section of AGENTS.md up to date with the current one.

## Acceptance criteria
1. When AGENTS.md has a `## speck` section that differs from the current one, `speck init` replaces that section, from its heading up to the next heading of the same or a higher level or the end of the file, with the current text, and says it updated it.
2. Everything in AGENTS.md outside that section is left byte for byte as it was.
3. When the section already matches the current text, `speck init` leaves AGENTS.md untouched and doesn't say it updated it.
4. AGENTS.md without a speck section, or no AGENTS.md at all, gets the section added as today.
5. AGENTS.md that mentions "This repo uses speck" but has no `## speck` heading is left as it is, and `speck init` says the speck instructions in it may be out of date and shows the current text to compare.

## Out of scope
- CLAUDE.md, which only imports AGENTS.md.
- Keeping edits someone made inside speck's own section: they're replaced, and show in `git diff`.

## Notes
- Failing before this build: none
- Self-check: made the section scan skip fenced code blocks, so a `# comment` in a code block doesn't end the section early (test added), and updated the setup skill's line on what `speck init` does to AGENTS.md.

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
    "reviewed_sha": "ac3afdb75464900b1d52696a3e4e934af988a101",
    "thread_id": "01a12afa-1f70-7222-9889-36bf11b82046",
    "seconds": 31,
    "usage": {
      "input_tokens": 88229,
      "cached_input_tokens": 52608,
      "cache_write_input_tokens": 0,
      "output_tokens": 835,
      "reasoning_output_tokens": 96
    },
    "saved_at": "2026-10-11T12:40:28.014Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing AC1 tests cover unindented headings and fenced blocks. However, scripts/install.mjs:66 in syncAgentsSection misses valid headings indented by up to three spaces. A read-only reproduction with '  ## Other' or '  # Other' replaced the following section too."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 test passes for an unindented boundary. The same reproduction deleted 'Keep these user rules.' outside the speck section, violating byte-for-byte preservation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "syncAgentsSection returns unchanged text for the current section; cmdInit writes only changed text. The passing AC3 test checks unchanged contents and no update message, including when another section follows."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 integration test exercises both missing AGENTS.md and an existing file without a speck section, checking the resulting contents and update message."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 integration test verifies that an unheaded speck mention remains unchanged and the output warns about outdated instructions and shows the current text."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/install.mjs:66",
        "issue": "The section boundary recogniser ignores valid Markdown headings with one to three leading spaces. Updating an old speck section therefore deletes subsequent user-owned sections with such headings. This was reproduced directly using syncAgentsSection.",
        "suggested_fix": "Recognise valid indented level-one and level-two headings as section boundaries while retaining fenced-code handling. Add regression tests verifying that these headings and all following text remain byte-for-byte unchanged.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The update works for the layouts covered by the tests, and the recorded suite has no failures. However, it can delete unrelated project instructions when the next heading is indented. Fix that preservation bug before merging."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9eb51486516be75ab4ed42d554ad129433deca76",
    "thread_id": "01a12afa-1f70-7222-9889-36bf11b82046",
    "seconds": 34,
    "usage": {
      "input_tokens": 211204,
      "cached_input_tokens": 168064,
      "cache_write_input_tokens": 0,
      "output_tokens": 1809,
      "reasoning_output_tokens": 148
    },
    "saved_at": "2026-10-11T12:42:38.682Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 tests pass, and direct checks confirm indented headings now work. However, syncAgentsSection in scripts/install.mjs tracks only the last line of a setext heading. For 'Project\\nrequirements\\n------------', replacement incorrectly consumes 'Project'."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests pass for their fixtures. A read-only reproduction with a multiline setext heading deleted its first line, so text outside the speck section is not always preserved."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 integration test checks unchanged contents and no update message. cmdInit writes only when the returned text differs; direct checks also confirmed repeat updates are idempotent."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 integration test exercises missing AGENTS.md and an existing file without a speck section, checking contents and update messages. The addition path remains unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 integration test checks unchanged unheaded instructions, the warning and current comparison text. cmdInit retains this behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/install.mjs:syncAgentsSection",
        "issue": "Indented level-one and level-two headings previously caused subsequent user sections to be deleted. The updated recogniser fixes this, with passing regression tests and independently verified preservation.",
        "suggested_fix": "No further change required for indented ATX headings.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/install.mjs:syncAgentsSection",
        "issue": "Setext headings can span multiple text lines, but the new boundary logic remembers only the immediately preceding line. For 'Project\\nrequirements\\n------------\\n\\nKeep me.', updating the preceding speck section deletes 'Project', changing a user-owned heading outside the section.",
        "suggested_fix": "Track the beginning of the paragraph forming a setext heading and use that as the boundary. Add an integration regression test with a multiline setext heading that verifies the entire heading and following text remain byte-for-byte unchanged.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The original indentation bug is fixed, and the recorded suite passes. However, the added handling for underlined headings can delete the first line of a multiline heading belonging to the project. That preservation bug still needs fixing before merge."
  }
}
```

</details>

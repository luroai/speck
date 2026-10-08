---
id: "0003"
title: "Verify the Claude subagent reviewer end to end"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | done
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:46:41.610Z"

---
# 0003 · Verify the Claude subagent reviewer end to end

**Status:** 🔨 building

## Problem
The `claude-subagent` reviewer path (speck prompt, Agent tool, SendMessage, speck record) is written but has never been run, so it may not work.

## Outcome
A ticket can be reviewed end to end with `reviewer: claude-subagent` and `allow_same_model_review: true`.

## Acceptance criteria
1. A sample ticket with a deliberate bug gets `changes_requested` from the subagent in round 1, recorded via `speck record`.
2. Round 2 continues the same subagent through SendMessage and ends in `approve` after the fix.
3. Any instructions in skills/speck-review/SKILL.md that turn out wrong are corrected.

## Out of scope
- Adding other reviewer models

## Notes
**Live run (2026-10-08).** A throwaway repo had speck installed from this branch, `reviewer: claude-subagent` and `allow_same_model_review: true`. Its sample ticket 0001 asked for `slugify()` and had three criteria. The build had a deliberate bug: a trailing hyphen was left on (`"  Hello, World!  "` gave `hello-world-`), and an AC2 test only checked the leading end, so the tests passed. Each step followed `skills/speck-review/SKILL.md` as written. Model and effort were `default`, so neither was passed. The one extra was that the repo path went into the subagent's prompt, because the builder session was running from this repo rather than the sample one.
- Round 1: a fresh general-purpose subagent found the bug and the weak test (F1 and F2, blocking; F3 minor, about product.md) and returned `changes_requested`. Its reply came inside a ```` ```json ```` fence, and `speck record` crashed on it with a Node stack trace. Once the fence was stripped by hand, the round recorded, and `next` said `fix`. **(AC1)**
- Round 2: after the fix was committed, SendMessage to the same agent id resumed it with its round-1 findings. It marked F1–F3 `resolved` and returned `approve` (fenced again, and the crash happened again). Once recorded, `next` said `ship` and `speck pack` showed both rounds as `claude-subagent, model default, effort default`. The round-2 verdict was saved with its evidence and finding text shortened. The verdict, criteria statuses and finding ids and states were kept exactly. **(AC2)**

**What was wrong, and what's fixed (AC3).** The skill said to save the subagent's "JSON reply", but a real reply is fenced, so `speck record` failed every round. `speck record` now accepts a fenced reply, and gives a plain error with no round recorded for anything that isn't a JSON verdict. The skill now says to save the reply as it came back. It also says the agent id kept in round 1 is what round 2's SendMessage goes to, and gives the full `speck record` command for round 2. Everything else in the skill worked as written.

**Automated tests** (`0003 AC1`–`AC3` in `test/speck.test.mjs`) replay the same loop through the CLI, with the replies fenced as the real subagent sent them. A test can't start a real Claude subagent, so the live run above is the evidence for that part.

## Blocked question

## Review log

## Delivery log

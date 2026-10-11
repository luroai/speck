---
id: "0121"
title: Refuse a ticket that contains one of your private words                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-stop-tests-depending-on-files-under-speck.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T12:18:35.680Z"
finished: "2026-10-11T12:24:46.240Z"

---
# 0121 · Refuse a ticket that contains one of your private words

**Status:** ✅ done

## Problem
Tickets are committed and often published, so a ticket can leak words you'd rather keep out of the repo, such as your real name or an old alias. Today only one of speck's own tests checks for them (0084), by scanning the whole repo. Since 0112 reuses test results whenever nothing outside `speck/` has changed, that test can miss a word added in a new ticket.

## Outcome
`speck lint` refuses a ticket that contains one of your private words, so a ticket holding one can't be set ready.

## Acceptance criteria
1. `speck lint <id>` reads private words from `~/.config/speck/private-words` (the current user's home folder, as the operating system reports it): one word per line, ignoring blank lines and lines starting with `#`.
2. When the ticket's text contains one of those words (ignoring case, matched literally), lint prints a `✗` naming the line number but not the word, and exits non-zero, so `speck set <id> status ready` refuses the ticket.
3. When the file is missing, lint checks nothing for it and prints nothing about it. When the file exists but can't be read, lint prints a `!` warning saying so and how to fix it, and the rest of lint works as before.
4. A ticket that contains none of the words gets no such error.
5. The README or the brief says how to list your private words.

## Out of scope
- Checking idea notes, code or any file other than the ticket.
- Changing speck's own tests (0122).

## Notes
- Same file and format as 0084's check (`test/support/private-words.mjs`), so the words you already list there work.
- Lint already warns about your home folder's path in a ticket (0083). That stays a warning; this is an error, because the words are ones you've chosen to keep private.
- Failing before this build: none
- The home folder is `os.homedir()`, as 0083's check and 0084's word list use it: `$HOME` when set, otherwise the system's record of the user. That lets the tests use a fake home folder.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 96,408
- Elapsed since build started: 5 min
- Changed lines: 26 (limit 5000)
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
    "reviewed_sha": "4ea898a49b7ce80f198dccb4f4952289d4f2528e",
    "thread_id": "01a12aea-c89c-7931-9f54-5d8905c76413",
    "seconds": 27,
    "usage": {
      "input_tokens": 95788,
      "cached_input_tokens": 55040,
      "cache_write_input_tokens": 0,
      "output_tokens": 620,
      "reasoning_output_tokens": 10
    },
    "saved_at": "2026-10-11T12:23:38.864Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs privateWordProblems uses os.homedir() and reads .config/speck/private-words, trimming lines and skipping blanks and comments. Four AC1 tests in test/lint-0121.test.mjs passed, exercising a fake HOME and file formatting."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "privateWordProblems checks the complete ticket text using lowercase literal includes and reports line numbers without the matched word. scripts/speck.mjs cmdLint exits non-zero and checkSetTicket refuses ready before writing. Seven AC2 tests passed, covering case, literal matching, frontmatter, multiple lines and refusal without changing draft status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "privateWordProblems silently handles missing files and returns an actionable warning for other read failures. Three AC3 tests passed, exercising missing files, an unreadable directory and continued reporting of other lint errors."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Two AC4 tests passed, checking clean tickets and empty or comment-only lists produce no private-word diagnostics."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md documents the file location, one-word-per-line format, comments and lint behaviour. The AC5 documentation test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Lint now blocks tickets containing your listed private words and identifies affected lines without naming the words. Missing lists are silent; unreadable lists produce helpful warnings. The tests exercise the real CLI, and the full saved test output shows no failures. Existing tests were unchanged, and no blocking issues were found."
  }
}
```

</details>

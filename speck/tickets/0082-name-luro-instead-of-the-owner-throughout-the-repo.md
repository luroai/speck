---
id: "0082"
title: "Name Luro instead of the owner throughout the repo's files"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:55:01.374Z"

---
# 0082 · Name Luro instead of the owner throughout the repo's files

**Status:** 👍 approved

## Problem
speck is moving to the `luroai` GitHub organisation under the brand Luro, and the owner wants to keep their own name out of it. Today the install command points at the owner's personal GitHub account, and the docs name the owner, so anyone reading the repo sees who they are.

## Outcome
The repo's files point to `luroai/speck` and refer to Luro or "the maintainer", never the owner's name, old GitHub handle or machine username.

## Acceptance criteria
1. `README.md`, `docs/brief.md` and the message speck prints when a copy can't install itself all give the install command as `npx github:luroai/speck init`. A test checks the message.
2. Apart from this ticket's own file, no tracked file contains the owner's old handle, machine username or first name (case-insensitive `git grep`).
3. `docs/HANDOFF.md` is deleted. It's the v0.1 handoff note and says nothing has been committed yet, so it's out of date.
4. Where the owner was named in a sentence that stays, it now says "the maintainer". Where an example used an absolute home folder path, it now uses a `~/` path. Each sentence otherwise reads as before.
5. `docs/panel-mockup.html` shows `luroai/speck`, and the full test suite passes.

## Out of scope
- Rewriting git history or commit authors. That's done by hand after this ships (see Notes).
- Publishing to npm or changing the package name.
- The repo move itself, which the owner does on GitHub.

## Notes
- This ticket's own file names the old handle and name so the reviewer can check AC2. The later history rewrite replaces them in every file and commit, this one included.
- Known places on 2026-10-10: `README.md`, `docs/brief.md` (install row, success measure), `docs/HANDOFF.md`, `docs/panel-mockup.html`, the install message in `scripts/install.mjs`, `speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md` (pilot line), `speck/tickets/done/0053-…` (example path).
- Assumption: deleting `docs/HANDOFF.md` rather than editing it (AC3).
- Checked 2026-10-10: `npx github:luroai/speck init` uses npm's `github:<user>/<repo>` spec, and `git ls-remote https://github.com/luroai/speck` answers, so the repo is already at `luroai/speck`.
- `test/product-0068.test.mjs` listed `docs/HANDOFF.md` among the docs it checks for `product.md` mentions. With the file deleted (AC3) it's dropped from that list; the check on every other file is unchanged.
- Self-check: the AC2 test first split the old handle in two, which still contained the name, so the test file failed its own check; it now splits it further. Also checked that no tracked file has the surname or email address, and that `package.json` has no author or repository field to update.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 238,720
- Elapsed since build started: 3 min
- Changed lines: 58 (limit 5000)
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
    "reviewed_sha": "5db9e02d49df44e7056d2bd2626a9a4187a1ad33",
    "thread_id": "01a125e4-1767-70f3-a4f8-1af4352b3245",
    "seconds": 29,
    "usage": {
      "input_tokens": 238079,
      "cached_input_tokens": 150400,
      "cache_write_input_tokens": 0,
      "output_tokens": 641,
      "reasoning_output_tokens": 15
    },
    "saved_at": "2026-10-10T12:58:16.882Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md and docs/brief.md contain the required command; scripts/install.mjs installTooling uses it in the error. Both AC1 tests in test/luro-0082.test.mjs passed; the message test runs the real CLI without skills."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Independent case-insensitive git grep found no matches outside ticket 0082. The AC2 tracked-file scan in test/luro-0082.test.mjs passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "docs/HANDOFF.md is deleted and git ls-files lists no such file. The AC3 deletion test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The diff preserves the sentences in docs/brief.md and the pilot idea except for replacing the name with 'the maintainer'; ticket 0053's example now begins ~/projects/. The AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/panel-mockup.html shows luroai/speck, covered by the passing AC5 test. Supplied full-suite output reports 651 passes, zero failures and three existing skips. Tests were inspected but not rerun because they write temporary files and this review is read-only."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The install instructions and mockup now name Luro, personal identifiers are removed outside the exempt ticket, and the outdated handoff note is deleted. The changes stay within scope and the supplied full test run passes. Ready for merge."
  }
}
```

</details>

---
id: "0250"
title: "Bring the README's wording in line with the landing page"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0249"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T11:42:20.136Z"

---
# 0250 · Bring the README's wording in line with the landing page

**Status:** 🔍 reviewing

## Problem
The README and the landing page describe speck differently: the landing page is built around two decisions and the things speck does for you, while the README is a long list. A technical reader, such as a hiring team at a coding-tools company, comes to the README for the same story with the detail of how it works, and finds the install prompt only after several sections.

## Outcome
The README tells the landing page's story in the same order and words, with the install prompt straight after it, and adds the technical detail behind each part that the landing page leaves out.

## Acceptance criteria
1. The README opens with the landing page's tagline ("Your judgement, at agent speed.") and its opening paragraph, then the hero image from 0249, then a `## Get started` section with the setup prompt, before any other `##` section. The prompt keeps the pinned `#v<version>` install that the release tests check.
2. A `## How it works` section follows the landing page's three parts in order: your first decision (what gets built), everything in between (built tests first, self-checked, reviewed by a second AI, each in its own worktree) and your second decision (what ships: the review pack, `/speck-ship` or auto-ship). Each part names the skills, commands and config settings involved.
3. A section follows the landing page's "clever bits" (it raises its own fix tickets, files its own follow-ups, turns ideas into tickets only in conversation, asks then moves on, sorts out its own merge conflicts, fits in your pocket, keeps the receipts), and gives each the mechanism behind it: the command, setting, file or ticket status that makes it happen.
4. A `## Under the hood` section explains, consistently with `docs/brief.md`: how the builder and reviewer take turns and when a review escalates (`max_review_rounds`, `escalate_after_repeat_disputes`); where state lives (ticket frontmatter, review and delivery logs in the ticket, `speck/.cache/`); which tests run during a build and which at ship; and how `speck run`'s builds and its one ship queue share the base branch.
5. The README keeps every fact its sections give today (the panel, requirements, installing without an agent, commands, using another reviewer, repo layout, built with speck, design and licence), and no test that passed before this change fails, apart from tests that check wording this ticket deliberately changes, which check the new wording instead.
6. Before the first review round, the builder runs the `/no-ai-slop` skill in detect mode on the README's new and changed text, then fixes each pattern it names or keeps it with a reason. The ticket's Notes list each pattern found, the line it was in and what was done, and a second detect pass on the finished README names no pattern left unaddressed.

## Out of scope
- The image itself: 0249.
- The landing page, `docs/brief.md` and the skills' wording.
- New features, or describing anything speck doesn't do today.

## Notes
- Source for the story and wording: the landing page, `site/index.html` in the speck-site repo, beside this one on the build machine. Use its words where they fit, and British English.
- Public text: keep private names and paths out, as the existing private-words and Luro checks require.
- `/no-ai-slop` is installed globally for Claude Code (`~/.claude/skills/no-ai-slop/`), so a `speck run` build can use it. Detect mode names patterns and doesn't rewrite: the builder makes the fixes itself, keeping the landing page's voice.
- Failing before this build: none
- No-ai-slop detect, first pass: on the README's new and changed text (lines 1–120).
  - L92 "The detail behind the steps above.": interpretive metadiscourse. Cut.
  - L114 "The agents do the typing; you do the steering.": fake-profound kicker. Cut.
  - L88 "…say what the product does: there's no separate spec…": colon reveal. Joined with "so".
  - L61 "No GitHub needed: everything happens in your local repo.": colon reveal. Split into two sentences.
  - L82 "carries on … to carry on": repeated phrase. Changed the second to "to resume it".
  - L74 "Things you won't have to do.": fragment. Kept: it's the landing page's subtitle for the section.
  - L29 "If you can write a good ticket, you can ship.": possible kicker. Kept: the landing page's subtitle and the section's lead.
  - L57 "…then ship. Or let low-risk work ship itself.": fragment. Kept: the landing page's words.
  - L76–88 every clever bit opens with a bold sentence: robotic rhythm. Kept: the landing page's structure, and each goes on with different mechanisms.
- No-ai-slop detect, second pass: no pattern left unaddressed. The fixed lines read as plain sentences, and the patterns kept are listed above with their reasons.
- Self-check: narrowed two claims: `speck ship` also refuses when files outside `speck/` changed after the approval, and only a full test run reuses a recorded result or retries failing tests.
- AC5: `test/release-0236.test.mjs` checked the old "How you work with it" section; it now checks the same wording in "How it works", which replaced it.
- About 26 test files read `README.md` (for example `readme-0089`, `wording-0125`, `release-0092`, `private-words-0084`): keep what they check unless the change is deliberate.

## In plain words
The README now tells the same story as the landing page, in the same order and mostly the same words: the tagline, the opening paragraph and the picture, then the setup prompt straight away. After that come your two decisions and what speck does in between, the review pack, the "clever bits" and a new "Under the hood" section for technical readers, with the commands and settings behind each part. Nothing the README said before was dropped: the panel, requirements, commands and the rest follow as before.

To see it, open the README on GitHub and compare it with the landing page. Keep an eye on the two drifting apart: when the landing page's wording changes, the README needs the same change by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
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
    "reviewed_sha": "73c7064879cabac0da428ddf9db12e2ae1d53d8e",
    "thread_id": "01a14489-62e8-7471-b5ea-85a34c8d4910",
    "seconds": 25,
    "usage": {
      "input_tokens": 166202,
      "cached_input_tokens": 112512,
      "cache_write_input_tokens": 0,
      "output_tokens": 802,
      "reasoning_output_tokens": 50
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T11:47:21.287Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md opens with the supplied tagline and paragraph, retains the 0249 picture, and puts Get started first. Passing 0250 AC1 tests check order and the version-pinned prompt; 0249 tests check image references."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md's How it works follows the three required parts and names the relevant skills, commands and settings. The passing 0250 AC2 test checks their order and content."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The clever bits covers all seven parts in order with their mechanisms. The passing 0250 AC3 test checks these; merge handling agrees with scripts/hand-back.mjs and the build skill."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Under the hood covers review turns, escalation, state, test selection and the serial ship queue consistently with docs/brief.md and scripts/review.mjs. Both 0250 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The diff preserves the existing factual sections and relocates the introductory facts. Both 0250 AC5 tests passed. The recorded run has 293 passes and no failures; release-0236 retains its assertions under the renamed heading."
      },
      {
        "id": 6,
        "status": "pass",
        "evidence": "The ticket's Notes record two detect passes, each first-pass pattern with its original line and fix or retention reason, and no unaddressed patterns after the second pass. The 0250 AC6 test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now follows the landing page's story, brings setup near the top and explains the technical mechanisms behind each part. Existing information is preserved, and all 293 tests in the recorded run passed. No blocking concerns found."
  }
}
```

</details>

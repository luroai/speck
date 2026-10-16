---
id: "0250"
title: "Bring the README's wording in line with the landing page"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
- About 26 test files read `README.md` (for example `readme-0089`, `wording-0125`, `release-0092`, `private-words-0084`): keep what they check unless the change is deliberate.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

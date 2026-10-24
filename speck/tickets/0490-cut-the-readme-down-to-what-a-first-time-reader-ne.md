---
id: "0490"
title: "Cut the README down to what a first-time reader needs"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0489"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0490 · Cut the README down to what a first-time reader needs

**Status:** 📝 draft

## Problem
The README is 285 lines, with paragraphs over 1,000 characters that list setting names, fallbacks and limits. Someone arriving from the launch post, often on a phone, has to wade through detail the brief already holds before they understand what speck does.

## Outcome
The README is short enough to read on a phone, describes the panel as it is now, and leaves the full detail to `docs/brief.md`.

## Acceptance criteria
1. `README.md` is at most 150 lines, and no paragraph or list item outside the Commands section's tables is over 500 characters.
2. Every setting name, command and file path the README names today is still named in the README or in `docs/brief.md`. Tests that check a fact in the README check it wherever it now is.
3. "The panel" describes it as it's used now: a phone-width column beside your agent or on your phone, speck's screen saying what's happening, Plan, Build and Shipped as cards you swipe between, and Settings. Each of "The clever bits" is one or two sentences, and "Who it's for" no longer repeats the opening (checked by review).
4. The opening (0489), the setup prompt, the status line, "Built with speck", every link and every heading another page links to (such as `#the-panel`) are unchanged. No test that passed before this change fails.

## Out of scope
- The opening above `## Get started` (0489).
- What `docs/brief.md` says, beyond adding what moves there from the README.

## Notes
- Agreed with the user on 2026-10-24, from the page https://claude.ai/artifact/1TAXHPCUZ9wvSfkdaLKQzW: cut "The clever bits" to a sentence or two each, fold the four long paragraphs under "Where state lives" (your own settings, API keys, your agents, adding an API provider) into one short "Your agents" part, rewrite "The panel" round the phone-width column, shrink "Who it's for" to the "Most AI coding tools sell speed or autonomy" paragraph and the OpenSpec credit, and keep Requirements to one line for builders.
- 66 test files mention the README today, such as `test/readme-0250.test.mjs`, which checks it names the commands and settings for each step and each clever bit.
- Waits for 0489, which rewrites the opening above this.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0490"
title: "Cut the README down to what a first-time reader needs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-24T20:29:47.438Z"

---
# 0490 · Cut the README down to what a first-time reader needs

**Status:** 🔨 building

## Problem
The README is 285 lines, with paragraphs over 1,000 characters that list setting names, fallbacks and limits. Someone arriving from the launch post, often on a phone, has to wade through detail the brief already holds before they understand what speck does.

## Outcome
The README is short enough to read on a phone, describes the panel as it is now, and leaves the full detail to `docs/brief.md`.

## Acceptance criteria
1. The README is at most about 150 lines, and no paragraph or list item outside the Commands section's tables runs much over 500 characters (checked by review).
2. Every setting name, command and file path the README names before this change is named in `docs/brief.md` after it, so cutting it from the README loses nothing. Checked against the list of them taken from the README before the change.
3. "The panel" describes it as it's used now: a phone-width column beside your agent or on your phone, speck's screen saying what's happening, Plan, Build and Shipped as cards you swipe between, and Settings. Each of "The clever bits" is one or two sentences, and "Who it's for" no longer repeats the opening (checked by review).
4. The opening (0489), the setup prompt, the status line, "Built with speck", every link and every heading another page links to (such as `#the-panel`) are unchanged (checked by review). No test that passed before this change fails.

## Out of scope
- The opening above `## Get started` (0489).
- What `docs/brief.md` says, beyond adding what moves there from the README.

## Notes
- Agreed with the user on 2026-10-24, from the page https://claude.ai/artifact/1TAXHPCUZ9wvSfkdaLKQzW: cut "The clever bits" to a sentence or two each, fold the four long paragraphs under "Where state lives" (your own settings, API keys, your agents, adding an API provider) into one short "Your agents" part, rewrite "The panel" round the phone-width column, shrink "Who it's for" to the "Most AI coding tools sell speed or autonomy" paragraph and the OpenSpec credit, and keep Requirements to one line for builders.
- After 0491, only a few tests read the README (the setup prompt, the status line, the pictures and its links), so cutting text doesn't mean moving tests.
- Waits for 0489, which rewrites the opening above this, and through it 0491.
- Failing before this build: none
- Self-check: narrowed two claims in the cut README (speck's agent looks into stops only with `watch: fix`; an idea is saved when you ask, not as you talk), and dropped a new link to a brief heading that broke when the brief's headings are reworded (0267).
- Pictures: none, because the change only cuts and rewrites README text, with no picture, layout or styling change, and no Markdown renderer is installed here to show it as GitHub would.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

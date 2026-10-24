---
id: "0489"
title: "Rewrite the README's opening round planning then walking away"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0456", "0488", "0491"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0489 · Rewrite the README's opening round planning then walking away

**Status:** 📋 ready

## Problem
speck's tagline, "Ship code you can't read, and still trust it", starts from what the reader can't do, and the README's opening was written before speck became a slim panel beside your agent and before it worked with any agent. It takes four paragraphs to reach the picture. It also doesn't mention tasks, tickets whose build does a job other than code, such as an email draft, a plan or research. For launch, the first screen should say how speck is used: a short burst of planning, then walking away while the agents build, review and ship, code or not.

## Outcome
speck's tagline is "Plan in ten minutes. Come back to it shipped.", and the README opens with it, the new opener, which covers tasks as well as code, the picture and which agents speck works with.

## Acceptance criteria
1. `speck help`'s first line is `speck: Plan in ten minutes. Come back to it shipped.`, the comment at the top of `scripts/speck.mjs` is `// speck: Plan in ten minutes. Come back to it shipped.`, and `package.json`'s description starts with the new tagline. None of them, nor the README, contains `Ship code you can't read`.
2. The README starts with `# speck`, then the tagline in bold, then the four opener paragraphs in Notes, word for word, then the demo picture (its `<picture>` block, unchanged) as the README's first image, before the status line (checked by review).
3. After the picture, one paragraph names the agents speck builds and reviews with, Claude Code, Codex, Cursor and model providers such as DeepSeek, and says speck doesn't let a model review its own work unless you allow it. Then one sentence says it was built by a product manager for people who decide what gets built but don't write the code, and that engineers use it too. Every claim in them is true of speck today (checked by review).
4. The opening's four old paragraphs are gone, and nothing from the status line down changes (checked by review). No test that passed before this change fails.

## Out of scope
- Everything from `## Get started` down (0490), and the status line and figures (0452).
- The picture itself (0456).
- The landing page and launch post.

## Notes
- Agreed with the user on 2026-10-24, from the page https://claude.ai/artifact/1TAXHPCUZ9wvSfkdaLKQzW: the tagline above, "speck gives you a team you can trust" in the user's own words, and the user asked to drop "You're the only human on it." The user then asked for tasks and other agent work to be included, with the team not limited to engineering. The second paragraph's tasks are what document tasks do today: the build leaves its result in `outputs/` (0351 to 0361), and a second AI reviews it against the criteria.
- The four opener paragraphs, word for word:

  > speck gives you a team you can trust. You spend your time where it counts: deciding what needs doing and what done looks like, in a quick conversation with your coding agent. Then you walk away. Your agents build each change tests first, a second AI reviews it, and speck ships it, the same way every time.
  >
  > It isn't only code. A ticket can be a task instead, such as drafting an email, writing a plan or pulling together research. An agent does it, a second AI checks it against what you asked for, and the result waits for you in `outputs/`.
  >
  > It fits the way you really work, in bursts. Ticket up some work before a meeting, check the panel on your phone afterwards, and set the next batch going before bed. speck stops only when it needs you, with one plain question.
  >
  > You don't need to read the code to check the work. Every ticket comes with a one-page review pack in plain English, with the reviewer's evidence for each criterion. Nothing ships until you say so, or until you let speck ship low-risk work by itself.

- A starting point for AC3's paragraph: "Use the agents you already have: Claude Code, Codex or Cursor, or any model you have an API key for, such as DeepSeek." Check the review rule against `allow_same_model_review` before writing it.
- `auto_ship` is `false` in `templates/config.yml`, so the third paragraph's last sentence keeps shipping as your call by default.
- Today: `test/tagline-0255.test.mjs` checks the old tagline in `speck help`, `scripts/speck.mjs` and `package.json`; it changes with AC1.
- Waits for 0456 (the picture this places), 0488 (the README's Foreman wording) and 0491 (which tests may read the README).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

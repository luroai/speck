# speck — product brief

Status: v0.1 brief, implemented · 8 October 2026

## Thesis

**You own two decisions: what gets built and what gets shipped. Everything in between is automated.**

PMs have practised spec-driven development for years. It's called a PRD, and it reaches engineers as a ticket. speck applies the same workflow to AI coding agents. You write, or approve, a small ticket. One agent builds it. A second, independent agent reviews it until it's good enough. Then you merge.

OpenSpec showed the value of keeping specs in the repo. speck keeps that idea but swaps the ceremony for small tickets, an adversarial review loop, and one living spec.

## Who it's for

- **Primary:** PMs and non-technical founders who can write a good ticket but can't review code line by line, and who want to ship personal or small-team projects quickly without giving up quality.
- **Secondary:** engineers who want a lightweight, auditable loop of ticket, agent build, independent review and PR.
- **Not for:** large multi-team specification, or work that needs design documents spanning many changes. Use OpenSpec or similar for that.

## Principles

1. **The repo is the source of truth.** Ideas, tickets, review transcripts and the living spec are Markdown files in the repo. Any tool, including the future board, reads and writes these files and nothing else.
2. **Small tickets only.** A ticket is one agent, one sitting, one PR. If a ticket is too big for that, it gets split. It never gets stretched.
3. **Review is adversarial and independent by default.** The builder never reviews its own work. A separate reviewer, preferably a different model, must approve it.
4. **Humans hold two gates.** Gate 1 is moving a ticket to `ready`. Gate 2 is merging the PR in GitHub. An agent can never merge.
5. **Evidence over trust.** Every PR carries a review pack that a non-coder can judge: each acceptance criterion with its result, a plain-English change summary, and flagged risks.
6. **Measure actuals.** Every ticket records attempts, review rounds, time and cost. That data is the product's proof.

## The workflow

```
idea / conversation
  → /speck-capture        → speck/ideas/<date>-<slug>.md
  → /speck-ticket         → speck/tickets/0007-<slug>.md   (status: draft)
  → you edit and approve  → status: ready                  [GATE 1]
  → /speck-build 0007     → branch speck/0007-<slug>
       tests from acceptance criteria → implementation → tests pass
       → review loop with reviewer subagent (see below)
       → approved?  yes → /speck-ship
                    no, after max rounds → status: blocked + question for you
  → /speck-ship 0007      → PR + review pack + `speck/review` check = success
                            ticket set to done and product.md updated *inside the PR*
  → you approve and merge in GitHub                        [GATE 2]
```

Because the ticket's `done` status and the `product.md` update travel in the same PR, merging is the moment the spec becomes true. If you close the PR unmerged, `main` is unchanged.

## Ticket size rules

A ticket is ready only if it passes all of these. `/speck-ticket` checks them and offers a split when a ticket fails.

| Rule | Limit |
|---|---|
| Outcome | One outcome that you can observe or verify. No "and" joining two outcomes in the title. |
| Acceptance criteria | 1–5, each testable |
| Ticket length | Fits on one screen (about 40 lines of body) |
| Expected change | Reviewable in one sitting. Default guideline is ≤ 300 changed lines, excluding tests and lockfiles (configurable). |
| Size | `S` or `M`. `L` can never be `ready`; it must be split into sibling tickets. |
| Risk | `low` or `high`. `high` means it touches auth, payments, data deletion, migrations, infrastructure or secrets, and makes the reviewer stricter. |

Guardrail during build: if the diff passes the size limit before the tests pass, the builder stops and proposes a split. It doesn't push on.

## The review loop

The implementation agent owns the loop. It spawns a reviewer subagent and they work in turns until the reviewer approves or the loop escalates to you.

**Roles**

- **Builder:** writes tests and code. It can fix a finding or dispute it with a reason. It cannot approve.
- **Reviewer:** reads the ticket, `product.md`, the diff and the test output. It runs read-only and cannot edit code. It is the only party that can approve.

**Protocol**

1. **Round 1.** The builder spawns the reviewer with the ticket, `speck/product.md`, the diff against the base branch and the test output. The reviewer returns a structured verdict (`templates/review-verdict.schema.json`):
   - a result for each acceptance criterion: `pass`, `fail` or `unclear`, with evidence;
   - findings, each `blocking` or `minor`;
   - whether the proposed `product.md` change is accurate;
   - a verdict: `approve`, `changes_requested` or `escalate`.
2. **Builder's turn.** The builder answers every blocking finding with one of:
   - `fixed`, with the change made;
   - `disputed`, with a reason;
   - `needs_pm`, for a scope or product question.
3. **Next round.** The builder resumes the *same* reviewer session, so the reviewer remembers its earlier findings, and sends its responses plus the new diff. The reviewer re-checks, accepts or rejects each dispute, and issues a new verdict.
4. **Termination.** The loop ends in one of four ways:
   - **Approve:** no blocking findings and every criterion passes. The builder proceeds to ship.
   - **Max rounds reached** (default 3): the ticket becomes `blocked`, with a summary and one specific question for you.
   - **Repeated disagreement:** the same finding is disputed in two consecutive rounds. It escalates to you rather than looping.
   - **`needs_pm`:** the ticket becomes `blocked` with that question.
5. **Minor findings never block.** They're logged in the ticket and offered as new ideas.

**Records:** each round is saved to `speck/reviews/0007/round-N.json`, and a short summary goes into the ticket's Review log. The review pack in the PR is built from these files.

**Reviewer adapters (v0.1)**

| Adapter | How it runs | Notes |
|---|---|---|
| `codex` (default when the builder is Claude) | `codex exec --sandbox read-only --output-schema …`, then `codex exec resume <session>` for later rounds | Cross-model by default |
| `claude-subagent` | A fresh-context Claude Code subagent using the review skill | Fallback; same model family, so config must allow it explicitly |

Config rejects `builder` and `reviewer` being the same agent unless `allow_same_model_review: true` is set.

**Reviewer model and effort.** `reviewer_model` and `reviewer_effort` in `speck/config.yml` set the reviewer's model and effort level for the whole repo. `speck new` copies them into each ticket, and a value on the ticket overrides config. A blank ticket value falls back to config. If both are blank, speck sets nothing: Codex uses its own default, and a `claude-subagent` reviewer runs on the builder's model in a fresh session. Model names are free text in the reviewer's own format and aren't checked. Effort must be blank or one of `low`, `medium`, `high`, `xhigh` or `max`. Codex gets them as `-m` and `model_reasoning_effort` in every round. The review skill passes them to the subagent (`speck reviewer-settings <id>` prints them). Every saved round and the review pack show the model and effort used, or "default".

## Repo layout (in a project that uses speck)

```
AGENTS.md / CLAUDE.md        # points agents at speck/product.md first
speck/
  config.yml                 # agents, test command, limits, base branch
  product.md                 # the living spec: what this product is and does today
  ideas/                     # low-ceremony notes and captured conversations
  tickets/0007-<slug>.md     # numbered tickets; status lives in frontmatter
  reviews/0007/round-N.json  # review transcripts
.claude/skills/speck-*/      # skills for Claude Code
.agents/skills/speck-*/      # the same skills for Codex, cptr and other agents
.speck/                      # the speck command and templates
```

## Skills and commands (v0.1)

| Command | Does |
|---|---|
| `npx github:luroai/speck init` | Creates `speck/`, `config.yml` and `product.md`, installs the skills and the `speck` command into the project, and runs `speck doctor`. Re-run it to update. Prints the branch-protection settings to apply. |
| `speck doctor` | Checks that git, GitHub, Claude Code and Codex are installed and signed in, with a plain-English fix for each problem. |
| `/speck-capture` | Turns an idea or the current conversation into `speck/ideas/` |
| `/speck-ticket` | Turns an idea into a numbered draft ticket. Runs the size checks and proposes splits. |
| `/speck-build <id>` | Takes a `ready` ticket: branch, tests from acceptance criteria, implementation, then the review loop |
| `/speck-review <id>` | Runs the review loop on its own (for example, after a manual fix) |
| `/speck-ship <id>` | Opens the PR with the review pack, sets the `speck/review` check, and marks the ticket done and updates `product.md` inside the PR |
| `/speck-status` | Lists tickets by status, with blocked questions first |

Merge protection that you set up once per repo:
- Require the `speck/review` status check.
- Require one approving review from you.
- Agents have no merge rights.

## The living spec: `speck/product.md`

A single document that a new agent session or a person can read in about five minutes to understand the product. It covers:
- what the product is and who it's for;
- current capabilities;
- key decisions and constraints;
- known limits.

It's updated only through `/speck-ship`, inside the PR, and the reviewer checks the update. It describes the present, not history; the history lives in tickets.

## Two projects

1. **speck (this repo):** the file format, the skills, the review loop and the CLI. It's useful entirely on its own.
2. **speck board (later):** a local kanban app over `speck/`. Columns map to ticket status, and moving a card to Ready for Dev is Gate 1 and starts `/speck-build`. It reads and writes the same files, and merging stays in GitHub. Captured as an idea in `speck/ideas/`.

## v0.1 scope

In scope:
- the ticket, idea, config and `product.md` formats;
- the capture, ticket, build, review, ship and status skills for Claude Code as builder;
- the `codex` and `claude-subagent` reviewer adapters;
- `speck init`;
- a README with one real worked example and its actuals.

Out of scope for v0.1:
- running several tickets in parallel, or dependency graphs;
- Jira or GitHub Issues sync;
- the board;
- builders other than Claude Code;
- hosted or remote runs (GitHub Actions comes later).

## Success measures

- speck builds itself: from ticket 0002 onwards, every change goes through speck.
- At least 20 tickets shipped through speck, with published actuals (median time, cost, review rounds, share blocked).
- Someone other than Luro installs it and ships a ticket.

## Open questions

- Licence: MIT is set in the manifests as a placeholder. Confirm before publishing.
- Package name: `speck` is taken on npm and PyPI. `speck-dev` is set in `package.json` (private). It installs a `speck` command.
- GitHub self-approval: GitHub won't let you approve a PR you opened. If agents use your own `gh` login, require the `speck/review` check and treat your merge as the gate, or give agents a bot account (ticket 0002).
- Resolved 8 October 2026: `codex exec resume` accepts `--output-schema` and keeps the session's memory. Verified end to end.

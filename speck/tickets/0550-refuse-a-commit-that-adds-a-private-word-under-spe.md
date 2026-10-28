---
id: "0550"
title: "Refuse a commit that adds a private word under speck/"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-28

---
# 0550 · Refuse a commit that adds a private word under speck/

**Status:** 📝 draft

## Problem
speck checks for private words and the home folder's path only when a ticket is linted (0083, 0121) or shipped (0506). Notes and tickets that an agent commits straight to the base branch, such as a capture, a ticketing or a triage commit, are never checked. On 2026-10-27 an idea note committed that way published the user's own domain, which is on their private-words list, and nobody noticed until it was on GitHub.

## Outcome
In a project set up with `speck init`, a commit that adds a private word or the home folder's path to a file under `speck/` is refused, however it's made.

## Acceptance criteria
1. After `speck init` in a git repository, `git commit` is refused, and nothing is committed, when a line it adds to a file under `speck/` contains one of the words in `~/.config/speck/private-words` (in any case) or the user's home folder's path, matched as `speck ship` matches them (0506). The message names each file and line number, without repeating the word, and says to take it out. The same holds for a commit made in any of the repository's git worktrees.
2. A commit commits as before when the lines it adds under `speck/` contain neither, when it changes only files outside `speck/`, or when the word or path is only on lines the commit doesn't add. Without a private-words file, only the home folder's path is checked.
3. When the repository already has its own pre-commit hook, or git's `core.hooksPath` is set, `speck init` leaves it unchanged and prints one line saying the private-words check for commits isn't installed, and why. Running `speck init` again neither adds the check twice nor removes it.
4. The brief's private-words section says that commits adding a private word or the home folder's path under `speck/` are refused, and that `git commit --no-verify` skips the check for one commit.
5. No test that passed before this change fails.

## Out of scope
- Checking files outside `speck/`. The repo's own private-words test covers those (0084), and a user's code can hold words they list on purpose, such as their name in a licence.
- Matching the machine's hostname by itself. A short hostname would match ordinary words, so list it in `~/.config/speck/private-words` if it's private.
- Removing words already in the history.
- Handing back a pull request refused for private words (`speck/ideas/2026-10-25-hand-back-a-pull-request-refused-for-private-words.md`).

## Notes
- Asked for 2026-10-28, after an idea note committed on `main` published the user's domain: "add that as a ticket right now to be built in the next release". Goes into 0.21.0 (0539).
- Reuse the matching in `scripts/private-words.mjs` (0506), so lint, ship and commits agree on what counts.
- speck's own automated commits (a build's, a ship's) go through the same check. They already write home paths as `~/` paths (0506), so they shouldn't be refused; if one is, its error should say why rather than fail without a reason.
- Checked 2026-10-28: git runs the pre-commit hook from `core.hooksPath` when set, otherwise from the repository's hooks folder, shared by all its worktrees, and `git commit --no-verify` skips it (`git help githooks`, git 2.53.0).
- Risk high: it changes how every commit works in a user's repository.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

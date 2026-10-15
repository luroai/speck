---
id: "0240"
title: "Publish a GitHub release when a new version lands on main"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15

---
# 0240 · Publish a GitHub release when a new version lands on main

**Status:** 📋 ready

## Problem
Each release ticket ends with the maintainer tagging the release and publishing its GitHub release page by hand once it has shipped. Until then the README's setup prompt names a tag that doesn't exist, so anyone following it gets an error, and with `auto_ship` on nobody is watching for the moment a release ticket ships.

## Outcome
When a release ticket ships, its tag and GitHub release are published straight away, with no one doing it by hand.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. A GitHub Actions workflow in `.github/workflows/` runs on every push to `main`. When the remote has no `v<version>` tag for the version in `package.json`, it creates that tag on the pushed commit and publishes a GitHub release titled `speck <version>`, with `docs/releases/v<version>.md` as its notes.
2. When that tag already exists, the workflow creates nothing and succeeds, so a push that doesn't change the version, and the versions already tagged (`v0.2.0`, `v0.3.0`, `v0.4.0`), are left alone.
3. When `docs/releases/v<version>.md` is missing, the workflow creates no tag or release and fails, naming the missing file.
4. The workflow uses only the repository's own `GITHUB_TOKEN`, with `contents: write` and no other permission, and no other secret.
5. No test that passed before this change fails.

## Out of scope
- Installing the workflow in other people's projects: it's for speck's own repository, and `speck init` doesn't copy it.
- Publishing to npm.
- The release tickets' own files (0236, 0226).

## Notes
- Today the steps are in each release ticket's Notes: tag `v<version>`, then `gh release create v<version> --verify-tag --title "speck <version>" --notes-file docs/releases/v<version>.md` (0210).
- Risk is high because it's infrastructure that writes to the repository on GitHub.
- Test the workflow's logic the quickest way that really checks it (for example by reading the workflow file, or a script it runs called directly with a stand-in for `git` and `gh`), not by pushing to GitHub.
- Checked 2026-10-15: `gh release create` has `--verify-tag`, `--title`, `--notes-file` and `--target` (`gh release create --help`, gh 2.101.0). The repo has tags `v0.2.0`, `v0.3.0` and `v0.4.0` and no `.github/` folder.
- Unverified: that `gh` is installed on GitHub's hosted runners and reads `GH_TOKEN` (not checked against GitHub's runner image documentation).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

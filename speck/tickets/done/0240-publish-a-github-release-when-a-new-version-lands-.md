---
id: "0240"
title: "Publish a GitHub release when a new version lands on main"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-15T21:24:37.941Z"
approved: "2026-10-15T21:39:32.370Z"
finished: "2026-10-15T21:49:52.151Z"

---
# 0240 · Publish a GitHub release when a new version lands on main

**Status:** ✅ done

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
- Checked 2026-10-15: `gh` is preinstalled on all GitHub-hosted runners and reads its token from `GH_TOKEN` (GitHub Docs, "Using GitHub CLI in workflows").
- Failing before this build: none
- Self-check: no changes (checked odd versions in package.json, a missing GITHUB_SHA, a failed tag lookup and two pushes racing, which the workflow's concurrency group runs one after the other).

## In plain words
When a new version of speck lands on GitHub, its version tag and release page now appear by themselves a minute or so later, so the README's setup command works straight away and nobody has to remember to publish by hand. Pushes that don't change the version, and versions already published, are left alone. If the release notes for a new version are missing, nothing is published and the run on GitHub's Actions tab fails, saying which notes file to add. To see it, open the repository's Actions tab after the next release ticket ships and check the Releases page. Worth a look: it has only been tried against stand-ins, so the first real release is its first real run.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The fixed concurrency group retains only one pending run by default.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 414,888
- Elapsed since build started: 15 min
- Changed lines: 69 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes):
  - The release tickets 0236 and 0226 (out of scope here) still list tagging and publishing by hand in their Notes; that step is now done by the workflow, so it can be dropped when they're built.
  - The workflow has only been checked against stand-ins for `git` and `gh`; the first version bump to land on main is its first real run, so watch the Actions tab then.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "66cf1a48fafc8e60b0d9135f0f40a9d6e1f82ae3",
    "thread_id": "01a1417d-4425-7130-bd59-7ba82e9fbb48",
    "seconds": 33,
    "usage": {
      "input_tokens": 163276,
      "cached_input_tokens": 123904,
      "cache_write_input_tokens": 0,
      "output_tokens": 930,
      "reasoning_output_tokens": 70
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T21:35:23.440Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": ".github/scripts/release.mjs correctly supplies the pushed SHA, title and notes to gh; the AC1 tests cover those arguments. However, release.yml's concurrency group can cancel pending pushes, so not every pushed version is processed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "release.mjs exits successfully before publishing when git ls-remote finds the tag. The passing AC2 test covers versions 0.2.0, 0.3.0 and 0.4.0."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "release.mjs checks for the notes before invoking gh. The passing missing-notes test verifies failure, the filename and no publishing call."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "release.yml grants only contents: write and supplies secrets.GITHUB_TOKEN as GH_TOKEN. The passing AC4 test checks both restrictions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full /tmp/speck-0240-tests.txt records 1990 tests, 1987 passes, three skips and zero failures. Existing tests were not modified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": ".github/workflows/release.yml",
        "issue": "The fixed concurrency group retains only one pending run by default. cancel-in-progress: false protects the running workflow, but later pushes replace pending runs. If successive versions land while another run is active, an intermediate version's workflow can be cancelled and its release never published. GitHub documents this behaviour: [workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency). The current tests do not check this case.",
        "suggested_fix": "Use a concurrency strategy that preserves pending release runs, such as the documented queue: max option, and add a workflow configuration assertion covering that setting.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release script handles new tags, existing tags and missing notes correctly, and the full test suite passes. One workflow setting needs fixing: rapid pushes can cancel a queued release and leave that version unpublished."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "cd39204a92433c158588b68e00e1ee713b510a48",
    "thread_id": "01a1417d-4425-7130-bd59-7ba82e9fbb48",
    "seconds": 17,
    "usage": {
      "input_tokens": 249245,
      "cached_input_tokens": 203904,
      "cache_write_input_tokens": 0,
      "output_tokens": 1437,
      "reasoning_output_tokens": 70
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T21:39:21.286Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "release.yml triggers on pushes to main and now uses queue: max. release.mjs passes the pushed SHA, required title and notes file to gh release create. Passing AC1 tests cover the trigger, queue configuration and publishing arguments."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "release.mjs checks the remote tag and exits successfully without publishing when it exists. The passing AC2 test exercises versions 0.2.0, 0.3.0 and 0.4.0."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "release.mjs checks notes exist before invoking gh. The passing missing-notes test verifies failure, the missing filename and no publishing call."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "release.yml grants only contents: write and uses only secrets.GITHUB_TOKEN through GH_TOKEN. The passing AC4 test checks these restrictions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0240-tests.txt: 1991 tests, 1988 passes, three skips and zero failures. Existing tests have not been weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": ".github/workflows/release.yml",
        "issue": "The previous concurrency configuration could replace a pending release run. queue: max now preserves pending runs up to GitHub's documented 100-run limit, and a passing configuration test guards the setting.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The workflow publishes new versions with the correct tag, commit, title and notes, leaves existing tags alone, and fails safely when notes are missing. The queue issue is fixed, all tests pass, and the change is ready for the owner's merge decision."
  }
}
```

</details>

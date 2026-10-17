---
id: "0267"
title: "Remove the tests that pin documents' wording"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0266"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T08:41:54.734Z"

---
# 0267 · Remove the tests that pin documents' wording

**Status:** 🔨 building

## Problem
About 30 test files read the README, `docs/` or the changelog. Some of them pin a document's exact sentences, or the order of its paragraphs and headings, so editing that document by hand fails the suite and stops every ship until a fix ticket updates the tests. The rest check facts that can really go wrong, such as an install command that must work.

## Outcome
No test fails because a document's wording or order changed. The tests that check facts in documents stay.

## Acceptance criteria
1. No test checks a document's exact wording, or the order of its sentences, paragraphs or headings. A document is any file written for people to read, such as the README, `docs/` and the changelog, as in 0266.
2. Tests that check a fact in a document stay and pass: a command, a setting's name, a version, a file name, a link, or a name that mustn't appear.
3. Rewording the README's opening paragraph, swapping the order of two of its paragraphs, or rewording a section's first sentence fails no test.
4. The ticket's `## In plain words` lists each test removed or changed, with the document it read, and each document-reading test kept, with the fact it checks.
5. No test that passed before this change fails, apart from those removed.

## Out of scope
- The rule for new tickets: 0266.
- Tests that check the wording of the skills or the reviewer prompt, which are instructions to agents, not documents for people.

## Notes
- Likely candidates: `test/readme-0089.test.mjs`, `test/readme-0249.test.mjs`, `test/readme-0250.test.mjs`, `test/readme-0251.test.mjs`, `test/readme-0256.test.mjs`, `test/tagline-0255.test.mjs`, `test/brief-0111.test.mjs`, `test/brief-0225.test.mjs`, and the README checks in `test/install-0253.test.mjs`, `test/setup-0088.test.mjs`, `test/setup-0107.test.mjs` and `test/release-*.test.mjs`. Find them with `grep -lE "README|docs/|CHANGELOG" test/*.test.mjs`. Each has to be read: some check facts (0253's install commands, `private-words-0084`), and those stay.
- A test file that only checks a removed criterion is deleted, not left empty.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

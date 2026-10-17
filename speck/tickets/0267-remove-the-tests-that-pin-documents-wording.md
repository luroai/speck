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
- What counts as a fact, as the ticket lists: a command, a setting's name or default, a version, a file name, a link, or a name that mustn't appear (including the names of a skill, a button or a tool). Everything else a test read from the README, `docs/brief.md`, `CHANGELOG.md` or `docs/releases/` is wording or order, and went. Facts that were tied to a heading, a table row or a paragraph now check the whole document, so moving or renaming the part they sit in fails nothing.
- The README's setup prompt is now found as the first code block that names `speck-setup` (`setupPrompt()` in `test/support/release.mjs`), not as the code block under `## Get started`.
- The changelog's version headings and newest-first order stay checked: `releaseMismatches()` reads the newest section's version, and the changelog checks find each release's section by its version heading. 0267 AC1's test leaves those alone.
- Tickets' Notes recording no-ai-slop passes (0250 AC6, 0251 AC4, 0256 AC2) were removed too: they pinned a ticket's wording, and only recorded a past process step.
- Tests on the wording of skills, `AGENTS.md`, `templates/` and the reviewer prompt are out of scope and unchanged. Where one test read both a skill and a document (0111 AC4, 0235 AC4), only the document was taken out of it.
- AC4 is about how the ticket reads, so it's checked by review, with no test. AC5 is checked by `speck ship`'s whole-suite run; this build ran every changed test file.
- Self-check: the copy now keeps symlinks (`.agents/skills/`) as links; the nested test run drops `NODE_TEST_CONTEXT` so it really runs and reports, and the test checks at least 100 tests passed; heavy files (heavy.mjs) are left out of the nested run, and files whose document reads are inside single tests run only those tests, taking 0267's test file from about 13 s to about 4 s; kept 0225's check on `templates/config.yml`'s `max_parallel_builds` default, which no other test covers, in place of deleting the file.

## In plain words
Editing the README, the design brief, the changelog or the release notes by hand no longer fails the tests, as long as the commands, settings, versions, links and names in them stay right. Before, many checks pinned exact sentences, or the order of sections and paragraphs, so a wording change stopped every ship until a fix ticket updated them. To see it for yourself, reword a paragraph of the README or move a section and the tests still pass; change the install command or drop the licence link and they fail. Worth keeping an eye on: how a document reads is now checked only by the reviewer.

**Removed: checks on wording or order** (the document each read)
- README: that it opens with the tagline, then the one-line description, the opening paragraph, the picture and Get started; the opening's sentences on who speck is for, why it was built and why you can trust it; that Get started comes first and Without an agent later; the headings and order of How it works, The clever bits and Under the hood, and their sentences; that Under the hood says the same as the brief; that every earlier section is still there; the old introduction's sentences; that each section opens with a short, whole sentence and not with an old opener; the sentences on setting a ticket ready; the setup prompt's exact words; the picture's place after the opening paragraph and its description for screen readers; the tagline in the README; the command table's rows for running builds and stopping one; the sentences on which tests run when; the sentences releases 0.5.2, 0.5.3 and 0.5.4 made untrue; and the "Built with speck" figures, which were read from its sentences, for each release from 0.4.0 to 0.5.4.
- Brief: the one-build-at-a-time principle's wording and reasons (in three places); that nothing describes a shipping agent; the Releases section's sentences (in three places); the rows for detecting other workflows, setting speck up, running builds and running tests; the paragraph on merge rounds; the sentence that names the maintainer; the sentences on the whole suite and on recorded test results; the sentence on why a ship's tests fail; the "Not yet" list; and that it says builds end when approved.
- Changelog: how many headings and items each release's section has, that it says what changed since the last release, which words each section uses, that earlier sections are unchanged word for word, and the order of release sections.
- Release notes (0.4.0 to 0.5.4): the opening paragraph, how many main changes each lists, and the wording of their Install and Upgrading sections.
- Tickets: that three README tickets' notes record their two writing checks.

**Changed: now check only the fact, wherever it is in the document**
- README: the setup prompt runs the latest release's install command, names the setup skill and Node.js 20, and installs no fixed release; the terminal install command is the latest release's; the README names macOS, Linux, Claude Code, git, Node.js 20, Codex and Cursor, and the two skills folders; it links to the licence and names MIT; it shows both demo pictures, with the dark one for dark mode; it names the commands and settings for each step from idea to ship, and the review settings, with the right default for the number of review rounds; it gives the panel command and address, the command form for the terminal, and the links to the brief and to OpenSpec; it names the current version.
- Brief: names the latest release's install and detect commands, the setup command, the other-workflows field, the recorded-results command, the files option for tests and `nice`, the setting that stops background commands, the ship command, and the release notes file a release is published from; names the current version.
- Changelog: has a section for each release, giving that release's install command.
- Release notes: give the release's install command.

**Kept as they were: checks on facts**
- README and brief: the install command for the project's own home; the old skill name and the old "living spec" file name don't appear; the Ship button is named; no fixed release in any install command; private words don't appear.
- README: the old way a build shipped its own ticket isn't given.
- Changelog: the newest section's version matches the package's.
- Changelog and release notes: each past release keeps its own install command; each release's notes link to its changelog heading and use no private words.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

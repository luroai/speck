---
id: "0267"
title: "Remove the tests that pin documents' wording"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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

The list below names each test by its file and name, as the ticket asks, so it can be checked against the change.

**Removed** (the document each read)
- `brief-0111`: "AC1: the Principles list says speck runs one build at a time…", "AC1: the principle says the user can create tickets…", "AC2: the principle gives the reasons…", "AC3: the brief says builds end at approved…", "AC3: no part of the brief describes a shipping agent…" (brief).
- `brief-0225`: "0225 AC1: the reasons say one build at a time is the default…", "0225 AC1: the reasons no longer say…" (brief); "0225 AC3: 0111 checks the new wording…" (read 0111's test, which no longer checks the brief).
- `install-0253`: "0253 AC1: the setup prompt's other words are unchanged" (README); "0253 AC3: the brief's Releases section says the prompt always installs the newest release…" (brief).
- `luro-0082`: "AC4: the brief's sentence that named the owner now says "the maintainer"" (brief).
- `readme-0089`: "AC1: "Get started" is the first section after the introduction", "AC3: the terminal command without an agent is in a later "Without an agent" section" (README).
- `readme-0250`: "0250 AC1: the README opens with the tagline, the opening paragraph, the image, then Get started", "0250 AC4: Under the hood agrees with the brief on the facts it shares", "0250 AC5: the README keeps every section it had, after the new ones", "0250 AC5: the facts the old introduction and How you work with it gave are still there" (README and brief); "0250 AC6: the ticket's Notes record the no-ai-slop passes" (ticket 0250).
- `readme-0251`, the whole file: "0251 AC1: the opening says who speck is for…", "0251 AC2: a paragraph of its own says why speck exists", "0251 AC3: the opening says why you can trust the result…", "0251 AC5: the paragraph about your two decisions stays in the opening…" (README); "0251 AC4: the ticket records both no-ai-slop detect passes" (ticket 0251).
- `readme-0256`: "0256 AC1: every ## section opens with a paragraph…", "0256 AC1: every ## section's first sentence is a whole, short sentence", "0256 AC1: no section opens with a slogan…" (README); "0256 AC2: the ticket's Notes record both no-ai-slop detect passes" (ticket 0256).
- `ready-0108`: "0108 AC1: the README says setting ready commits the ticket…" (README).
- `release-0106`: "0106 AC2: the 0.2.0 section is unchanged" (changelog).
- `release-0210`: "0210 AC2: the 0.3.0 section is unchanged" (changelog); "0210 AC4: the brief's principle 7 says…" (brief); "0210 AC7: the README's Built with speck figures match…", "0210 AC7: worked out the same way, the done tickets of the last figures give the figures the README stated then" (README as it was at two past commits).
- `release-0226`: "0226 AC2: the 0.5.1 section covers the fixes…", "0226 AC2: the 0.5.0 and 0.4.0 sections are unchanged" (changelog); "0226 AC5: the README's Built with speck figures match…" (README at a past commit).
- `release-0236`: "0236 AC2: the 0.4.0 section is unchanged" (changelog); "0236 AC3: the README's How it works says a build runs the ticket's own tests…" (README); "0236 AC5: the README's Built with speck figures match…" (README at a past commit).
- `release-0243`: "0243 AC2: the 0.5.2 section covers…", "0243 AC2: the 0.5.1 and 0.5.0 sections are unchanged" (changelog); "0243 AC3: the README says nothing the 0.5.2 tickets made untrue" (README); "0243 AC6: the README's Built with speck figures match…" (README at a past commit).
- `release-0248`: "0248 AC2: the 0.5.3 section covers…", "0248 AC2: the 0.5.2 and 0.5.1 sections are unchanged" (changelog); "0248 AC3: the README says nothing the 0.5.3 tickets made untrue" (README); "0248 AC5: the README's Built with speck figures match…" (README at a past commit).
- `release-0254`: "0254 AC2: the 0.5.4 section covers…", "0254 AC2: the 0.5.3 and 0.5.2 sections are unchanged" (changelog); "0254 AC5: the README's Built with speck figures match…" (README).
- `review-0241`: "0241 AC4: the brief says a round is a merge round whenever the round before it approved" (brief).
- `run-0194`: "0194 AC5: the brief says builds end at approved and one ship queue…" (brief).
- `setup-0107`: "AC2: the README and the brief say the skill is hidden from the / menu" (README and brief).
- `ship-0244`: "0244 AC3: the brief says the same as the message" (brief).
- `tagline-0255`: "0255 AC1: under the # speck heading, the README opens with the new tagline and the plain line" (README).
- `worktrees`: "0032 AC4: the brief no longer puts parallel tickets out of scope…" (brief).

**Changed** (old name → new name: the document, and the fact it now checks)
- `brief-0111`: "AC4: no part of the brief, the README or the skills says builds run in parallel" → "AC4: no skill says builds run in parallel": no longer reads the brief or the README; the skills part is unchanged.
- `brief-0225`: "0225 AC2: the brief, the README and templates/config.yml agree on one build at a time…" → "0225 AC2: templates/config.yml builds one at a time unless you raise max_parallel_builds" (the setting's default, not a document) and "0225 AC2: the brief names max_parallel_builds, speck/config.yml and after:" (brief: two settings and a file name).
- `build-0235`: "0235 AC4: the brief and /speck-build say the whole suite runs in speck ship…" → "0235 AC4: /speck-build says…" (skill only) and "0235 AC4: the brief names speck ship" (brief: a command).
- `core`: "0014 AC4: the docs describe the builder as any agent that reads speck skills" → "0014 AC4: the README names the skills folders and the agents that read them" (README: two folder names and three tool names).
- `detect-0124`: "0124 AC1: the brief describes other_workflows in speck detect, and setup asking about it" → "0124 AC1: the brief names other_workflows" (brief: a field's name).
- `install-0253`: "0253 AC2: the README's Without an agent section installs the latest release" → "0253 AC2: the README's command to run in a terminal installs the latest release" (README: a command); "0253 AC2: the brief's command table and Releases section use the latest release" → "0253 AC2: the brief gives the latest release's init and detect commands" (brief: two commands); new "0253 AC3: the brief names the files the version check reads" (brief: two file names); "0253 AC4: the setup prompt check passes…" and "0253 AC4: the setup prompt check fails…" keep their names and now give the check example prompts that name the setup skill, since the check finds the prompt by that name.
- `licence-0090`: "AC2: the README Licence section links to LICENSE" → "AC2: the README links to LICENSE and names MIT" (README: a link and the licence's name).
- `lint-0121`: "0121 AC5: the README or the brief says how to list your private words" → "0121 AC5: the README or the brief names the private words file" (README or brief: a file name).
- `readme-0089`: "AC1: Get started gives a prompt in a code block to paste into Claude Code" → "AC1: the README gives a prompt in a code block to paste into Claude Code" (README: the prompt and a tool name); "AC1: the prompt runs init at the latest release, follows speck-setup, offers Node.js 20+ and asks before changes" → "AC1: the prompt runs init at the latest release, follows speck-setup and names Node.js 20" (README: a command, a skill name and a version); "AC4: Requirements name macOS or Linux, Claude Code, git and Node.js 20 or newer, with Codex optional" → "AC4: the README names macOS, Linux, Claude Code, git, Node.js 20 and Codex" (README: names and a version).
- `readme-0249`: "0249 AC1: the README shows the demo picture after the opening paragraph and before the first ## heading" → "0249 AC1: the README shows the demo picture" (README: both image file names); "0249 AC2: a dark <source>…" keeps its name and no longer checks the picture's description words (README: the image file names and dark mode).
- `readme-0250`: "0250 AC1: the setup prompt keeps installing the latest release" keeps its name (README: a command); "0250 AC2: How it works follows the landing page's three parts in order" → "0250 AC2: the README names the commands and settings for each step from idea to ship"; "0250 AC3: The clever bits gives each of the landing page's clever bits, in order…" → "0250 AC3: the README names what makes each clever bit happen"; "0250 AC4: Under the hood covers the review turns…" → "0250 AC4: the README names the review loop's settings and statuses, where state lives and which tests run when", with the default number of review rounds (README: commands, settings, statuses, folder names and a default); new "0250 AC5: the README still links to OpenSpec" (README: a link).
- `readme-0256`: "0256 AC3: the facts the changed sections gave are still there" → "0256 AC3: the commands and links the changed sections gave are still there" (README: two commands, an address and two links).
- `recorded-0238`: "0238 AC4: docs/brief.md describes speck test --recorded and says…" → "0238 AC4: docs/brief.md names speck test --recorded" (brief: a command).
- `release-0092`: "AC2: CHANGELOG.md has a 0.2.0 section grouped under a few headings" → "AC2: CHANGELOG.md has a 0.2.0 section" (changelog: a version); "AC3: the README and brief status lines say the current version, a public preview, not v0.1" → "AC3: the README and the brief name the current version" (README and brief: a version).
- `release-0106`, `release-0210`, `release-0226`, `release-0236`, `release-0243`, `release-0248`, `release-0254`: each "CHANGELOG.md has a <version> section above <previous>, under a few headings" (or "a heading or two") → "CHANGELOG.md has a <version> section" (changelog: a version, and the release's install command for 0.5.0 to 0.5.4); each "the README and brief status lines say the current version, a public preview" (0254: "…say 0.5.4…") → "the README and the brief name the current version" (0254: "…name 0.5.4") (README and brief: a version); each "the release notes say …, how to install and how to upgrade" (all but 0106, which has no release notes) → "the release notes say how to install <version>" (release notes: a command).
- `release-0106`: new "0106 AC5: the brief names main, the branch a release is cut from" in place of "0106 AC5: the brief has a short Releases section…" (brief: a branch name).
- `release-0210`: new "0210 AC6: the release notes name speck run" (0.4.0 notes: a command).
- `release-0226`: new "0226 AC2: the 0.5.1 section names max_parallel_builds" (changelog: a setting) and "0226 AC3: the README's commands name run and pause <id>" in place of "0226 AC3: the README's commands say run builds one at a time…" (README: two commands).
- `release-0236`: new "0236 AC4: the release notes name speck test --files" (0.5.0 notes: a command).
- `release-0243`: "0243 AC5: the brief says a workflow tags and publishes each release from its notes file…" → "0243 AC5: the brief names the release notes file a workflow publishes each release from" (brief: a file name).
- `release-0254`: "0254 AC3: the README says nothing the 0.5.4 tickets made untrue" → "0254 AC3: no install command in the README names a fixed release" (README: a command); new "0254 AC4: the release notes name speck/config.yml" (0.5.4 notes: a file name).
- `run-0245`: "0245 AC3: the brief says speck run's Claude Code builds can't run commands in the background, and why" → "0245 AC3: the brief names the setting that stops speck run's Claude Code builds running commands in the background" (brief: a setting's name).
- `run-0247`: "0247 AC5: the brief says speck run switches to new code once it's idle" → "0247 AC5: the brief names speck run" (brief: a command).
- `setup-0088`: "0088 AC1: the README and the brief list /speck-setup with the other skills" → "0088 AC1: the README and the brief name /speck-setup" (README and brief: a skill name).
- `setup-0107`: "AC3: the README setup prompt still names the skill" keeps its name and finds the prompt by the skill it names, not by its heading (README: a skill name).
- `ship`: "AC5: only the user can ship, and the agent rules say so" keeps its name; its one check on the brief now looks for the ship skill's name, not a sentence (brief: a skill name).
- `turns-0239`: "0239 AC4: docs/brief.md says --files takes a turn and that tests run through nice" → "0239 AC4: docs/brief.md names speck test --files, commands.test_files, {files} and nice" (brief: a command, a setting, a placeholder and a tool).
- `wording-0125`: "0125 AC1: the README, package.json and speck help share the tagline…" → "0125 AC1: package.json and speck help share the tagline…": no longer reads the README.

**Kept as they were** (the document, and the fact each checks)
- `build-0116`: "0116 AC4: the brief, the README and the skills no longer describe the skill" (README and brief: the old skill's name mustn't appear).
- `install-0253`: "0253 AC1: the setup prompt runs init at the latest release, quoted, naming no fixed release" (README: a command); "0253 AC2: every speck npx command outside the changelog and release notes uses the latest release, quoted" (README and brief: commands); "0253 AC2: the changelog and release notes keep each release's fixed version" (changelog and 0.5.3 notes: a command and a version); "0253 AC4: the version check covers package.json and the newest changelog section, not the prompt" (changelog: a version).
- `luro-0082`: "AC1: README and the brief give the install command for luroai/speck" (README and brief: a command); "AC3: the v0.1 handoff note is gone" and "AC5: the panel mockup is gone" (file names that mustn't exist).
- `panel-0133`: "0133 Notes: the docs say shipping happens through /speck-ship or the panel's Ship button…" (README and brief: a button's name).
- `private-words-0084`: "AC2: 0082's check fails naming each file when a listed word is in a tracked file" (every tracked file, the README among them: names that mustn't appear).
- `product-0068`: "0068 AC3: no skill, template or top-level doc mentions product.md or a living spec" (README and brief: a file name and a name that mustn't appear).
- `readme-0089`: "AC2: the prompt installs the latest release, not a fixed version" (README: a command).
- `release-0092`: "AC4: the README setup prompt installs the latest release" (README: a command).
- `release-0106`, `release-0210`, `release-0226`, `release-0236`, `release-0243`, `release-0248`: "package.json has the current release version" (changelog: a version); "the README setup prompt installs the latest release" (README: a command, and no older fixed release); "package.json and the newest changelog section name the same version, and the setup prompt installs the latest release" (changelog and README: a version and a command). `release-0254`: "0254 AC3: the setup prompt still installs the latest release, as 0253 left it" (README: a command); "0254 AC5: package.json and the newest changelog section name 0.5.4" (changelog: a version).
- `release-0210`, `release-0226`, `release-0236`, `release-0243`, `release-0248`, `release-0254`: "the release notes link to the changelog heading GitHub makes for the <version> section" (release notes: a link); "the release notes use none of the private words" (release notes: names that mustn't appear).
- `run-0194`: "0194: the other docs no longer say a build ships its own ticket" (README: an old command that mustn't appear).
- `setup-0107`: "AC2: the description says the README setup prompt starts it, not a typed command" reads the skill's description, not a document.
- Tests that only write a README or a `docs/` file into a temporary repo, and read no document of speck's, are unchanged: `detect-0124` "0124 AC3", `release-0240` "0240 AC1: an untagged version…", `repo-speck-0122` "0122 AC2" and "0122 AC3", `retry-0228` "0228 AC2 AC4" and "0228 AC3".

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "1c9f12429aca4e4bc8d5f0634ddf47f1c31dfb3a",
    "thread_id": "01a14912-223b-7de3-b614-f2563bfb4b06",
    "seconds": 38,
    "usage": {
      "input_tokens": 285988,
      "cached_input_tokens": 207232,
      "cache_write_input_tokens": 0,
      "output_tokens": 1577,
      "reasoning_output_tokens": 197
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T08:55:25.133Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/docs-0267.test.mjs:140–152 introduces assertions that depend on the README's prose and section structure."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "test/turns-0239.test.mjs drops the brief's commands.test_files setting-name check instead of retaining it independently of the sentence."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "A read-only probe using the actual mutate() helpers confirmed that rewording the opening description without 'the', 'and', 'a' or 'is' makes the 'the opening is reworded' assertion fail."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The ticket's In plain words groups changes by document and subject, but does not identify each removed, changed or retained test."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0267-tests.txt confirms 330 tests passed with no failures across the reported files. The reviewed change reveals no regression in existing passing tests; the whole-suite check remains with speck ship."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/docs-0267.test.mjs:140",
        "issue": "The new self-check reintroduces dependence on document wording. Replacing the opening description with 'speck converts conversations into tickets, builds code, runs tests, reviews results, then ships consistently.' preserves its meaning but fails assert.notEqual because reword() changes none of its words. The section-count and 'nearly every section opens differently' assertions also constrain future document edits.",
        "suggested_fix": "Test the mutation helper against a fixed synthetic fixture. Make mutations applied to real documents work independently of their vocabulary and section count, without assertions requiring particular prose or layout.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/turns-0239.test.mjs:160",
        "issue": "Removing the sentence assertion also removes its check that the brief names commands.test_files. A setting's name is explicitly a fact that AC2 requires retaining. The remaining checks cover only the command and nice.",
        "suggested_fix": "Retain a whole-document check for commands.test_files, and audit other removed mixed assertions for facts that need separate checks.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "speck/tickets/0267-remove-the-tests-that-pin-documents-wording.md",
        "issue": "AC4 requires an inventory of each test removed or changed and each document-reading test kept. The current subject summaries do not identify individual tests, making the inventory impossible to reconcile reliably with the diff.",
        "suggested_fix": "List test file and test name (or a unique criterion identifier) for every affected or retained document-reading test, alongside its document and, for retained checks, its fact.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Most wording checks have been removed, and all 330 reported tests pass. Changes are still needed: the new self-check itself fails on harmless README rewording, a required setting-name check was lost, and the ticket lacks the requested test-by-test inventory."
  }
}
```

</details>

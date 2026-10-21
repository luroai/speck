---
id: "0354"
title: "Link to the document from its review pack"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0353"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:22:34.885Z"

---
# 0354 · Link to the document from its review pack

**Status:** 🔍 reviewing

## Problem
For a document, Gate 2 is reading the document itself, not a summary of it. Today the review pack shows the reviewer's verdict and evidence but gives no way to open what the build wrote.

## Outcome
A document task's review pack links to each file in its output folder, and the panel opens it.

## Acceptance criteria
1. For a document task, `speck pack <id>` lists each file in its output folder, with its path from the project root. A code ticket's pack is unchanged.
2. In the panel, each file the review pack lists is a link. Pressing a Markdown file shows it formatted in the side pane, as a review pack is, with a way back to the pack. Any other file opens in a new tab, served by the panel.
3. The panel serves only files inside that ticket's output folder: a request for a path that leads outside it, by `..` or by a link, gets a 404.
4. No test that passed before this change fails.

## Out of scope
- Comments on passages of the document: one note for the whole ticket comes with 0356 and 0357.
- Editing the document in the panel.

## Notes
- Agreed with the user 2026-10-21: the review pack links to the document; it doesn't paste it in.
- Failing before this build: none
- Self-check: only regular files are listed and served, so a link in the folder is neither listed nor followed; a page or SVG the build wrote is served sandboxed, so it can't act as the panel; a malformed address gets a 404 rather than an error.
- `reviewPack` and `panelPack` in `scripts/pack.mjs`; the routes in `scripts/panel.mjs` (the pictures route, 0294, is the nearest pattern); the review pack pane in `templates/panel.html`.

## In plain words
When speck writes a document for you, its review pack now lists every file it wrote. In the panel, each one is a link: a Markdown file opens right in the side pane, laid out as the pack is, with a button to go back to the pack, and anything else, such as a PDF, opens in a new browser tab. To see it, open the review pack of an approved document ticket in the panel and press one of the files under Document. The panel only opens files inside that ticket's own folder; if that folder, or one it sits in, is a shortcut to somewhere else, the pack says so and opens nothing. A web page the build wrote opens with its scripts switched off.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Known limits: only Markdown files open in the side pane; a plain text file opens in a new tab. A file that's a link inside the folder isn't listed or served, even when it points at another file in the folder.
- Follow-ups: none for the inbox.

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
    "reviewed_sha": "e2add7fe2939d6900dfffe485c27e907bb857fd8",
    "thread_id": "01a15e00-89bc-77d1-9493-154aa3d21e76",
    "seconds": 39,
    "usage": {
      "input_tokens": 161562,
      "cached_input_tokens": 113152,
      "cache_write_input_tokens": 0,
      "output_tokens": 938,
      "reasoning_output_tokens": 150
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:28:15.008Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/output.mjs outputFiles/documentLines recursively list regular files with project-relative paths; reviewPack includes them. The AC1 tests in test/pack-0354.test.mjs passed, including code-ticket compatibility."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelDocuments supplies file URLs; documentsPart, openDocument and documentPane provide links, formatted Markdown and a back button. Passing AC2 tests exercise these behaviours and the real server's file responses."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "documentFile rejects symlinks beneath the resolved output directory, but fs.realpathSync(outputPath(repo, t)) follows symlinks at the output directory itself or its ancestors before establishing the boundary. Existing AC3 tests cover only links within that directory."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test output reports 167 passed, zero failed and three skipped across 170 tests. The changes and regression tests provide no other evidence of regressions; the whole-suite check remains for shipping."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/output.mjs",
        "issue": "documentFile follows a symlink at the ticket's output folder, or any parent beneath outputs/, and treats its destination as the allowed boundary. For example, if outputs/memos/pricing points to another directory, requesting output/secret.txt serves that directory's secret.txt. outputFiles also lists those external files. This bypasses the ticket's requirement to reject paths that escape by a link.",
        "suggested_fix": "Check the configured output directory and its ancestors beneath the project root for symlinks before listing or serving files, rather than establishing the boundary from an already resolved destination. Add regression tests for a symlink replacing the output folder and a symlink at an intermediate parent; external files must not be listed and requests must return 404.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The review pack lists document files, and the panel opens Markdown with a way back. The tested flows pass. One file-access boundary needs fixing: a linked output folder can expose files outside the ticket's intended folder."
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
    "reviewed_sha": "18ea1a58e1a533ed5a77e2529c949b95ad27159c",
    "thread_id": "01a15e00-89bc-77d1-9493-154aa3d21e76",
    "seconds": 20,
    "usage": {
      "input_tokens": 266120,
      "cached_input_tokens": 212224,
      "cache_write_input_tokens": 0,
      "output_tokens": 1440,
      "reasoning_output_tokens": 150
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:29:20.676Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/output.mjs outputFiles/documentLines list regular files recursively with project-relative paths; reviewPack includes them only for document tasks. Passing AC1 tests cover nested files, missing/empty folders and unchanged code-ticket packs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelDocuments supplies links; templates/panel.html documentsPart, openDocument and documentPane implement formatted Markdown in the side pane with a back button and other files in a new tab. Passing AC2 tests cover these behaviours and actual server responses."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "unlinkedOutput now rejects output folders whose resolved location differs from their configured location. documentFile also checks containment and rejects linked files. Passing AC3 tests cover traversal, internal links, malformed addresses, and links at outputs/, an intermediate parent and the output folder itself."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The fresh recorded run reports 168 passed, zero failed and three skipped across 171 tests, including the ticket tests and relevant regression checks. No regression is evident from the code changes; shipping performs the whole-suite check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/output.mjs",
        "issue": "A symlink at the output folder or one of its parents previously allowed external files to be listed and served.",
        "suggested_fix": "Implemented: unlinkedOutput checks the configured folder against its real location before listing or serving. Regression tests exercise links at all three folder levels.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Document review packs now list files and let users open them from the panel, with Markdown shown in the side pane. The folder-boundary issue is fixed and covered by regression tests. All reviewed criteria pass."
  }
}
```

</details>

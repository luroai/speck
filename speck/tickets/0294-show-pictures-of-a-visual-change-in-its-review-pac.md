---
id: "0294"
title: "Show pictures of a visual change in its review pack"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0284"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:07:36.362Z"
approved: "2026-10-18T13:42:05.697Z"

---
# 0294 · Show pictures of a visual change in its review pack

**Status:** 👍 approved

## Problem
For a ticket that changes how something looks, the review pack gives criteria with ticks and the reviewer's words, but no picture. Someone who doesn't read code can't judge a visual change without checking out the branch or waiting until it ships, though deciding whether to ship (Gate 2) is what the pack is for.

## Outcome
The review pack of a ticket that changes how something looks shows pictures of the result.

## Acceptance criteria
1. The build skill has a build whose ticket changes how something looks (the panel, a page, or how the README renders) take pictures of each changed view in a real browser, in the light and dark looks where both exist, before review. (checked by review)
2. The pictures are kept with the ticket's review pack in `speck/.cache/`, not committed, and `speck pack <id>` lists them with what each shows.
3. The panel's review pack shows them, each with its caption, and opens one full size when pressed.
4. A pack with no pictures looks as it does today.

## Out of scope
- Before-and-after comparisons.
- Pictures of documents: `speck/ideas/2026-10-17-review-documents-an-agentic-task-writes.md`.

## Notes
- From `speck/ideas/2026-10-16-show-images-in-review-packs.md`, with its open questions decided: the builder takes the pictures, of the result only, in light and dark, kept beside the pack.
- Failing before this build: none
- AC1 is checked by review: the new step 5 in section 3 of `skills/speck-build/SKILL.md`. A test checks only the facts it names (the command, the folder).
- Self-check: a caption with a line break, hand-edited into `pictures.json`, is now put on one line when read, so the pack's list keeps one line per picture.
- Pictures: taken in a real browser (Chromium through Playwright) of a throwaway repo's review pack with two sample pictures, light and dark, and kept with `speck picture 0294`.
- Tests already drive a real browser with `browserPage()` in `test/support/panel.mjs`. The pack is built in `scripts/pack.mjs`.

## In plain words
When a ticket changes how something looks, the build now takes pictures of the result in a real browser, in the light and dark looks, and keeps them with the ticket's review pack. Open an approved ticket's review pack in the panel and the pictures appear under the acceptance criteria, each with a caption saying what it shows; press one to see it full size. This ticket's own pack has two pictures of exactly that. A pack with no pictures looks the same as before. The pictures stay on this computer and are never committed, so they won't show for someone looking at the project elsewhere.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 677,468
- Elapsed since build started: 34 min
- Changed lines: 164 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox note): pictures stay in `speck/.cache/pictures/<id>/` after the ticket ships, with nothing tidying them away; `speck pack` gives each picture's full path on this machine.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "3f99228f253441a0da942e1f877c3583eb35e9a1",
    "thread_id": "01a14f25-56f4-7592-90eb-c30c56064dd2",
    "seconds": 37,
    "usage": {
      "input_tokens": 268039,
      "cached_input_tokens": 216064,
      "cache_write_input_tokens": 0,
      "output_tokens": 914,
      "reasoning_output_tokens": 147
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:14:06.410Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md, section 3 step 5, requires real-browser pictures of each changed view before review, in light and dark where available, and fresh pictures after visual fixes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/pictures.mjs stores captioned pictures in the shared speck/.cache/pictures/<id>/ directory; reviewPack lists them through picturesLines. Passing AC2 tests cover CLI storage, git exclusion, worktree sharing, captions and clearing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelPack supplies pictures and panelServer serves their bytes. templates/panel.html picturesPart renders captioned images linking to the full-size files. Passing AC3 tests exercise rendering and HTTP delivery; the saved light-look screenshot also shows the pictures beneath the criteria."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "picturesLines returns no content when pictures are absent, and the panel adds no picture elements. Both passing AC4 tests verify the unchanged pack output and panel presentation."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Visual changes now have captioned pictures in their review packs, with full-size viewing from the panel. Pictures remain outside git, and packs without pictures retain their existing presentation. The reported tests passed, and I found no blocking issues."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "013411d18afe4fa406470d73c1760710511fa329",
    "merge": true,
    "thread_id": "01a14f25-56f4-7592-90eb-c30c56064dd2",
    "seconds": 18,
    "usage": {
      "input_tokens": 407085,
      "cached_input_tokens": 333568,
      "cache_write_input_tokens": 0,
      "output_tokens": 1430,
      "reasoning_output_tokens": 147
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:42:03.307Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 3 step 6 still requires real-browser pictures of each changed view, in both looks where available, before the first review round. Moving this step preserves the requirement."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/pictures.mjs retains shared, git-ignored cache storage and captioned listings through picturesLines in reviewPack. Passing AC2 tests cover storage, worktree sharing, git exclusion, captions and clearing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelPack, the picture HTTP route and picturesPart retain captioned thumbnails linking to full-size files. All AC3 tests pass. The revised missing-picture response remains a 404 and restores compatibility with the existing panel restart tests."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both AC4 tests pass: packs without pictures retain their text and render without picture elements. The merged changes preserve the existing panel behaviour."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change still meets all four criteria. The two compatibility fixes preserve picture capture and viewing while restoring the existing tests. The reported run passed 160 tests with three skipped; no blocking concerns remain."
  }
}
```

</details>

---
id: "0249"
title: "Show speck's panel beside an agent conversation at the top of the README"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T11:09:08.751Z"
approved: "2026-10-16T11:10:55.235Z"

---
# 0249 · Show speck's panel beside an agent conversation at the top of the README

**Status:** 👍 approved

## Problem
People landing on speck's GitHub page, such as someone reading a job application, see only text. What speck is like to use, your agent's conversation on one side and speck's panel open beside it in the agent app, isn't shown anywhere in the README.

## Outcome
Near the top, the README shows a demo image of an agent app with a conversation on the left and speck's panel open in its browser pane on the right, in the reader's light or dark theme.

## Acceptance criteria
1. `README.md` shows the demo image supplied for this ticket of an agent app, a conversation on the left and speck's panel open in its browser pane on the right, placed after the opening paragraph and before the first `##` heading.
2. There's a light and a dark version, and the README picks between them with a `<picture>` element whose `<source>` uses `media="(prefers-color-scheme: dark)"`, falling back to the light one in an `<img>` with alt text that says it's an agent conversation beside speck's panel.
3. Both image files are committed under `docs/images/`, are each at least 1600 pixels wide and under 800 KB.
4. Neither image shows a person's name, account or email address, a panel "Disconnected" banner or a speck version number: anything like that in a supplied screenshot is cropped out or covered.
5. No test that passed before this change fails.

## Out of scope
- Making the images: they're supplied, in light and dark.
- Changing the README's wording, apart from the image: that's 0250, which waits for this one.

## Notes
- Source: `demo-light.png` and `demo-dark.png` in `speck-assets/readme/`, beside this checkout on the build machine, outside the repo. They show the real panel page with made-up tickets for a demo shop, inside a mock agent app (no product's branding), at 3000×1880. Use them as they are, apart from any resizing or compressing the size limits need. Don't commit that path, or the demo's server and frame from `speck-assets/readme/demo/`. If the images aren't there, block and ask for them.
- The images are public: check them for anything private (names, accounts, client or project names other than speck) before committing.
- Checked 2026-10-16: GitHub renders `<picture>` with a `prefers-color-scheme` `<source>` in a README: `gh api markdown` (gfm) keeps the `<source media="(prefers-color-scheme: dark)">` and wraps the element in GitHub's `<themed-picture>`, which switches the image with the reader's GitHub theme.
- Failing before this build: none
- AC4 is checked by looking at the two images: they show a mock agent app (no product branding, no account or user name), a made-up "shop" project and the panel at `127.0.0.1:4777` with no "Disconnected" banner and no speck version. The supplied files were used unchanged: 3000×1880, about 310 KB each, with no text or EXIF metadata chunks, which the AC4 test checks.
- Self-check: no changes (ran the README, release, private-words and licence test files as well: all pass).

## In plain words
speck's GitHub page now opens with a picture of what it's like to use: a chat with your coding agent on the left and speck's panel beside it on the right, showing tickets for a made-up shop being planned, built and waiting to ship. People who use GitHub's dark theme see a dark version of the picture, and everyone else sees the light one. To see it, open the README on GitHub after this ships and switch GitHub between light and dark. Worth keeping an eye on: the picture shows the panel as it looks today, so it will need a fresh one if the panel's look changes a lot.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 87,815
- Elapsed since build started: 2 min
- Changed lines: 5 (limit 5000)
- Follow-ups: none.

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
    "reviewed_sha": "6217e2b622136ba6db6b80a441bbb3b80e2791fc",
    "thread_id": "01a14467-df2b-7251-926c-add82638bea6",
    "seconds": 27,
    "usage": {
      "input_tokens": 87182,
      "cached_input_tokens": 50048,
      "cache_write_input_tokens": 0,
      "output_tokens": 633,
      "reasoning_output_tokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T11:10:47.074Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md places the picture after the opening paragraph and before the first ## heading. Visual inspection confirms a conversation on the left and speck's panel on the right. Covered by the passing AC1 test."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md uses the required dark-theme source, light img fallback and descriptive alt text. The AC2 test exercises these attributes and passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both PNGs are tracked under docs/images/. Each is 3000 pixels wide; dark is 310,439 bytes and light is 321,029 bytes. The AC3 dimension and size checks pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Inspected both images visually: neither shows personal names, accounts, email addresses, a Disconnected banner or a speck version. Only the fictional shop project appears. The passing AC4 test additionally checks for text and EXIF metadata."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied ticket test run passes all four tests; the independent rerun also passes. Existing tests are unchanged, and the diff contains only the README image insertion, image assets, ticket records and focused tests. The whole-suite check remains part of shipping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now shows the supplied conversation and panel demo near the top, with light and dark versions. Both images meet the size requirements and contain no visible private details. Tests pass, existing wording is unchanged, and there are no blocking concerns."
  }
}
```

</details>

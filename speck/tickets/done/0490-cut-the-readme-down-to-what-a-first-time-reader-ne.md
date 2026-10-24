---
id: "0490"
title: "Cut the README down to what a first-time reader needs"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0489"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T20:29:47.438Z"
approved: "2026-10-24T20:37:37.235Z"
finished: "2026-10-24T20:41:08.982Z"

---
# 0490 · Cut the README down to what a first-time reader needs

**Status:** ✅ done

## Problem
The README is 285 lines, with paragraphs over 1,000 characters that list setting names, fallbacks and limits. Someone arriving from the launch post, often on a phone, has to wade through detail the brief already holds before they understand what speck does.

## Outcome
The README is short enough to read on a phone, describes the panel as it is now, and leaves the full detail to `docs/brief.md`.

## Acceptance criteria
1. The README is at most about 150 lines, and no paragraph or list item outside the Commands section's tables runs much over 500 characters (checked by review).
2. Every setting name, command and file path the README names before this change is named in `docs/brief.md` after it, so cutting it from the README loses nothing. Checked against the list of them taken from the README before the change.
3. "The panel" describes it as it's used now: a phone-width column beside your agent or on your phone, speck's screen saying what's happening, Plan, Build and Shipped as cards you swipe between, and Settings. Each of "The clever bits" is one or two sentences, and "Who it's for" no longer repeats the opening (checked by review).
4. The opening (0489), the setup prompt, the status line, "Built with speck", every link and every heading another page links to (such as `#the-panel`) are unchanged (checked by review). No test that passed before this change fails.

## Out of scope
- The opening above `## Get started` (0489).
- What `docs/brief.md` says, beyond adding what moves there from the README.

## Notes
- Agreed with the user on 2026-10-24, from the page https://claude.ai/artifact/1TAXHPCUZ9wvSfkdaLKQzW: cut "The clever bits" to a sentence or two each, fold the four long paragraphs under "Where state lives" (your own settings, API keys, your agents, adding an API provider) into one short "Your agents" part, rewrite "The panel" round the phone-width column, shrink "Who it's for" to the "Most AI coding tools sell speed or autonomy" paragraph and the OpenSpec credit, and keep Requirements to one line for builders.
- After 0491, only a few tests read the README (the setup prompt, the status line, the pictures and its links), so cutting text doesn't mean moving tests.
- Waits for 0489, which rewrites the opening above this, and through it 0491.
- Failing before this build: none
- Self-check: narrowed two claims in the cut README (speck's agent looks into stops only with `watch: fix`; an idea is saved when you ask, not as you talk), and dropped a new link to a brief heading that broke when the brief's headings are reworded (0267).
- Pictures: none, because the change only cuts and rewrites README text, with no picture, layout or styling change, and no Markdown renderer is installed here to show it as GitHub would.

## In plain words
The README is now about half as long, short enough to read on a phone. The opening, the setup prompt and "Built with speck" are exactly as they were. Below them, each section says what a newcomer needs and leaves the detail to the product brief: each clever bit is a sentence or two, the four long paragraphs about agents, keys and settings are now one short "Your agents" part, and "The panel" describes the narrow column with speck's screen, the Plan, Build and Shipped cards you swipe between, and Settings. Everything the old README named, every setting, command and file, is still in the brief. To see it, open the README on GitHub, ideally on a phone. Worth a look: the "What a review pack looks like" and "Repo layout" sections are gone, folded into "How it works" and left to the brief.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 212,950
- Elapsed since build started: 8 min
- Changed lines: 224 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Tidy-up: "How it works" uses `speck set` and `speck run` before the Commands section says that `speck` stands for `node .speck/scripts/speck.mjs`. Worth a word earlier if readers trip on it. No idea note: wording only.

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
    "reviewed_sha": "695bdd33f3d9d157032a74bc2c75079e375b7163",
    "session": "fresh",
    "thread_id": "01a16fa1-81af-70d3-a760-6a9dc86271f0",
    "builder_response": "- Tests run: `speck test --related test/readme-0490.test.mjs` (the ticket's own test, plus every existing test file that names README.md or docs/brief.md), then, for AC4, every test file whose source mentions the README (61 files) with `speck test --files`. Both runs are in the test output, one after the other; both passed with no failures.\n- AC2: the list of setting names, commands, file paths and values is in test/readme-0490.test.mjs, taken from every code span in the README before this change (195 spans). A full command line is listed as the speck command it runs. The test fails on the brief before this change (15 missing) and passes after. The only span left out is `docs/brief.md`, the brief's own path.\n- AC1, AC3, AC4 are checked by review. The README is 151 lines. The opening above `## Get started`, `## Get started` itself, the status line and \"Built with speck\" to the end are byte-identical to before; the set of links and picture sources is identical too. Removed headings (\"What a review pack looks like\", \"Repo layout\", and the four under \"Under the hood\") are linked from nowhere in the repo; `#the-panel` is kept.\n- Not a visual change beyond text: no pictures (see Notes).\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 211760,
      "cached_input_tokens": 153728,
      "cache_write_input_tokens": 0,
      "output_tokens": 1190,
      "reasoning_output_tokens": 35
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T20:37:27.519Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md is 151 lines, within 'about 150'. Its longest prose paragraph is 406 characters; individual list items also stay below 500."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/readme-0490.test.mjs checks a fixed inventory from the previous README against docs/brief.md and passes. Comparison with main confirms the inventory covers the previous settings, commands and paths, with equivalent command forms normalised."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md's 'The panel' describes the phone-width column, status screen, swipeable Plan, Build and Shipped cards, and Settings. Each clever bit has two sentences including its label. 'Who it's for' retains only the judgement paragraph and OpenSpec credit."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Comparison with main confirms the opening, Get started section including its setup prompt, status line, and Built with speck through the end are byte-identical. Link destinations are unchanged; no repository Markdown links target removed headings. Both recorded test runs passed with zero failures."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README is substantially shorter and clearly explains the current panel. Technical references remain available in the brief, and the protected content and links are preserved. The recorded tests pass. No blocking concerns found."
  }
}
```

</details>

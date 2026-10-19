---
id: "0306"
title: "Bring the README and its picture up to date"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0287", "0293", "0294", "0296", "0304", "0305", "0308", "0309", "0310", "0311", "0312", "0313", "0314", "0315", "0316", "0317", "0318", "0319", "0320", "0321"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T06:00:41.454Z"
approved: "2026-10-19T06:06:52.384Z"
finished: "2026-10-19T06:09:16.737Z"

---
# 0306 · Bring the README and its picture up to date

**Status:** ✅ done

## Problem
The README describes speck as it was at 0.5.4, and its picture (0249) shows the panel's old look. Since then speck has gained a Settings view, the Foreman, builds with Codex and Cursor, a Claude Code reviewer, pull request mode and pictures in review packs, and the panel has the LCD look (0302–0305). Someone reading the README sees neither.

## Outcome
The README describes what speck does now, and its picture shows the panel as it looks now.

## Acceptance criteria
1. The README says what each of these does for someone using speck, in the section where it fits: the Settings view, the Foreman (one status for the pipeline, and clearing technical blockages), building with Claude Code, Codex or Cursor, reviewing with Claude Code from the command line, pull request mode, and pictures of a visual change in review packs. Every claim matches a shipped ticket. (checked by review)
2. Nothing in the README is untrue of speck as it is when this is built, including what it says about which agents can build and review. (checked by review)
3. The light and dark pictures in `docs/images/` are taken again, the same way as 0249's, so they show the panel with the LCD badges, the LCD mark and title, and the Foreman's status in the header, with made-up tickets. Each is at least 1600 pixels wide and under 800 KB, with no text or EXIF metadata.
4. Neither picture shows a person's name, account or email address, a client or project name other than speck, a "Disconnected" banner or a speck version number.
5. No test that passed before this change fails.

## Out of scope
- The landing page, which lives in its own repo.

## Notes
- 0249's pictures were made with the demo in `speck-assets/readme/demo/` beside this checkout, outside the repo: `server.mjs` serves the real panel page from a speck checkout with made-up tickets inside a mock agent app (`frame.html`), and `shoot.mjs` takes the screenshot at 2× with headless Chromium. Don't commit that folder or its paths.
- Waits for everything it describes, so the README and picture match what ships.
- Failing before this build: none
- Tests: AC1, AC2 and AC4 are about how the README reads and what the pictures show, so review checks them by reading the README and looking at `docs/images/`. `test/readme-0306.test.mjs` checks AC3's file facts (width, size, no text or EXIF chunks). The pictures were taken again with the 0249 demo, updated to serve the panel's LCD script and font and to give the header the Foreman's status, worked out by speck's own code.
- Self-check: dropped two tests that checked the README's wording (the 0267 check fails on them), and changed the Foreman paragraph's heading so it doesn't promise one word when the status can be two.

## In plain words
The README now covers the few things that had shipped without being described: in pull request mode speck never pushes straight to your main branch, the Foreman's status in the panel's header tells you at a glance where things stand, only one speck run can work in a project at a time, each ticket is built with the agent it was made for, and the Claude reviewer runs without your MCP servers or connectors. Setup's description also mentions the pull request choice. Its picture, in both the light and dark look, now shows the panel as it is: the LCD badges, the new mark and title, and the Foreman's "Building 1 | Fixing on" status. Open the README on GitHub to see it, switching your system between light and dark. The version line and the "Built with speck" figures are left for the 0.9.0 release ticket (0307) to update.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Both pictures display the project name ‘shop’.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 405,926
- Elapsed since build started: 6 min
- Changed lines: 14 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. The README's status line (0.8.0) and "Built with speck" figures are left for 0307, whose criteria 3 and 5 cover them.
- The demo outside the repo (`speck-assets/readme/demo/`) now serves the panel's LCD script and font, works out the header's Foreman status with speck's own code, and labels the project speck, so it can take the pictures again for later releases.

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
    "reviewed_sha": "10a2e0d48693474d95ee5a7cb3569bdab3c2e6ec",
    "thread_id": "01a152c3-5564-7d80-94dd-6b6bfad05c18",
    "seconds": 34,
    "usage": {
      "input_tokens": 147970,
      "cached_input_tokens": 98560,
      "cache_write_input_tokens": 0,
      "output_tokens": 1236,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T06:05:29.468Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md covers Settings under ‘The panel’, Foreman status and recovery under ‘The clever bits’, builders under ‘Requirements’, Claude review under ‘Using another reviewer’, and PR mode and pictures under ‘Your second decision’. These match shipped tickets including 0287, 0293, 0294, 0296, 0312, 0314 and 0315."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md’s builder and reviewer descriptions agree with shipped ticket 0312 and scripts/reviewers.mjs, including Claude reviewer isolation. The release version and historical figures remain reserved for 0307."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both pictures visibly show LCD badges, mark, title and Foreman status with fictional tickets. Independently inspected files are 3000×1880, 305176 and 293939 bytes, containing only IHDR, IDAT and IEND chunks. The reported passing test ‘0306 AC3’ exercises these file facts."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Both docs/images/demo-light.png and demo-dark.png show ‘shop’ as the project name in the conversation header, composer footer and panel header (‘shop · base main’)."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported verification has 437 passes, no failures and three skips. Changes are confined to the README, pictures, ticket and PNG tests; the added test checks file facts without enforcing document wording."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "docs/images/demo-light.png and docs/images/demo-dark.png",
        "issue": "Both pictures display the project name ‘shop’. Criterion 4 explicitly prohibits any client or project name other than speck, even a fictional one.",
        "suggested_fix": "Change the demo’s project labels to speck and retake both pictures, preserving the required dimensions, size and metadata restrictions.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The README describes the current features, and both refreshed pictures show the new panel design. Checks pass, but the pictures must be retaken because they display ‘shop’ as a project name, which the ticket explicitly forbids."
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
    "reviewed_sha": "4b625fc0ad36b613acf21ce2b24c5015041f4fff",
    "thread_id": "01a152c3-5564-7d80-94dd-6b6bfad05c18",
    "seconds": 21,
    "usage": {
      "input_tokens": 254710,
      "cached_input_tokens": 196864,
      "cache_write_input_tokens": 0,
      "output_tokens": 2010,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T06:06:42.781Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md remains unchanged since round 1. Its panel, Foreman, requirements, reviewer and shipping sections cover all requested features and match shipped tickets 0287, 0293, 0294, 0296, 0312, 0314 and 0315."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The previously reviewed README.md is unchanged. Its builder and reviewer descriptions match the implementation and shipped tickets; no new inaccurate claims were introduced."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both retaken pictures visibly show LCD badges, mark, title and Foreman status with fictional tickets. Independent file inspection confirms 3000×1880 dimensions, sizes of 306273 and 295127 bytes, and only IHDR, IDAT and IEND chunks. The reported AC3 test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Visual inspection of both pictures confirms project labels now say speck. Neither shows a person's name, account, email address, other project name, Disconnected banner or speck version."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The fresh reported run has 437 passes, zero failures and three skips. Since round 1, only the pictures and ticket record changed; tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "docs/images/demo-light.png and docs/images/demo-dark.png",
        "issue": "The pictures previously displayed ‘shop’ as the project name. Both now display speck in all visible project labels.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The README describes the current features, and both refreshed pictures show the new panel design. The prohibited project labels have been corrected, image checks pass, and no blocking concerns remain."
  }
}
```

</details>

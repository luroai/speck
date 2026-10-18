---
id: "0304"
title: "Set the panel's title in the LCD design's lettering"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0303"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:08:37.278Z"
approved: "2026-10-18T22:16:12.846Z"

---
# 0304 · Set the panel's title in the LCD design's lettering

**Status:** 👍 approved

## Problem
The LCD design (`docs/design/lcd/`) sets speck's name in Doto, a dot-matrix typeface, on the concept and landing pages. The panel's header still sets "speck" in the serif it uses for headings, so the panel and the landing page don't look like one product.

## Outcome
The panel's header shows "speck" in the design's dot-matrix lettering.

## Acceptance criteria
1. The header's "speck" is set in Doto at weight 900, as the design's pages set their names. Its size and position keep the header's height as it is today.
2. The panel serves the Doto font itself, from a file in the repo, so the title looks the same with no internet connection. When the font can't load, the title falls back to a monospace font.
3. The "control panel" label beside it, the page's own title and every other heading keep their fonts. (checked by review)
4. It looks right in the light and dark looks, and at the panel's narrowest width.

## Out of scope
- The mark beside the title: 0303.

## Notes
- The design's pages load Doto from Google Fonts (`family=Doto:wght@500;700;900`) and set names with `font: 900 … "Doto", "Silkscreen", ui-monospace, monospace`.
- Checked 2026-10-18: Doto's licence is the SIL Open Font License 1.1 (google/fonts ofl/doto/OFL.txt), with no Reserved Font Name, so bundling the font file with its licence is allowed.
- Failing before this build: none
- Self-check: the wider Doto name cut the project's name short on a 375 px phone (0140's test), so on phones it is set at 14 px and raised .1em to stay centred on the mark; an earlier try with negative letter-spacing made the letters touch, so it was dropped.
- The header is `.logo` in `templates/panel.html`; fonts are served by `scripts/panel.mjs` like the icons in `templates/icons/`.

## In plain words
The panel's header now spells "speck" in the same dot-matrix lettering as the design's landing page, so the two look like one product. The lettering comes with speck itself, so it looks the same with no internet connection. To see it, open the panel: the name beside the mark is made of dots, in both the light and dark looks. On a phone the name is a little smaller, so the project's name beside it still fits. Keep an eye on very narrow phones with long project names, where the project's name may still be cut short, as it could be before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 174,349
- Elapsed since build started: 8 min
- Changed lines: 109 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups and known limits, no inbox notes):
- The bundled font is Google Fonts' full variable TTF, about 450 KB. Subsetting it to the letters of "speck" at weight 900 (as WOFF2) would make it a few KB.
- The README's Licence section names only speck's MIT licence. It could mention that the bundled Doto font is under the SIL Open Font License (templates/fonts/OFL.txt).

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
    "reviewed_sha": "e026a3aa271cf2e52cd200a7ce818310b92bdce5",
    "thread_id": "01a15115-6661-7f33-8b6b-e45e74fe9b0c",
    "seconds": 45,
    "usage": {
      "input_tokens": 173656,
      "cached_input_tokens": 131584,
      "cache_write_input_tokens": 0,
      "output_tokens": 693,
      "reasoning_output_tokens": 23
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:16:04.342Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html sets .logo .name in Doto at weight 900, with a smaller phone size. Passing panel-0304 browser tests verify unchanged header height and alignment at 1280 and 320 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel.mjs serves /fonts/Doto.ttf from templates/fonts/. Passing panel-0304 tests check the response byte for byte, browser font loading and the monospace fallback. OFL.txt accompanies the font."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Reviewed templates/panel.html: the new font applies only to .logo .name. The control-panel label, document title and other heading font rules retain their existing settings."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0304 browser tests cover light and dark themes at 1280 and 320 px, checking alignment and overflow. Reviewed supplied desktop dark and phone light pictures; the lettering is legible and fits."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now uses the design’s dot-matrix lettering for speck, with a bundled font that works offline. Other headings keep their fonts, and the title fits the existing header on desktop and phones. The reported tests passed; no blocking concerns found."
  }
}
```

</details>

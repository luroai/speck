---
id: "0147"
title: Style the panel like the landing page                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T19:36:41.412Z"

---
# 0147 · Style the panel like the landing page

**Status:** 🔍 reviewing

## Problem
The landing page now has a picture of the control panel, styled to match the rest of the page: warm white paper, near-black ink and a vermilion accent. The real panel still uses the greener zen colours from 0134 and 0136, so it looks different from how the landing page shows it.

## Outcome
The real panel uses the landing page's colours and font names, in both light and dark. Nothing else changes: layout, wording and behaviour stay exactly as they are.

## Acceptance criteria
1. In light mode (the first `:root` block in `templates/panel.html`, plus the block that sets the `-bg` tints), these are set to exactly: `--bg: #faf9f5; --panel: #ffffff; --raise: #f0eee6; --line: #cccbc8; --line-soft: #e8e7e3; --text: #141413; --muted: #3d3d3a; --faint: #73726c; --accent: #b0412e; --bad: #c42a3c; --ok: #56713f; --warn: #9c6a10; --run: #3b6286; --idea: #7a4f86; --inbox: #2f7469; --bug: #a3466f; --fix: #7a6a14; --accent-bg: #f7ebe6; --idea-bg: #f2ecf3; --inbox-bg: #e9f2f0; --bad-bg: #fae6e8`.
2. In dark mode (the `:root[data-theme="dark"]` block), these are set to exactly: `--bg: #181818; --panel: #1f1f1f; --raise: #222222; --line: #3d3d3d; --line-soft: #262626; --text: #e4e4e4; --muted: #b4b4b4; --faint: #8a8a8a; --accent: #d4664e; --bad: #ec5a6b; --ok: #9db584; --warn: #d6a24a; --run: #7ea6cf; --idea: #b597c6; --inbox: #6fb5aa; --bug: #d685ab; --fix: #c9b65c; --accent-bg: #2e2320; --idea-bg: #2a2430; --inbox-bg: #1d2a28; --bad-bg: #341d21`.
3. The panel's colour tests (`PALETTE` in `test/support/panel.mjs`, `test/mockup-0126.test.mjs`, `test/panel-0134.test.mjs` and `test/panel-0136.test.mjs`) check the values in AC1 and AC2 and still fail if any of them changes. The dark backdrop behind the full-ticket pane is unchanged, and the light one is `rgba(20, 20, 19, .2)`.
4. Every font list in the panel's stylesheet names the same fonts as the landing page, in this order: `"Shippori Mincho", "Noto Serif JP", Georgia, serif` for the serif, `"Zen Kaku Gothic New", "Noto Sans JP", system-ui, sans-serif` for the sans, and `"IBM Plex Mono", ui-monospace, monospace` for the mono. No font is loaded from another host.
5. Nothing else changes. This ticket's diff against the base branch changes only colour values and font lists in `templates/panel.html`'s stylesheet, and the colour and font tests named in AC3. It changes nothing between `<script>` and `</script>` and no file in `scripts/`. No test that passed before this change fails, except those colour and font checks, which are updated to the new values.

## Out of scope
- Layout, sizes, spacing, borders, wording and the light/dark switch. They stay as they are.
- The landing page itself, which lives in the speck-site project.

## Notes
- Source: the panel illustration on the landing page (`site/index.html` in speck-site, section "The control panel", `.win` styles) and that page's `:root` and dark-mode colours. It isn't in this repo, so the values are copied here.
- Mapping from the landing page: `--bg` = paper, `--panel` = card, `--raise` = paper-2, `--text`/`--muted`/`--faint` = ink/ink-2/ink-3, `--accent` = the vermilion seal colour. `--line` and `--line-soft` are the landing page's two hairline colours worked out as solid colours over the paper.
- `--bad` (errors, blocked, needs you) is a crimson, deliberately not the vermilion, so an error never looks like the accent. The other colours are muted, earthy versions of their old hues: ok sage, warn ochre, run slate blue, idea plum (also the approved-and-waiting-to-ship colour from 0138), inbox teal, bug rose, fix mustard.
- Each colour in AC1 and AC2 has a contrast ratio of at least 4.4:1 against its mode's `--bg`, checked 2026-10-13.
- The palette was shown to the user as a mockup of the live panel (local, in `mockups/landing-palette/`, not in git).
- To undo it, revert the ship commit.
- Checked 2026-10-13: the colours and fonts, read from `site/index.html` in the local speck-site project.
- Failing before this build: none
- Build: the light pane shadow (`#full-ticket`'s `box-shadow`) was tinted with the old ink, like the backdrop, so it now uses the new ink too: `rgba(20, 20, 19, .12)`. It's a colour value, which AC5 allows.
- Build: two browser tests outside AC3's list hard-coded an old colour as `rgb(…)` (`test/panel-0041.test.mjs`, the accent on the chain; `test/panel-0055.test.mjs`, the in-flight blue). They're colour checks, so AC5's "updated to the new values" applies: only those two literals changed.
- Self-check: no changes

## In plain words
The control panel now looks like the picture of it on the landing page: warm white paper, near-black text and a vermilion red accent in light mode, and soft greys with the same red in dark mode. The status colours (ready, running, blocked and so on) are muted, earthy versions of the old ones, and errors use a crimson so they never look like the accent. Nothing moves, and no wording or behaviour changes. To see it, open the panel and switch between light and dark with the button at the top right. Worth a glance: the accent is now red rather than green, so check that nothing reads as an error at a quick look.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (tidy-up, no ticket): two older browser tests (0041 and 0055) still hard-code single colours as `rgb(…)`, so any future palette change has to update them by hand. They could read the colour from the panel's stylesheet instead.

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
    "reviewed_sha": "b5ec39083651aac81750027e3e7e73437793c748",
    "thread_id": "01a136c9-f751-7931-9f36-a408c6180a2a",
    "seconds": 34,
    "usage": {
      "input_tokens": 117110,
      "cached_input_tokens": 69376,
      "cache_write_input_tokens": 0,
      "output_tokens": 839,
      "reasoning_output_tokens": 99
    },
    "saved_at": "2026-10-13T19:43:21.907Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html contains all 21 specified light values. Passing test '0147 AC1' asserts each value and the first-block placement."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html contains all 21 specified dark values. Passing test '0147 AC2' asserts each value."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The named existing tests do not enforce every exact value: panel-0136.test.mjs checks only ten dark values exactly; its OWN and TINTS checks permit other colours. Light tints also lack exact checks in the named files. The new panel-0147.test.mjs supplies this missing coverage instead. Both backdrop values are correct and tested."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "All stylesheet font lists match the required stacks. Passing '0147 AC4' tests check every detected list and prohibit external font loading."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The actual diff changes only colours and font lists in the production stylesheet, with scripts unchanged. However, it adds test/panel-0147.test.mjs outside the expressly allowed test files. The two existing browser-test literal updates are necessary colour-check updates covered by AC5's final sentence. The full log confirms 1284 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0136.test.mjs",
        "issue": "AC3 requires the named colour tests to reject changes to every specified value. They currently accept alternative dark status colours and light/dark tints; exact coverage exists only in the newly added test file, which AC5 excludes.",
        "suggested_fix": "Move the new palette, backdrop and comprehensive font assertions into the permitted existing test files, including exact assertions for all light and dark values, and remove test/panel-0147.test.mjs. Retain the necessary two browser colour-literal updates.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The panel has the requested colours and fonts, with no layout or behaviour changes, and the recorded suite passes. Before approval, move the new checks into the test files the ticket permits and ensure those checks protect every specified colour."
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
    "reviewed_sha": "4453234c1930c1706c3746473d3120dd4c71040c",
    "thread_id": "01a136c9-f751-7931-9f36-a408c6180a2a",
    "seconds": 24,
    "usage": {
      "input_tokens": 223435,
      "cached_input_tokens": 167680,
      "cache_write_input_tokens": 0,
      "output_tokens": 1540,
      "reasoning_output_tokens": 132
    },
    "saved_at": "2026-10-13T19:45:37.197Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains all 21 required light values. Passing '0147 AC1' checks every value and the first-root placement."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html retains all 21 required dark values. Passing '0147 AC2' checks every value."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/panel-0136.test.mjs now asserts all 21 dark values through DARK and all 21 light values through ZEN and ZEN_TINTS. Both backdrop values are asserted exactly. PALETTE and the other named tests retain their updated checks; '0147 AC3' verifies palette mutation detection."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The stylesheet uses the required font stacks throughout. Passing '0147 AC4' tests inspect every font list and prohibit external font loading."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Production changes remain confined to stylesheet colour values and font lists; no scripts, layout or wording changed. The additional ticket-specific test file fulfils speck-build section 2's explicit test-file requirement. The two browser-test changes only update colour literals. The full test log confirms 1284 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0136.test.mjs",
        "issue": "The missing exact palette coverage is fixed. The dispute concerning the separate ticket-specific test file is accepted after verifying speck-build section 2, step 1 explicitly requires it; keeping these acceptance checks does not expand product scope.",
        "suggested_fix": "No further change required.",
        "state": "dispute_accepted"
      }
    ],
    "escalation_question": "",
    "summary": "The panel now uses the requested colours and fonts in both modes, with layout and behaviour unchanged. Tests protect every specified colour and both backdrops, and the recorded suite has no failures. Ready for the owner's merge decision."
  }
}
```

</details>

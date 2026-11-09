---
id: "0577"
title: "Set the panel's new design tokens"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T17:42:55.310Z"
approved: "2026-11-09T18:28:16.190Z"
finished: "2026-11-09T18:34:34.396Z"

---
# 0577 · Set the panel's new design tokens

**Status:** ✅ done

## Problem
The panel's look was built around the LCD screen: grey-green screen colours, the Doto dot-matrix font on titles, and borders round every card. The redesign needs a calm, grown-up base for every view: neutral greys, one blue accent, orange only for what needs you, and speck's red kept for its eye alone.

## Outcome
The panel uses the redesign's colours and fonts in both looks, and every view picks them up.

## Acceptance criteria
1. `templates/panel-base.css` defines the redesign's colour tokens for the light and the dark look, with the values in Notes: background, surface, border, text, muted text, accent, needs-you, needs-you text, speck's eye, and the black bar's background, ink, muted ink and line.
2. Inter (weights 400, 500 and 600) and JetBrains Mono (400 and 500) are kept as woff2 files in `templates/fonts/` with their licence files, loaded with `@font-face` from addresses relative to the page as 0543 requires, and used for the panel's text and for ids, times and figures respectively. Lane titles and the Pipeline log's title no longer use Doto.
3. Muted text, accent text and needs-you text each have a contrast of at least 4.5:1 against the background and the surface, in both looks.
4. The panel fetches no font or style from anywhere but itself, so it looks the same with no network.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Changing any view's layout, which the tickets after this do.
- The LCD screen, which keeps its own colours until 0580 replaces it.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Light: background #FFFFFF, surface #F4F5F7, border #E4E6EA, text #15171A, muted #5F6670, accent #2F55D4, needs-you #D9822B with its text #A84F06, speck's eye #D63F28. Dark: background #111214, surface #1B1D20, border #2A2D31, text #ECEDEF, muted #9AA0A8, accent #86A2FF, needs-you #F0A35A (text too), speck's eye #FF6A4D. The black bar, the same in both looks: #1C1D19, ink #E8E7E1, muted ink #A5A69E, line #34352F, its eye #E24A2F.
- `test/panel-0472.test.mjs` AC3 compared every element's computed style with the look before 0472's split; it can't hold through a redesign, so it's updated to check what it still can, or replaced, and the Delivery log says which.
- Checked 2026-11-09: Inter and JetBrains Mono are both under the SIL Open Font License 1.1, which allows bundling them, read from each font's own LICENSE file in @fontsource/inter and @fontsource/jetbrains-mono 5.3.0. The builder keeps that file beside each font, as Doto's `OFL.txt` is.
- Failing before this build: none
- AC5 has no test of its own: its first half is the Delivery log, which a reviewer reads, and its second half is the whole suite, which `speck ship` runs. A test can't read this repo's `speck/` folder (0122).
- Inter and JetBrains Mono are the Latin subsets from @fontsource 5.3.0 (about 24 KB each). Anything outside them (Greek, Cyrillic, some arrows) falls back to the machine's fonts, which stay behind them in each list.
- Self-check: lane dots moved from the border to the muted colour, because the border is too faint for a dot; two old comments that named Cursor's blue corrected; the browser bar and the manifest moved to the new page colour.
- speck (2026-11-09 18:16 UTC) told you: Nothing is stuck and main isn't broken: 0577 is slow because new colours and fonts broke about 65 older tests that pinned the old look, so the build has been fixing them and re-running large test batches, up to all 3,263 tests, which took about 20 of its first 31 minutes. It's on its last test run before review round 1, and the machine's high load is probably slowing the browser tests too. Why: The build's log shows steady progress with no test hanging, every failure came from the new look, one of them a browser timing check that passed on re-run, and main's last recorded test run passed; I couldn't see which processes are causing the load.

## In plain words
The panel has its new look in both light and dark: white or near-black pages, soft grey surfaces, one blue accent, and orange for anything that needs you. Text is now in Inter, with ticket numbers, timers and figures in JetBrains Mono, and these fonts come with the panel, so it looks the same with no internet.

To see it, open the panel and look through the lanes, a ticket, Settings and the Pipeline log, then switch the look in Settings. Lane titles and the Pipeline log's title are no longer in the dot-matrix lettering. The top screen keeps its old colours for now, as a later ticket replaces it.

Worth watching: the edges of cards and buttons are much fainter than before, and small grey text is a little lighter, which may be harder for people with low vision. An idea for checking this is in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 AC2 requires JetBrains Mono for times and figures, but build timers (progressOf()'s .sub and factsOf()'s .time .sub), shipped summary figures (#shipped-stats .num), and shipped metadata still inherit Inter.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 910,895
- Elapsed since build started: 45 min
- Changed lines: 404 (limit 5000)
Tests updated to the new look (AC5):
- `test/icons-0305.test.mjs`
- `test/mockup-0126.test.mjs`
- `test/panel-0051.test.mjs`
- `test/panel-0055.test.mjs`
- `test/panel-0134.test.mjs`
- `test/panel-0135.test.mjs`
- `test/panel-0136.test.mjs`
- `test/panel-0147.test.mjs`
- `test/panel-0149.test.mjs`
- `test/panel-0151.test.mjs`
- `test/panel-0155.test.mjs`
- `test/panel-0156.test.mjs`
- `test/panel-0157.test.mjs`
- `test/panel-0161.test.mjs`
- `test/panel-0426.test.mjs`
- `test/panel-0427.test.mjs`
- `test/panel-0440.test.mjs`
- `test/panel-0445.test.mjs`
- `test/panel-0448.test.mjs`
- `test/panel-0449.test.mjs`
- `test/panel-0455.test.mjs`
- `test/panel-0461.test.mjs`
- `test/panel-0478.test.mjs`
- `test/panel-0480.test.mjs`
- `test/pipeline-0470.test.mjs`
- `test/pipeline-0479.test.mjs`
- `test/review.test.mjs`
- `test/support/panel.mjs`: the agreed palette (`PALETTE`).
- `test/panel-0420.test.mjs` and `test/panel-0442.test.mjs` loosen two measurements Inter's wider letters and narrower spaces moved: the shipped stats line at 420 px now just fits, with no spare room where the test asked for three more digits (a bigger figure wraps between the stats, as it already did on a phone), and the ` · ` gap is 3 px, down from 4.
- `test/review.test.mjs` is in that list for a different reason: its check for hard-coded model names read every file as text, and a woff2 font's compressed bytes can spell one by chance, so it now skips `.woff2` files only.

`test/panel-0472.test.mjs` is unchanged: its AC3 compares the styles from before and after 0472's split, both read from git history, so the redesign doesn't touch what it checks, and it still passes.

Follow-up saved to the inbox: `speck/ideas/2026-11-09-check-the-redesign-for-low-vision-readers.md`.

Follow-ups for the tickets after this one: state colours other than what needs you and the accent (green for approved, the purple Ship track, the bug, fix and task tags) keep their old hues until the views that use them are redesigned. The build log's terminal colours, including its red-pink failure lines, are unchanged.

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
    "reviewed_sha": "6f223af2e6dcce945f7f4d06159ef26bb5f10d94",
    "session": "fresh",
    "thread_id": "01a1c186-8fb1-7cc1-8a38-f00334ab7ff8",
    "builder_response": "- Tests run: test/panel-0577.test.mjs test/icons-0305.test.mjs test/mockup-0126.test.mjs test/panel-0051.test.mjs test/panel-0055.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0136.test.mjs test/panel-0147.test.mjs test/panel-0149.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0157.test.mjs test/panel-0161.test.mjs test/panel-0420.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0440.test.mjs test/panel-0442.test.mjs test/panel-0445.test.mjs test/panel-0448.test.mjs test/panel-0449.test.mjs test/panel-0455.test.mjs test/panel-0461.test.mjs test/panel-0478.test.mjs test/panel-0480.test.mjs test/pipeline-0470.test.mjs test/pipeline-0479.test.mjs test/review.test.mjs, by `speck test --related`, plus the files it brought in. No whole-suite run.\n- Round 1. The change is templates/panel-base.css (tokens, @font-face), templates/fonts (woff2 and OFL licences), the font lists now `var(--font-ui)` / `var(--font-mono)` across the panel's CSS, a font route in scripts/panel.mjs, and the browser bar and manifest colour.\n- AC5 has no test of its own: a test can't read this repo's speck/ folder (0122), and the suite half runs at ship. The Delivery log lists every test updated, with why.\n- test/review.test.mjs now skips `.woff2` files: its hard-coded-model check reads every file as text, and compressed font bytes can match the pattern by chance.\n- Please check the mapping of the older tokens (--panel, --raise, --run, --blue, --bad, --warn) to the design, and that 0161's 7:1 small-text and 3:1 edge rules are correctly superseded by AC3 and the design's hairline border.\n",
    "seconds": 41,
    "usage": {
      "input_tokens": 412107,
      "cached_input_tokens": 321536,
      "cache_write_input_tokens": 0,
      "output_tokens": 878,
      "reasoning_output_tokens": 26
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 90571,
      "cached": 321536,
      "write": 0,
      "output": 878
    },
    "cost_usd": 0.2220756,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:17:04.340Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-base.css defines the specified light, dark and black-bar tokens. The passing 0577 AC1 tests check their values and legacy-token mappings."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Bundled fonts, licences, relative @font-face addresses and title changes are covered by passing 0577 AC2 tests. However, templates/panel.js progressOf() and factsOf() render timers without a monospace class; templates/panel-cards.css leaves these and #shipped-stats .num inheriting Inter."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0577 AC3 test calculates contrast for all three required text colours against background and surface in both looks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0577 AC4 tests check local stylesheet/font addresses and exercise the server routes for every named font. scripts/panel.mjs serves only explicitly allowed font files."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the updated tests and explains measurement changes. The recorded related-test run reports 3260 passed, zero failed and three skipped. panel-0472 correctly continues checking historical styles."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css",
        "issue": "AC2 requires JetBrains Mono for times and figures, but build timers (progressOf()'s .sub and factsOf()'s .time .sub), shipped summary figures (#shipped-stats .num), and shipped metadata still inherit Inter. The new font test checks log times and tile figures only, so it misses these visible cases.",
        "suggested_fix": "Apply --font-mono to the relevant time and numeric elements, keeping surrounding prose in Inter, and add coverage for build timers and shipped summary figures rather than checking only logs and stat tiles.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new colours and locally bundled fonts are in place, and the reported tests pass. Some visible timers and figures still use the ordinary text font, so the typography requirement needs one further fix before approval."
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
    "reviewed_sha": "8a85631b0d24155989327814d69616d55664b249",
    "session": "continued",
    "thread_id": "01a1c186-8fb1-7cc1-8a38-f00334ab7ff8",
    "builder_response": "- Tests run: test/panel-0577.test.mjs test/icons-0305.test.mjs test/mockup-0126.test.mjs test/panel-0051.test.mjs test/panel-0055.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0136.test.mjs test/panel-0147.test.mjs test/panel-0149.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0157.test.mjs test/panel-0161.test.mjs test/panel-0420.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0440.test.mjs test/panel-0442.test.mjs test/panel-0445.test.mjs test/panel-0448.test.mjs test/panel-0449.test.mjs test/panel-0455.test.mjs test/panel-0461.test.mjs test/panel-0478.test.mjs test/panel-0480.test.mjs test/pipeline-0470.test.mjs test/pipeline-0479.test.mjs test/review.test.mjs, and the files of every test that failed in the last run.\n- F1: fixed. templates/panel-cards.css puts build timers (`.q .top .progress > .sub`, `.q .facts .value.time .sub`, `#shipped .facts .value.time .sub`), `.q .top .ship-at`, `#shipped-stats .num` (weight 500, as the font has) and shipped metadata (`#shipped .meta`) in `var(--font-mono)`. test/panel-0577.test.mjs AC2 checks each of those rules.\n- Mono figures are a little wider, so test/panel-0420.test.mjs now asserts the 420 px stats line doesn't overflow rather than keeping spare room for three more digits; a bigger figure wraps between the stats, as on a phone. The Delivery log says so.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 604988,
      "cached_input_tokens": 506112,
      "cache_write_input_tokens": 0,
      "output_tokens": 1407,
      "reasoning_output_tokens": 26
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8305,
      "cached": 184576,
      "write": 0,
      "output": 529
    },
    "cost_usd": 0.0403576,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:19:00.542Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-base.css retains all specified light, dark and black-bar tokens. Both 0577 AC1 tests pass, checking exact values and legacy-token mappings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0577 AC2 tests cover bundled woff2 files and licences, relative @font-face addresses, font assignments and removal of Doto from lane and Pipeline log titles. templates/panel-cards.css now also assigns JetBrains Mono to build timers, shipping times, shipped figures and metadata, resolving F1."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0577 AC3 test calculates at least 4.5:1 contrast for muted, accent and needs-you text against background and surface in both looks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing 0577 AC4 tests check that font and stylesheet addresses are local and exercise the server routes for every named font."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists updated tests and explains font-related measurement changes. The fresh run reports 346 passed, zero failed and three skipped. The updated 0420 browser test still checks that the stats fit without overflowing; whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css",
        "issue": "Timers and shipped summary figures previously inherited Inter instead of JetBrains Mono.",
        "suggested_fix": "Completed: the relevant timer, shipping-time, summary-number and metadata selectors now use --font-mono, with expanded passing AC2 coverage.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The new colours and locally bundled fonts meet the ticket. Timers and shipped figures now use the required font, and the updated tests pass. No blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "401d91613e47490d2c4631cb9488d791959dcf9f",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c186-8fb1-7cc1-8a38-f00334ab7ff8",
    "builder_response": "- Tests run: test/panel-0463.test.mjs test/panel-0464.test.mjs test/panel-0465.test.mjs test/panel-0577.test.mjs test/panel-0427.test.mjs test/panel-0161.test.mjs\n- Ship ran the tests on the ticket merged with main; three failed: 0463, 0464 and 0465 AC1 (\"the track and the table look the same\"). Main's changes didn't cause them, and the merge had no conflicts.\n- Cause: my round-1 fix for F1 grouped `.q .top .progress > .sub` with `.q .facts .value.time .sub` in one rule. Those tests require every `.q .facts` / `.q .track` rule's selector list to also name the same selector for a Plan ticket, a shipped card and the full view.\n- Fix: templates/panel-cards.css splits it into `.q .top .progress > .sub` and `.facts .value.time .sub`, which applies to the facts table in every view. test/panel-0577.test.mjs AC2 checks the new selector. No test was weakened; 0463, 0464 and 0465 are unchanged.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 908925,
      "cached_input_tokens": 755328,
      "cache_write_input_tokens": 0,
      "output_tokens": 1970,
      "reasoning_output_tokens": 26
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54721,
      "cached": 249216,
      "write": 0,
      "output": 563
    },
    "cost_usd": 0.1399936,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:28:12.364Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-base.css retains the specified light, dark and black-bar tokens. Both 0577 AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0577 AC2 tests cover bundled fonts, licences, relative loading, font assignments and title changes. The shared .facts .value.time .sub rule now applies JetBrains Mono consistently across ticket views, preserving F1's fix."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0577 AC3 test checks all required text/background combinations reach 4.5:1 in both looks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0577 AC4 tests verify local font/style addresses and successful serving of every named font."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the updated appearance tests. The three failures found at ship now pass without changes to their tests: 0463, 0464 and 0465 AC1. The fresh run reports 159 passed, zero failed and three skipped; remaining whole-suite verification runs at ship."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css",
        "issue": "Timers and shipped figures previously inherited Inter instead of JetBrains Mono.",
        "suggested_fix": "Completed. Timers and figures use --font-mono; the shared facts-table selector also keeps their appearance consistent across Plan, Build, Shipped and the full view.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The new colours and bundled fonts still meet the ticket after the merge. The timer styling now applies consistently across ticket views, and all three tests that failed during shipping pass unchanged. No blocking concerns remain."
  }
}
```

</details>

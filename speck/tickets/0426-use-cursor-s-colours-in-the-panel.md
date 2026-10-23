---
id: "0426"
title: "Use Cursor's colours in the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0425"] # ticket ids that must be done first
created: 2026-10-23

---
# 0426 · Use Cursor's colours in the panel

**Status:** 📋 ready

## Problem
The panel's colours are its own warm "zen" palette. It's used mostly in a pane beside Cursor, where it looks like a different product.

## Outcome
The panel uses Cursor's own light and dark theme colours, so it looks like part of Cursor.

## Acceptance criteria
1. In the dark look, the page behind the lanes is `#141414`, and cards, the open tab, pop-ups and Settings are `#181818`, with text in `#E4E4E4EB` and inputs on `#1C1C1C`, as in Cursor Dark. In the light look, the page is `#F3F3F3`, cards, the open tab, pop-ups and Settings are `#FCFCFC`, text is `#141414EB` and inputs are on `#FCFCFC`, as in Cursor Light.
2. Muted text is Cursor's (`#E4E4E48D` dark, `#141414AD` light) wherever it meets 0161's contrast. Text smaller than 14 px, and the edges of controls and cards, use the nearest shade of the same grey that reaches 0161's 7:1 and 3:1.
3. State colours come from Cursor's theme, each at the nearest shade that meets 0161's contrast where Cursor's own doesn't:
   - needs you, a stopped build and the high-risk tag: Cursor's red (`#E34671` dark, `#CF2D56` light)
   - waiting for you: Cursor's magenta (`#B48EAD` dark, `#B8448B` light)
   - passing checks, and a ticket's edge while it ships: Cursor's green (`#70B489` dark, `#1F8A65` light)
   - links, the focus ring, and a ticket's edge while its tests and code are written: Cursor's blue (`#81A1C1` dark, `#3C7CAB` light)
   - a ticket's edge during its self-check: Cursor's cyan (`#88C0D0` dark, `#4C7F8C` light)
   - a ticket's edge during review: Cursor's yellow (`#D2943E` dark, `#A16900` light)
4. speck's screen, its frame and the `speck` dot-matrix title keep their own colours.
5. The light, dark and System looks all use these colours, and 0161's contrast test passes with them. No test that passed before this change fails, except checks of the old colour values, which are changed to match.

## Out of scope
- Fonts (0427) and corners (0428).
- Reading the colours of whatever theme Cursor is set to: these are Cursor Dark and Cursor Light.

## Notes
- The user asked for this on 2026-10-23: the panel is used mostly beside Cursor, at work and at home, and should look like part of it.
- Checked 2026-10-23: Cursor Dark is editor `#181818`, sidebar and panel `#141414`, foreground `#E4E4E4EB`, sidebar text `#E4E4E48D`, borders `#E4E4E413`, input `#1c1c1c`, error `#E34671`, magenta `#B48EAD`, green `#70B489`, link `#81A1C1`, cyan `#88C0D0`, yellow `#D2943E`. Cursor Light is editor `#FCFCFC`, sidebar `#F3F3F3`, foreground `#141414EB`, muted `#141414AD`, error `#CF2D56`, magenta `#B8448B`, green `#1F8A65`, link `#3C7CAB`, cyan `#4C7F8C`, yellow `#A16900` (https://github.com/BioHazard786/cursor-theme-vscode (themes/cursor-dark.json and cursor-light.json, a copy of Cursor's built-in themes; Cursor Noir's listing gives the same #181818 and #141414)).
- Cursor's own borders and muted text fall short of 0161: dark borders are 1.2:1 and dark muted text 5.1:1 against their backgrounds. Criterion 2 keeps 0161.
- The stage edges are `.q.at-build`, `.at-check`, `.at-review` and `.at-ship` (0171). The user asked on 2026-10-23 for them to take Cursor's colours too, after seeing the old gold review edge beside Cursor.
- Colour tokens are in `:root` and `:root[data-theme="dark"]` in `templates/panel.html`.
- Waits for 0425: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0504"
title: "Give speck comic moments while it watches"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0503"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:18:46.825Z"
approved: "2026-10-25T22:34:52.073Z"

---
# 0504 · Give speck comic moments while it watches

**Status:** 👍 approved

## Problem
After 0503, speck's beats are habits. The user wants humour in what speck does while it watches, so the screen is worth glancing at.

## Outcome
speck has four comic moments to mix in while it watches.

## Acceptance criteria
1. While watching, speck also plays these beats, as the prototype does them (checked by review): a bubble that grows out of the gap at the top of its head and pops in its face; a spider that lowers itself on a thread between speck and the TVs, while speck leans back wide-eyed and gives it a flat look as it climbs away; balancing the clipboard flat on its head until it slides off onto the floor, then back in its hand; and a little dance, until it notices you, freezes staring out of the screen, and goes back to watching.
2. Each is picked at random with the other beats, by weight, never the same twice running, and blends in and out of the resting pose as they do. No arm reaches beyond its usual length: while the clipboard is on its head or the floor, that arm is folded away.
3. A step finishing makes speck hop and look, except during these four beats. With reduced motion nothing changes from 0502. No test that passed before this change fails.

## Out of scope
- 0505's TV tricks.

## Notes
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code. Its beats here are `bubble`, `spider`, `balance` and `dance`.
- Waits for 0503, in the same code.
- Failing before this build: none
- Self-check: the clipboard lands on the floor to speck's right rather than its left, where three builds' TVs stand and it would sit on the nearest one; the balance's wobble stops once the clipboard slides off rather than starting again as it comes back; the spider fades in and out with the beat like the other props. 0502's hop test samples ten minutes rather than two, as with more beats it often saw no read during a tick (12 in 40 runs failed, 4 in 40 before this change).

## In plain words
While speck watches the builds, it now has four funny moments mixed in with its other habits: it blows a bubble that pops in its face, it's startled by a spider dropping down on a thread and gives it a flat look as it climbs away, it balances its clipboard on its head until it slides onto the floor, and it does a little dance until it notices you watching and freezes.

To see them, open the panel while speck run is building and watch the screen for a few minutes: each comes up about as often as the other small habits. While one of these is playing, speck doesn't hop when a step finishes. With reduced motion on, nothing changes: speck still shows one still picture beside the TVs.

Worth knowing: the clipboard lands on the floor to speck's right, not its left as in the design, so it never lands on a TV when three builds are running.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 149,469
- Elapsed since build started: 16 min
- Changed lines: 59 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes): the watch pose's tests draw beats with the real Math.random, so the ones that need two random events to coincide (a read during a tick, each beat seen during a tick) pass only because they sample long enough. Seeding Math.random in those tests would make them certain and quicker. 0502's hop test was already failing about one run in ten before this build; it now samples ten minutes and passed 60 runs in a row.

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
    "reviewed_sha": "b27aa47ac81194bf8af8d1206863db7c22da20d9",
    "session": "fresh",
    "thread_id": "01a17533-522f-7ad3-b9f4-4055b69d4a31",
    "builder_response": "- Tests run: test/panel-0504.test.mjs, test/panel-0503.test.mjs, test/panel-0502.test.mjs, plus what `speck test --related` brought in (test/panel-0433, test/panel-0473, test/panel-0474) and the checks.\n- Round 1. The four comic moments (bubble, spider, balance, dance) join the other beats in `watchPose` in templates/panel-header.js, from docs/design/lcd/watching.html, with its weights (1 each), durations and timings. They're marked `own`, as the prototype lists them among the beats that don't hop when a step finishes; the comment on `own` now says it also covers a beat too taken up to notice.\n- Balancing: the clipboard goes from its hand to its head, wobbles, slides off onto the floor and comes back, as the prototype has it; the clipboard's arm is folded away (no arm drawn) from k .12 to .97, while it's off its hand.\n- Tidied from the prototype: the clipboard lands on the floor to speck's right, not its left, because with three builds the prototype's spot (BX - 26) is on top of the nearest TV, which 0502's AC1 test forbids; speck's sheepish look down follows it there. The wobble stops once it slides off (the prototype's wobble started again at k .95). The slide's tumble settles rather than jumping back at the end. The spider fades with the beat (`a: env`) like the other props; its thread hangs from above the scene, which the panel clips, as in the prototype.\n- AC1 is checked by review: pictures in the review pack, from a real panel in Chromium at 390 px, with the page's clock moved to chosen moments of each beat (light), and balancing and the spider in the dark look. The title row says BUILDING 1 from the real board, while the TVs follow the count I set for each picture.\n- Existing tests changed, without loosening what they check: 0503's two exact lists of beats (all beats, and the `own` ones) now leave out 0504's four, which 0504's own tests check; 0502's hop test samples ten minutes rather than two, because with more beats it often saw no read during a tick (12 in 40 runs failed with this change, 4 in 40 already before it).\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 148883,
      "cached_input_tokens": 103168,
      "cache_write_input_tokens": 0,
      "output_tokens": 586,
      "reasoning_output_tokens": 13
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T22:34:40.540Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Checked by review: watchPose in templates/panel-header.js implements bubble, spider, balance and dance using the corresponding sequences, durations and sizes in docs/design/lcd/watching.html. The clipboard floor position avoids the TVs; the spider fades with the beat."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "watchPose.beatAt uses weighted random selection and excludes the previous beat. The four passing AC2 tests in test/panel-0504.test.mjs exercise selection, resting-pose transitions, arm lengths, the folded clipboard arm, floor placement and return to the hand."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All four beats have own:true, suppressing the existing completion hop. The two passing AC3 tests exercise completion reactions and the unchanged reduced-motion still frame. The supplied test log records 144 passes, zero failures and three skips, including the changed 0502 and 0503 tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Speck now mixes four comic moments into its watching routine: a popping bubble, a visiting spider, clipboard balancing and a dance interrupted by noticing you. The implementation follows the prototype, preserves reduced motion and passes the relevant tests. No blocking issues found."
  }
}
```

</details>

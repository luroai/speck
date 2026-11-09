---
id: "0584"
title: "Show a build's live details in its full view"                # one outcome, no "and"
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
after: ["0583"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T19:26:25.966Z"
approved: "2026-11-09T19:49:31.011Z"

---
# 0584 · Show a build's live details in its full view

**Status:** 👍 approved

## Problem
A building ticket's card holds its live log, its progress, its paused or blocked state and its Stop button. The redesign turns Build cards into compact rows (0585), so those details need a home first, or they'd be lost.

## Outcome
Everything a Build card shows about a running or stopped build is also in the ticket's full view.

## Acceptance criteria
1. A building or reviewing ticket's full view shows its live log with the Full log button, where it is and for how long, whether it's paused (with the `speck play <id>` that carries it on) and its Stop button, as its Build card does today.
2. A blocked ticket's full view shows its question with the Go with the recommendation button, and an engineering manager's question with its Answer box and its Answer and Dismiss buttons, as its card does.
3. These update while the full view is open, as the card's do.
4. Each still does what it does from the card: the same requests, confirmations and messages.
5. No test that passed before this change fails.

## Out of scope
- Taking them off the cards (0585).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today on the card: `progressOf`, `lights`, `stopButton`, `logBox` and the blocked parts of `queueItem` in `templates/panel.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the full view's log box is a div rather than a pre, as the real browser showed `#full-ticket pre` taking away its terminal background in the light look; the card's and full view's Answer boxes now match while you type; focus goes back to whichever of Full log or the Build log row opened the pop-up.
- The live section sits under the track and facts rather than in the body: older tests fix the body's contents, and AC5 allows none of them to fail. It has the card's `q` class so it takes the card's styles, as those tests also fix the card's rules as exact selectors.
- `--related` doesn't pick the panel tests when a panel script changes, so this build ran every test file that uses the panel page as well.

## In plain words
A ticket's full view now shows what its Build card shows about a running or stopped build, in a box under its progress bars and facts. While a build runs you can see what it's doing, which step it's at and for how long, whether it's paused and how to carry it on, its log updating as it goes, and the Full log and Stop build buttons. A blocked ticket shows its question with Go with the recommendation, and a question from speck's engineering manager has its Answer box with Answer and Dismiss. All of these work exactly as they do on the card, with the same confirmations and messages.

To see it, open Full ticket on any ticket in the Build lane that's being built or is blocked.

Worth keeping an eye on: a running ticket now has both a Full log button and a Build log row, which open the same thing. The cards keep these details for now, until the Build lane moves to compact rows.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 189,874
- Elapsed since build started: 23 min
- Changed lines: 187 (limit 5000)
Follow-ups:
- A running ticket's full view has both the Full log button (AC1) and the Build log row (0583), which open the same pop-up. Once Build cards become compact rows (0585), one of them could go.
- Skipped, already captured: the real-browser slide timing test in 0517 failed once under load at 52 ms against its 50 ms limit and passed on the next run (speck/ideas/2026-11-08-steady-the-0517-ac3-frame-time-test-under-load.md).

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
    "reviewed_sha": "0885dbee4bde9e1660ea6d6ad56820c332dd348b",
    "session": "fresh",
    "thread_id": "01a1c1da-ee88-7b40-9da1-6a745edab6de",
    "builder_response": "- Tests run: test/panel-0584.test.mjs, plus through --related every test file that uses the panel page (380 files; --related alone doesn't pick them when a panel script changes): test/agents-0288.test.mjs test/baseline-0095.test.mjs test/calls-0589.test.mjs test/blocked-0283.test.mjs test/agents-0398.test.mjs test/build-log-0080.test.mjs test/build-0183.test.mjs test/build-0116.test.mjs test/foreman-cursor-0333.test.mjs test/builder-model-0311.test.mjs test/foreman-fix-0286.test.mjs test/build-log-0548.test.mjs test/builder-switch-0293.test.mjs test/kind-0492.test.mjs test/flaky-0207.test.mjs test/build-log-0291.test.mjs test/foreman-0317.test.mjs test/panel-0038.test.mjs test/followups-0036.test.mjs test/go-with-0284.test.mjs test/ideas-0057.test.mjs test/panel-0059.test.mjs test/panel-0039.test.mjs test/build-model-0279.test.mjs test/criteria-0565.test.mjs test/panel-0127.test.mjs test/checks-0272.test.mjs test/foreman-agent-0287.test.mjs test/history-0085.test.mjs test/panel-0060.test.mjs test/luro-0082.test.mjs test/foreman-answer-0318.test.mjs test/panel-0128.test.mjs test/first-person-0591.test.mjs test/panel-0142.test.mjs test/pack-0363.test.mjs test/panel-0143.test.mjs test/install-0253.test.mjs test/panel-0054.test.mjs test/panel-0155.test.mjs test/pack-0354.test.mjs test/panel-0156.test.mjs test/foreman-once-0566.test.mjs test/foreman-0285.test.mjs test/panel-0055.test.mjs test/panel-0168.test.mjs test/panel-0170.test.mjs test/panel-0050.test.mjs test/foreman-asked-0328.test.mjs test/fix-0100.test.mjs test/panel-0073.test.mjs test/panel-0199.test.mjs test/panel-0077.test.mjs test/panel-0196.test.mjs test/panel-0051.test.mjs test/licence-0090.test.mjs test/mockup-0126.test.mjs test/icons-0305.test.mjs test/panel-0257.test.mjs test/panel-0063.test.mjs test/panel-0139.test.mjs test/foreman-provider-0392.test.mjs test/panel-0246.test.mjs test/output-0351.test.mjs test/panel-0067.test.mjs test/panel-0303.test.mjs test/logo-0320.test.mjs test/panel-0135.test.mjs test/panel-0056.test.mjs test/panel-0138.test.mjs test/panel-0134.test.mjs test/panel-0151.test.mjs test/panel-0058.test.mjs test/panel-0385.test.mjs test/panel-0147.test.mjs test/panel-0304.test.mjs test/panel-0164.test.mjs test/panel-0040.test.mjs test/panel-0146.test.mjs test/panel-0188.test.mjs test/panel-0118.test.mjs test/panel-0422.test.mjs test/foreman-0299.test.mjs test/panel-0159.test.mjs test/panel-0061.test.mjs test/panel-0052.test.mjs test/panel-0041.test.mjs test/panel-0178.test.mjs test/panel-0435.test.mjs test/panel-0150.test.mjs test/panel-0203.test.mjs test/panel-0069.test.mjs test/panel-0160.test.mjs test/panel-0132.test.mjs test/panel-0163.test.mjs test/panel-0062.test.mjs test/panel-0395.test.mjs test/panel-0261.test.mjs test/panel-0450.test.mjs test/panel-0182.test.mjs test/panel-0141.test.mjs test/panel-0136.test.mjs test/panel-0187.test.mjs test/panel-0144.test.mjs test/panel-0079.test.mjs test/panel-0206.test.mjs test/panel-0214.test.mjs test/panel-0423.test.mjs test/panel-0133.test.mjs test/panel-0277.test.mjs test/panel-0468.test.mjs test/icons-0594.test.mjs test/panel-0268.test.mjs test/panel-0148.test.mjs test/panel-0140.test.mjs test/panel-0357.test.mjs test/panel-0154.test.mjs test/panel-0145.test.mjs test/panel-0361.test.mjs test/panel-0153.test.mjs test/panel-0436.test.mjs test/panel-0167.test.mjs test/panel-0158.test.mjs test/panel-0161.test.mjs test/panel-0275.test.mjs test/panel-0371.test.mjs test/panel-0165.test.mjs test/panel-0451.test.mjs test/panel-0484.test.mjs test/panel-0368.test.mjs test/panel-0157.test.mjs test/panel-0414.test.mjs test/panel-0419.test.mjs test/panel-0469.test.mjs test/panel-0190.test.mjs test/panel-0517.test.mjs test/panel-0185.test.mjs test/long-build-0569.test.mjs test/panel-0189.test.mjs test/panel-0427.test.mjs test/panel-0432.test.mjs test/panel-0494.test.mjs test/panel-0418.test.mjs test/panel-0171.test.mjs test/panel-0584.test.mjs test/panel-0413.test.mjs test/pack-0362.test.mjs test/panel-0224.test.mjs test/panel-0442.test.mjs test/panel-0208.test.mjs test/panel-0431.test.mjs test/panel-0519.test.mjs test/panel-0200.test.mjs test/panel-0177.test.mjs test/panel-0446.test.mjs test/panel-0053.test.mjs test/panel-0281.test.mjs test/panel-0234.test.mjs test/panel-0273.test.mjs test/panel-0426.test.mjs test/panel-0445.test.mjs test/pipeline-0470.test.mjs test/panel-background-0509.test.mjs test/panel-0372.test.mjs test/panel-0465.test.mjs test/panel-0258.test.mjs test/panel-0464.test.mjs test/pr-private-0552.test.mjs test/panel-0071.test.mjs test/panel-0302.test.mjs test/pipeline-0479.test.mjs test/panel-0420.test.mjs test/panel-0364.test.mjs test/panel-0461.test.mjs test/panel-0201.test.mjs test/panel-0308.test.mjs test/panel-0379.test.mjs test/panel-0137.test.mjs test/panel-0478.test.mjs test/panel-0416.test.mjs test/pr-ship-0296.test.mjs test/panel-0421.test.mjs test/panel-0259.test.mjs test/panel-0441.test.mjs test/panel-0149.test.mjs test/ready-check-0573.test.mjs test/panel-0433.test.mjs test/panel-0338.test.mjs test/release-0236.test.mjs test/panel-0474.test.mjs test/panel-0162.test.mjs test/panel-0410.test.mjs test/panel-0512.test.mjs test/panel-0448.test.mjs test/panel-0480.test.mjs test/panel-0434.test.mjs test/panel-0186.test.mjs test/release-0240.test.mjs test/panel-0545.test.mjs test/release-0343.test.mjs test/panel-0513.test.mjs test/panel-0428.test.mjs test/release-0346.test.mjs test/panel-0555.test.mjs test/release-0531.test.mjs test/panel-0466.test.mjs test/panel-0443.test.mjs test/panel-0411.test.mjs test/release-0535.test.mjs test/pipeline-0415.test.mjs test/panel-0449.test.mjs test/panel-0462.test.mjs test/panel-0481.test.mjs test/panel-0424.test.mjs test/panel-0503.test.mjs test/review-model-0382.test.mjs test/panel-0467.test.mjs test/panel-0514.test.mjs test/panel-0425.test.mjs test/pictures-0294.test.mjs test/panel-0537.test.mjs test/panel-0455.test.mjs test/panel-0438.test.mjs test/panel-0577.test.mjs test/panel-0476.test.mjs test/release-0106.test.mjs test/panel-0483.test.mjs test/run-cursor-0290.test.mjs test/panel-0213.test.mjs test/panel-0453.test.mjs test/panel-0504.test.mjs test/release-0329.test.mjs test/panel-0473.test.mjs test/panel-0516.test.mjs test/release-0092.test.mjs test/panel-0471.test.mjs test/release-0515.test.mjs test/settings-0409.test.mjs test/panel-0502.test.mjs test/panel-0440.test.mjs test/release-0307.test.mjs test/panel-0538.test.mjs test/panel-summary-0595.test.mjs test/run-lock-0321.test.mjs test/panel-0454.test.mjs test/panel-0583.test.mjs test/pipeline-0458.test.mjs test/panel-0274.test.mjs test/panel-0472.test.mjs test/settings-roles-0400.test.mjs test/pipeline-0459.test.mjs test/release-0507.test.mjs test/settings-0412.test.mjs test/panel-0366.test.mjs test/panel-0495.test.mjs test/providers-0401.test.mjs test/related-0437.test.mjs test/settings-roles-0403.test.mjs test/panel-0417.test.mjs test/panel-0500.test.mjs test/panel-0536.test.mjs test/release-0282.test.mjs test/panel-0520.test.mjs test/panel-0430.test.mjs test/release-0226.test.mjs test/release-0210.test.mjs test/panel-0521.test.mjs test/release-0380.test.mjs test/panel-decided-0568.test.mjs test/panel-0444.test.mjs test/release-0336.test.mjs test/pr-done-0315.test.mjs test/panel-focus-0326.test.mjs test/settings-0396.test.mjs test/plain-words-0130.test.mjs test/readme-0089.test.mjs test/split-0270.test.mjs test/pr-conflict-0323.test.mjs test/panel.test.mjs test/round-tokens-0546.test.mjs test/pull-request-0295.test.mjs test/speck-name-0576.test.mjs test/priority-0075.test.mjs test/panel-0463.test.mjs test/release-0518.test.mjs test/split-0078.test.mjs test/same-model-0330.test.mjs test/settings-info-0405.test.mjs test/release-0243.test.mjs test/panel-0477.test.mjs test/release-0248.test.mjs test/stopped-0173.test.mjs test/related-0447.test.mjs test/ticket-0205.test.mjs test/release-0360.test.mjs test/settings-0387.test.mjs test/panel-0505.test.mjs test/release-0254.test.mjs test/release-0297.test.mjs test/setup-0510.test.mjs test/settings-groups-0406.test.mjs test/release-0367.test.mjs test/release-0375.test.mjs test/run-0110.test.mjs test/release-0539.test.mjs test/watch-decide-0564.test.mjs test/settings-0278.test.mjs test/release-0574.test.mjs test/panel-0543.test.mjs test/task-0350.test.mjs test/speck-mood-0579.test.mjs test/release-0560.test.mjs test/settings-builder-effort-0402.test.mjs test/run-builder-0324.test.mjs test/setup-0345.test.mjs test/watch-0486.test.mjs test/review-running-0223.test.mjs test/private-words-0084.test.mjs test/release-0394.test.mjs test/setup-0331.test.mjs test/seen-builds-0300.test.mjs test/release-0298.test.mjs test/release-0339.test.mjs test/release-0452.test.mjs test/related-0482.test.mjs test/speck-face-0578.test.mjs test/run-0247.test.mjs test/settings-0397.test.mjs test/review-claude-0292.test.mjs test/steady-0559.test.mjs test/repo-speck-0122.test.mjs test/repo-copy-0230.test.mjs test/release-0522.test.mjs test/run-provider-0391.test.mjs test/steady-0557.test.mjs test/run-switch-0301.test.mjs test/resume-0044.test.mjs test/run-settings-0549.test.mjs test/settings-models-0369.test.mjs test/review-0280.test.mjs test/type-0049.test.mjs test/status-0325.test.mjs test/set-0439.test.mjs test/settings-0276.test.mjs test/same-model-0313.test.mjs test/settings-agents-0399.test.mjs test/settings-0370.test.mjs test/run-codex-0289.test.mjs test/settings-cursor-0347.test.mjs test/settings-0381.test.mjs test/settings-foreman-0348.test.mjs test/speck-name-0485.test.mjs test/setup-0107.test.mjs test/setup-0334.test.mjs test/setup-0335.test.mjs test/settings-agents-0408.test.mjs test/settings-agents-0404.test.mjs test/settings-provider-0393.test.mjs test/ship-0204.test.mjs test/settings-0407.test.mjs test/settings-same-model-0511.test.mjs test/total-cost-0526.test.mjs test/steady-0571.test.mjs test/sleep-0344.test.mjs test/slow-tests-0429.test.mjs test/size-guard-0563.test.mjs test/seen-builds-0319.test.mjs test/ship-0355.test.mjs test/ship-0153.test.mjs test/spend-0120.test.mjs test/stopped-wait-0217.test.mjs test/status-0501.test.mjs test/speck-name-0575.test.mjs test/split-0018.test.mjs test/ticket-0475.test.mjs test/watch-decide-0567.test.mjs test/watch-spend-0525.test.mjs test/triage-0037.test.mjs test/waiting-0166.test.mjs test/watch-settings-0487.test.mjs \n- Round 1. No older test was changed. The live section sits under the track and facts (.steps) because older tests fix the body's contents; it carries the card's q class so the card's styles apply. Its log box is a div because #full-ticket pre would otherwise restyle it. The Build log row from 0583 stays beside the Full log button AC1 asks for.\n",
    "seconds": 42,
    "usage": {
      "input_tokens": 189121,
      "cached_input_tokens": 134656,
      "cache_write_input_tokens": 0,
      "output_tokens": 753,
      "reasoning_output_tokens": 96
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54465,
      "cached": 134656,
      "write": 0,
      "output": 753
    },
    "cost_usd": 0.1299256,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T19:49:14.430Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.js liveSection, liveNow and liveParts show progress, elapsed time, pause instructions, log and shared action buttons. Passing AC1 tests cover building, reviewing, paused and stopped builds, Full log and Stop availability."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "liveParts reuses templates/panel.js buildNotes and foremanAskBox. Passing AC2 tests exercise blocked questions, recommendations and the manager's Answer and Dismiss controls."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "renderFull, drawLive, followLive, showLog and liveCounters update the open view. Passing AC3 tests cover board changes, streamed log lines, reconnection, counters, subscription lifetime and answer drafts."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The full view reuses the card's action handlers. Passing AC4 tests verify requests, confirmation prompts, refusal messages, answer text, dismissal and copying the resume command."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported test results show 3,461 passes, zero failures and three skips across the selected regression files. No existing tests were changed; the code changes remain within the ticket's scope."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The full ticket view now shows live build progress, logs, pause details and the same controls and questions as the card. The tests exercise updates and actions, with no reported regressions. The change is ready for the product owner's merge decision."
  }
}
```

</details>

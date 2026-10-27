# A foreman that keeps the work moving

Captured: 2026-10-17 · Status: ticketed (0285, 0286, 0287)

## What
A Foreman that keeps tickets moving after you've set them ready and walked away. It shows one status for the whole pipeline in the panel's header, and clears blockages itself instead of you messaging an agent "fix it". It's what `speck run` grows into: the panel's speck run switch moves into the Foreman's section of Settings, and its place in the header becomes the Foreman's status. "I think this would be the last piece of the puzzle in terms of setting some tickets up and walking away."

## Why
On 2026-10-17 work stopped six times, and each time the reason was only in `run.log` and the fix needed someone to step in: `main` had diverged from GitHub, shipping was on hold for a failing `main` (holding up its own fix ticket), speck run waited to switch to new code, the panel page was too old to show a new setting, a push hit the wrong GitHub account, and 0274 blocked on a broken test 0270 left behind. None was a product decision. The user says no build has ever blocked on a product question: they've always been technical, and the user has always taken the recommendation or asked for it to be cleared.

## Notes
- Two parts. The always-on part is `speck run`, a plain program that costs nothing to keep running and already knows every stuck state. The thinking part is an agent it starts only when needed, with a short brief, as it already resumes builders for hand-backs.
- On a stuck state it does one of three things: fixes it in code when there's a known recipe (merge a clean divergence, re-run a test once, push again as the right account); starts the Foreman agent when it needs judgement (a blocked question, a refusal it doesn't recognise, something stuck longer than a set time); or asks the user, in one line, when it's a product decision.
- A blocked question is technical when no option changes anything the user would notice. Then the Foreman takes the build's recommendation and resumes the build. A question where an option would change what the user sees or gets goes to the user.
- Never: set a ticket ready, approve work, ship beyond what `auto_ship` covers, or decide what gets built. Code it changes goes through the reviewer. Everything it does is recorded and shown.
- Settings and setup: which agent runs it, `foreman_model` and `foreman_effort` (a cheaper model such as Sonnet by default), and two switches: Building (today's speck run on/off) and Fixing (off, tell me only, or fix simple things; tell me only by default for new users).
- Status in the header: one word and a colour, such as Building 3, Shipping 0274, Fixing: main moved on GitHub, Needs you: 1 question, Idle. Tapping it shows what's moving, what's waiting and why, and what it fixed recently. It also says when the panel page is out of date.
- Steps: (1) the status in the header and the switch in Settings, with nothing new behind them; (2) the fixes in code; (3) the Foreman agent, its settings and the Fixing switch.
- `speck run` keeps its name on the command line. Builds on the shipping agent's design (`speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md`, 0094–0105).
- Open: how long "stuck" is before it acts; whether it notifies the user's phone when it needs them.

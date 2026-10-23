---
id: "0408"
title: "Don't offer DeepSeek until you add it"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-dont-offer-deepseek-until-you-add-it.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:51:23.306Z"
blocked_at: ""
waited_seconds: 673
approved: "2026-10-23T13:11:21.285Z"

---
# 0408 · Don't offer DeepSeek until you add it

**Status:** 👍 approved

## Problem
Add an agent still offers DeepSeek with a key field even when this machine has never set a DeepSeek key. Beside the Add an API provider form from 0401, that row looks like speck expects an account you do not have.

## Outcome
Add an agent does not offer DeepSeek, or any other known API provider, until you have added that provider yourself.

## Acceptance criteria
1. With Add an agent open, DeepSeek does not appear as an offer row when this machine has no DeepSeek key and DeepSeek is not one of your agents. Other known providers in speck's list are treated the same way.
2. API providers are added only through the Add an API provider form from 0401. Claude Code, Codex and Cursor are still offered when they are not yours, as today.
3. A provider that is already one of your agents still appears under Your agents, with its key and Remove. Someone who already uses DeepSeek keeps it. No test that passed before this change fails, except a check that Add an agent offers DeepSeek without a key, which is changed to check criterion 1.

## Out of scope
- Removing DeepSeek from speck's built-in provider list for builds and reviews that already use it.
- Changing the Add an API provider form.

## Notes
- Asked for 2026-10-23 after 0401 shipped the form but left the DeepSeek offer in `addRows` (`templates/panel.html`). 0401's criterion 1 only required that DeepSeek not be the only way to add a provider.
- Checked 2026-10-23: `addRows` maps every agent that is not yours, including `kind === 'provider'` from `PROVIDERS` (DeepSeek), and shows a key field when `key_set` is false.
- A provider removed from Your agents with its key still kept may still be offered with Add and no paste, as 0399 left it: that is someone who already configured it.
- Failing before this build: none
- Existing tests changed: besides 0393's check that DeepSeek with no key is offered with its key field (now checking AC1), five other checks relied on the removed offer: 0399 AC2 (offers listed TestCo with its key field), 0399 AC3's page part (pasting TestCo's key in its offer row; now pasted in its own row once yours), 0399 AC4 in a browser (counted two offers; now one), 0393 AC2's two page checks (DeepSeek's key field under Add an agent; now in its row as one of yours) and 0393 AC4's page part (TestCo offered with no key; now not offered). Each keeps its intent where the behaviour still exists.
- Before the user's answer, the form refused the name DeepSeek, as speck already knows it. Now (option a) the form's server side takes a name that is one of speck's own providers as that provider: it saves only the key and adds it to your agents, with speck's own address and models, ignoring what was typed for them. `checkedProvider` still refuses the name, so the saved providers file can't override DeepSeek. 0401 AC2's refusal of the name DeepSeek was taken out of its list for this.
- Self-check: README's Add an agent sentence still said each provider is offered with a key field; changed it. (A README check added then was removed in review round 1 as a wording check.)
- Went with the recommendation: (a) let the form add the built-in DeepSeek (chosen by the user in the panel, 2026-10-23 13:08 UTC).

## In plain words
Settings' Add an agent no longer lists DeepSeek with an empty key box when you've never set up DeepSeek. Claude Code, Codex and Cursor are still offered as before. To add DeepSeek, use the Add an API provider form: type DeepSeek as the name and paste your key, and speck fills in the rest itself. To see it, open Settings on a machine without a DeepSeek key and press Add an agent. If you already use DeepSeek, nothing changes for you. Worth a look: the "Every agent speck knows is one of yours" line can show even though DeepSeek isn't yours (saved as an idea).

## Blocked question
With the DeepSeek row gone, someone new to DeepSeek can't add it from Settings: the Add an API provider form refuses the name DeepSeek because speck already knows it, and changing the form is out of scope here, so today the only way is `speck keys set deepseek` on the command line. Should I (a) widen this ticket so that entering DeepSeek in the form saves its key and adds speck's own DeepSeek (its built-in address and models, ignoring what was typed for them), or (b) keep it as built, with built-in providers added by their key from the command line, as the README now says? I recommend (a): the point of the ticket is that providers are added through the form, and a new user shouldn't need the command line for the one provider speck tests.
Recommended: (a) let the form add the built-in DeepSeek
Changes what you'd notice: yes
Clear winner: yes

## Review log
Round 1 (codex): escalate: F1 A new DeepSeek user cannot add it through Add an API provider: checkedProvider rejects its built-in name.; F2 The README test depends on exact prose: it locates '**Add an agent** offers' and forbids 'each model provider with a field for its key'.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 301,026
- Elapsed since build started: 20 min
- Changed lines: 33 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Idea: speck/ideas/2026-10-23-say-what-add-an-agent-leaves-out.md (the "every agent is yours" line shows while DeepSeek isn't).
- Idea: speck/ideas/2026-10-23-tell-the-form-a-known-provider-needs-only-its-key.md (the form still asks for an address and models it ignores for DeepSeek).
- Tidy-up: keyLine's "Save key and add" label is no longer reached, since an offered provider always has its key.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "706f1731327e2176c11f46b5fb1f255448958c2e",
    "session": "fresh",
    "thread_id": "01a168d5-ba6c-7fb0-93b3-2bb960bac18c",
    "builder_response": "- Tests run: test/settings-agents-0408.test.mjs test/settings-agents-0399.test.mjs test/settings-provider-0393.test.mjs (plus the commands.checks files speck adds). Before that, 0401, 0404, 0389 and 0398's files also passed.\n- AC3 note: the ticket expected one existing check to change. Five more checks relied on the removed offer; each is listed in the ticket's Notes (\"Existing tests changed\") and keeps its intent where the behaviour still exists (key fields are now tested in a provider's own row as one of yours). No other test was changed.\n- The README's Add an agent sentence said each provider is offered with a key field; it now says a provider is offered only once this machine has its key, and that other providers are added with Add an API provider. The form refuses the name DeepSeek (built in, out of scope to change), so the built-in DeepSeek comes back by its key (`speck keys set deepseek`, or removed with its key kept).\n- Pictures: Settings' Your agents with Add an agent open on this machine (no DeepSeek key), light and dark.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 99753,
      "cached_input_tokens": 59392,
      "cache_write_input_tokens": 0,
      "output_tokens": 985,
      "reasoning_output_tokens": 91
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T12:57:19.056Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html addRows filters out providers without key_set. Passing 0408 AC1 tests exercise DeepSeek, another provider and the settingsAnswer response."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing 0408 AC2 page test verifies CLI offers and form fields, but does not add DeepSeek through the form. scripts/custom-providers.mjs checkedProvider rejects built-in provider names, including DeepSeek. README instead directs users to speck keys set, conflicting with the form-only criterion."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "agentRow retains providers' key fields and Remove buttons. Passing 0408 AC3 tests cover existing providers with and without keys, and re-adding a provider whose key was kept. Reported targeted run: 138 passed, zero failed, three skipped. Existing test changes follow the removed offer behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/custom-providers.mjs",
        "issue": "A new DeepSeek user cannot add it through Add an API provider: checkedProvider rejects its built-in name. Criterion 2 requires the form, but the ticket also prohibits changing that form. The builder's added note substitutes a command-line route without resolving this conflict.",
        "suggested_fix": "Obtain the owner's decision on whether built-in providers must be addable through the form or are explicitly exempt, then align the criterion, implementation and behavioural tests.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/settings-agents-0408.test.mjs",
        "issue": "The README test depends on exact prose: it locates '**Add an agent** offers' and forbids 'each model provider with a field for its key'. These are wording checks, expressly prohibited by the review rules, and can fail after harmless editorial changes.",
        "suggested_fix": "Remove the prose-dependent assertions. Retain only checks of factual names or commands that do not depend on sentence wording.",
        "state": "open"
      }
    ],
    "escalation_question": "Must a new DeepSeek user be able to add it through Add an API provider, allowing the necessary form change, or should built-in providers explicitly remain an exception added through speck keys set?",
    "summary": "Unconfigured providers are hidden, and existing providers remain available. The targeted tests pass. However, adding DeepSeek now requires the command line, which conflicts with the form-only requirement and needs your decision. A brittle documentation test also needs fixing."
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
    "reviewed_sha": "33db89c6e7e5140b07fee201d6ce61dc1e0544c0",
    "session": "continued",
    "thread_id": "01a168d5-ba6c-7fb0-93b3-2bb960bac18c",
    "builder_response": "- Tests run: test/settings-agents-0408.test.mjs test/settings-agents-0399.test.mjs test/settings-provider-0393.test.mjs test/providers-0401.test.mjs (plus the commands.checks files speck adds).\n- F1: fixed, with the user's answer (recorded in the ticket's Notes: option (a), let the form add the built-in DeepSeek, which widens the out-of-scope line about the form). scripts/provider-form.mjs panelProviderAddRequest: a name that is one of speck's own providers (providerId matches PROVIDERS) now goes to addOwnProvider, which refuses one already yours, then saves only the key and adds it to your agents through panelKeyAddRequest, using speck's own address and models and ignoring what was typed for them; the answer's `said` says so. checkedProvider still refuses built-in names, so providers.json can't override DeepSeek. New tests: 0408 AC2 DeepSeek added through the form (key saved, yours, not saved as a custom provider, address unchanged, no commit, key never sent back; name and key alone suffice), refusals (bad or empty key, already yours, Claude still refused), and the page posting the form with name DeepSeek. 0401 AC2's list entry expecting the name DeepSeek to be refused was removed, as the user's answer changes that behaviour. README says a known provider needs only its name and key in the form.\n- F2: fixed. Removed the README test that matched prose; no new prose-dependent test was added.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 198651,
      "cached_input_tokens": 105856,
      "cache_write_input_tokens": 0,
      "output_tokens": 1637,
      "reasoning_output_tokens": 91
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T13:10:59.561Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html addRows excludes providers without a saved key. Passing 0408 AC1 tests cover DeepSeek, another known provider and the settingsAnswer response."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/provider-form.mjs now adds built-in DeepSeek through addOwnProvider, using its built-in configuration and saving its key through panelKeyAddRequest. Passing tests exercise server persistence, invalid keys, duplicate refusal and page submission. CLI offers remain covered. The recorded owner decision authorises this form change."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "agentRow retains existing providers with key fields and Remove. Passing AC3 tests cover providers with and without keys and re-adding one whose key was kept. The targeted run reports 151 passed, zero failed and three skipped; changed legacy tests preserve coverage of the remaining behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/provider-form.mjs",
        "issue": "DeepSeek previously could not be added through the provider form.",
        "suggested_fix": "Implemented: the form accepts built-in DeepSeek using its existing address and models, following the owner's recorded decision.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/settings-agents-0408.test.mjs",
        "issue": "The README test depended on exact prose.",
        "suggested_fix": "Implemented: the prose-dependent test was removed and replaced with behavioural coverage of provider addition.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Unconfigured providers are hidden, and DeepSeek can now be added through the provider form. Existing agents and saved keys remain available. Both earlier findings are resolved, and the targeted tests pass."
  }
}
```

</details>

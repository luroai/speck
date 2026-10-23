# Run OpenAI-type providers

Captured: 2026-10-23 · Status: inbox
From ticket: 0401

## What
Let a provider you added with the OpenAI API type build, review and run the Foreman, as Anthropic-type ones do.

## Why
Settings saves and lists OpenAI-type providers, but speck refuses to run them, so anyone whose provider only offers an OpenAI-compatible API can't use it yet.

## Notes
- From 0401's out of scope: "a follow-up once this has shipped".
- Open question: which agent runs them (Codex with a custom provider, or another), and how the key reaches it without being on a command line.

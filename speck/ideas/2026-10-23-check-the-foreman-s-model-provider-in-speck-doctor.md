# Check the Foreman's model provider in speck doctor

Captured: 2026-10-23 · Status: dropped
From ticket: 0393

## What
When the Foreman runs on a model provider, such as `foreman: deepseek`, `speck doctor` should check that Claude Code is installed and this machine has the provider's key, as it already does for a provider builder or reviewer.

## Why
Today doctor checks a DeepSeek builder or reviewer but says nothing about a DeepSeek Foreman, so someone who sets only the Foreman to DeepSeek finds out it can't start only when `speck run` refuses to start it.

## Notes
- From the builder's own note while building 0393: `doctorChecks` in `scripts/install.mjs` covers the builder and reviewer only; 0392's `foremanCantStart` already has the checks to reuse.

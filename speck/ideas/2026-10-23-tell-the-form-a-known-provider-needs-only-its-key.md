# Tell the form a known provider needs only its key

Captured: 2026-10-23 · Status: dropped
From ticket: 0408

## What
Add an API provider asks for a base URL, API type and models even for DeepSeek, which speck already knows. Since 0408 the form takes DeepSeek by its name and key alone, ignoring the rest. Say so in the form, for example by greying out or hiding those fields once the name is one speck knows.

## Why
Someone adding DeepSeek may hunt for its base URL and model names, then find what they typed wasn't used.

## Notes
- Builder's own note from 0408 (the user chose to let the form add the built-in DeepSeek). Only the README says it today.

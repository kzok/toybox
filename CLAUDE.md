# CLAUDE.md

## Commands

- `npm run test -- --run path/to/file.test.ts`
  - Run a single `vitest` file.
- `npm run test -- --changed --run`
  - Run affected `vitest` files by changed files.
- `npm run type-check`
  - Run TypeScript type-check.
- `make check`
  - Pre-commit check (format, type-check, changed tests).
    Run before considering work done.
- `npm run rumdl`
  - Lint and format all the markdown docs.

## Project foundation docs

@README.md

Details live in `README.md` file in each workspace.
Read the one for whatever you're touching and don't assume this file has it.

## Writing docs and comments

- **Focus each sentence on a single idea.**
  - Eliminate or reduce extraneous words.
  - Consider converting long sentences to lists.
- **Don't write what the tools answer.**
  - If grep, jump-to-def or the type checker already says it, prose only caches it,
    and caches go stale.
  - Write the invariant, the constraint and the reason; those have no other home.
- **Don't enumerate what can grow.**
  - "Every consumer must call the shared helper" survives a new consumer.
  - "the four consumers are ..." does not.
- **One home per fact.**
  - State it once and link from the others.
- **When renaming an exported symbol, sweep `*.md` and comments too.**
  - Prose is not covered by the type checker.

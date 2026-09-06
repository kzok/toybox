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

## Writing style

Rules here apply to both docs and code comments.

- **Focus each sentence on a single idea.**
  - Eliminate or reduce extraneous words.
  - Consider converting long sentences to lists.
- **Don't write what the tools answer.**
  - If grep, jump-to-def or the type checker already says it, prose only caches it,
    and caches go stale.
- **One home per fact.**
  - State it once; point at it from the others.
- **Don't enumerate what can grow.**
  - "Every consumer must call the shared helper" survives a new consumer.
  - "the four consumers are ..." does not.
- **Never invent a reason.**
  - Omit it when it is unclear or trivial; a value chosen by eye has none to state.
  - A guessed reason outlives the guess and gets defended as if it were a decision.
- **When renaming an exported symbol, sweep `*.md` and code comments too.**
  - Prose is not covered by the type checker.

### Writing docs

- **Confirm the details with the user before updating a design doc.**
  - The `docs/` folders hold decisions the user made, which nothing in the code answers.
  - An agent cannot check its own edit against anything, so it asks instead.
- **Write the invariant, the constraint and the reason.**

### Writing code comments

- **A comment earns its place by preventing a specific mistake.**
  - Write one where changing the code without it would break something.
  - Most exports need no rationale beyond `@param` / `@returns`.

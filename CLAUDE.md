# CLAUDE.md

## Useful commands

- `npm run test -- --run path/to/file.test.ts`
- `npm run test -- --changed --run`
  - Run affected files by changed files.
- `make check`
  - Run before considering work done.

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
- **A test can be a comment's home.**
  - Delete the comment where a test already pins the behaviour,
    and state the reason in the test's name.
- **Keep the descriptions on a data type's fields, even pure restatement.**
  - How the data is read is what the type cannot give.
  - A pass cutting comments leaves them alone.
    Whether to write one is the user's call.

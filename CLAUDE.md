# CLAUDE.md

## Useful commands

- `npm run test -- --run path/to/file.test.ts`
- `npm run test -- --changed --run`
  - Run the tests that the changed files affect.
- `make check`
  - Run it before you consider the work done.
  - Use it even for a quick lint, format or type check, instead of the underlying tools.
  - It rewrites files on purpose.
    CI rejects unformatted code anyway.

## Project foundation docs

See @README.md for the project overview.

Each workspace has the details in its own `README.md` file.
Read the `README.md` of each workspace that you work on.
Don't assume that this file has those details.

## Writing style

Rules here apply to both docs and code comments.

- **Focus each sentence on a single idea.**
  - Remove or reduce unnecessary words.
  - Consider converting long sentences to lists.
- **Don't write what the tools answer.**
  - If grep, jump-to-def or the type checker already says it, prose only caches it,
    and caches go stale.
- **One home per fact.**
  - State it once.
    Link to it from other places.
- **Don't enumerate what can grow.**
  - "Every consumer must call the shared helper" survives a new consumer.
  - "the four consumers are ..." does not.
- **Never invent a reason.**
  - Omit it when it is unclear or trivial.
    A value chosen by eye has no reason to state.
  - A guessed reason stays after everyone forgets that it was a guess.
    People then defend it as if it were a decision.
- **When you change a behaviour or an exported symbol name, also update `*.md` files and code
  comments.**
  - The type checker does not check prose.
  - A rename at least leaves the old name to grep for; a changed behaviour leaves nothing at all.

### Writing docs

- **Confirm the details with the user before updating a design doc.**
  - The `docs/` folders hold decisions that the user made.
    Nothing in the code records them.
  - An agent cannot check its own edit against anything, so it asks instead.
- **Write the invariant, the constraint and the reason.**
- **Don't weaken a rule the code does not meet yet.**
  - If the code does not meet a design doc rule, the code is behind, not the rule.
  - A rule loosened to match today's code ("Every" → "Most") can never catch a future change.
  - Report the gap to the user instead.
- **Keep `TODO`s and implementation status out of design docs.**
  - They become outdated as soon as you write them.
- **Let rumdl handle Markdown line breaks.**
  Don't flag the mid-phrase wraps that it leaves.

### Writing code comments

- **Write a comment only when it prevents a specific mistake.**
  - Write one where a code change without it would break something.
  - Most exports need no rationale beyond `@param` / `@returns`.
- **A doc never justifies deleting a code comment.**
  - When a fact is in both, keep the comment and shorten the copy in the doc.
  - The doc is not open on screen when someone edits the line.
- **A test can be a comment's home.**
  - Delete the comment when a test already checks the behaviour.
    State the reason in the test's name.
- **Keep the descriptions on a data type's fields, even pure restatement.**
  - The type cannot tell how to read the data.
  - A pass that removes comments must keep these descriptions.
    The user decides whether to write one.

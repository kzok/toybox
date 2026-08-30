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

## Project foundation docs

@README.md

Details live in `README.md` file in each workspace.
Read the one for whatever you're touching and don't assume this file has it.

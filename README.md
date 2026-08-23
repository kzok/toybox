# toybox

My personal frontend playground.

## Workspace structure

This repo adopts monorepo structure.
Sub-packages are located in the following folders.

- `app/`
  - Applications hosted on GitHub Pages, built with Vite.
- `lib/`
  - Shared modules used only by applications or other modules.

## Workspace conventions

- [Volta](https://docs.volta.sh/) is used to pin the Node.js version.
- Packages are named `@~/<name>` (e.g. `@~/ui`) and are `private`.
- Root `tsconfig.json` and `biome.jsonc` generally apply across all workspaces.

See the following docs for more info.

- [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md)
- [`docs/STYLING.md`](docs/STYLING.md)

## How to develop

`Makefile` is used as a task runner on top of npm scripts.
Please run `make` with no args to show help message.

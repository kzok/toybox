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

- Packages are named `@~/<name>` (e.g. `@~/ui`) and are `private`.
- Root `tsconfig.json` and `biome.jsonc` generally apply across all workspaces.
- Vitest test files live in `__tests__/<name>.test.ts{,x}`.
- Playwright E2E test files live in `e2e/**/*.e2e.ts`.
- Component-scoped styles use CSS Modules, colocated as `<name>.module.css` next to the component and imported as `styles`.
- Global styles are defined in `@~/ui`.

## How to develop

`Makefile` is used as a task runner on top of npm scripts.
Please run `make` with no args to show help message.

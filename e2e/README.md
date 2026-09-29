# E2E tests

This folder holds Playwright tests.
They drive the built applications through a real browser.
For when to use e2e tests instead of Vitest or Storybook,
see [`docs/TEST_STRATEGY.md`](../docs/TEST_STRATEGY.md).

## How to run

Run the suite with `make` from the repository root.

- `make e2e`
  - Run everything in Docker.
    CI does the same.
    This is the only way to get meaningful pixel comparisons,
    because the Linux browser in the container renders the baselines.
- `make e2e-update`
  - Run the same as `make e2e`, with `--update-snapshots`.
    Use it after you add or intentionally change a baseline.
    Check the written PNG files before you commit them.
- `make e2e-local`
  - Open the Playwright UI against the browser of the host.
    This command ignores snapshots, because the host renders differently from the container.

All of them build `./dist` first.
The tests run against the production build that `serve` serves, not against the Vite dev server.

To run a subset, pass Playwright arguments to `./e2e/runner.sh run`:

```sh
./e2e/runner.sh run addTextItem          # by file name
./e2e/runner.sh run -g "ctrl\+click"     # by title
```

## Folder structure

```text
e2e/
├── serve.json / Dockerfile / docker-entrypoint.sh / runner.sh
└── <app-workspace-name>/
    ├── helpers/                      shared helpers, never a test file itself
    ├── fixtures/                     input files handed to the application
    ├── <feature>.e2e.ts              one file per feature
    └── <feature>.e2e.ts-snapshots/   baselines, written by `make e2e-update`
```

Playwright collects only `**/*.e2e.ts` as test files.
So any file under `helpers/` can be a plain module.

## Conventions

- **One file per feature**, named after the feature.
  `happyPath.e2e.ts` is an intentional exception.
  It is a single flow across images, the view and the export.
  Its last assertion checks that the view operations left the exported picture identical,
  byte for byte.
  This assertion works only because the state accumulates through the whole test.
- **Use helpers, not page objects.**
  `helpers/` exports plain functions, grouped by purpose:
  - `locators.ts` — every selector is here, so a markup change needs a fix in only one place.
  - `interactions.ts` — what a user does (open menus, drag, type, export).
  - `assertions.ts` — assertions worth a name, mostly geometric.
  - `support.ts` — types and small pure utilities.
- **Prefer roles and text.**
  If they are not enough, use `data-*` attributes that the application exposes on purpose.
  Examples: `data-editor-mode` on the editor overlay,
  `data-item-kind` / `data-selected` on the items, `data-range-preview` on the range being drawn.
  Never select on CSS Modules class names, because the build hashes them.
- **Drive the pointer with `page.mouse`**, not `dragTo`.
  The editor reads `movementX` / `movementY` of each `pointermove`.
  So a drag needs intermediate steps.
  `dragBy` / `dragFromTo` already do this.
- **Type with the keyboard**, not `fill`.
  The `<textarea/>` of Edit mode is uncontrolled.
  `fill` replaces its whole value, so the test learns nothing about the caret position.
- **Park the cursor before a screenshot** (`parkCursor`).
  Otherwise, the `:hover` highlight of the element under the pointer appears in the baseline.
- **Make pixel comparisons soft** (`expect.soft`).
  Then one mismatched baseline does not hide the assertions after it.
  The comparisons only read the page, so it is safe to continue after a mismatch.

## The network is cut off

`openApp` aborts every request that leaves the machine.
So a run never depends on the network.

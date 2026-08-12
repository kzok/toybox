# E2E tests

Playwright tests driving the built applications through a real browser. For when to
reach for e2e over vitest/storybook, see [`docs/TEST_STRATEGY.md`](../docs/TEST_STRATEGY.md).

## How to run

The suite is driven by `make` from the repository root.

- `make e2e`
  - Run everything in Docker. This is what CI does and the only way the pixel comparisons are
    meaningful, since the baselines are rendered by the Linux browser of the container.
- `make e2e-update`
  - Same, with `--update-snapshots`. Use it after adding or intentionally changing a baseline,
    and look at the written PNGs before committing them.
- `make e2e-local`
  - Open the Playwright UI against the browser of the host. Snapshots are ignored, because the
    host renders differently from the container.

All of them build `./dist` first: the tests run against the production build served by `serve`,
not against the Vite dev server.

To run a subset, pass the arguments through:

```sh
./e2e/runner.sh run addTextItem          # by file name
./e2e/runner.sh run -g "ctrl\+click"     # by title
```

## Folder structure

```
e2e/
├── serve.json / Dockerfile / docker-entrypoint.sh / runner.sh
└── <app-workspace-name>/
    ├── helpers/                      shared helpers, never a test file itself
    ├── fixtures/                     input files handed to the application
    ├── <feature>.e2e.ts              one file per feature
    └── <feature>.e2e.ts-snapshots/   baselines, written by `make e2e-update`
```

Only `**/*.e2e.ts` is collected as a test file, so anything under `helpers/` is free to be a
plain module.

## Conventions

- **One file per feature**, named after it. `happyPath.e2e.ts` is the deliberate exception: it is
  a single flow crossing images, the view and the export, and its last assertion is that the view
  operations left the exported picture byte for byte identical — which only holds because the
  state accumulates through the whole test.
- **Helpers over page objects.** `helpers/` exports plain functions, split by what they do:
  - `locators.ts` — every selector lives here, so a markup change has one place to be fixed.
  - `interactions.ts` — what a user does (open menus, drag, type, export).
  - `assertions.ts` — assertions worth a name, mostly geometric.
  - `support.ts` — types and small pure utilities.
- **Prefer roles and text**, and fall back to `data-*` attributes the application exposes on
  purpose: `data-editor-mode` on the editor overlay, `data-item-kind` / `data-selected` on the
  items, `data-range-preview` on the range being drawn. CSS module class names are hashed and must
  never be selected on.
- **Drive the pointer through `page.mouse`**, not `dragTo`: the editor reads `movementX` /
  `movementY` of each `pointermove`, hence a drag needs intermediate steps (`dragBy` / `dragFromTo`
  already do this).
- **Type with the keyboard**, not `fill`: the `<textarea/>` of edit mode is uncontrolled, and
  `fill` would replace its whole value and tell nothing about where the caret was.
- **Park the cursor before a screenshot** (`parkCursor`), otherwise the `:hover` highlight of
  whatever sits under the pointer leaks into the baseline.
- **Pixel comparisons are soft** (`expect.soft`), so that one drifted baseline does not hide the
  assertions after it. They only read the page, hence continuing past a mismatch stays safe.

## The network is cut off

`openApp` aborts every request leaving the machine, so a run never depends on the network.

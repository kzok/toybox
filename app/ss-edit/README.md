# @~/ss-edit

An image editor specialized for editing screenshots.

## Folder structure

- `src/app/`
  - The application root component.
- `src/containers/`
  - React components connected to the application state.
- `src/components/`
  - Pure presentational React components.
- `src/features/editorItem/`
  - This folder contains:
    - The item data model (the `EditorItem` union).
    - The shared style values for drawing each item kind.
    - Text layout.
    - Item measurement.
    - The factory that makes a new item from a dragged range.
  - It has no canvas code.
- `src/features/renderer/`
  - Canvas drawing and image export.
    It draws the pixels from the data and style values in `editorItem`.
- `src/hooks/`
  - React hooks shared across the application.
- `src/store/`
  - Jotai-based application state management.
- `src/utils/`
  - Framework-agnostic helpers.
    They do not depend on any other folder.

## Other docs

- [`docs/UX_DESIGN.md`](docs/UX_DESIGN.md)
- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md)

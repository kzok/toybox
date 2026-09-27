# @~/ss-edit

An image editor specialized for editing screenshots.

## Folder structure

- `src/app/`
  - The application root component.
- `src/containers/`
  - React components wired to application state managements.
- `src/components/`
  - Pure presentational React components.
- `src/features/editorItem/`
  - The item data model (the `EditorItem` union), the shared style values each kind is drawn at,
    text layout, item measurement, and the factory turning a dragged range into a new item.
    No canvas code lives here.
- `src/features/renderer/`
  - Canvas drawing and image export.
    Consumes `editorItem`'s data and style values to paint pixels;
    this is where visuals are actually produced.
- `src/hooks/`
  - React hooks shared across the application.
- `src/store/`
  - Jotai-based application state management.
- `src/utils/`
  - Framework-agnostic helpers depending on no other folder.

## Other docs

- [`docs/UX_DESIGN.md`](docs/UX_DESIGN.md)
- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md)

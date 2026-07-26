# @~/app-ss-edit

An image editor specialized for editing screenshots.

## Folder structure

- `src/container/`
  - React components wired to application state managements.
  - Virtually entry point of the application.
- `src/ui/`
  - Presentational components shared across this app.
- `src/store/`
  - Jotai-based application state management.
- `src/hooks/`
  - Shared React hooks not tied to a specific container.
- `src/utils/`
  - Framework-agnostic helpers depending on no other folder.

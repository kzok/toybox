# @~/app-ss-edit

An image editor specialized for editing screenshots.

## Folder structure

- `src/app/`
  - The application root component. Entry point of the application.
- `src/containers/`
  - React components wired to application state managements.
- `src/ui/`
  - Presentational components shared across this app.
- `src/store/`
  - Jotai-based application state management.
- `src/hooks/`
  - Shared React hooks not tied to a specific container.
- `src/utils/`
  - Framework-agnostic helpers depending on no other folder.

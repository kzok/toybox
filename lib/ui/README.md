# @~/ui

A shared module providing UI components and styles.

## Folder structure

- `src/style/`
  - Global styles shared among this repo.
  - Including the vendored `Noto Sans JP` web font.
- `src/components/`
  - Shared React components across applications.

## The web font

`Noto Sans JP` is served by the applications themselves rather than by Google Fonts.
The files under `src/style/fonts/` were taken from
[google-webfonts-helper](https://gwfh.mranftl.com/fonts): the `japanese_latin` subset, in the two
weights the applications ask for (400 and 700).
Keep `OFL.txt` next to them — the license travels with the font.

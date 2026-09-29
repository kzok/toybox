# @~/ui

A shared module providing UI components and styles.

## Folder structure

- `style/`
  - Global styles shared across this repo.
  - It includes the vendored `Noto Sans JP` web font.
- `components/`
  - React components shared across applications.

## The web font

The applications serve `Noto Sans JP` themselves, not through Google Fonts.
The files under `style/fonts/` come from
[google-webfonts-helper](https://gwfh.mranftl.com/fonts).
They are the `japanese_latin` subset, in the two weights that the applications use (400 and 700).
Keep `OFL.txt` next to them.
The license must stay with the font files.

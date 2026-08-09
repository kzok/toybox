# @~/ui

A shared module providing UI components and styles.

## Folder structure

- `src/style/`
  - Global styles shared among this repo.
  - Including the vendored `Noto Sans JP` web font.

## The web font

`Noto Sans JP` is served by the applications themselves rather than by Google Fonts. The files
under `src/style/fonts/` were taken from [google-webfonts-helper](https://gwfh.mranftl.com/fonts):
the `japanese_latin` subset, in the two weights the applications ask for (400 and 700). Keep
`OFL.txt` next to them — the license travels with the font.

Change the font, and the family has to be updated in two places: the `--font-family` of
`src/style/variables.css`, and the `ctx.font` of whichever canvas draws text.

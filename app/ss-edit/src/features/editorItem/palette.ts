/** color of a newly added item, whichever kind it is */
export const NEW_ITEM_COLOR = "#EF3171";

/** a color the user can pick */
export type PaletteColor = Readonly<{
  /** name shown to the user */
  label: string;
  /** CSS color value */
  value: string;
}>;

/** colors an item with a `color` can take */
export const ITEM_COLORS: readonly PaletteColor[] = [
  { label: "Pink", value: NEW_ITEM_COLOR },
  { label: "Red", value: "#F3353C" },
  { label: "Orange", value: "#F68000" },
  { label: "Yellow", value: "#EDD200" },
  { label: "Green", value: "#00A62C" },
  { label: "Blue", value: "#0F87FF" },
  { label: "Purple", value: "#AA58F3" },
  { label: "Black", value: "#212121" },
  { label: "White", value: "#FFFFFF" },
];

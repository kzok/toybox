/** color of a newly added item, whichever kind it is */
export const NEW_ITEM_COLOR = "#EF3171";

/** a color the user can pick */
export type PaletteColor = Readonly<{
  /** name shown to the user */
  label: string;
  /** CSS color value */
  value: string;
}>;

/** colors a text item can take */
export const TEXT_COLORS: readonly PaletteColor[] = [
  { label: "Pink", value: NEW_ITEM_COLOR },
  { label: "Red", value: "#E53935" },
  { label: "Orange", value: "#FB8C00" },
  { label: "Yellow", value: "#FDD835" },
  { label: "Green", value: "#43A047" },
  { label: "Blue", value: "#1E88E5" },
  { label: "Black", value: "#212121" },
  { label: "White", value: "#FFFFFF" },
];

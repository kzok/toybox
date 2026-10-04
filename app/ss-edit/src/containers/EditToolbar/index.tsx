import { TypedSingleDropdown } from "@~/ui/components/TypedSingleDropdown";
import {
  ColorSwatch,
  Popover,
  type PopoverProps,
  PopoverSurface,
  PopoverTrigger,
  SpinButton,
  type SpinButtonProps,
  SwatchPicker,
  type SwatchPickerProps,
  Toolbar,
  ToolbarButton,
  tokens,
} from "@fluentui/react-components";
import {
  ColorFillRegular,
  ColorLineRegular,
  GridRegular,
  LineThicknessRegular,
  TextColorRegular,
  TextFontSizeRegular,
} from "@fluentui/react-icons";
import React from "react";
import {
  type EditorItem,
  ITEM_COLORS,
  MAX_FONT_SIZE_PX,
  MIN_FONT_SIZE_PX,
  MOSAIC_BLOCK_SIZES,
  RECT_LINE_WIDTHS,
} from "../../features/editorItem";
import { pageCtx } from "../../store";
import { useTextEditorRef } from "./context";
import styles from "./index.module.css";

export { TextEditorProvider } from "./context";

/** toolbar for edit mode, shown only on a kind of item that has controls */
export const EditToolbar = React.memo(() => {
  const controls = renderControls(pageCtx.useEditingItem());

  if (controls == null) {
    return null;
  }
  return (
    <Toolbar className={styles.container} aria-label="Item style">
      {controls}
    </Toolbar>
  );
});

/** @returns the controls for the item under edit, or null if its kind has none */
const renderControls = (item: EditorItem | null): React.ReactNode => {
  switch (item?.kind) {
    case "text":
      return (
        <>
          <FontSizeInput item={item} />
          <ColorPicker item={item} label="Text color" icon={<TextColorRegular />} />
        </>
      );
    case "rect":
      return (
        <>
          <LineWidthDropdown item={item} />
          <ColorPicker item={item} label="Line color" icon={<ColorLineRegular />} />
        </>
      );
    case "mosaic":
      return <BlockSizeDropdown item={item} />;
    case "arrow":
      return <ColorPicker item={item} label="Arrow color" icon={<ColorFillRegular />} />;
    default:
      return null;
  }
};

const FontSizeInput = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const inputId = React.useId();
  const onChange: SpinButtonProps["onChange"] = (_, data) => {
    // NOTE: `value` is undefined when the user typed the number rather than spun it.
    const fontSize = data.value ?? Number.parseFloat(data.displayValue ?? "");
    if (Number.isFinite(fontSize)) {
      actions.editMode.setTextFontSize(item.id, fontSize);
    }
  };

  return (
    <span className={styles.labelled} title="Font size">
      {/* NOTE: `htmlFor` rather than wrapping the input: biome cannot see an input inside a component. */}
      <label className={styles.icon} htmlFor={inputId}>
        <TextFontSizeRegular />
      </label>
      <SpinButton
        id={inputId}
        className={styles.fontSizeInput}
        aria-label="Font size"
        value={item.fontSize}
        min={MIN_FONT_SIZE_PX}
        max={MAX_FONT_SIZE_PX}
        onChange={onChange}
      />
    </span>
  );
});

const LineWidthDropdown = React.memo<{
  item: EditorItem.Rect;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const dropdownId = React.useId();

  return (
    <span className={styles.labelled} title="Line width">
      <label className={styles.icon} htmlFor={dropdownId}>
        <LineThicknessRegular />
      </label>
      <TypedSingleDropdown
        id={dropdownId}
        className={styles.lineWidthDropdown}
        aria-label="Line width"
        value={item.lineWidth}
        options={RECT_LINE_WIDTHS.map((value) => ({ value, label: `${value}px` }))}
        onChange={({ value }) => actions.editMode.setRectLineWidth(item.id, value)}
      />
    </span>
  );
});

const BlockSizeDropdown = React.memo<{
  item: EditorItem.Mosaic;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const dropdownId = React.useId();

  return (
    <span className={styles.labelled} title="Block size">
      <label className={styles.icon} htmlFor={dropdownId}>
        <GridRegular />
      </label>
      <TypedSingleDropdown
        id={dropdownId}
        className={styles.blockSizeDropdown}
        aria-label="Block size"
        value={item.blockSize}
        options={MOSAIC_BLOCK_SIZES.map((value) => ({ value, label: `${value}px` }))}
        onChange={({ value }) => actions.editMode.setMosaicBlockSize(item.id, value)}
      />
    </span>
  );
});

const ColorPicker = React.memo<{
  item: Extract<EditorItem, { color: string }>;
  /** what the color paints, shown to the user */
  label: string;
  icon: React.ReactElement;
}>(({ item, label, icon }) => {
  const actions = pageCtx.useActions();
  const textEditorRef = useTextEditorRef();
  const [open, setOpen] = React.useState(false);
  const closeToTextEditor = () => {
    textEditorRef.current?.focus();
    setOpen(false);
  };
  const onOpenChange: PopoverProps["onOpenChange"] = (e, data) => {
    if (!data.open && "key" in e && e.key === "Escape") {
      closeToTextEditor();
      return;
    }
    setOpen(data.open);
  };
  const onSelectionChange: SwatchPickerProps["onSelectionChange"] = (_, data) => {
    actions.editMode.setColor(item.id, data.selectedValue);
    closeToTextEditor();
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange} positioning="below-start">
      <PopoverTrigger disableButtonEnhancement>
        <ToolbarButton className={styles.colorButton} aria-label={label} title={label} icon={icon}>
          <span className={styles.colorChip} style={{ backgroundColor: item.color }} />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverSurface>
        <SwatchPicker
          aria-label={label}
          selectedValue={item.color}
          onSelectionChange={onSelectionChange}
        >
          {ITEM_COLORS.map((color) => (
            <ColorSwatch
              key={color.value}
              color={color.value}
              value={color.value}
              aria-label={color.label}
              borderColor={tokens.colorNeutralStroke1}
            />
          ))}
        </SwatchPicker>
      </PopoverSurface>
    </Popover>
  );
});

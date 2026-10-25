import { TypedSingleDropdown } from "@~/ui/components/TypedSingleDropdown";
import {
  ColorSwatch,
  Field,
  Label,
  Slider,
  SpinButton,
  type SpinButtonProps,
  SwatchPicker,
  type SwatchPickerProps,
  Text,
  tokens,
} from "@fluentui/react-components";
import clsx from "clsx";
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

/** styles of the item under edit, shown on the side panel in edit mode */
export const ItemStyle = React.memo<{
  className?: string | undefined;
}>((props) => {
  const item = pageCtx.useEditingItem();

  if (item == null) {
    return null;
  }
  return (
    <section className={clsx(props.className, styles.container)} aria-label="Item style">
      <Text as="h2" className={styles.heading} weight="semibold">
        {KIND_LABELS[item.kind]}
      </Text>
      {renderControls(item)}
    </section>
  );
});

const KIND_LABELS: Readonly<Record<EditorItem["kind"], string>> = {
  image: "Image",
  text: "Text",
  rect: "Rectangle",
  arrow: "Arrow",
  mosaic: "Mosaic",
};

/** @returns the controls for the item under edit */
const renderControls = (item: EditorItem): React.ReactNode => {
  switch (item.kind) {
    case "text":
      return (
        <>
          <FontSizeInput item={item} />
          <ColorPicker item={item} label="Text color" />
        </>
      );
    case "rect":
      return (
        <>
          <LineWidthDropdown item={item} />
          <ColorPicker item={item} label="Line color" />
        </>
      );
    case "mosaic":
      return <BlockSizeDropdown item={item} />;
    case "arrow":
      return <ColorPicker item={item} label="Arrow color" />;
    case "image":
      return <Text className={styles.noStyles}>No styles</Text>;
    default:
      item satisfies never;
      throw new Error(`unknown item: ${JSON.stringify(item)}`);
  }
};

const FontSizeInput = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();

  return (
    <NumberInput
      label="Font size"
      value={item.fontSize}
      min={MIN_FONT_SIZE_PX}
      max={MAX_FONT_SIZE_PX}
      onChange={(fontSize) => actions.editMode.setTextFontSize(item.id, fontSize)}
    />
  );
});

/**
 * a slider and a spin button side by side, both for the same number.
 */
const NumberInput = React.memo<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}>(({ label, value, min, max, onChange }) => {
  const inputId = React.useId();
  const onSpinButtonChange: SpinButtonProps["onChange"] = (_, data) => {
    // NOTE: `value` is undefined when the user typed the number rather than spun it.
    const typed = data.value ?? Number.parseFloat(data.displayValue ?? "");
    if (Number.isFinite(typed)) {
      onChange(typed);
    }
  };

  return (
    <div className={styles.numberInput}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className={styles.numberInputRow}>
        <Slider
          className={styles.slider}
          aria-label={label}
          value={value}
          min={min}
          max={max}
          onChange={(_, data) => onChange(data.value)}
        />
        <SpinButton
          id={inputId}
          className={styles.spinButton}
          value={value}
          min={min}
          max={max}
          onChange={onSpinButtonChange}
        />
      </div>
    </div>
  );
});

const LineWidthDropdown = React.memo<{
  item: EditorItem.Rect;
}>(({ item }) => {
  const actions = pageCtx.useActions();

  return (
    <Field label="Line width">
      <TypedSingleDropdown
        className={styles.dropdown}
        value={item.lineWidth}
        options={RECT_LINE_WIDTHS.map((value) => ({ value, label: `${value}px` }))}
        onChange={({ value }) => actions.editMode.setRectLineWidth(item.id, value)}
      />
    </Field>
  );
});

const BlockSizeDropdown = React.memo<{
  item: EditorItem.Mosaic;
}>(({ item }) => {
  const actions = pageCtx.useActions();

  return (
    <Field label="Block size">
      <TypedSingleDropdown
        className={styles.dropdown}
        value={item.blockSize}
        options={MOSAIC_BLOCK_SIZES.map((value) => ({ value, label: `${value}px` }))}
        onChange={({ value }) => actions.editMode.setMosaicBlockSize(item.id, value)}
      />
    </Field>
  );
});

const ColorPicker = React.memo<{
  item: Extract<EditorItem, { color: string }>;
  /** what the color paints, shown to the user */
  label: string;
}>(({ item, label }) => {
  const actions = pageCtx.useActions();
  const textEditorRef = useTextEditorRef();
  const onSelectionChange: SwatchPickerProps["onSelectionChange"] = (_, data) => {
    actions.editMode.setColor(item.id, data.selectedValue);
    textEditorRef.current?.focus();
  };

  return (
    <Field label={label}>
      <SwatchPicker
        className={styles.swatches}
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
    </Field>
  );
});

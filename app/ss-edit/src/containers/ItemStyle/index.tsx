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
  MAX_MOSAIC_BLOCK_SIZE_PX,
  MAX_RECT_LINE_WIDTH_PX,
  MIN_FONT_SIZE_PX,
  MIN_MOSAIC_BLOCK_SIZE_PX,
  MIN_RECT_LINE_WIDTH_PX,
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
          <LineWidthInput item={item} />
          <ColorPicker item={item} label="Line color" />
        </>
      );
    case "mosaic":
      return <BlockSizeInput item={item} />;
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

const LineWidthInput = React.memo<{
  item: EditorItem.Rect;
}>(({ item }) => {
  const actions = pageCtx.useActions();

  return (
    <NumberInput
      label="Line width"
      value={item.lineWidth}
      min={MIN_RECT_LINE_WIDTH_PX}
      max={MAX_RECT_LINE_WIDTH_PX}
      onChange={(lineWidth) => actions.editMode.setRectLineWidth(item.id, lineWidth)}
    />
  );
});

const BlockSizeInput = React.memo<{
  item: EditorItem.Mosaic;
}>(({ item }) => {
  const actions = pageCtx.useActions();

  return (
    <NumberInput
      label="Block size"
      value={item.blockSize}
      min={MIN_MOSAIC_BLOCK_SIZE_PX}
      max={MAX_MOSAIC_BLOCK_SIZE_PX}
      onChange={(blockSize) => actions.editMode.setMosaicBlockSize(item.id, blockSize)}
    />
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

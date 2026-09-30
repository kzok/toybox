import { Dropdown, Option } from "@fluentui/react-components";

export type OptionType<V extends string | number> = Readonly<{ value: V; label: string }>;

type TypedSingleDropdownProps<V extends string | number> = Omit<
  React.ComponentProps<typeof Dropdown>,
  | "multiselect"
  | "value"
  | "defaultValue"
  | "selectedOptions"
  | "defaultSelectedOptions"
  | "onOptionSelect"
  | "options"
  | "onChange"
  | "children"
> & {
  value: V;
  options: readonly OptionType<V>[];
  onChange: (option: OptionType<V>) => void;
};

/** A typed, single-select version of `Dropdown` from `@fluentui/react-components`. */
export const TypedSingleDropdown = <V extends string | number>({
  value,
  options,
  onChange,
  ...restProps
}: TypedSingleDropdownProps<V>): React.ReactNode => {
  const findByKey = (key: string | undefined) =>
    options.find((option) => String(option.value) === key);

  return (
    <Dropdown
      {...restProps}
      multiselect={false}
      value={findByKey(String(value))?.label ?? ""}
      selectedOptions={[String(value)]}
      onOptionSelect={(_, d) => {
        const option = findByKey(d.optionValue);
        if (option == null) {
          return;
        }
        onChange(option);
      }}
    >
      {options.map((option) => (
        <Option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </Option>
      ))}
    </Dropdown>
  );
};

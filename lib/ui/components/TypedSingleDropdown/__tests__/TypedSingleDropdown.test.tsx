import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vitest } from "vitest";
import { TypedSingleDropdown } from "../index";

const FORMAT_OPTIONS = [
  { value: "png", label: "PNG image" },
  { value: "jpeg", label: "JPEG image" },
] as const;

const NUMBER_OPTIONS = [
  { value: 1, label: "One" },
  { value: 2, label: "Two" },
] as const;

describe(TypedSingleDropdown, () => {
  it("call onChange() with the selected option even if its label differs from its value.", async () => {
    const onChange = vitest.fn();
    render(<TypedSingleDropdown value="png" options={FORMAT_OPTIONS} onChange={onChange} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "JPEG image" }));
    expect(onChange).toHaveBeenCalledWith({ value: "jpeg", label: "JPEG image" });
  });

  it("call onChange() with a number value, not its string form.", async () => {
    const onChange = vitest.fn();
    render(<TypedSingleDropdown value={1} options={NUMBER_OPTIONS} onChange={onChange} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Two" }));
    expect(onChange).toHaveBeenCalledWith({ value: 2, label: "Two" });
  });

  it("shows the label of the current value, not the value itself.", () => {
    render(<TypedSingleDropdown value="png" options={FORMAT_OPTIONS} onChange={() => {}} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("PNG image");
  });

  it("marks only the option of the current value as selected.", async () => {
    render(<TypedSingleDropdown value="jpeg" options={FORMAT_OPTIONS} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "JPEG image" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "PNG image" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

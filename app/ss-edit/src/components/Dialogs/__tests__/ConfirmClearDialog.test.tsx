import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vitest } from "vitest";
import { ConfirmClearDialog } from "../ConfirmClearDialog";

describe(ConfirmClearDialog, () => {
  it("renders the confirmation message.", () => {
    render(<ConfirmClearDialog onSelect={() => {}} />);

    expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to discard them\?/)).toBeInTheDocument();
  });

  it("call onSelect(true) when 'Discard Changes' is clicked.", async () => {
    const onSelect = vitest.fn();
    render(<ConfirmClearDialog onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Discard Changes" }));
    expect(onSelect).toHaveBeenCalledWith(true);
  });

  it("call onSelect(false) when 'Cancel' is clicked.", async () => {
    const onSelect = vitest.fn();
    render(<ConfirmClearDialog onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSelect).toHaveBeenCalledWith(false);
  });
});

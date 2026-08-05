import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vitest } from "vitest";
import { ErrorNoticeDialog } from "../ErrorNoticeDialog";

/**
 * The dialog is rendered into a portal, so it is out of the `container` of `render()`.
 *
 * @returns the element holding the error details, or null if it is not rendered
 */
const queryErrorDetails = (): HTMLElement | null => document.body.querySelector("code");

describe(ErrorNoticeDialog, () => {
  it("renders the notice message.", () => {
    render(<ErrorNoticeDialog error={new Error("boom")} resolve={() => {}} />);

    expect(screen.getByText("Something Went Wrong")).toBeInTheDocument();
    expect(screen.getByText(/The operation could not be completed\./)).toBeInTheDocument();
  });

  it("renders the error itself and its stack trace.", () => {
    const error = new Error("boom");
    error.stack = "Error: boom\n    at doSomething (dummy.ts:1:1)";
    render(<ErrorNoticeDialog error={error} resolve={() => {}} />);

    expect(screen.getByText("Error: boom")).toBeInTheDocument();
    expect(queryErrorDetails()).toHaveTextContent("at doSomething (dummy.ts:1:1)");
  });

  it("dumps a non Error value as JSON.", () => {
    render(<ErrorNoticeDialog error={{ code: 42 }} resolve={() => {}} />);

    expect(screen.getByText(String({ code: 42 }))).toBeInTheDocument();
    expect(queryErrorDetails()).toHaveTextContent('"code": 42');
  });

  it("call resolve() when 'Close' is clicked.", async () => {
    const onClose = vitest.fn();
    render(<ErrorNoticeDialog error={new Error("boom")} resolve={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledWith();
  });
});

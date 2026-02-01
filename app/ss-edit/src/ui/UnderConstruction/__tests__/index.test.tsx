import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnderConstruction } from "../index";

describe(UnderConstruction, () => {
  it("show message.", () => {
    render(<UnderConstruction />);

    expect(screen.getByText("🚧 Under construction 🚧")).toBeInTheDocument();
  });
});

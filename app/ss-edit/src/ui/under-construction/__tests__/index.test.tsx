import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnderConstruction } from "../index";

describe(UnderConstruction, () => {
  it("show message.", () => {
    render(<UnderConstruction />);

    expect(screen.getByText("🚧 Under construction 🚧")).toBeInTheDocument();
  });
});

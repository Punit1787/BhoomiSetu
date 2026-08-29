import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";


describe("HomePage", () => {
  it("explains that the project foundation is ready", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Every land-acquisition case should have a clear next step.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Setup complete")).toBeInTheDocument();
  });
});


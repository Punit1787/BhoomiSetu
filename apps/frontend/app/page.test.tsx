import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";


describe("HomePage", () => {
  it("introduces the BhoomiSetu role portal", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Clarity for every family. Accountability at every step.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enter BhoomiSetu" })).toHaveAttribute("href", "/login");
    expect(screen.getByText("Phase 1 foundation verified")).toBeInTheDocument();
  });
});

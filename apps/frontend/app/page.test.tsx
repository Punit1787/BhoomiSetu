import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";


describe("HomePage", () => {
  it("introduces the BhoomiSetu role portal", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Land acquisition, made legible.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open BhoomiSetu" })).toHaveAttribute("href", "/login");
    expect(screen.getByText("Core platform verified")).toBeInTheDocument();
  });
});

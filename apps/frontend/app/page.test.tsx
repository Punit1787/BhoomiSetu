import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";


describe("HomePage", () => {
  it("introduces the BhoomiSetu role portal", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Clarity for every family. Control for every decision.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enter command centre" })).toHaveAttribute("href", "/login");
    expect(screen.getByText("Core platform verified")).toBeInTheDocument();
  });
});

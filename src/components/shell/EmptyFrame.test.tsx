import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyFrame from "./EmptyFrame";

describe("EmptyFrame", () => {
  it("[SWHR2-C-0277] renders the empty frame with its message and optional action", () => {
    render(<EmptyFrame message="Nothing here yet." action={<a href="/">Go</a>} />);
    const frame = screen.getByTestId("empty-frame");
    expect(frame).toHaveTextContent("Nothing here yet.");
    expect(screen.getByRole("link", { name: "Go" })).toBeInTheDocument();
  });

  it("[SWHR2-C-0277] renders a custom title as a heading", () => {
    render(<EmptyFrame title="No users" message="Add one." />);
    expect(screen.getByRole("heading", { name: "No users" })).toBeInTheDocument();
  });
});

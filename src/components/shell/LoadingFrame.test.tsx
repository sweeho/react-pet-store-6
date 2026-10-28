import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoadingFrame from "./LoadingFrame";

describe("LoadingFrame", () => {
  it("[SWHR2-C-0277] is a status region with the default label", () => {
    render(<LoadingFrame />);
    const frame = screen.getByTestId("loading-frame");
    expect(frame).toHaveAttribute("role", "status");
    expect(frame).toHaveTextContent("Loading…");
  });

  it("[SWHR2-C-0277] shows a custom label", () => {
    render(<LoadingFrame label="Loading users…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading users…");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import ErrorFrame from "./ErrorFrame";

const setup = (onRetry = vi.fn()) => {
  render(
    <MemoryRouter>
      <ErrorFrame onRetry={onRetry} />
    </MemoryRouter>,
  );
  return onRetry;
};

describe("ErrorFrame", () => {
  it("[SWHR2-C-0278] renders the error frame with a Retry button showing Try again", () => {
    setup();
    expect(screen.getByTestId("error-frame")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /retry/i });
    expect(button).toHaveTextContent("Try again");
  });

  it("[SWHR2-C-0279] calls onRetry when the button is clicked", async () => {
    const onRetry = setup();
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("[SWHR2-C-0278] links back to the home page", () => {
    setup();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });
});

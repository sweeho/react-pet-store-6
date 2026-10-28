import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Users from "./index";

afterEach(() => vi.unstubAllGlobals());

const renderUsers = () =>
  render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>,
  );

describe("Users page", () => {
  it("[SWHR2-C-0277] shows the loading frame, then the empty frame for an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ users: [] })),
    );
    renderUsers();
    expect(screen.getByTestId("loading-frame")).toBeInTheDocument();
    expect(await screen.findByTestId("empty-frame")).toBeInTheDocument();
  });

  it("[SWHR2-C-0278] shows the error frame when the API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    renderUsers();
    expect(await screen.findByTestId("error-frame")).toBeInTheDocument();
  });

  it("[SWHR2-C-0279] retry loads the names from the { users } body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("boom", { status: 500 }))
      .mockResolvedValue(Response.json({ users: [{ id: 1, name: "Alice Johnson" }] }));
    vi.stubGlobal("fetch", fetchMock);
    renderUsers();
    const frame = await screen.findByTestId("error-frame");
    await userEvent.click(within(frame).getByRole("button", { name: /retry/i }));
    const link = await screen.findByRole("link", { name: "Alice Johnson" });
    expect(link).toHaveAttribute("href", "/users/1");
  });

  it("[SWHR2-C-0279] accepts a bare array body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json([{ id: 2, name: "Bob Smith" }])),
    );
    renderUsers();
    expect(await screen.findByText("Bob Smith")).toBeInTheDocument();
  });
});

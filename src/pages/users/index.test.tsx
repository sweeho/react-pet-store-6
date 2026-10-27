import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Users from "./index";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function renderUsers() {
  return render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>,
  );
}

describe("Users list data states", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR2-C-0277] renders the shared empty frame when there are no users", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ users: [] })));
    renderUsers();

    expect(await screen.findByTestId("empty-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("error-frame")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Alice/ })).not.toBeInTheDocument();
  });

  it("[SWHR2-C-0278] renders the shared error frame with Retry when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "boom" }, 500)));
    renderUsers();

    expect(await screen.findByTestId("error-frame")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByTestId("empty-frame")).not.toBeInTheDocument();
  });

  it("[SWHR2-C-0279] retry calls the data source again and shows the returned item", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ message: "boom" }, 500))
      .mockResolvedValueOnce(json({ users: [{ id: 1, name: "Alice Johnson" }] }));
    vi.stubGlobal("fetch", fetchMock);
    renderUsers();

    await userEvent.click(await screen.findByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Alice Johnson")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("error-frame")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

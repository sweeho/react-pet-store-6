import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, Outlet, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppShell from "../../../src/components/shell/AppShell";
import Landing from "../../../src/pages/index";
import Users from "../../../src/pages/users/index";

afterEach(() => vi.unstubAllGlobals());

// The primary areas' routes as the landing page must link to them (design.md: catalog, cart,
// sign-in, Administration, Supplier). Search, account and localization have no route of their own.
const PRIMARY_AREA_ROUTES = [
  "/petstore",
  "/petstore/cart",
  "/petstore/signin",
  "/admin",
  "/supplier",
];

describe("landing page", () => {
  // case: SWHR2-C-0271@v1
  it("SWHR2-C-0271: every primary area has exactly one link on the landing page", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    for (const route of PRIMARY_AREA_ROUTES) {
      expect(
        hrefs.filter((h) => h === route),
        route,
      ).toHaveLength(1);
    }
  });
});

describe("app shell", () => {
  // case: SWHR2-C-0275@v1
  it("SWHR2-C-0275: page content renders in main, between the single header and footer, with navigation", () => {
    const router = createMemoryRouter(
      [
        {
          element: (
            <AppShell>
              <Outlet />
            </AppShell>
          ),
          children: [{ path: "/test", element: <p>page marker</p> }],
        },
      ],
      { initialEntries: ["/test"] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const header = screen.getByRole("banner");
    const footer = screen.getByRole("contentinfo");
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
    const marker = within(screen.getByRole("main")).getByText("page marker");
    expect(header.compareDocumentPosition(marker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(marker.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("shared data frames", () => {
  // The users list page is assumed to load its data with fetch and map it onto the shared frames,
  // identified by test ids "empty-frame" and "error-frame"; the error frame has a Retry button.
  const renderUsers = () =>
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );

  // case: SWHR2-C-0277@v1
  it("SWHR2-C-0277: a page with no data renders the shared empty frame", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json([])),
    );
    renderUsers();
    expect(await screen.findByTestId("empty-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("error-frame")).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  // case: SWHR2-C-0278@v1
  it("SWHR2-C-0278: a page whose data fails renders the shared error frame with Retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    renderUsers();
    const frame = await screen.findByTestId("error-frame");
    expect(within(frame).getByRole("button", { name: /retry/i })).toBeVisible();
    expect(screen.queryByTestId("empty-frame")).not.toBeInTheDocument();
  });

  // case: SWHR2-C-0279@v1
  it("SWHR2-C-0279: Retry reloads the data and shows the returned item", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("boom", { status: 500 }))
      .mockResolvedValue(Response.json([{ id: 1, name: "Alice Johnson" }]));
    vi.stubGlobal("fetch", fetchMock);
    renderUsers();
    const frame = await screen.findByTestId("error-frame");
    await userEvent.click(within(frame).getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("Alice Johnson")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByTestId("error-frame")).not.toBeInTheDocument());
  });
});

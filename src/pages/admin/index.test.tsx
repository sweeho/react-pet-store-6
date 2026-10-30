import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminHome from "./index";

afterEach(() => vi.unstubAllGlobals());

const LOGIN_ERROR =
  "You could not be authenticated with the information provided. Please check your Username and Password.";

function setup(opts: { signedIn: boolean; signInStatus?: number }) {
  let signedIn = opts.signedIn;
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/api/admin/sign-in") {
      if (opts.signInStatus === 401) return Response.json({}, { status: 401 });
      signedIn = true;
      return Response.json({});
    }
    if (url === "/api/admin/sign-out") {
      signedIn = false;
      return Response.json({});
    }
    return signedIn
      ? Response.json({ userId: "admin" })
      : Response.json({ data: { kind: "SignOnRequired" } }, { status: 401 });
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <AdminHome />
    </MemoryRouter>,
  );
}

describe("administration area", () => {
  it("[SWHR2-C-0257] shows User ID, Password and a submit control when not signed in", async () => {
    setup({ signedIn: false });
    expect(await screen.findByLabelText(/user id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("[SWHR2-C-0258] rejected credentials show Login Error, the set text and a link back", async () => {
    setup({ signedIn: false, signInStatus: 401 });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/user id/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Login Error")).toBeInTheDocument();
    expect(screen.getByText(LOGIN_ERROR)).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /back to sign-in/i }));
    expect(await screen.findByLabelText(/user id/i)).toBeInTheDocument();
  });

  it("[SWHR2-C-0267] the landing page describes the facilities and offers Launch tool and Log out", async () => {
    setup({ signedIn: true });
    expect(await screen.findByText(/approve or deny pending orders/i)).toBeInTheDocument();
    for (const word of [/sales/i, /revenue/i, /orders by status/i])
      expect(screen.getAllByText(word).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /launch administration tool/i })).toHaveAttribute(
      "href",
      "/admin/tool",
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(await screen.findByLabelText(/user id/i)).toBeInTheDocument();
  });
});

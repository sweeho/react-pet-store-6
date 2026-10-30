import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Account from "./account";

afterEach(() => vi.unstubAllGlobals());

function renderAccount(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      status === 200
        ? Response.json({ userId: "j2ee" })
        : Response.json({ data: { kind: "SignOnRequired" } }, { status }),
    ),
  );
  render(
    <MemoryRouter initialEntries={["/petstore/account"]}>
      <Routes>
        <Route path="/petstore/account" element={<Account />} />
        <Route path="/petstore/signin" element={<p>sign-in screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("account page", () => {
  it("[SWHR2-C-0253] sends a visitor who is not signed in to the sign-in screen", async () => {
    renderAccount(401);
    expect(await screen.findByText("sign-in screen")).toBeInTheDocument();
  });

  it("shows the signed-on customer's user id", async () => {
    renderAccount(200);
    expect(await screen.findByText("j2ee")).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
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

describe("account form options", () => {
  const renderForm = () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ locale: "en_US", signedOn: true, userId: "j2ee", preferences: {} }),
      ),
    );
    render(
      <MemoryRouter>
        <Account />
      </MemoryRouter>,
    );
  };

  it("[SWHR2-C-0149] the card type choice offers exactly Java(TM) Card, Duke Express and Meow Card", async () => {
    renderForm();
    const select = await screen.findByLabelText(/card type/i);
    expect(
      within(select)
        .getAllByRole("option")
        .map((o) => o.textContent?.trim()),
    ).toEqual(["Java(TM) Card", "Duke Express", "Meow Card"]);
  });

  it("[SWHR2-C-0150] the expiry year is a fixed list of choices with no free-text entry", async () => {
    renderForm();
    const year = await screen.findByLabelText(/(expir|year)/i);
    expect(year.tagName).toBe("SELECT");
    const years = within(year)
      .getAllByRole("option")
      .map((o) => o.textContent?.trim());
    expect(years).toContain("2030");
    expect(years).not.toContain("1999");
    expect(screen.queryByRole("textbox", { name: /year/i })).toBeNull();
  });
});

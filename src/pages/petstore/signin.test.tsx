import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Signin from "./signin";

afterEach(() => vi.unstubAllGlobals());

function setup(signInStatus = 200) {
  const sent: string[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url) !== "/api/session/sign-in")
      return Response.json({ locale: "en_US", signedOn: false, rememberedUserName: "ann" });
    sent.push(String(init?.body));
    return Response.json({}, { status: signInStatus });
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/petstore/signin?return=/petstore/account"]}>
      <Routes>
        <Route path="/petstore/signin" element={<Signin />} />
        <Route path="/petstore/account" element={<p>account page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return sent;
}

describe("storefront sign-in", () => {
  it("pre-fills the remembered user name and never a password", async () => {
    setup();
    expect(await screen.findByDisplayValue("ann")).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("");
    expect(screen.getByLabelText(/remember my user name/i)).toBeInTheDocument();
  });

  it("submits user id, password and remember, then returns to the requested page", async () => {
    const sent = setup();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/user id/i), "x");
    await user.type(screen.getByLabelText(/^password$/i), "pw");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText("account page");
    expect(JSON.parse(sent[0])).toEqual({
      userId: "annx",
      password: "pw",
      remember: true,
    });
  });

  it("shows a sign-in failure and stays on the screen", async () => {
    setup(401);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/^password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});

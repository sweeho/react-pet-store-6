import { render, screen, waitFor, within } from "@testing-library/react";
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
    expect(screen.getAllByLabelText(/^password$/i)[0]).toHaveValue("");
    expect(screen.getByLabelText(/remember my user name/i)).toBeInTheDocument();
  });

  it("submits user id, password and remember, then returns to the requested page", async () => {
    const sent = setup();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/user id/i), "x");
    await user.type(screen.getAllByLabelText(/^password$/i)[0], "pw");
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
    await user.type((await screen.findAllByLabelText(/^password$/i))[0], "bad");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});

describe("sign-up form", () => {
  function signUp(status: number) {
    const posted: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (String(url) === "/api/account/register") {
          posted.push(String(init?.body));
          return Response.json(status === 200 ? { userId: "newuser" } : { kind: "UserExists" }, {
            status,
          });
        }
        return Response.json({ locale: "en_US", signedOn: false });
      }),
    );
    render(
      <MemoryRouter initialEntries={["/petstore/signin"]}>
        <Routes>
          <Route path="/petstore/signin" element={<Signin />} />
          <Route path="/petstore/account" element={<p>account form</p>} />
          <Route path="/petstore/user-creation-error" element={<p>user creation error</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const form = screen.getByRole("form", { name: /new customer/i });
    return { posted, form };
  }

  it("[SWHR2-C-0147] the three sign-up fields are required, so an empty repeat is refused in the browser", () => {
    const { form } = signUp(200);
    const fields = within(form).getAllByLabelText(/user name|password/i);
    expect(fields).toHaveLength(3);
    for (const f of fields) expect(f).toBeRequired();
  });

  it("[SWHR2-C-0164] signing up as newuser registers the name and continues to account creation", async () => {
    const { posted, form } = signUp(200);
    const user = userEvent.setup();
    await user.type(within(form).getByLabelText(/user name/i), "newuser");
    await user.type(within(form).getByLabelText(/^password$/i), "secret1");
    await user.type(within(form).getByLabelText(/repeat password/i), "other");
    await user.click(within(form).getByRole("button"));
    await screen.findByText("account form");
    expect(JSON.parse(posted[0])).toEqual({
      userId: "newuser",
      password: "secret1",
      passwordRepeat: "other",
    });
  });

  it("[SWHR2-C-0165] signing up as an existing name shows the User Creation Error screen", async () => {
    const { form } = signUp(409);
    const user = userEvent.setup();
    await user.type(within(form).getByLabelText(/user name/i), "j2ee");
    await user.type(within(form).getByLabelText(/^password$/i), "secret1");
    await user.type(within(form).getByLabelText(/repeat password/i), "secret1");
    await user.click(within(form).getByRole("button"));
    await screen.findByText("user creation error");
  });
});

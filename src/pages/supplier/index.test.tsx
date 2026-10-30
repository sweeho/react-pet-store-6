import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SupplierHome from "./index";

afterEach(() => vi.unstubAllGlobals());

function setup(signInStatus: number) {
  let signedIn = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/supplier/sign-in") {
        if (signInStatus === 200) signedIn = true;
        return signInStatus === 409
          ? Response.json({ data: { kind: "AdminSignedIn" } }, { status: 409 })
          : Response.json({}, { status: signInStatus });
      }
      return signedIn ? Response.json({ userId: "supplier" }) : Response.json({}, { status: 401 });
    }),
  );
  render(
    <MemoryRouter initialEntries={["/supplier"]}>
      <SupplierHome />
    </MemoryRouter>,
  );
}

async function submit() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/user id/i), "supplier");
  await user.type(screen.getByLabelText(/password/i), "supplier-pw");
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("supplier area", () => {
  it("[SWHR2-C-0256] tells a user still signed in to administration to sign out first", async () => {
    setup(409);
    await submit();
    expect(await screen.findByText(/sign out of administration first/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/user id/i)).toBeInTheDocument();
  });

  it("[SWHR2-C-0255] opens the supplier home once signed in", async () => {
    setup(200);
    await submit();
    expect(await screen.findByRole("button", { name: /log out/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/user id/i)).not.toBeInTheDocument();
  });

  it("shows a login error for rejected credentials", async () => {
    setup(401);
    await submit();
    expect(await screen.findByText(/login error/i)).toBeInTheDocument();
  });
});

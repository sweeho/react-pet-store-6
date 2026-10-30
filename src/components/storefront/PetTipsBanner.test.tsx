import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import PetTipsBanner from "./PetTipsBanner";

afterEach(() => vi.unstubAllGlobals());

function show(screen_: string, preferences: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({ locale: "en_US", signedOn: true, userId: "j2ee", preferences }),
    ),
  );
  render(
    <MemoryRouter>
      <PetTipsBanner screen={screen_} />
    </MemoryRouter>,
  );
}

describe("PetTipsBanner", () => {
  it("[SWHR2-C-0160] with the banner on and favourite CATS the home screen shows the cats banner", async () => {
    show("home", { banner: true, myList: true, favouriteCategory: "CATS" });
    expect((await screen.findByTestId("pet-tips-banner")).getAttribute("data-category")).toBe(
      "cats",
    );
  });

  it("[SWHR2-C-0161] an unrecognised favourite category shows the dogs banner on the cart screen", async () => {
    show("cart", { banner: true, myList: true, favouriteCategory: "UNKNOWN" });
    expect((await screen.findByTestId("pet-tips-banner")).getAttribute("data-category")).toBe(
      "dogs",
    );
  });

  it("[SWHR2-C-0162] no banner appears on a screen other than home or cart", async () => {
    show("product", { banner: true, myList: true, favouriteCategory: "CATS" });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByTestId("pet-tips-banner")).toBeNull();
  });

  it("[SWHR2-C-0163] with the banner preference off the home screen shows no banner", async () => {
    show("home", { banner: false, myList: true, favouriteCategory: "CATS" });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByTestId("pet-tips-banner")).toBeNull();
  });
});

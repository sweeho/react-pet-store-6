import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Petstore from "../petstore";
import Cart from "./cart";
import ChangeLanguage from "./change-language";
import Home from "./index";
import Signin from "./signin";

const KANA = /[぀-ヿ]/;
const HAN = /[一-鿿]/;

// In-memory stand-in for the session API: GET /api/session, POST /api/session/locale.
let sessionLocale: string;
beforeEach(() => {
  sessionLocale = "en_US";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        sessionLocale = (JSON.parse(String(init.body)) as { locale: string }).locale;
      }
      expect(String(url)).toMatch(/^\/api\/session/);
      return Response.json({ locale: sessionLocale });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/petstore" element={<Petstore />}>
          <Route index element={<Home />} />
          <Route path="cart" element={<Cart />} />
          <Route path="signin" element={<Signin />} />
          <Route path="change-language" element={<ChangeLanguage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const bodyText = () => document.body.textContent ?? "";

describe("changing locale", () => {
  it("[SWHR2-C-0021] selecting Japanese and submitting Change Locale sets ja_JP and confirms it", async () => {
    const user = userEvent.setup();
    renderAt("/petstore/change-language");
    await user.selectOptions(await screen.findByRole("combobox"), "Japanese");
    await user.click(screen.getByRole("button", { name: "Change Locale" }));
    expect((await screen.findAllByText(/ja_JP/)).length).toBeGreaterThan(0);
    expect(sessionLocale).toBe("ja_JP");
  });

  // The cart-line part of this case needs the localized cart from SWHR2-T-0097.
  it("[SWHR2-C-0022] changing locale to zh_CN through the screen sets the zh_CN session locale", async () => {
    const user = userEvent.setup();
    renderAt("/petstore/change-language");
    await user.selectOptions(await screen.findByRole("combobox"), "Simplified Chinese");
    await user.click(screen.getByRole("button", { name: "Change Locale" }));
    expect((await screen.findAllByText(/zh_CN/)).length).toBeGreaterThan(0);
    expect(sessionLocale).toBe("zh_CN");
  });

  it("[SWHR2-C-0028] activating the Japanese flag in the header switches the storefront to Japanese", async () => {
    const user = userEvent.setup();
    renderAt("/petstore");
    await user.click(await screen.findByRole("button", { name: /日本語|japanese/i }));
    await waitFor(() => expect(bodyText()).toMatch(KANA));
    expect(sessionLocale).toBe("ja_JP");
  });
});

describe("localized storefront screens", () => {
  it("[SWHR2-C-0027] a shopper who has not chosen a locale sees US English", async () => {
    renderAt("/petstore");
    expect(await screen.findByRole("heading", { name: "Catalog" })).toBeInTheDocument();
    expect(bodyText()).not.toMatch(KANA);
    expect(bodyText()).not.toMatch(HAN);
  });

  it.each(["/petstore", "/petstore/cart", "/petstore/signin"])(
    "[SWHR2-C-0026] %s renders localized text in en_US, ja_JP and zh_CN",
    async (path) => {
      sessionLocale = "ja_JP";
      const ja = renderAt(path);
      await waitFor(() => expect(bodyText()).toMatch(KANA));
      ja.unmount();

      sessionLocale = "zh_CN";
      const zh = renderAt(path);
      await waitFor(() => expect(bodyText()).toMatch(HAN));
      expect(bodyText()).not.toMatch(KANA);
      zh.unmount();

      sessionLocale = "en_US";
      renderAt(path);
      await screen.findByRole("heading", { level: 1 });
      expect(bodyText()).not.toMatch(KANA);
      expect(bodyText()).not.toMatch(HAN);
    },
  );
});

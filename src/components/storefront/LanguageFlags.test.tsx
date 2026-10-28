import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LanguageFlags from "./LanguageFlags";
import { LocaleProvider } from "./LocaleProvider";

let sessionLocale: string;
beforeEach(() => {
  sessionLocale = "en_US";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST")
        sessionLocale = (JSON.parse(String(init.body)) as { locale: string }).locale;
      return Response.json({ locale: sessionLocale });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

const renderFlags = () =>
  render(
    <MemoryRouter>
      <LocaleProvider>
        <LanguageFlags />
      </LocaleProvider>
    </MemoryRouter>,
  );

describe("LanguageFlags", () => {
  it("[SWHR2-C-0028] activating the Japanese flag sets the session locale to ja_JP", async () => {
    const user = userEvent.setup();
    renderFlags();
    const ja = await screen.findByRole("button", { name: "Japanese" });
    expect(ja).toHaveAttribute("aria-pressed", "false");
    await user.click(ja);
    await waitFor(() => expect(sessionLocale).toBe("ja_JP"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "日本語" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
  });

  it("[SWHR2-C-0027] with no locale chosen the en_US flag is the pressed one", async () => {
    renderFlags();
    expect(await screen.findByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import ChangeLanguage from "./change-language";

afterEach(() => vi.unstubAllGlobals());

describe("change-language screen", () => {
  it.each(["en_US", "de_DE", "ja_JP", "zh_CN"])(
    "[SWHR2-C-0020] shows four locale options and a Change Locale button when the session locale is %s",
    async (locale) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json({ locale })),
      );
      render(
        <MemoryRouter>
          <ChangeLanguage />
        </MemoryRouter>,
      );
      const select = await screen.findByRole("combobox");
      const options = within(select)
        .getAllByRole("option")
        .map((o) => o.textContent?.trim());
      expect(options).toEqual(["US English", "German", "Japanese", "Simplified Chinese"]);
      expect(screen.getByRole("button", { name: "Change Locale" })).toBeInTheDocument();
    },
  );
});

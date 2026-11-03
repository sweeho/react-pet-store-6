import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider, useLocale } from "./LocaleProvider";

function Probe() {
  const { locale } = useLocale();
  return <p data-testid="locale">{locale}</p>;
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    // A session request that never returns: only the cookie can supply the first render.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "ps_locale=; path=/; max-age=0";
  });

  it("[SWHR2-C-0293] first render uses the ja_JP locale from the ps_locale cookie", () => {
    document.cookie = "ps_locale=ja_JP; path=/";
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("locale").textContent).toBe("ja_JP");
  });

  it("[SWHR2-C-0293] ignores an unsupported ps_locale value", () => {
    document.cookie = "ps_locale=xx_YY; path=/";
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("locale").textContent).toBe("en_US");
  });
});

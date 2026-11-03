import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/components/storefront/LocaleProvider";

import AppShell from "./AppShell";

describe("AppShell", () => {
  it("[SWHR2-C-0275] renders banner, navigation, main and contentinfo in order with children in main", () => {
    render(
      <MemoryRouter>
        <AppShell header={<span>header slot</span>}>
          <p>page marker</p>
        </AppShell>
      </MemoryRouter>,
    );
    const banner = screen.getByRole("banner");
    const nav = screen.getByRole("navigation", { name: "Global" });
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");
    expect(within(banner).getByText("header slot")).toBeInTheDocument();
    expect(within(main).getByText("page marker")).toBeInTheDocument();
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(banner, nav)).toBe(true);
    expect(follows(nav, main)).toBe(true);
    expect(follows(main, footer)).toBe(true);
  });

  it.each(["/about", "/does-not-exist"])(
    "[SWHR2-C-0276] route %s renders inside the shared layout",
    (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <AppShell>
            <Routes>
              <Route path="/about" element={<h1>About</h1>} />
              <Route path="*" element={<h1>Not Found</h1>} />
            </Routes>
          </AppShell>
        </MemoryRouter>,
      );
      for (const role of ["banner", "navigation", "main", "contentinfo"] as const) {
        expect(screen.getByRole(role)).toBeInTheDocument();
      }
      expect(within(screen.getByRole("main")).getByRole("heading")).toBeInTheDocument();
    },
  );
});

describe("AppShell footer locale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "ps_locale=; path=/; max-age=0";
  });

  it("[SWHR2-C-0296] in ja_JP the footer renders Japanese and no English Home", () => {
    document.cookie = "ps_locale=ja_JP; path=/";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ locale: "ja_JP", signedOn: false })),
    );
    render(
      <LocaleProvider>
        <MemoryRouter>
          <AppShell header={<span>h</span>}>
            <p>page</p>
          </AppShell>
        </MemoryRouter>
      </LocaleProvider>,
    );
    const footer = screen.getByRole("contentinfo").textContent ?? "";
    expect(footer).toMatch(/[぀-ヿ]/);
    expect(footer).not.toMatch(/Home|Pet Store/);
  });

  it("[SWHR2-C-0298] with session locale ja_JP the shell shows no English Sign in", () => {
    document.cookie = "ps_locale=ja_JP; path=/";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    render(
      <LocaleProvider>
        <MemoryRouter>
          <AppShell>
            <p>page</p>
          </AppShell>
        </MemoryRouter>
      </LocaleProvider>,
    );
    const nav = screen.getByRole("navigation").textContent ?? "";
    const footer = screen.getByRole("contentinfo").textContent ?? "";
    expect(nav + footer).toMatch(/[぀-ヿ]/);
    expect(document.body.textContent).not.toMatch(/Sign in/);
  });
});

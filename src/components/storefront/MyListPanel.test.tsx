import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import MyListPanel from "./MyListPanel";

afterEach(() => vi.unstubAllGlobals());

function show(items: { productId: string; name: string }[]) {
  const fetchMock = vi.fn(async () => Response.json({ items }));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter>
      <MyListPanel />
    </MemoryRouter>,
  );
  return fetchMock;
}

describe("MyListPanel", () => {
  it("[SWHR2-C-0157] with MyList on the panel lists BIRDS products linked to their pages", async () => {
    show([{ productId: "AV-CB-01", name: "Amazon Parrot" }]);
    const panel = await screen.findByTestId("my-list");
    const link = (await screen.findByRole("link", { name: "Amazon Parrot" })) as HTMLAnchorElement;
    expect(panel).toContainElement(link);
    expect(link.getAttribute("href")).toBe("/petstore/product/AV-CB-01");
  });

  it("[SWHR2-C-0159] with MyList off (no items) no My List panel is shown", async () => {
    const fetchMock = show([]);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByTestId("my-list")).toBeNull();
  });
});

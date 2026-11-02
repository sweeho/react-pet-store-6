import { defineHandler, HTTPError } from "nitro/h3";

import { readJson } from "../../../services/customers/http";
import { guardRoute } from "../../../services/errors";
import { requireSupplier } from "../../../services/session/guards";
import { listInventory, updateInventory } from "../../../services/supplier/inventory";
import type { StockRow } from "../../../services/supplier/inventory";

const bad = (message: string, kind: string) =>
  new HTTPError({ status: 400, message, data: { kind } });

const wholeNumber = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isInteger(v) && v >= 0 ? v : null;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return null;
};

/** Applies the marked rows together; unmarked and blank rows are ignored, any invalid one saves nothing. */
export default defineHandler((event) =>
  guardRoute(async () => {
    requireSupplier(event);
    const { rows } = await readJson(event);
    if (!Array.isArray(rows)) throw bad("rows required", "InvalidInventory");
    const changes: StockRow[] = [];
    for (const raw of rows as unknown[]) {
      const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      if (r.marked !== true) continue;
      if (typeof r.itemId !== "string" || r.itemId === "")
        throw bad("itemId required", "InvalidInventory");
      if (r.quantity === undefined || r.quantity === null || r.quantity === "") continue;
      if (typeof r.quantity === "string" && r.quantity.trim() === "") continue;
      const quantity = wholeNumber(r.quantity);
      if (quantity === null)
        throw bad(`Quantity for ${r.itemId} must be a whole number`, "InvalidQuantity");
      changes.push({ itemId: r.itemId, quantity });
    }
    updateInventory(changes);
    return listInventory();
  }),
);

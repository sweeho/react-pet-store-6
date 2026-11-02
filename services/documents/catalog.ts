import { readFileSync } from "node:fs";
import path from "node:path";

import { XMLParser } from "fast-xml-parser";

/** The document formats the supplier exchange uses, with the identifiers that name each one. */
export const FORMATS = {
  SupplierOrder: {
    publicId: "-//PetStore//DTD SupplierOrder 1.1//EN",
    namespace: "http://petstore.example/schemas/SupplierOrder",
    dtd: "SupplierOrder.dtd",
    xsd: "SupplierOrder.xsd",
  },
  Invoice: {
    publicId: "-//PetStore//DTD Invoice 1.1//EN",
    namespace: "http://petstore.example/schemas/Invoice",
    dtd: "Invoice.dtd",
    xsd: "Invoice.xsd",
  },
  LineItem: {
    publicId: "-//PetStore//DTD LineItem 1.1//EN",
    namespace: "http://petstore.example/schemas/LineItem",
    dtd: "LineItem.dtd",
    xsd: "LineItem.xsd",
  },
} as const;

export type FormatName = keyof typeof FORMATS;

const baseUrl = () => process.env.DOC_BASE_URL ?? "http://localhost:5000";

/**
 * The XML declaration (UTF-8) and, by default, the DOCTYPE that names the format by its public
 * identifier; with `DOC_FORMAT_MODE=xsd` the format is named by namespace instead, returned as the
 * root element's attribute text (SWHR2-R-0139).
 */
export function documentHead(root: FormatName): { prolog: string; rootAttrs: string } {
  const f = FORMATS[root];
  const decl = '<?xml version="1.0" encoding="UTF-8"?>';
  if (process.env.DOC_FORMAT_MODE === "xsd")
    return { prolog: decl, rootAttrs: ` xmlns="${f.namespace}"` };
  return {
    prolog: `${decl}<!DOCTYPE ${root} PUBLIC "${f.publicId}" "${baseUrl()}/schemas/${f.dtd}">`,
    rootAttrs: "",
  };
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

/** The `systemId -> location` entries of one catalog file; relative locations resolve against `base`. */
function readCatalog(file: string, base: string): Map<string, string> {
  const out = new Map<string, string>();
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return out;
  }
  const root = (parser.parse(text) as { catalog?: { system?: unknown } }).catalog;
  for (const e of [root?.system ?? []].flat() as Record<string, string>[])
    if (e["@_systemId"] && e["@_uri"]) out.set(e["@_systemId"], path.resolve(base, e["@_uri"]));
  return out;
}

/**
 * Where a format's definition is: the deployment catalog (`DOC_CATALOG_PATH`) first, then the
 * built-in catalog, and only then the network location. Nothing is fetched here (SWHR2-R-0139).
 */
export async function resolveFormat(id: string): Promise<{ id: string; location: string }> {
  const deployment = process.env.DOC_CATALOG_PATH;
  const builtIn = path.join(process.cwd(), "services/documents/catalog.xml");
  const sources: [string, string][] = [];
  if (deployment) sources.push([deployment, path.dirname(path.resolve(deployment))]);
  sources.push([builtIn, process.cwd()]);
  for (const [file, base] of sources) {
    const location = readCatalog(file, base).get(id);
    if (location) return { id, location };
  }
  const f = (FORMATS as Record<string, (typeof FORMATS)[FormatName]>)[id];
  return { id, location: `${baseUrl()}/schemas/${f ? f.dtd : `${id}.dtd`}` };
}

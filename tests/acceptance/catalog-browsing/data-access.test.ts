// @vitest-environment node
import { Database } from "bun:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";

import { catalogCalls, loadCatalog, nameOf, recordQueries, rows, seeder } from "./harness";

// The deployment configuration names the catalog data-access implementation and the
// database dialect, as the legacy param/CatalogDAOClass and param/CatalogDAODatabase did.
const IMPLEMENTATION = "CATALOG_DAO_CLASS";
const DIALECT = "CATALOG_DAO_DATABASE";

afterEach(() => vi.unstubAllEnvs());

/** A catalog data-access implementation that records each read and answers with fixed products. */
function recordingDataAccess(products: string[]) {
  const reads: unknown[][] = [];
  return {
    reads,
    impl: {
      listProducts: async (...args: unknown[]) => {
        reads.push(args);
        return products.map((name, i) => ({
          productId: `FI-${i}`,
          name,
          description: `${name} description`,
        }));
      },
    },
  };
}

/** Starts the catalog under the given deployment configuration, with FISH holding Angelfish. */
async function startCatalog(config: Record<string, string>) {
  for (const [k, v] of Object.entries(config)) vi.stubEnv(k, v);
  const env = await loadCatalog();
  const s = seeder(env.client);
  s.category("FISH", { en_US: "Fish" });
  s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
  return env;
}

/** A separate migrated SQLite catalog store whose "FISH" category holds the given en_US products. */
async function dialectStore(products: string[]) {
  vi.resetModules();
  const { db } = await import("../../../db/client");
  const client = db.$client as unknown as Database;
  const s = seeder(client);
  s.category("FISH", { en_US: "Fish" });
  products.forEach((name, i) => s.product(`FI-D-${i}`, "FISH", { en_US: name }));
  return client;
}

describe("catalog data access selected by configuration", () => {
  // case: SWHR2-C-0280@v1
  it("SWHR2-C-0280: catalog reads go through the data-access implementation named in the deployment configuration", async () => {
    const { client, catalog } = await startCatalog({
      [IMPLEMENTATION]: "recording",
      [DIALECT]: "sqlite",
    });
    const recording = recordingDataAccess(["Angelfish"]);
    catalog.registerDataAccess("recording", recording.impl);
    const defaultCalls = recordQueries(client);

    const names = rows(await catalog.listProducts("FISH", "en_US", 0, 10)).map(nameOf);

    expect(recording.reads).toHaveLength(1);
    expect(recording.reads[0]).toEqual(expect.arrayContaining(["FISH", "en_US"]));
    expect(names).toEqual(["Angelfish"]);
    // the default implementation reads the SQLite catalog tables; it was never asked
    expect(catalogCalls(defaultCalls)).toHaveLength(0);
  });

  // case: SWHR2-C-0281@v1
  it("SWHR2-C-0281: catalog reads use the database dialect named in the deployment configuration", async () => {
    // Each dialect name gets its own SQLite store holding different products, and the default
    // store holds only Angelfish, so the products returned show which connection served the read.
    const sqliteStore = await dialectStore(["Angelfish", "Koi"]);
    const otherStore = await dialectStore(["Guppy"]);
    const { client, catalog } = await startCatalog({ [DIALECT]: "sqlite" });
    catalog.registerDialect("sqlite", sqliteStore);
    catalog.registerDialect("oracle", otherStore);
    const sqliteCalls = recordQueries(sqliteStore);
    const otherCalls = recordQueries(otherStore);
    const defaultCalls = recordQueries(client);

    const names = rows(await catalog.listProducts("FISH", "en_US", 0, 10)).map(nameOf);

    expect(sqliteStore).toBeInstanceOf(Database);
    expect(catalogCalls(sqliteCalls).length).toBeGreaterThan(0);
    expect(names).toEqual(["Angelfish", "Koi"]);
    expect(catalogCalls(otherCalls)).toHaveLength(0);
    expect(catalogCalls(defaultCalls)).toHaveLength(0);
  });

  // case: SWHR2-C-0281@v1
  it("SWHR2-C-0281: a configuration naming a dialect other than SQLite is served by that dialect's connection", async () => {
    // Same setup, but the configuration names the other dialect: the read must move to the
    // connection registered for that dialect and return its products.
    const sqliteStore = await dialectStore(["Guppy"]);
    const otherStore = await dialectStore(["Angelfish", "Koi"]);
    const { client, catalog } = await startCatalog({ [DIALECT]: "oracle" });
    catalog.registerDialect("sqlite", sqliteStore);
    catalog.registerDialect("oracle", otherStore);
    const sqliteCalls = recordQueries(sqliteStore);
    const otherCalls = recordQueries(otherStore);
    const defaultCalls = recordQueries(client);

    const names = rows(await catalog.listProducts("FISH", "en_US", 0, 10)).map(nameOf);

    expect(catalogCalls(otherCalls).length).toBeGreaterThan(0);
    expect(names).toEqual(["Angelfish", "Koi"]);
    expect(catalogCalls(sqliteCalls)).toHaveLength(0);
    expect(catalogCalls(defaultCalls)).toHaveLength(0);
  });

  // case: SWHR2-C-0282@v1
  it("SWHR2-C-0282: changing only the configured data-access implementation changes which implementation serves catalog reads", async () => {
    const run = async (named: "A" | "B") => {
      const { catalog } = await startCatalog({ [IMPLEMENTATION]: named, [DIALECT]: "sqlite" });
      const a = recordingDataAccess(["Angelfish"]);
      const b = recordingDataAccess(["Angelfish"]);
      catalog.registerDataAccess("A", a.impl);
      catalog.registerDataAccess("B", b.impl);
      await catalog.listProducts("FISH", "en_US", 0, 10);
      return { a: a.reads.length, b: b.reads.length };
    };

    expect(await run("A")).toEqual({ a: 1, b: 0 });
    expect(await run("B")).toEqual({ a: 0, b: 1 });
  });
});

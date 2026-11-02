import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { users } from "../../../db/schema";
import listUsers from "./index.get";

/**
 * INTEGRATION TEST
 *
 * Same H3Event pattern as routes/api/hello.test.ts, minus the middleware
 * step — this route doesn't read anything from `event.context`.
 */
describe("GET /api/users", () => {
  // db/client.ts inserts no rows (SWHR2-R-0074), so the test owns its two users.
  beforeAll(() => {
    db.insert(users)
      .values([
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
      ])
      .onConflictDoNothing()
      .run();
  });

  it("returns the mock user list", async () => {
    const event = new H3Event(new Request("http://localhost/api/users"));

    const result = await listUsers(event);

    expect(result).toEqual({
      users: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
      ],
    });
  });
});

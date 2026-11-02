import { defineHandler } from "nitro/h3";

export default defineHandler(async (): Promise<Response> => {
  throw new Error("VortexNotImplemented");
});

import { defineHandler } from "nitro/h3";

import { FORMATS } from "../../services/documents/catalog";

/**
 * Publishes the document format catalog: each format's public identifier and namespace mapped to an
 * absolute schema location on this server's own address (SWHR2-R-0093). It lists formats only, so
 * it needs no authorisation and never touches the outbox.
 */
export default defineHandler((event) => {
  const origin = new URL(event.req.url).origin;
  const entries = Object.entries(FORMATS)
    .map(
      ([, f]) =>
        `  <public publicId="${f.publicId}" uri="${origin}/schemas/${f.dtd}"/>\n  <uri name="${f.namespace}" uri="${origin}/schemas/${f.xsd}"/>`,
    )
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n${entries}\n</catalog>\n`,
    {
      headers: { "content-type": "application/xml; charset=utf-8" },
    },
  );
});

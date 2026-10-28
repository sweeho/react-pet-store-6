import type { H3Event } from "nitro/h3";

// Runs before middleware/10.session.ts (file-name order), so sign-on and every
// handler read values already interpreted as UTF-8.
const TEXT_BODY = /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/)/i;
const TEXT_RESPONSE = /^(text\/|application\/json)/i;

const withUtf8 = (contentType: string) =>
  /charset=/i.test(contentType) ? contentType : `${contentType}; charset=utf-8`;

export default async function encoding(event: H3Event, next?: () => unknown): Promise<unknown> {
  const contentType = event.req.headers.get("content-type");
  // multipart carries a boundary; appending a charset parameter keeps it valid.
  if (contentType && TEXT_BODY.test(contentType) && !/charset=/i.test(contentType)) {
    const headers = new Headers(event.req.headers);
    headers.set("content-type", withUtf8(contentType));
    // H3Event types `req` read-only, but it is a plain property; later readers must see the new request.
    (event as { req: Request }).req = new Request(event.req, { headers });
  }

  if (!next) return;
  const response = await next();
  if (response instanceof Response) {
    const type = response.headers.get("content-type");
    if (type && TEXT_RESPONSE.test(type)) response.headers.set("content-type", withUtf8(type));
  }
  return response;
}

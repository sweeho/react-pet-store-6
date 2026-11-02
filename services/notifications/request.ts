/** A request that can never succeed (malformed); retrying it is pointless, so it is marked failed. */
export class RejectedRequest extends Error {
  override readonly name = "RejectedRequest";
}

export interface MailRequest {
  to: string;
  subject: string;
  content: string;
}

const FIELDS = ["to", "subject", "content"] as const;

/** Accepts a request only when recipient, subject and content are all non-empty text. */
export function parseRequest(input: Partial<Record<keyof MailRequest, unknown>>): MailRequest {
  for (const field of FIELDS) {
    const v = input[field];
    if (typeof v !== "string" || v.trim() === "")
      throw new RejectedRequest(`E-mail request needs a non-empty ${field}.`);
  }
  return {
    to: input.to as string,
    subject: input.subject as string,
    content: input.content as string,
  };
}

/** Reads the `mail.outbound` payload, the JSON triple `[recipient, subject, content]`. */
export function parseTriple(payload: string): MailRequest {
  let value: unknown;
  try {
    value = JSON.parse(payload);
  } catch {
    throw new RejectedRequest("E-mail request is not valid JSON.");
  }
  if (!Array.isArray(value) || value.length !== 3)
    throw new RejectedRequest("E-mail request must be [recipient, subject, content].");
  const [to, subject, content] = value as unknown[];
  return parseRequest({ to, subject, content });
}

/** Splits a comma-separated recipient list leniently; every address is a To recipient. */
export function splitRecipients(to: string): string[] {
  return to
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

import nodemailer from "nodemailer";

import { mailConfig } from "./config";
import { parseRequest, parseTriple, splitRecipients } from "./request";

/**
 * Sends one HTML e-mail exactly as supplied (no templating). The transport is built at send time
 * from the current settings. A malformed request rejects before anything is sent.
 */
export async function sendMail(request: {
  to?: string;
  subject?: string;
  content?: string;
}): Promise<void> {
  const { to, subject, content } = parseRequest(request);
  const { from, ...transport } = mailConfig();
  const recipients = splitRecipients(to);
  if (recipients.length === 0) parseRequest({ to: "", subject, content });
  await nodemailer
    .createTransport(transport)
    .sendMail({ from, to: recipients, subject, html: content });
}

/** The `mail.outbound` handler: a transport error rejects and the worker retries. */
export async function deliverOutbound(payload: string): Promise<void> {
  await sendMail(parseTriple(payload));
}

export interface NotificationSwitches {
  approval: boolean;
  shipment: boolean;
  completed: boolean;
}

export interface MailConfig {
  host?: string;
  port?: number;
  auth?: { user: string; pass: string };
  from: string;
}

export const DEFAULT_SENDER = "customerservice@javapetstoredemo.com";

/** Absent or "false" is off, "true" is on (any case); anything else throws. */
function flag(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "" || raw === "false") return false;
  if (raw === "true") return true;
  throw new Error(`${name} must be "true" or "false", got "${process.env[name]}".`);
}

/** Read on every call so a deployment setting is never frozen at import. */
export function notificationSwitches(): NotificationSwitches {
  return {
    approval: flag("NOTIFY_APPROVAL_ENABLED"),
    shipment: flag("NOTIFY_SHIPMENT_ENABLED"),
    completed: flag("NOTIFY_COMPLETED_ENABLED"),
  };
}

/** The operator's mail server, account and sender, read on every call. */
export function mailConfig(): MailConfig {
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM } = process.env;
  return {
    host: MAIL_HOST || undefined,
    port: MAIL_PORT ? Number(MAIL_PORT) : undefined,
    auth: MAIL_USER ? { user: MAIL_USER, pass: MAIL_PASSWORD ?? "" } : undefined,
    from: MAIL_FROM || DEFAULT_SENDER,
  };
}

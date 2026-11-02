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

const notImplemented = (): never => {
  throw new Error("VortexNotImplemented");
};

export const notificationSwitches: () => NotificationSwitches = notImplemented;
export const mailConfig: () => MailConfig = notImplemented;

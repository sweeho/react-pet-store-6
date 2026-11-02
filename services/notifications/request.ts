export interface MailRequest {
  to: string;
  subject: string;
  content: string;
}

const notImplemented = (): never => {
  throw new Error("VortexNotImplemented");
};

export const parseRequest: (input: Partial<Record<keyof MailRequest, unknown>>) => MailRequest =
  notImplemented;
export const parseTriple: (payload: string) => MailRequest = notImplemented;
export const splitRecipients: (to: string) => string[] = notImplemented;

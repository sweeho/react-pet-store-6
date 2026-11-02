const notImplemented = (): never => {
  throw new Error("VortexNotImplemented");
};

export const sendMail: (request: {
  to?: string;
  subject?: string;
  content?: string;
}) => Promise<void> = notImplemented;
export const deliverOutbound: (payload: string) => Promise<void> = notImplemented;

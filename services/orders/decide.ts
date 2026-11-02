export interface DecisionEntry {
  orderId: string;
  status: string;
}
export function toApprovalXml(): string {
  throw new Error("VortexNotImplemented");
}
export function readApprovalBatch(): DecisionEntry[] {
  throw new Error("VortexNotImplemented");
}
export async function decideBatch(): Promise<void> {
  throw new Error("VortexNotImplemented");
}

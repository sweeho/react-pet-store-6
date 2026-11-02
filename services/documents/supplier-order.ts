export interface SupplierOrderInput {
  orderId?: string;
  userId?: string;
  orderDate?: string;
  shipping: Record<string, string | undefined>;
  lines: {
    lineNumber: number;
    categoryId: string;
    productId: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export const buildSupplierOrder: (_input: SupplierOrderInput) => string = () => {
  throw new Error("VortexNotImplemented");
};

export const readSupplierOrder: (_xml: string) => SupplierOrderInput = () => {
  throw new Error("VortexNotImplemented");
};

export const validateSupplierOrder: (xml: string) => { valid: boolean; errors: string[] } = () => {
  throw new Error("VortexNotImplemented");
};

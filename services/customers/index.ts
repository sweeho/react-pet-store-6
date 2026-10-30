const nope = (): never => {
  throw new Error("VortexNotImplemented");
};
export const registerUser = async (): Promise<void> => nope();
export const createCustomer = async (): Promise<unknown> => nope();
export const getCustomer = async (): Promise<unknown> => nope();
export const updateCustomer = async (): Promise<unknown> => nope();
export const contactSnapshot = async (): Promise<unknown> => nope();

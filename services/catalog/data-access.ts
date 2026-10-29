export type Dialect = "sqlite";

export interface DataAccess {
  readonly dialect: Dialect;
}

export function registerDataAccess(): void {
  throw new Error("VortexNotImplemented");
}

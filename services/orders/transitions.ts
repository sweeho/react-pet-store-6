import type { Executor } from "../ids";

export class TransitionError extends Error {}

export interface Transition {
  single?: (message: string, exec?: Executor) => void;
  batch?: (messages: string[], exec?: Executor) => void;
}

export const ORDER_TRANSITIONS: Record<string, string> = {};

export const registerTransition: (_name: string, _transition: Transition) => void = () => {
  throw new Error("VortexNotImplemented");
};

export const handOff: (_step: string, _messages: string[], _exec?: Executor) => void = () => {
  throw new Error("VortexNotImplemented");
};

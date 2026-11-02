import { db } from "../../db/client";
import type { Executor } from "../ids";
import { enqueue } from "../messaging";

/** A stage hand-off: takes the step's messages one by one, or all together as a batch. */
export interface Transition {
  single?: (message: string, exec: Executor) => void;
  batch?: (messages: string[], exec: Executor) => void;
}

/** A transition could not be loaded or failed; `cause` carries the reason (SWHR2-R-0106). */
export class TransitionError extends Error {
  override readonly name = "TransitionError";
}

/** Step name to transition name. `approval` hands the supplier order to the supplier's channel. */
export const ORDER_TRANSITIONS: Record<string, string> = {
  approval: "outbox:supplier.purchase-order",
};

const registry = new Map<string, Transition>();

export function registerTransition(name: string, transition: Transition): void {
  registry.set(name, transition);
}

const OUTBOX = "outbox:";

/** Registered names first; `outbox:<channel>` is built on demand as an enqueue onto that channel. */
function load(name: string): Transition {
  const known = registry.get(name);
  if (known) return known;
  if (name.startsWith(OUTBOX))
    return { single: (message, exec) => void enqueue(exec, name.slice(OUTBOX.length), message) };
  throw new Error(`No transition is registered under that name.`);
}

/**
 * Hands a step's outbound messages to the transition configured for it: the batch at once when the
 * transition takes batches, otherwise each message in turn. Runs in the caller's transaction when
 * `exec` is that transaction.
 */
export function handOff(step: string, messages: string[], exec: Executor = db): void {
  const name = ORDER_TRANSITIONS[step];
  try {
    if (name === undefined) throw new Error(`No transition is configured for step "${step}".`);
    const t = load(name);
    if (t.batch) t.batch(messages, exec);
    else if (t.single) for (const m of messages) t.single(m, exec);
    else throw new Error("The transition takes neither a message nor a batch.");
  } catch (cause) {
    throw new TransitionError(`Transition "${name ?? step}" failed for step "${step}".`, { cause });
  }
}

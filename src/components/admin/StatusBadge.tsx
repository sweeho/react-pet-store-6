import { cn } from "@/utils";

// Palette utilities, not theme tokens: the hue name is part of the contract (DESIGN.md § Status colours).
const TONE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  DENIED: "bg-red-100 text-red-800",
  COMPLETED: "bg-slate-100 text-slate-700",
};

/** An order workflow status as its stored upper-case text in a coloured pill. */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full px-2 text-xs font-semibold tracking-wide",
        TONE[status] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {status}
    </span>
  );
}

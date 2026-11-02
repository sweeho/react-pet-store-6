/** An order row as the tool shows it. */
export interface OrderRow {
  id: string;
  userId: string;
  date: string;
  amount: number;
  status: string;
}

export type Decision = "APPROVED" | "DENIED";

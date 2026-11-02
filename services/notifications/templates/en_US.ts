import type { Templates } from "./types";

export const enUS: Templates = {
  approval: (orderId, status) =>
    `<html><body><p>Your order ${orderId} is now ${status}.</p></body></html>`,
  shipment: (orderId) =>
    `<html><body><p>Part of your order ${orderId} has shipped.</p></body></html>`,
  completed: (orderId, lines) =>
    `<html><body><p>Your entire order has shipped (order ${orderId}).</p><table>${lines
      .map(
        (l) =>
          `<tr><td>${l.category}</td><td>${l.product}</td><td>${l.quantity}</td><td>${l.unitPrice}</td></tr>`,
      )
      .join("")}</table></body></html>`,
};

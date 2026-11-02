import type { Templates } from "./types";

export const jaJP: Templates = {
  approval: (orderId, status) =>
    `<html><body><p>ご注文 ${orderId} のステータス: ${status}</p></body></html>`,
  shipment: (orderId) =>
    `<html><body><p>ご注文 ${orderId} の一部を発送しました。</p></body></html>`,
  completed: (orderId, lines) =>
    `<html><body><p>ご注文 ${orderId} のすべてを発送しました。</p><table>${lines
      .map(
        (l) =>
          `<tr><td>${l.category}</td><td>${l.product}</td><td>${l.quantity}</td><td>${l.unitPrice}</td></tr>`,
      )
      .join("")}</table></body></html>`,
};

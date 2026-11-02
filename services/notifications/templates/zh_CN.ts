import type { Templates } from "./types";

export const zhCN: Templates = {
  approval: (orderId, status) =>
    `<html><body><p>您的订单 ${orderId} 状态: ${status}</p></body></html>`,
  shipment: (orderId) => `<html><body><p>您的订单 ${orderId} 已部分发货。</p></body></html>`,
  completed: (orderId, lines) =>
    `<html><body><p>您的订单 ${orderId} 已全部发货。</p><table>${lines
      .map(
        (l) =>
          `<tr><td>${l.category}</td><td>${l.product}</td><td>${l.quantity}</td><td>${l.unitPrice}</td></tr>`,
      )
      .join("")}</table></body></html>`,
};

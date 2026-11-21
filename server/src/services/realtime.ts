import type { Server } from "socket.io";

export function minimalOrder(order: any) {
  return {
    id: String(order._id),
    total: order.total,
    paymentStatus: order.paymentStatus,
    shippingStatus: order.shippingStatus,
    trackingNumber: order.trackingNumber || ""
  };
}

export function emitOrderCreated(io: Server | undefined, order: any) {
  const data = minimalOrder(order);
  io?.to("admin").emit("order:created", data);
}

export function emitOrderUpdated(io: Server | undefined, order: any) {
  const data = minimalOrder(order);
  io?.to("admin").emit("order:updated", data);
  io?.to(`user:${String(order.user)}`).emit("order:updated", data);
}

export function emitOrderStatusChanged(io: Server | undefined, order: any) {
  const data = minimalOrder(order);
  io?.to("admin").emit("order:statusChanged", data);
  io?.to(`user:${String(order.user)}`).emit("order:statusChanged", data);
}

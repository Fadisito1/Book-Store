import { AppError } from "../middleware/errors";

export type ShippingStatus = "Pendiente" | "Procesando" | "Enviado" | "Entregado";

export function validateShippingTransition(
  paid: boolean,
  current: ShippingStatus,
  next: ShippingStatus,
  trackingNumber?: string
) {
  if (!paid) throw new AppError(409, "El pedido no está pagado");

  const allowed: Record<ShippingStatus, ShippingStatus[]> = {
    Pendiente: ["Procesando"],
    Procesando: ["Enviado"],
    Enviado: ["Entregado"],
    Entregado: []
  };
  if (!allowed[current].includes(next)) throw new AppError(409, "Transición de estado de envío inválida");
  if (next === "Enviado" && !trackingNumber?.trim()) {
    throw new AppError(400, "El número de guía es obligatorio al enviar");
  }
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { SocketStatus } from "@/components/SocketStatus";
import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";
import type { Order } from "@/lib/types";

function OrdersContent() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try { const data = await apiRequest<{ orders: Order[] }>("/api/orders/me", {}, token); setOrders(data.orders); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return <div>
    <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-black">Mis pedidos</h1><SocketStatus onEvent={load} /></div>
    {loading && <p className="py-12 text-center text-slate-500">Cargando pedidos…</p>}
    {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {!loading && !orders.length && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Aún no tienes pedidos.</p>}
    <div className="space-y-4">{orders.map((order) => <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-slate-500">Pedido</p><p className="font-mono font-bold">{order._id}</p></div><strong>${Number(order.total).toFixed(2)}</strong></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Pago</p><p className="font-bold">{order.paymentStatus === "pagado" ? "Pagado" : "Pendiente"}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Envío</p><p className="font-bold">{order.shippingStatus}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Guía</p><p className="font-bold">{order.trackingNumber || "Aún no asignada"}</p></div>
      </div>
    </article>)}</div>
  </div>;
}

export default function MyOrdersPage() { return <Protected><OrdersContent /></Protected>; }

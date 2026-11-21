"use client";

import { useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { apiRequest } from "@/lib/api";

function CheckoutContent() {
  const { token } = useAuth();
  const { items, clear } = useCart();
  const [address, setAddress] = useState("");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function createBackendOrder() {
    if (!address.trim()) throw new Error("Ingresa la dirección de envío");
    if (!token) throw new Error("Debes iniciar sesión");
    if (!items.length) throw new Error("El carrito está vacío");

    const data = await apiRequest<{ order: { _id: string } }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items: items.map((item) => ({ bookId: item.book._id, quantity: item.quantity })) })
    }, token);
    setOrderId(data.order._id);
    localStorage.setItem("bookstore_delivery_address", address);
    return data.order._id;
  }

  return <Protected>
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-black">Finalizar compra</h1>
      {message && <p className="mb-4 rounded-xl bg-slate-100 p-4 text-sm">{message}</p>}
      <label className="mb-5 block rounded-2xl border border-slate-200 bg-white p-5 font-semibold">Dirección de envío
        <textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={4} className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" placeholder="Calle, número, ciudad y referencia" />
      </label>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        {items.map((item) => <div key={item.book._id} className="flex justify-between border-b border-slate-100 py-3"><span>{item.quantity} × {item.book.title}</span><strong>${(item.quantity * item.book.price).toFixed(2)}</strong></div>)}
        <PayPalButtons
          disabled={busy || !items.length || !address.trim()}
          createOrder={async () => {
            setBusy(true); setMessage("");
            try {
              const createdOrderId = await createBackendOrder();
              const data = await apiRequest<{ paypalOrderId: string }>("/api/payments/paypal/order", {
                method: "POST", body: JSON.stringify({ orderId: createdOrderId })
              }, token || undefined);
              return data.paypalOrderId;
            } catch (e: any) { setMessage(e.message); throw e; }
            finally { setBusy(false); }
          }}
          onApprove={async (data) => {
            setBusy(true);
            try {
              await apiRequest<{ status: string }>("/api/payments/paypal/capture", {
                method: "POST", body: JSON.stringify({ paypalOrderId: data.orderID })
              }, token || undefined);
              clear(); setMessage("Pago confirmado. Tu pedido está pagado.");
            } catch (e: any) { setMessage(e.message); }
            finally { setBusy(false); }
          }}
          onError={() => setMessage("No se pudo completar el pago con PayPal.")}
          onCancel={() => setMessage("Pago cancelado. Puedes intentarlo nuevamente.")}
        />
      </div>
      {orderId && <p className="mt-4 text-sm text-slate-500">Pedido creado: {orderId}</p>}
    </div>
  </Protected>;
}

export default function CheckoutPage() { return <CheckoutContent />; }

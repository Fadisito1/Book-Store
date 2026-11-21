"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { SocketStatus } from "@/components/SocketStatus";
import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";
import type { Book, Order } from "@/lib/types";

const columns = ["Pendiente", "Procesando", "Enviado", "Entregado"] as const;

function AdminContent() {
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [board, setBoard] = useState<Record<string, Order[]>>({ Pendiente: [], Procesando: [], Enviado: [], Entregado: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{ orders: Array<{ id: string; user: string; items: Array<{ title: string; quantity: number }>; total: number; paymentStatus: Order["paymentStatus"]; shippingStatus: Order["shippingStatus"]; trackingNumber: string; createdAt?: string; paidAt?: string | null; updatedAt?: string }> }>("/api/orders", {}, token);
      const next: Record<string, Order[]> = { Pendiente: [], Procesando: [], Enviado: [], Entregado: [] };
      data.orders.forEach((order) => {
        const mapped: Order = {
          _id: order.id,
          user: order.user,
          items: order.items.map((item) => ({ book: "", titleSnapshot: item.title, priceSnapshot: 0, quantity: item.quantity })),
          total: order.total,
          paymentStatus: order.paymentStatus,
          paidAt: order.paidAt || undefined,
          shippingStatus: order.shippingStatus,
          trackingNumber: order.trackingNumber,
          createdAt: order.createdAt
        };
        next[order.shippingStatus].push(mapped);
      });
      setBoard(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los pedidos");
    }
  }, [token]);

  const loadBooks = useCallback(async () => {
    if (!token) return;
    try { const data = await apiRequest<{ books: Book[] }>("/api/books", {}, token); setBooks(data.books); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadBooks(); loadOrders(); }, [loadBooks, loadOrders]);

  async function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      title: String(form.get("title")), author: String(form.get("author")), category: String(form.get("category")),
      description: String(form.get("description") || ""), price: Number(form.get("price")), stock: Number(form.get("stock")), imageUrl: ""
    };
    try {
      await apiRequest("/api/books", { method: "POST", body: JSON.stringify(body) }, token || undefined);
      event.currentTarget.reset(); await loadBooks();
    } catch (e: any) { setError(e.message); }
  }

  async function setStock(book: Book, stock: number) {
    try {
      await apiRequest(`/api/books/${book._id}`, { method: "PUT", body: JSON.stringify({ stock }) }, token || undefined);
      await loadBooks();
    } catch (e: any) { setError(e.message); }
  }

  async function deleteBook(book: Book) {
    try { await apiRequest(`/api/books/${book._id}`, { method: "DELETE" }, token || undefined); await loadBooks(); }
    catch (e: any) { setError(e.message); }
  }

  async function changeStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, string> = { shippingStatus: String(form.get("shippingStatus")) };
    if (body.shippingStatus === "Enviado") body.trackingNumber = String(form.get("trackingNumber"));
    try {
      const data = await apiRequest<{ order: Order }>(`/api/orders/${form.get("orderId")}/status`, { method: "PATCH", body: JSON.stringify(body) }, token || undefined);
      const responseOrder = data.order as Order & { id?: string };
      const orderId = responseOrder.id || responseOrder._id;
      const order: Order = { ...responseOrder, _id: orderId };
      setBoard((current) => {
        const next = Object.fromEntries(columns.map((column) => [column, current[column].filter((item) => item._id !== orderId)])) as Record<string, Order[]>;
        next[order.shippingStatus] = [{ ...order, items: [], user: "" }, ...next[order.shippingStatus]];
        return next;
      });
      event.currentTarget.reset();
    } catch (e: any) { setError(e.message); }
  }

  function handleSocket(event: string, data: unknown) {
    if (event !== "order:created" && event !== "order:updated" && event !== "order:statusChanged") return;
    const realtime = data as (Order & { id?: string });
    if (!realtime?.shippingStatus) return;
    const orderId = realtime.id || realtime._id;
    if (!orderId) return;
    const order: Order = { ...realtime, _id: orderId };
    setBoard((current) => {
      const next = Object.fromEntries(columns.map((column) => [column, current[column].filter((item) => item._id !== orderId)])) as Record<string, Order[]>;
      next[order.shippingStatus] = [{ ...order, items: [], user: "" }, ...next[order.shippingStatus]];
      return next;
    });
  }

  return <div>
    <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-black">Administración</h1><SocketStatus onEvent={handleSocket} onReconnect={loadOrders} /></div>
    {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-xl font-bold">Nuevo libro</h2>
      <form onSubmit={saveBook} className="grid gap-3 md:grid-cols-2">
        <input name="title" required placeholder="Título" className="rounded-lg border border-slate-300 px-3 py-2" />
        <input name="author" required placeholder="Autor" className="rounded-lg border border-slate-300 px-3 py-2" />
        <input name="category" required placeholder="Categoría" className="rounded-lg border border-slate-300 px-3 py-2" />
        <input name="price" required type="number" step="0.01" min="0" placeholder="Precio" className="rounded-lg border border-slate-300 px-3 py-2" />
        <input name="stock" required type="number" step="1" min="0" placeholder="Stock" className="rounded-lg border border-slate-300 px-3 py-2" />
        <textarea name="description" placeholder="Descripción" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
        <button className="rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white md:col-span-2">Crear libro</button>
      </form>
    </section>

    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold">Libros</h2>
      {loading && <p>Cargando libros…</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{books.map((book) => <article key={book._id} className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold">{book.title}</h3><p className="text-sm text-slate-500">${Number(book.price).toFixed(2)}</p>
        <label className="mt-3 block text-sm">Stock<input type="number" min="0" defaultValue={book.stock} onBlur={(e) => setStock(book, Number(e.target.value))} className="ml-2 w-24 rounded-lg border border-slate-300 px-2 py-1" /></label>
        <button onClick={() => deleteBook(book)} className="mt-3 text-sm font-bold text-red-600">Eliminar</button>
      </article>)}</div>
    </section>

    <section>
      <h2 className="mb-4 text-xl font-bold">Cambiar envío</h2>
      <form onSubmit={changeStatus} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-4">
        <input name="orderId" required placeholder="ID del pedido" className="rounded-lg border border-slate-300 px-3 py-2" />
        <select name="shippingStatus" className="rounded-lg border border-slate-300 px-3 py-2">{columns.map((status) => <option key={status}>{status}</option>)}</select>
        <input name="trackingNumber" placeholder="Número de guía (al enviar)" className="rounded-lg border border-slate-300 px-3 py-2" />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">Actualizar</button>
      </form>
      <div className="grid gap-4 overflow-x-auto lg:grid-cols-4">
        {columns.map((column) => <div key={column} className="min-h-48 rounded-2xl bg-slate-100 p-3">
          <h3 className="mb-3 font-bold">{column}</h3>{board[column].map((order) => <article key={order._id} className="mb-2 rounded-xl bg-white p-3 shadow-sm">
            <p className="break-all text-xs font-bold">{order._id}</p><p className="mt-1 text-sm">${Number(order.total || 0).toFixed(2)}</p>{order.trackingNumber && <p className="text-xs text-slate-500">Guía: {order.trackingNumber}</p>}
          </article>)}
        </div>)}
      </div>
    </section>
  </div>;
}

export default function AdminPage() { return <Protected role="admin"><AdminContent /></Protected>; }

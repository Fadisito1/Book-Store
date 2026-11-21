"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, total, setQuantity, remove } = useCart();
  if (!items.length) return <div className="py-20 text-center"><p className="text-lg text-slate-600">Tu carrito está vacío.</p><Link href="/" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">Explorar libros</Link></div>;

  return <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
    <section className="space-y-4">
      {items.map(({ book, quantity }) => <article key={book._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 place-items-center rounded-xl bg-slate-100 text-3xl">📖</div>
        <div className="flex-1"><h2 className="font-bold">{book.title}</h2><p className="text-sm text-slate-500">{book.author}</p></div>
        <label className="text-sm">Cantidad<input type="number" min={1} max={book.stock} value={quantity} onChange={(e) => setQuantity(book._id, Number(e.target.value))} className="ml-2 w-20 rounded-lg border border-slate-300 px-3 py-2" /></label>
        <strong>${(book.price * quantity).toFixed(2)}</strong>
        <button onClick={() => remove(book._id)} className="text-sm font-bold text-red-600">Eliminar</button>
      </article>)}
    </section>
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-black">Resumen</h2>
      <div className="mt-5 flex justify-between"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
      <Link href="/checkout" className="mt-5 block rounded-xl bg-indigo-600 px-4 py-3 text-center font-bold text-white">Continuar al pago</Link>
    </aside>
  </div>;
}

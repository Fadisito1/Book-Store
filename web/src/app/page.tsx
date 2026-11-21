"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Book } from "@/lib/types";
import { useCart } from "@/components/CartProvider";

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { add } = useCart();

  useEffect(() => {
    setLoading(true); setError("");
    apiRequest<{ books: Book[] }>(`/api/books${category ? `?category=${encodeURIComponent(category)}` : ""}`)
      .then((data) => setBooks(data.books)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [category]);

  const categories = useMemo(() => Array.from(new Set(books.map((book) => book.category))).sort(), [books]);

  return <div>
    <section className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-600 p-8 text-white md:p-12">
      <p className="mb-2 text-sm font-bold uppercase tracking-widest text-indigo-100">Tu próxima lectura</p>
      <h1 className="max-w-2xl text-4xl font-black md:text-5xl">Encuentra historias que merecen quedarse contigo.</h1>
    </section>
    <div className="mb-6"><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3">
      <option value="">Todas las categorías</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
    </select></div>
    {loading && <p className="py-12 text-center text-slate-500">Cargando catálogo…</p>}
    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {!loading && !error && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => <article key={book._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid h-44 place-items-center rounded-xl bg-slate-100 text-5xl">📖</div>
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{book.category}</p>
        <h2 className="mt-1 text-lg font-bold"><Link href={`/libros/${book._id}`}>{book.title}</Link></h2>
        <p className="mb-4 text-sm text-slate-500">{book.author}</p>
        <div className="mt-auto flex items-center justify-between"><strong>${Number(book.price).toFixed(2)}</strong>
          <button onClick={() => add(book)} disabled={book.stock < 1} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white">Agregar</button></div>
        <p className="mt-2 text-xs text-slate-500">Stock: {book.stock}</p>
      </article>)}
    </div>}
  </div>;
}

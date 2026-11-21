"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { Book } from "@/lib/types";
import { useCart } from "@/components/CartProvider";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState("");
  const { add } = useCart();

  useEffect(() => {
    apiRequest<{ book: Book }>(`/api/books/${id}`).then((data) => setBook(data.book)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!book) return <p className="py-20 text-center text-slate-500">Cargando libro…</p>;
  return <article className="grid gap-8 md:grid-cols-[280px_1fr]">
    <div className="grid h-96 place-items-center rounded-3xl bg-slate-100 text-7xl">📖</div>
    <div>
      <p className="text-sm font-bold uppercase text-indigo-600">{book.category}</p>
      <h1 className="mt-2 text-4xl font-black">{book.title}</h1>
      <p className="mt-2 text-lg text-slate-600">por {book.author}</p>
      <p className="mt-6 leading-7 text-slate-700">{book.description}</p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <strong className="text-3xl">${Number(book.price).toFixed(2)}</strong>
        <button onClick={() => add(book)} disabled={book.stock < 1} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white">Agregar al carrito</button>
      </div>
      <p className="mt-3 text-sm text-slate-500">Disponibles: {book.stock}</p>
    </div>
  </article>;
}

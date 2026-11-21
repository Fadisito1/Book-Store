"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { SocketStatus } from "./SocketStatus";

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-black text-indigo-700">Biblioteca Digital</Link>
        <div className="flex items-center gap-3 text-sm">
          {user && <SocketStatus />}
          <Link href="/" className="hidden sm:inline">Catálogo</Link>
          {user?.role === "admin" && <Link href="/admin">Administración</Link>}
          {user && <Link href="/mis-pedidos">Mis pedidos</Link>}
          <Link href="/carrito" className="rounded-lg bg-indigo-50 px-3 py-2 font-semibold text-indigo-700">Carrito ({count})</Link>
          {user ? <button onClick={logout} className="text-slate-600">Salir</button> : <Link href="/login" className="rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white">Entrar</Link>}
        </div>
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      await register(String(data.get("name")), String(data.get("email")), String(data.get("password")));
      router.replace("/");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h1 className="mb-6 text-3xl font-black">Crear cuenta</h1>
    {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <label className="mb-4 block text-sm font-semibold">Nombre<input name="name" required minLength={2} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
    <label className="mb-4 block text-sm font-semibold">Correo<input name="email" type="email" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
    <label className="mb-6 block text-sm font-semibold">Contraseña<input name="password" type="password" required minLength={8} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
    <button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">{loading ? "Creando…" : "Registrarme"}</button>
    <p className="mt-4 text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link href="/login" className="font-bold text-indigo-700">Inicia sesión</Link></p>
  </form>;
}

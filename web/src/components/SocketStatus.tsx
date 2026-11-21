"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";
import { useAuth } from "./AuthProvider";

export function SocketStatus({ onEvent, onReconnect }: { onEvent?: (event: string, data: unknown) => void; onReconnect?: () => void }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);

  useEffect(() => {
    if (!token) { setConnected(false); return; }
    const socket: Socket = io(API_URL, { auth: { token }, transports: ["websocket", "polling"] });
    const events = ["order:created", "order:statusChanged", "order:updated"];
    let hasConnected = false;
    socket.on("connect", () => {
      setConnected(true);
      if (hasConnected) onReconnectRef.current?.();
      hasConnected = true;
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    events.forEach((event) => socket.on(event, (data) => onEventRef.current?.(event, data)));
    return () => { socket.disconnect(); };
  }, [token]);

  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-600" title={connected ? "Conectado" : "Reconectando"}>
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400"}`} />
      {connected ? "En vivo" : "Reconectando"}
    </span>
  );
}

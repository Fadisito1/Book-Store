"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const options = useMemo(() => ({
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture"
  }), []);

  if (!mounted) return null;
  return <PayPalScriptProvider options={options}>{children}</PayPalScriptProvider>;
}

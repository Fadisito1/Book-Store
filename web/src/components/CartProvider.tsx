"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Book } from "@/lib/types";
import { cartTotal, readCart, writeCart, type CartItem } from "@/lib/cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (book: Book, quantity?: number) => void;
  setQuantity: (bookId: string, quantity: number) => void;
  remove: (bookId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => setItems(readCart()), []);
  useEffect(() => { if (typeof window !== "undefined") writeCart(items); }, [items]);

  function add(book: Book, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.book._id === book._id);
      if (existing) return current.map((item) => item.book._id === book._id ? { ...item, quantity: Math.min(book.stock, item.quantity + quantity) } : item);
      return [...current, { book, quantity: Math.min(book.stock, quantity) }];
    });
  }
  function setQuantity(bookId: string, quantity: number) {
    setItems((current) => current.map((item) => item.book._id === bookId ? { ...item, quantity: Math.max(1, Math.min(item.book.stock, quantity)) } : item));
  }
  const remove = (bookId: string) => setItems((current) => current.filter((item) => item.book._id !== bookId));
  const clear = () => setItems([]);
  const value = useMemo(() => ({ items, count: items.reduce((sum, item) => sum + item.quantity, 0), total: cartTotal(items), add, setQuantity, remove, clear }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}

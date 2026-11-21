import type { Book } from "./types";

export interface CartItem { book: Book; quantity: number }
const KEY = "bookstore_cart";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
}

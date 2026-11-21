import { describe, expect, it } from "vitest";
import { cartTotal } from "./cart";

describe("cartTotal", () => {
  it("calcula el total sin usar datos enviados al servidor", () => {
    const total = cartTotal([
      { book: { _id: "1", title: "Libro", author: "Autor", category: "novela", description: "", price: 10.5, stock: 5, imageUrl: "", active: true }, quantity: 2 }
    ]);
    expect(total).toBe(21);
  });
});

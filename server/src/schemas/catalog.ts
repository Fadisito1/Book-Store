import { z } from "zod";

export const bookCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().max(3000).optional().default(""),
  price: z.number().finite().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().trim().max(2000).optional().default(""),
  active: z.boolean().optional().default(true)
}).strict();

export const bookUpdateSchema = bookCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Debe proporcionar al menos un campo" }
);

export const orderCreateSchema = z.object({
  items: z.array(z.object({
    bookId: z.string().min(1),
    quantity: z.number().int().positive()
  }).strict()).min(1).max(100)
}).strict();

import { Router } from "express";
import { Book } from "../models/Book";
import { authenticate, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errors";
import { bookCreateSchema, bookUpdateSchema } from "../schemas/catalog";

export const booksRouter = Router();

booksRouter.get("/", async (req, res, next) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category.trim().toLowerCase() : undefined;
    const filter: Record<string, unknown> = { active: true };
    if (category) filter.category = category;
    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.json({ books });
  } catch (error) {
    next(error);
  }
});

booksRouter.get("/:id", async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, active: true });
    if (!book) throw new AppError(404, "Libro no encontrado");
    res.json({ book });
  } catch (error) {
    next(error);
  }
});

booksRouter.post("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const input = bookCreateSchema.parse(req.body);
    const book = await Book.create({ ...input, category: input.category.toLowerCase() });
    res.status(201).json({ book });
  } catch (error) {
    next(error);
  }
});

booksRouter.put("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const input = bookUpdateSchema.parse(req.body);
    const updates = input.category ? { ...input, category: input.category.toLowerCase() } : input;
    const book = await Book.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!book) throw new AppError(404, "Libro no encontrado");
    res.json({ book });
  } catch (error) {
    next(error);
  }
});

booksRouter.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!book) throw new AppError(404, "Libro no encontrado");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

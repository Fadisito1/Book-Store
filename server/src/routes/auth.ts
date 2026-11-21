import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { loginSchema, registerSchema } from "../schemas/auth";
import { AppError } from "../middleware/errors";
import { authenticate, authorize, jwtSecret } from "../middleware/auth";

export const authRouter = Router();

function signToken(user: { _id: unknown; role: "cliente" | "admin" }) {
  return jwt.sign({ role: user.role }, jwtSecret(), { subject: String(user._id), expiresIn: "7d" });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) throw new AppError(409, "El correo ya está registrado");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({ name: input.name, email: input.email, passwordHash, role: "cliente" });
    res.status(201).json({
      token: signToken(user),
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email }).select("+passwordHash name email role");
    if (!user) throw new AppError(401, "Credenciales inválidas");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError(401, "Credenciales inválidas");

    res.json({
      token: signToken(user),
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth?.sub);
    if (!user) throw new AppError(401, "Usuario no encontrado");
    res.json({ user: { id: String(user._id), name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/admin-check", authenticate, authorize("admin"), (_req, res) => {
  res.json({ ok: true });
});

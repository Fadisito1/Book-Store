import bcrypt from "bcryptjs";
import { User } from "../models/User";

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrador";

  if (!email || !password) {
    throw new Error("Falta ADMIN_EMAIL o ADMIN_PASSWORD");
  }
  if (password.length < 8 || password.length > 72) {
    throw new Error("ADMIN_PASSWORD debe tener entre 8 y 72 caracteres");
  }

  const existing = await User.findOne({ email }).select("+passwordHash role");
  if (existing) {
    if (existing.role !== "admin") {
      throw new Error("El correo del administrador está registrado con otro rol");
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return User.create({ name, email, passwordHash, role: "admin" });
}

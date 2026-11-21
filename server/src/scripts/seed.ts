import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Book } from "../models/Book";

const demoBooks = [
  { title: "Cien años de soledad", author: "Gabriel García Márquez", category: "novela", description: "Saga de la familia Buendía.", price: 18.99, stock: 20, imageUrl: "" },
  { title: "El principito", author: "Antoine de Saint-Exupéry", category: "infantil", description: "Historia clásica sobre la amistad.", price: 12.50, stock: 30, imageUrl: "" },
  { title: "Don Quijote de la Mancha", author: "Miguel de Cervantes", category: "clásicos", description: "Las aventuras de Alonso Quijano.", price: 16.75, stock: 18, imageUrl: "" },
  { title: "Ficciones", author: "Jorge Luis Borges", category: "cuentos", description: "Relatos de realidades imposibles.", price: 14.25, stock: 24, imageUrl: "" },
  { title: "Rayuela", author: "Julio Cortázar", category: "novela", description: "Una novela abierta a múltiples lecturas.", price: 19.50, stock: 15, imageUrl: "" },
  { title: "La sombra del viento", author: "Carlos Ruiz Zafón", category: "misterio", description: "Un joven descubre un libro maldito.", price: 17.95, stock: 22, imageUrl: "" },
  { title: "Crónica de una muerte anunciada", author: "Gabriel García Márquez", category: "novela", description: "Relato de un asesinato anunciado.", price: 11.99, stock: 28, imageUrl: "" },
  { title: "Pedro Páramo", author: "Juan Rulfo", category: "clásicos", description: "Viaje a un pueblo cargado de voces.", price: 13.40, stock: 16, imageUrl: "" },
  { title: "El túnel", author: "Ernesto Sabato", category: "psicológica", description: "La mente de un pintor obsesionado.", price: 15.20, stock: 19, imageUrl: "" },
  { title: "Bestiario", author: "Julio Cortázar", category: "cuentos", description: "Cuentos donde lo cotidiano se vuelve extraño.", price: 14.80, stock: 21, imageUrl: "" }
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("Falta MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrador";
  if (!email || !password) throw new Error("Falta ADMIN_EMAIL o ADMIN_PASSWORD");

  const existingAdmin = await User.findOne({ email }).select("+passwordHash role");
  if (existingAdmin && existingAdmin.role !== "admin") {
    throw new Error("El correo del administrador está registrado con otro rol");
  }
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, email, passwordHash, role: "admin" });
  }

  for (const book of demoBooks) {
    await Book.updateOne(
      { title: book.title },
      { $set: book, $setOnInsert: { active: true } },
      { upsert: true }
    );
  }

  console.log("Seed completado: 1 administrador y 10 libros");
}

seed()
  .catch((error) => { console.error("Error en seed:", error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(async () => mongoose.disconnect());

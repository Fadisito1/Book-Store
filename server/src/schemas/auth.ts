import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().toLowerCase().trim(),
  password: z.string().min(8).max(72),
  role: z.never().optional()
}).strict();

export const loginSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1).max(72)
}).strict();

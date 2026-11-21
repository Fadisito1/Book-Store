import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errors";

export interface AuthPayload {
  sub: string;
  role: "cliente" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET");
  return secret;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError(401, "Token requerido"));
  try {
    req.auth = jwt.verify(header.slice(7), jwtSecret()) as AuthPayload;
    next();
  } catch {
    next(new AppError(401, "Token inválido o expirado"));
  }
}

export function authorize(...roles: Array<AuthPayload["role"]>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AppError(401, "Token requerido"));
    if (!roles.includes(req.auth.role)) return next(new AppError(403, "Permisos insuficientes"));
    next();
  };
}

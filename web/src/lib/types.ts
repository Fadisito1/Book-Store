export type Role = "cliente" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  active: boolean;
}

export interface OrderItem {
  book: string;
  titleSnapshot: string;
  priceSnapshot: number;
  quantity: number;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  total: number;
  paymentStatus: "pendiente" | "pagado";
  paidAt?: string;
  shippingStatus: "Pendiente" | "Procesando" | "Enviado" | "Entregado";
  trackingNumber?: string;
  createdAt?: string;
}

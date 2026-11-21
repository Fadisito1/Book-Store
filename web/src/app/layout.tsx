import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Bookstore | Biblioteca Digital",
  description: "Tienda de libros electrónicos"
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <main className="mx-auto min-h-[calc(100vh-70px)] max-w-7xl px-4 py-8">{children}</main>
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

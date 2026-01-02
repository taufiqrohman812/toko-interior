import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";

// --- 1. SETUP FONT PREMIUM ---
// Menggunakan Playfair Display (untuk Judul Mewah) & Lato (untuk Teks Bacaan)
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lato = Lato({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

// --- 2. SETUP METADATA (SEO) ---
export const metadata: Metadata = {
  title: "KAISEN INTERIOR | Furniture Premium Tegal",
  description: "Wujudkan hunian impian dengan koleksi furnitur modern, minimalis, dan berkualitas dari Kaisen Interior. Gratis ongkir se-Jawa.",
  icons: {
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGyPp7An3NS_fMKTqTD7R2pqIAfbpFyfccKw&s", // Pakai logo Kaisen
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${playfair.variable} ${lato.variable} font-sans antialiased bg-white text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}
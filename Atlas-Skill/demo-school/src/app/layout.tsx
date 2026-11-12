import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMA Aksara Nusantara — Bandung | PPDB Tahun Ajaran 2027/2028",
  description:
    "Sekolah menengah atas berbasis eksperimen laboratorium, riset sosial lapangan, dan pendampingan rasio 1 guru untuk 14 siswa di Bandung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${fraunces.variable} ${plusJakarta.variable}`}>
      <body className="antialiased selection:bg-ochre selection:text-white">{children}</body>
    </html>
  );
}


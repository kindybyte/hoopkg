import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileTabBar } from "@/components/MobileTabBar";

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  title: "HoopKG — баскетбол в Бишкеке",
  description:
    "Создавай игры, присоединяйся к площадкам и собирай команду за пару минут.",
  manifest: "/manifest.webmanifest",
  applicationName: "HoopKG"
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${inter.className} min-h-screen pb-20 sm:pb-0`}>
        <Navbar />
        <main className="container-px py-4 sm:py-8">{children}</main>
        <MobileTabBar />
      </body>
    </html>
  );
}

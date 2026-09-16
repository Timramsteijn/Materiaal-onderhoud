import type { Metadata, Viewport } from "next";
import { Carter_One, Figtree } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";

const carterOne = Carter_One({
  variable: "--font-carter-one",
  subsets: ["latin"],
  weight: ["400"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Materiaalonderhoud — Outdoor Valley",
  description:
    "Scan, log en beheer onderhoud aan verhuurmateriaal (ski's, snowboards en meer).",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Onderhoud",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#15212b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${carterOne.variable} ${figtree.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}

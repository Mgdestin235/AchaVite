import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { InstallPwaBanner } from "@/components/layout/InstallPwaBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-display",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://achavite.example"),
  title: {
    default: "AchaVite — Les meilleures bonnes affaires à portée de main",
    template: "%s | AchaVite",
  },
  description:
    "AchaVite est une boutique en ligne 100% africaine. Découvrez des milliers de produits à prix imbattables, livrés partout au Tchad.",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "AchaVite — Les meilleures bonnes affaires à portée de main",
    description:
      "Boutique e-commerce 100% africaine : smartphones, mode, beauté, maison et plus encore.",
    siteName: "AchaVite",
    locale: "fr_FR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AchaVite",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1f3a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <PwaRegister />
        <SiteChrome>{children}</SiteChrome>
        <InstallPwaBanner />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

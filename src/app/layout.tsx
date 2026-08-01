import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Agentation } from "agentation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RewardLoop",
    template: "%s | RewardLoop",
  },
  description:
    "Digital loyalty system for local salons — billing first, loyalty second.",
  applicationName: "RewardLoop",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RewardLoop",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4F46E5",
  viewportFit: "cover",
};

import { ServiceWorkerRegistry } from "@/components/service-worker-registry";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full w-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-dvh w-full flex flex-col font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === "development" && <Agentation />}
        <ServiceWorkerRegistry />
      </body>
    </html>
  );
}

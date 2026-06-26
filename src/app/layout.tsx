import type { Metadata } from "next";
import { Oxygen, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const oxygen = Oxygen({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const oxygenHeading = Oxygen({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OAU Staff Housing System",
  description:
    "Official staff housing allocation and management portal for Obafemi Awolowo University, Ile-Ife.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oxygen.variable} ${geistMono.variable} ${oxygenHeading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}

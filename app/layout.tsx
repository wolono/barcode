import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../public/fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "预售上架系统",
  description: "基于Next.js的预售上架系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

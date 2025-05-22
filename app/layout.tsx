import type { Metadata } from "next";
import "./globals.css";

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
      <body className={`antialiased`}>

        {children}
      </body>
    </html>
  );
}

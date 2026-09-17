import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OvaLuk | Product Control Center",
  description: "Monitor applications, engagement, payments, health, and remote controls in one workspace.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

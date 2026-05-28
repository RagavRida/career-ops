import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerAI - The Automated AI Job Search Pipeline",
  description: "Automate your job search, evaluate offers, generate custom CVs, and auto-apply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

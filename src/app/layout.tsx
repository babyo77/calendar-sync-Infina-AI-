import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const bangers = Rubik({
  variable: "--font-bangers-sans",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Calendar Sync - Google Calendar Integration",
  description: "Sync and manage your Google Calendar events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bangers.variable} ${bangers.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

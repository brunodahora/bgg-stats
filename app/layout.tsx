import type { Metadata } from "next";
import Image from "next/image";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BGG Stats",
  description: "Browse your BoardGameGeek collection",
  icons: {
    icon: "/bgg-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <a
          href="https://boardgamegeek.com"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50"
        >
          <Image
            src="/powered_by_BGG_04_XL.png"
            alt="Powered by BoardGameGeek"
            width={150}
            height={50}
            className="h-auto"
          />
        </a>
      </body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Short-Story A/B Studio",
  description: "Ping-pong short story drafting studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

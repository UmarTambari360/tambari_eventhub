import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../providers/auth-provider.js";

export const metadata: Metadata = {
  title: {
    default: "EventHub — Nigeria's Event Ticketing Platform",
    template: "%s | EventHub",
  },
  description:
    "Discover and book tickets for the best events in Nigeria. Music, Tech, Arts, Culture, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

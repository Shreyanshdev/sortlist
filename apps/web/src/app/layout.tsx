import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Shortlist — Semantic ATS Engine",
  description: "AI-powered resume screening and candidate ranking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: "var(--font-chillax)",
                borderRadius: "12px",
                padding: "14px 18px",
                fontSize: "14px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

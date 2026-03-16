"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <SessionProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: "glass",
            style: {
              background: "rgba(22, 22, 42, 0.95)",
              backdropFilter: "blur(12px)",
              color: "#f1f5f9",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#16162a" },
              style: {
                borderLeft: "4px solid #10b981",
              },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#16162a" },
              style: {
                borderLeft: "4px solid #ef4444",
              },
            },
          }}
        />
      </SessionProvider>
    </ThemeProvider>
  );
}

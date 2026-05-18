import type { Metadata } from "next";
import { DashboardProvider } from "@/context/DashboardContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repo Health Intelligence",
  description: "Quantitative repository health analytics — volatility, bus factor, and dependency risk.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}

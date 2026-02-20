// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers"; // Assuming you have this from Phase 1
import Navbar from "@/components/Navbar"; // <-- Import the new Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "iHAVECPU Reward Redemption",
  description: "Redeem your exclusive rewards here.",
  icons: {
    icon: [
      {
        url:'/iHAVECPU_COM (1).png',
        href: 'iHAVECPU_COM (1).png',
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <Providers>
          {/* Add the Navbar right here above children */}
          <Navbar /> 
          
          {/* The main content of your pages will render inside here */}
          <div className="flex-grow">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
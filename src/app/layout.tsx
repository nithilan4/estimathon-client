import type { Metadata } from "next";
import "./globals.css";
import { Inconsolata, Open_Sans } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster";

const inconsolata = Inconsolata({
	subsets: ["latin"],
	variable: "--font-inconsolata"
})
const openSans = Open_Sans({
	subsets: ["latin"],
	variable: "--font-opensans"
})

export const metadata: Metadata = {
  title: "Estimathon"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inconsolata.variable} ${openSans.variable} antialiased flex flex-col justify-center items-center w-full h-screen`}
      >
        {children}
		<Toaster />
      </body>
    </html>
  );
}

import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Zubete",
  description: "Manage your Team with Zubete",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The suppressHydrationWarning prop is no longer needed
    <html lang="en">
      {/* The dark mode classes have been removed from the body */}
      <body className={`${inter.className} bg-slate-100 text-slate-800`}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <main>{children}</main>
      </body>
    </html>
  );
}

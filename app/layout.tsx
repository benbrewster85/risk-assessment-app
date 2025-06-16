import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Risk Assessment Platform",
  description: "Create and manage risk assessments easily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-800`}>
        {/* UPDATED: We're adding extensive styling options to the Toaster */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000, // Toasts last for 4 seconds
            // Default styles for all toasts
            style: {
              background: "#ffffff",
              color: "#334155", // slate-700
              border: "1px solid #e2e8f0", // slate-200
              padding: "16px",
            },
            // Custom styles for specific toast types
            success: {
              style: {
                background: "#f0fdf4", // green-50
                color: "#166534", // green-800
                border: "1px solid #bbf7d0", // green-300
              },
              iconTheme: {
                primary: "#22c55e", // green-500
                secondary: "#ffffff",
              },
            },
            error: {
              style: {
                background: "#fef2f2", // red-50
                color: "#991b1b", // red-800
                border: "1px solid #fecaca", // red-300
              },
              iconTheme: {
                primary: "#ef4444", // red-500
                secondary: "#ffffff",
              },
            },
          }}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}

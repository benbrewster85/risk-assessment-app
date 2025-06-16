"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-gray-800 hover:text-blue-600"
            >
              Risk Assessment Platform
            </Link>
            {/* CORRECTED: The href now correctly points to /team */}
            <Link
              href="/dashboard/team"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Team Management
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/profile"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

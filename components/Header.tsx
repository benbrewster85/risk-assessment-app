"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team } from "@/lib/types";
import { LogOut, User as UserIcon, Shield } from "react-feather";

type HeaderProps = {
  team: Team | null;
  isSuperAdmin: boolean;
};

export default function Header({ team, isSuperAdmin }: HeaderProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0 print:hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Team Logo and Name */}
          <div className="flex items-center space-x-3">
            {team?.logo_url ? (
              <img
                src={team.logo_url}
                alt="Team Logo"
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-slate-200"></div>
            )}
            <span className="text-lg font-semibold text-gray-800">
              {team?.name || "My Dashboard"}
            </span>
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            {isSuperAdmin && (
              <Link
                href="/dashboard/super-admin"
                className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center"
              >
                <Shield className="h-4 w-4 mr-1" />
                Super Admin
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center"
            >
              <UserIcon className="h-4 w-4 mr-1" />
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

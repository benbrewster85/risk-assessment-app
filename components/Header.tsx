"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team } from "@/lib/types";
import {
  LogOut,
  User as UserIcon,
  Shield,
  ChevronDown,
  Menu,
} from "react-feather";
import { useState, useEffect, useRef } from "react";

type HeaderProps = {
  team: Team | null;
  isSuperAdmin: boolean;
  onMenuClick: () => void;
};

export default function Header({
  team,
  isSuperAdmin,
  onMenuClick,
}: HeaderProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0 print:hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden mr-4 text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-3">
              {team?.logo_url ? (
                <img
                  src={team.logo_url}
                  alt="Team Logo"
                  className="h-9 w-9 rounded-md object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-md bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-lg">
                  Z
                </div>
              )}
              <span className="text-lg font-semibold text-gray-800">
                {team?.name || "Zubete"}
              </span>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <UserIcon className="h-5 w-5 text-gray-600" />
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard/team"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Team Management
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      href="/dashboard/super-admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Super Admin
                    </Link>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

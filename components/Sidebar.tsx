"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, HardDrive, Truck, Users } from "react-feather";

// UPDATED: Added "Vehicle Management" back to the list
const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/dashboard/projects", icon: Folder },
  { name: "Asset Management", href: "/dashboard/assets", icon: HardDrive },
  { name: "Vehicle Management", href: "#", icon: Truck, comingSoon: true },
  { name: "Team Management", href: "/dashboard/team", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col print:hidden">
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => {
          // UPDATED: This logic now correctly handles the root dashboard link
          const isActive =
            link.href === "/dashboard"
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg group ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              } ${link.comingSoon ? "cursor-not-allowed opacity-50" : ""}`}
              onClick={(e) => {
                if (link.comingSoon) e.preventDefault();
              }}
            >
              <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {link.name}
              {link.comingSoon && (
                <span className="ml-auto text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

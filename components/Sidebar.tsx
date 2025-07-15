"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, HardDrive, Truck, Users, FileText } from "react-feather";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/dashboard/projects", icon: Folder },
  { name: "Logs & Records", href: "/dashboard/logs", icon: FileText },
  { name: "Asset Management", href: "/dashboard/assets", icon: HardDrive },
  { name: "Vehicle Management", href: "/dashboard/vehicles", icon: Truck },
  { name: "Team Management", href: "/dashboard/team", icon: Users },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navLinks.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={onClose}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg group ${
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {link.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 flex lg:hidden transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-60"
          onClick={onClose}
        ></div>
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {sidebarContent}
        </div>
      </div>
      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 hidden lg:flex flex-col print:hidden">
        {sidebarContent}
      </aside>
    </>
  );
}

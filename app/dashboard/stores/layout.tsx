"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Browse Stock", href: "/dashboard/stores" },
    { name: "Manage Stock", href: "/dashboard/stores/manage" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. The main title for the whole section is now here */}
      <h1 className="text-3xl font-bold">Stores Management</h1>

      {/* 2. The tab navigation is below the title */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {navLinks.map((link) => {
            // This logic correctly highlights the active tab
            const isActive =
              pathname === link.href ||
              (pathname.startsWith(link.href) &&
                link.href !== "/dashboard/stores");
            return (
              <Link key={link.name} href={link.href} passHref>
                <button
                  className={`${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {link.name}
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
      <div>{children}</div>
    </div>
  );
}

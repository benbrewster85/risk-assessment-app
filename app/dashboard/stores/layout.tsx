"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex border-b">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.name} href={link.href} passHref>
              <Button
                variant="ghost"
                className={`rounded-b-none border-b-2 ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {link.name}
              </Button>
            </Link>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}

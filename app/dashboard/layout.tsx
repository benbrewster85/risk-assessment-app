"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { Team } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null); // State for the user's name
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // UPDATED: Fetch first_name and last_name from the profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, team_id, is_super_admin")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsSuperAdmin(profile.is_super_admin ?? false);
          setUserName(
            `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          );

          if (profile.team_id) {
            const { data: teamData } = await supabase
              .from("teams")
              .select("*")
              .eq("id", profile.team_id)
              .single();
            setTeam(teamData);
          }
        }
      }
    };
    fetchUserData();
  }, [supabase]);

  return (
    <div className="h-screen flex flex-col">
      {/* We now pass the user's name to the Header */}
      <Header
        team={team}
        isSuperAdmin={isSuperAdmin}
        userName={userName}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-100">{children}</main>
      </div>
    </div>
  );
}

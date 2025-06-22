"use client"; // This layout now needs to be a client component to manage state

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { Team } from "@/lib/types";
import { useEffect } from "react";

// This is a Client Component now, so data fetching needs to happen in a useEffect hook.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const [team, setTeam] = useState<Team | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("team_id, is_super_admin")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsSuperAdmin(profile.is_super_admin ?? false);
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
      {/* We pass the function to toggle the sidebar to the header */}
      <Header
        team={team}
        isSuperAdmin={isSuperAdmin}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex overflow-hidden">
        {/* We pass the open/closed state to the sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-100">{children}</main>
      </div>
    </div>
  );
}

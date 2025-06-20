import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { Team } from "@/lib/types";
import type { Metadata } from "next"; // Import the Metadata type

// NEW: This function dynamically generates metadata for the page
export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let teamName = "Dashboard"; // Default title if no team is found

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .single();

    if (profile?.team_id) {
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", profile.team_id)
        .single();
      if (team?.name) {
        teamName = team.name;
      }
    }
  }

  return {
    title: {
      template: `%s | ${teamName}`, // e.g., "Projects | Acme Corp"
      default: teamName, // e.g., "Acme Corp"
    },
    description: `Your dashboard for ${teamName}`,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  let team: Team | null = null;
  let isSuperAdmin = false;

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
      isSuperAdmin = profile.is_super_admin ?? false;
      if (profile.team_id) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("id", profile.team_id)
          .single();
        team = teamData;
      }
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Header team={team} isSuperAdmin={isSuperAdmin} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-100">{children}</main>
      </div>
    </div>
  );
}

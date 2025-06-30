import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Vehicle, TeamMember } from "@/lib/types";
import VehicleListPage from "@/components/VehicleListPage";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, role")
    .eq("id", user.id)
    .single();

  const teamId = profile?.team_id || null;
  const isCurrentUserAdmin = profile?.role === "team_admin";

  // Fetch both the list of vehicles AND the list of team members
  const [vehiclesResult, teamMembersResult] = await Promise.all([
    supabase
      .from("vehicles_with_details")
      .select("*")
      .eq("team_id", teamId)
      .order("registration_number", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("team_id", teamId),
  ]);

  if (vehiclesResult.error) {
    console.error("Error fetching vehicles:", vehiclesResult.error);
  }

  return (
    <VehicleListPage
      initialVehicles={(vehiclesResult.data as Vehicle[]) || []}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      teamId={teamId}
      isCurrentUserAdmin={isCurrentUserAdmin}
    />
  );
}

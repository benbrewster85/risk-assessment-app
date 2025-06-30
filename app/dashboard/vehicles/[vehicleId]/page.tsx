import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Vehicle, TeamMember, VehicleEvent } from "@/lib/types";
import VehicleDetailPage from "@/components/VehicleDetailPage";

export const dynamic = "force-dynamic";

type VehiclePageProps = {
  params: { vehicleId: string };
};

export default async function VehiclePage({ params }: VehiclePageProps) {
  const supabase = createClient();
  const { vehicleId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) notFound();
  const teamId = profile.team_id;
  const isCurrentUserAdmin = profile.role === "team_admin";

  // Fetch from our vehicles_with_details view to get the assignee's name
  const { data: vehicle, error } = await supabase
    .from("vehicles_with_details")
    .select("*")
    .eq("id", vehicleId)
    .eq("team_id", teamId)
    .single();

  if (error || !vehicle) {
    notFound();
  }

  const [teamMembersResult, eventsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("team_id", teamId),
    supabase
      .from("vehicle_events")
      .select(
        "*, reporter:reported_by_id(first_name, last_name), resolver:resolved_by_id(first_name, last_name), attachments:vehicle_event_attachments(*)"
      )
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false }),
  ]);

  const initialEvents = (eventsResult.data || []).map((event) => ({
    ...event,
    reporter: Array.isArray(event.reporter)
      ? event.reporter[0]
      : event.reporter,
    resolver: Array.isArray(event.resolver)
      ? event.resolver[0]
      : event.resolver,
  }));

  return (
    <VehicleDetailPage
      initialVehicle={vehicle as Vehicle}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      initialEvents={(initialEvents as VehicleEvent[]) || []}
      isCurrentUserAdmin={isCurrentUserAdmin}
      currentUserId={user.id}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Vehicle,
  TeamMember,
  VehicleEvent,
  VehicleMileageLog,
  VehicleActivityLog,
} from "@/lib/types";
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

  const { data: vehicle, error } = await supabase
    .from("vehicles_with_details")
    .select("*")
    .eq("id", vehicleId)
    .eq("team_id", teamId)
    .single();

  if (error || !vehicle) {
    console.error("Error fetching vehicle:", error);
    notFound();
  }

  const [teamMembersResult, eventsResult, mileageResult, activityLogResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("team_id", teamId),
      // UPDATED: This query is now explicit and will not fail
      supabase
        .from("vehicle_events")
        .select(
          "*, reporter:reported_by_id(first_name, last_name), resolver:resolved_by_id(first_name, last_name), attachments:vehicle_event_attachments(*)"
        )
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_mileage_logs")
        .select("*, user:profiles(first_name, last_name)")
        .eq("vehicle_id", vehicleId)
        .order("journey_date", { ascending: false }),
      supabase
        .from("event_log_vehicles")
        .select(
          "event_log:event_logs!inner(*, project:projects(id, name), created_by:profiles(first_name, last_name))"
        )
        .eq("vehicle_id", vehicleId)
        .order("created_at", {
          referencedTable: "event_logs",
          ascending: false,
        }),
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

  const initialMileageLogs = (mileageResult.data || []).map((log) => ({
    ...log,
    user: Array.isArray(log.user) ? log.user[0] : log.user,
  }));

  const initialActivityLog = (activityLogResult.data || []).map((log) => ({
    ...log,
    event_log: Array.isArray(log.event_log) ? log.event_log[0] : log.event_log,
  }));

  return (
    <VehicleDetailPage
      initialVehicle={vehicle as Vehicle}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      initialEvents={initialEvents as VehicleEvent[]}
      initialMileageLogs={initialMileageLogs as VehicleMileageLog[]}
      initialActivityLog={initialActivityLog as VehicleActivityLog[]}
      isCurrentUserAdmin={isCurrentUserAdmin}
      currentUserId={user.id}
    />
  );
}

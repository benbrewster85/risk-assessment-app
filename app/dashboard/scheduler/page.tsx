import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SchedulerClientPage from "@/components/SchedulerClientPage";
import { TeamMember, Vehicle, ScheduleEvent } from "@/lib/types";
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

type SchedulerPageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function SchedulerPage({
  searchParams,
}: SchedulerPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  if (!profile?.team_id) {
    return (
      <p className="p-8">You must be part of a team to view the scheduler.</p>
    );
  }
  const teamId = profile.team_id;

  // Determine the week to display from the URL, or default to the current week
  const weekQuery = searchParams.week as string | undefined;
  const currentWeek = weekQuery ? parseISO(weekQuery) : new Date();
  const weekStart = format(
    startOfWeek(currentWeek, { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const weekEnd = format(
    endOfWeek(currentWeek, { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );

  // Fetch all staff, vehicles, and events for the selected week
  const [eventsResult, staffResult, vehiclesResult] = await Promise.all([
    supabase
      .from("schedule_events")
      .select(
        "*, project:projects(name), personnel:schedule_event_personnel(user_id), vehicles:schedule_event_vehicles(vehicle_id)"
      )
      .eq("team_id", teamId)
      .gte("start_date", weekStart)
      .lte("start_date", weekEnd),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("team_id", teamId)
      .order("first_name"),
    supabase
      .from("vehicles")
      .select("id, registration_number, model")
      .eq("team_id", teamId)
      .order("registration_number"),
  ]);

  return (
    <SchedulerClientPage
      initialEvents={(eventsResult.data as ScheduleEvent[]) || []}
      staff={(staffResult.data as TeamMember[]) || []}
      vehicles={(vehiclesResult.data as Vehicle[]) || []}
      initialWeek={currentWeek}
    />
  );
}

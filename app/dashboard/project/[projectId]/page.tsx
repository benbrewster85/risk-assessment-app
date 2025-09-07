import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Project,
  RiskAssessmentListItem,
  DynamicRisk,
  EventLog,
  Task,
  TeamMember,
} from "@/lib/types";
import ProjectClientPage from "@/components/ProjectClientPage";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: { projectId: string };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = createClient();
  const { projectId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  const [
    raResult,
    dynamicRisksResult,
    shiftReportsResult,
    tasksResult,
    teamMembersResult,
  ] = await Promise.all([
    supabase
      .from("risk_assessments")
      .select("id, name, description, created_at")
      .eq("project_id", projectId),
    supabase
      .from("dynamic_risks")
      .select("*, logged_by:profiles(first_name, last_name)")
      .eq("project_id", projectId)
      .order("logged_at", { ascending: false }),
    supabase
      .from("event_logs")
      .select(
        "*, created_by:profiles(first_name, last_name, id), project:projects(id, name)"
      )
      .eq("project_id", projectId)
      .order("start_time", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("team_id", project.team_id),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const currentUserRole = profile?.role || "user";

  // ✅ 1. Read the Mapbox token from your environment variables here
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  return (
    <ProjectClientPage
      initialProject={project as Project}
      initialRiskAssessments={(raResult.data as RiskAssessmentListItem[]) || []}
      initialDynamicRisks={(dynamicRisksResult.data as DynamicRisk[]) || []}
      initialShiftReports={(shiftReportsResult.data as EventLog[]) || []}
      initialTasks={(tasksResult.data as Task[]) || []}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
      mapboxToken={mapboxToken} // ✅ 2. Pass the token as a prop here
    />
  );
}

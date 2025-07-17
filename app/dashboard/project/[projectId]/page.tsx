import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Project,
  RiskAssessmentListItem,
  DynamicRisk,
  EventLog,
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

  // Fetch the project's related data in parallel
  const [raResult, dynamicRisksResult, shiftReportsResult] = await Promise.all([
    supabase
      .from("risk_assessments")
      .select("id, name, description, created_at")
      .eq("project_id", projectId),
    supabase
      .from("dynamic_risks")
      .select("*, logged_by:profiles(first_name, last_name)")
      .eq("project_id", projectId)
      .order("logged_at", { ascending: false }),
    // NEW: Fetch shift reports for this project
    supabase
      .from("event_logs")
      .select(
        "*, created_by:profiles(first_name, last_name), project:projects(name)"
      )
      .eq("project_id", projectId)
      .order("start_time", { ascending: false }),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const currentUserRole = profile?.role || "user";

  return (
    <ProjectClientPage
      initialProject={project as Project}
      initialRiskAssessments={(raResult.data as RiskAssessmentListItem[]) || []}
      initialDynamicRisks={(dynamicRisksResult.data as DynamicRisk[]) || []}
      initialShiftReports={(shiftReportsResult.data as EventLog[]) || []}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
    />
  );
}

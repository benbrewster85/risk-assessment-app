import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProjectClientPage from "@/components/ProjectClientPage";
import { Project, RiskAssessmentListItem, DynamicRisk } from "@/lib/types";

type ProjectPageProps = {
  params: {
    projectId: string;
  };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = createClient();
  const { projectId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return notFound();
  }

  const [projectResult, raResult, dynamicRisksResult, profileResult] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("risk_assessments")
        .select("id, name, description, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("dynamic_risks")
        .select("*, logged_by:profiles(first_name, last_name)")
        .eq("project_id", projectId)
        .order("logged_at", { ascending: false }),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  const currentUserRole = profileResult.data?.role || "user";

  return (
    <ProjectClientPage
      initialProject={projectResult.data as Project}
      initialRiskAssessments={(raResult.data as RiskAssessmentListItem[]) || []}
      initialDynamicRisks={(dynamicRisksResult.data as DynamicRisk[]) || []}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProjectListItem, TeamMember } from "@/lib/types";
import ProjectListPage from "@/components/ProjectListPage";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
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

  if (!profile?.team_id) {
    return <p className="p-8">You must be part of a team to view projects.</p>;
  }

  const teamId = profile.team_id;
  const currentUserRole = profile.role || "user";

  // This block now correctly fetches both projects and team members in parallel
  const [projectsResult, teamMembersResult] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("team_id", teamId)
      .order("last_edited_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("team_id", teamId),
  ]);

  return (
    <ProjectListPage
      initialProjects={(projectsResult.data as ProjectListItem[]) || []}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      currentUserRole={currentUserRole}
      teamId={teamId}
    />
  );
}

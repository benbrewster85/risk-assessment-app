import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectListPage from "@/components/ProjectListPage";
import { ProjectListItem } from "@/lib/types";

export default async function ProjectsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile to get both role and team_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id")
    .eq("id", user.id)
    .single();

  const currentUserRole = profile?.role || "user";
  const teamId = profile?.team_id || null; // Get the teamId

  // Fetch the projects list
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, reference, last_edited_at")
    .eq("team_id", teamId) // Only fetch projects for this user's team
    .order("last_edited_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects on server:", error);
    return (
      <ProjectListPage
        initialProjects={[]}
        currentUserRole={currentUserRole}
        teamId={teamId}
      />
    );
  }

  // Render the client component, passing the user's role AND teamId
  return (
    <ProjectListPage
      initialProjects={projects as ProjectListItem[]}
      currentUserRole={currentUserRole}
      teamId={teamId}
    />
  );
}

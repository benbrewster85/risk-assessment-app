import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectListPage from "@/components/ProjectListPage"; // Import the renamed component
import { ProjectListItem } from "@/lib/types";

export default async function ProjectsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch the projects list and the user's role
  const [projectsResult, profileResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, reference, last_edited_at")
      .order("last_edited_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const projects = projectsResult.data || [];
  const currentUserRole = profileResult.data?.role || "user";

  if (projectsResult.error) {
    console.error("Error fetching projects on server:", projectsResult.error);
    return (
      <ProjectListPage initialProjects={[]} currentUserRole={currentUserRole} />
    );
  }

  // Render the client component with the pre-fetched data
  return (
    <ProjectListPage
      initialProjects={projects as ProjectListItem[]}
      currentUserRole={currentUserRole}
    />
  );
}

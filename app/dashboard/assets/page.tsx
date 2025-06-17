import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssetListPage from "@/components/AssetListPage";
import { Asset, TeamMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
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
  const currentUserRole = profile?.role || "user";

  // UPDATED: Now queries our simple and powerful view
  const [assetsResult, categoriesResult, teamMembersResult] = await Promise.all(
    [
      supabase
        .from("assets_with_details")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false }),
      supabase
        .from("asset_categories")
        .select("*")
        .eq("team_id", teamId)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("team_id", teamId)
        .order("first_name"),
    ]
  );

  return (
    <AssetListPage
      initialAssets={(assetsResult.data as Asset[]) || []}
      categories={categoriesResult.data || []}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      teamId={teamId}
      isCurrentUserAdmin={currentUserRole === "team_admin"}
    />
  );
}

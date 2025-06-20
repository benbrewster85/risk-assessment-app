import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssetListPage from "@/components/AssetListPage";
import { Asset, TeamMember, AssetCategory } from "@/lib/types";

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

  // Fetch assets, categories, team members, and the new asset statuses all at once
  const [assetsResult, categoriesResult, teamMembersResult, statusesResult] =
    await Promise.all([
      supabase
        .from("assets_with_details")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false }),
      supabase
        .from("asset_categories")
        .select("id, name")
        .eq("team_id", teamId)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("team_id", teamId)
        .order("first_name"),
      supabase
        .from("asset_statuses")
        .select("id, name")
        .eq("team_id", teamId)
        .order("name"),
    ]);

  return (
    <AssetListPage
      initialAssets={(assetsResult.data as Asset[]) || []}
      categories={categoriesResult.data || []}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      assetStatuses={statusesResult.data || []}
      teamId={teamId}
      isCurrentUserAdmin={currentUserRole === "team_admin"}
    />
  );
}

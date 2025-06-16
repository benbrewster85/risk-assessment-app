import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssetListPage from "@/components/AssetListPage";
import { Asset, TeamMember } from "@/lib/types";

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

  const [assetsResult, categoriesResult, teamMembersResult] = await Promise.all(
    [
      // UPDATED: This query is now more powerful to get parent data
      supabase
        .from("assets")
        .select(
          "*, category:asset_categories(name), assignee:profiles(first_name, last_name), parent:assets!parent_asset_id(assignee:profiles(first_name, last_name))"
        )
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

  // This transformation handles Supabase's nested data structure
  const initialAssets = (assetsResult.data || []).map((asset) => ({
    ...asset,
    category: Array.isArray(asset.category)
      ? asset.category[0]
      : asset.category,
    assignee: Array.isArray(asset.assignee)
      ? asset.assignee[0]
      : asset.assignee,
    parent: Array.isArray(asset.parent) ? asset.parent[0] : asset.parent,
  }));

  return (
    <AssetListPage
      initialAssets={initialAssets as Asset[]}
      categories={categoriesResult.data || []}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      teamId={teamId}
      isCurrentUserAdmin={currentUserRole === "team_admin"}
    />
  );
}

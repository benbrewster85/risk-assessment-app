import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AssetDetailPage from "@/components/AssetDetailPage";
import { Asset, TeamMember } from "@/lib/types";

type AssetPageProps = {
  params: { assetId: string };
};

export default async function AssetPage({ params }: AssetPageProps) {
  const supabase = createClient();
  const { assetId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) notFound();
  const teamId = profile.team_id;
  const currentUserRole = profile.role;

  // UPDATED: The select query now fetches more parent details
  const [
    assetResult,
    teamMembersResult,
    childAssetsResult,
    availableAssetsResult,
  ] = await Promise.all([
    supabase
      .from("assets")
      .select(
        "*, category:asset_categories(name), assignee:profiles(first_name, last_name), parent:assets!parent_asset_id(id, system_id)"
      )
      .eq("id", assetId)
      .single(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("team_id", teamId),
    supabase
      .from("assets")
      .select("id, system_id, model")
      .eq("parent_asset_id", assetId),
    supabase
      .from("assets")
      .select("id, system_id, model")
      .eq("team_id", teamId)
      .is("parent_asset_id", null)
      .is("current_assignee_id", null)
      .neq("id", assetId),
  ]);

  if (assetResult.error || !assetResult.data) {
    notFound();
  }

  const initialAsset = {
    ...assetResult.data,
    category: Array.isArray(assetResult.data.category)
      ? assetResult.data.category[0]
      : assetResult.data.category,
    assignee: Array.isArray(assetResult.data.assignee)
      ? assetResult.data.assignee[0]
      : assetResult.data.assignee,
    parent: Array.isArray(assetResult.data.parent)
      ? assetResult.data.parent[0]
      : assetResult.data.parent,
  };

  return (
    <AssetDetailPage
      initialAsset={initialAsset as Asset}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      childAssets={childAssetsResult.data || []}
      availableAssets={availableAssetsResult.data || []}
      isCurrentUserAdmin={currentUserRole === "team_admin"}
    />
  );
}

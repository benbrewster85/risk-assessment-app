import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AssetDetailPage from "@/components/AssetDetailPage";
import { Asset, TeamMember } from "@/lib/types";

// This line tells Next.js to always treat this page as dynamic and fetch fresh data
export const dynamic = "force-dynamic";

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

  // UPDATED: This now queries our 'assets_with_details' view to get all data
  const { data: assetResult, error: assetError } = await supabase
    .from("assets_with_details")
    .select("*")
    .eq("id", assetId)
    .eq("team_id", teamId)
    .single();

  if (assetError || !assetResult) {
    if (assetError) console.error("Error fetching asset details:", assetError);
    notFound();
  }

  // Fetch other related data needed for the page
  const [teamMembersResult, childAssetsResult, availableAssetsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
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

  return (
    <AssetDetailPage
      initialAsset={assetResult as Asset}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      childAssets={childAssetsResult.data || []}
      availableAssets={availableAssetsResult.data || []}
      isCurrentUserAdmin={currentUserRole === "team_admin"}
    />
  );
}

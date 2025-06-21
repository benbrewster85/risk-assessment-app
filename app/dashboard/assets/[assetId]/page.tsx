import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AssetDetailPage from "@/components/AssetDetailPage";
import { Asset, TeamMember, AssetIssue } from "@/lib/types";

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

  const { data: assetResult, error: assetError } = await supabase
    .from("assets_with_details")
    .select("*")
    .eq("id", assetId)
    .eq("team_id", teamId)
    .single();
  if (assetError) {
    console.error("Error fetching asset details:", assetError);
    notFound();
  }

  const [
    teamMembersResult,
    childAssetsResult,
    availableAssetsResult,
    statusesResult,
    issuesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("team_id", teamId)
      .order("first_name"),
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
    supabase
      .from("asset_statuses")
      .select("id, name")
      .eq("team_id", teamId)
      .order("name"),
    supabase
      .from("asset_issues")
      .select(
        "*, reporter:reported_by_id(first_name, last_name), resolver:resolved_by_id(first_name, last_name), photos:asset_issue_photos(id, file_path)"
      )
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false }),
  ]);

  const initialIssues = (issuesResult.data || []).map((issue) => ({
    ...issue,
    reporter: Array.isArray(issue.reporter)
      ? issue.reporter[0]
      : issue.reporter,
    resolver: Array.isArray(issue.resolver)
      ? issue.resolver[0]
      : issue.resolver,
  }));

  return (
    // The AssetDetailPage now handles all its own UI rendering
    <AssetDetailPage
      initialAsset={assetResult as Asset}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      childAssets={childAssetsResult.data || []}
      availableAssets={availableAssetsResult.data || []}
      assetStatuses={statusesResult.data || []}
      initialIssues={initialIssues as AssetIssue[]}
      isCurrentUserAdmin={currentUserRole === "team_admin"}
      currentUserId={user.id}
    />
  );
}

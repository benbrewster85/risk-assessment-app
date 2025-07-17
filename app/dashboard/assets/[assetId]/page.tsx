import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AssetDetailPage from "@/components/AssetDetailPage";
import {
  Asset,
  TeamMember,
  AssetIssue,
  AssetActivityLog,
  EventLog,
} from "@/lib/types";
import AssetQrCode from "@/components/AssetQrCode";
import { Printer } from "react-feather";

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

  // UPDATED: This query now correctly fetches the activity log for assets
  const [
    teamMembersResult,
    childAssetsResult,
    availableAssetsResult,
    statusesResult,
    issuesResult,
    activityLogResult,
  ] = await Promise.all([
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
    supabase
      .from("asset_statuses")
      .select("id, name")
      .eq("team_id", teamId)
      .order("name"),
    supabase
      .from("asset_issues")
      .select(
        "*, reporter:reported_by_id(*), resolver:resolved_by_id(*), photos:asset_issue_photos(*)"
      )
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_log_assets")
      .select(
        "event_log:event_logs!inner(*, project:projects(id, name), created_by:profiles(first_name, last_name))"
      )
      .eq("asset_id", assetId)
      .order("created_at", { referencedTable: "event_logs", ascending: false }),
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
  const initialActivityLog = (activityLogResult.data || []).map((log) => ({
    ...log,
    event_log: Array.isArray(log.event_log) ? log.event_log[0] : log.event_log,
  }));

  return (
    <AssetDetailPage
      initialAsset={assetResult as Asset}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      childAssets={childAssetsResult.data || []}
      availableAssets={availableAssetsResult.data || []}
      assetStatuses={statusesResult.data || []}
      initialIssues={initialIssues as AssetIssue[]}
      initialActivityLog={initialActivityLog as AssetActivityLog[]}
      isCurrentUserAdmin={currentUserRole === "team_admin"}
      currentUserId={user.id}
    />
  );
}

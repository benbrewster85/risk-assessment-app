// app/action-items/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActionItems from "@/components/ActionItems"; // Your existing component
import { Asset, AssetIssue } from "@/lib/types";

export default async function ActionItemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Open Issues (full data)
  const { data: openIssues } = await supabase
    .rpc("get_my_actionable_issues")
    .select("*, asset:assets(system_id)");

  // 2. Fetch Assets for calibration checks
  const { data: ownedCategories } = await supabase
    .from("asset_categories")
    .select("id")
    .eq("owner_id", user.id);

  let calibrationAssets: Asset[] = [];
  if (ownedCategories && ownedCategories.length > 0) {
    const categoryIds = ownedCategories.map((c) => c.id);
    const { data: assets } = await supabase
      .from("assets_with_details")
      .select("*")
      .in("category_id", categoryIds);
    if (assets) {
      calibrationAssets = assets as Asset[];
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Action Items</h1>
        {/* We are now using your component on its own dedicated page */}
        <ActionItems
          assets={calibrationAssets}
          openIssues={(openIssues as AssetIssue[]) || []}
        />
      </div>
    </div>
  );
}

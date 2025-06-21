import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActionItems from "@/components/ActionItems";
import { Asset, AssetIssue } from "@/lib/types";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Find all categories owned by the current user
  const { data: ownedCategories } = await supabase
    .from("asset_categories")
    .select("id")
    .eq("owner_id", user.id);

  let calibrationAssets: Asset[] = [];
  if (ownedCategories && ownedCategories.length > 0) {
    const categoryIds = ownedCategories.map((c) => c.id);

    // 2. If the user owns categories, fetch assets within them for calibration checks
    const { data: assets } = await supabase
      .from("assets_with_details")
      .select("*")
      .in("category_id", categoryIds);

    if (assets) {
      calibrationAssets = assets as Asset[];
    }
  }

  // 3. Separately, call our function to get actionable issues
  const { data: openIssues } = await supabase
    .rpc("get_my_actionable_issues")
    .select("*, asset:assets(system_id)"); // Join the asset system_id

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <ActionItems
          assets={calibrationAssets}
          openIssues={(openIssues as AssetIssue[]) || []}
        />

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Welcome!</h2>
          <p className="text-gray-500">
            Use the sidebar navigation to manage your projects, teams, and
            assets.
          </p>
        </div>
      </div>
    </div>
  );
}

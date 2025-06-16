import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalibrationAlerts from "@/components/CalibrationAlerts";
import { Asset } from "@/lib/types";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Find all categories owned by the current user
  const { data: ownedCategories } = await supabase
    .from("asset_categories")
    .select("id")
    .eq("owner_id", user.id);

  let relevantAssets: Asset[] = [];

  // If the user owns any categories, fetch all assets within those categories
  if (ownedCategories && ownedCategories.length > 0) {
    const categoryIds = ownedCategories.map((c) => c.id);

    const { data: assets } = await supabase
      .from("assets")
      .select(
        "*, category:asset_categories(name), assignee:profiles(first_name, last_name)"
      )
      .in("category_id", categoryIds);

    if (assets) {
      relevantAssets = assets.map((asset) => ({
        ...asset,
        category: Array.isArray(asset.category)
          ? asset.category[0]
          : asset.category,
        assignee: Array.isArray(asset.assignee)
          ? asset.assignee[0]
          : asset.assignee,
      })) as Asset[];
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* The CalibrationAlerts component will only render if there are items to show */}
        <CalibrationAlerts assets={relevantAssets} />

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

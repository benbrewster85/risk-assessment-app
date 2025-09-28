// app/action-items/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActionItems from "@/components/ActionItems";
import { Asset, AssetIssue, Vehicle, VehicleEvent } from "@/lib/types";

// A type to match the JSON structure from our new SQL function
type ActionItemsData = {
  open_asset_issues: AssetIssue[];
  open_vehicle_issues: VehicleEvent[];
  assets_requiring_calibration: Asset[];
  vehicles_requiring_mot: Vehicle[];
};

export default async function ActionItemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // A single, efficient call to get all action items
  const { data, error } = await supabase.rpc("get_my_action_items");

  if (error) {
    console.error("Error fetching action items:", error);
    // Handle the error appropriately, maybe show an error message
  }

  // Use a default empty structure if data is null
  const actionItems: ActionItemsData = data || {
    open_asset_issues: [],
    open_vehicle_issues: [],
    assets_requiring_calibration: [],
    vehicles_requiring_mot: [],
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Action Items</h1>
        <ActionItems
          assetIssues={actionItems.open_asset_issues}
          vehicleIssues={actionItems.open_vehicle_issues}
          assetsForCalibration={actionItems.assets_requiring_calibration}
          vehiclesForMot={actionItems.vehicles_requiring_mot}
        />
      </div>
    </div>
  );
}

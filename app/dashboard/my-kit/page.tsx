// app/dashboard/my-kit/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Asset } from "@/lib/types";
import MyKitList from "@/components/MyKitList"; // We will create this next

export default async function MyKitPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all assets where the current_assignee_id matches the logged-in user's ID
  const today = new Date().toISOString().split("T")[0];

  const { data: assignedAssets, error } = await supabase.rpc("get_my_kit_bag", {
    p_date: today,
  });

  if (error) {
    console.error("Error fetching assigned assets:", error);
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Assigned Kit</h1>
        <MyKitList assets={(assignedAssets as Asset[]) || []} />
      </div>
    </div>
  );
}

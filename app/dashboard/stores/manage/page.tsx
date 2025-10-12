import { ConsumablesManagePage } from "@/components/ConsumablesManagePage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  StoreCategory,
  StoreLocation,
  StoreProduct,
  InventoryItem,
  OrderRequest,
} from "@/lib/types";

export default async function ManageStoresPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id, is_storesperson")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "team_admin" && !profile?.is_storesperson) {
    return (
      <div className="p-6">
        <h1 className="text-xl text-red-600">Access Denied</h1>
        <p>You do not have permission to manage the stores.</p>
      </div>
    );
  }

  const { data: locations } = await supabase
    .from("store_locations")
    .select("*")
    .eq("team_id", profile.team_id);
  const { data: categories } = await supabase
    .from("store_categories")
    .select("*")
    .eq("team_id", profile.team_id);
  const { data: products } = await supabase
    .from("store_products")
    .select("*")
    .eq("team_id", profile.team_id);
  const { data: items } = await supabase
    .from("inventory_items")
    .select(
      "*, store_locations(name), store_products(*, store_categories(name))"
    )
    .eq("team_id", profile.team_id);

  const { data: transactions } = await supabase
    .from("inventory_transactions")
    .select(
      `
      *,
      inventory_items (
        variant_name,
        store_products ( name )
      ),
      profiles ( first_name, last_name )
    `
    )
    .in(
      "item_id",
      (items || []).map((i) => i.id)
    ) // Only get transactions for this team's items
    .order("created_at", { ascending: false });

  const { data: orders, error } = await supabase
    .from("order_requests")
    .select(
      `
      *, 
      profiles:profiles!order_requests_requested_by_id_fkey(first_name, last_name),
      inventory_items(variant_name, store_products(name))
    `
    )
    .eq("team_id", profile.team_id)
    .order("created_at", { ascending: false });

  const defaultTab = searchParams.tab || "library";

  return (
    <ConsumablesManagePage
      initialLocations={(locations as StoreLocation[]) || []}
      initialCategories={(categories as StoreCategory[]) || []}
      initialProducts={(products as StoreProduct[]) || []}
      initialItems={(items as InventoryItem[]) || []}
      initialTransactions={transactions || []}
      initialOrders={(orders as OrderRequest[]) || []}
      defaultTab={defaultTab}
    />
  );
}

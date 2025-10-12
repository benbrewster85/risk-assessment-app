// In /app/dashboard/stores/page.tsx

import { createClient } from "@/lib/supabase/server";
import { ConsumablesListPage } from "@/components/ConsumablesListPage";
import {
  StoreLocation,
  InventoryItem,
  CategoryWithProducts,
} from "@/lib/types";

// The helper function remains the same.
const groupItemsByLocationAndCategory = (items: InventoryItem[]) => {
  const locationsMap: Map<
    string,
    { location: StoreLocation; categories: Map<string, CategoryWithProducts> }
  > = new Map();
  items.forEach((item) => {
    const location = item.store_locations;
    const product = item.store_products;
    const category = product.store_categories;
    if (!locationsMap.has(location.id)) {
      locationsMap.set(location.id, {
        location: location,
        categories: new Map(),
      });
    }
    const locData = locationsMap.get(location.id)!;
    if (!locData.categories.has(category.id)) {
      locData.categories.set(category.id, { ...category, products: [] });
    }
    const catData = locData.categories.get(category.id)!;
    let existingProduct = catData.products.find((p) => p.id === product.id);
    if (!existingProduct) {
      existingProduct = { ...product, items: [] };
      catData.products.push(existingProduct);
    }
    existingProduct.items.push(item);
  });
  return Array.from(locationsMap.values());
};

export default async function StoresPage() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // This case should ideally be handled by your middleware, but it's good practice to check.
    return <div>Please log in to view this page.</div>;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching user profile:", profileError);
    return <div>Could not load your user profile.</div>;
  }

  const teamId = profile.team_id;

  if (!teamId) {
    return (
      <div>
        Team not found. Your user profile is not associated with a team.
      </div>
    );
  }

  // --- START: CORRECTED QUERY ---
  const { data: items, error: itemsError } = await supabase
    .from("inventory_items")
    .select(
      `
      *,
      store_locations!inner (*),
      store_products!inner (
        *,
        store_categories!inner (*)
      )
    `
    )
    .eq("team_id", teamId)
    // FIX: Specify the path to the nested table for ordering.
    .order("name", { referencedTable: "store_products.store_categories" })
    .order("name", { referencedTable: "store_products" })
    .order("variant_name");
  // --- END: CORRECTED QUERY ---

  if (itemsError) {
    console.error("Error fetching inventory:", itemsError);
    return <div>Error loading inventory.</div>;
  }

  const locationsData = groupItemsByLocationAndCategory(items || []);

  const { data: allLocations } = await supabase
    .from("store_locations")
    .select("*")
    .eq("team_id", teamId);

  return (
    <ConsumablesListPage
      initialData={locationsData}
      allLocations={allLocations || []}
    />
  );
}

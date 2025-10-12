"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InventoryItem, StoreLocation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface Props {
  initialItems: InventoryItem[];
  initialLocations: StoreLocation[];
}

export function StockTake({ initialItems, initialLocations }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [changes, setChanges] = useState<Record<string, number>>({});

  const itemsInLocation = useMemo(() => {
    return initialItems.filter(
      (item) => item.location_id === selectedLocationId
    );
  }, [initialItems, selectedLocationId]);

  const handleQuantityChange = (itemId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      setChanges((prev) => ({ ...prev, [itemId]: quantity }));
    }
  };

  const handleSave = async () => {
    const changedItems = Object.keys(changes);
    if (changedItems.length === 0) {
      toast.error("No changes to save.");
      return;
    }

    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Authentication error.");
      setIsLoading(false);
      return;
    }

    const updatePromises = changedItems.map((itemId) =>
      supabase.rpc("handle_inventory_transaction", {
        item_id_in: itemId,
        user_id_in: user.id,
        type_in: "stock_take",
        quantity_change_in: changes[itemId],
        notes_in: "Routine stock take",
      })
    );

    const results = await Promise.all(updatePromises);
    const failedUpdates = results.filter((res) => res.error);

    setIsLoading(false);
    if (failedUpdates.length > 0) {
      toast.error(
        `Failed to update ${failedUpdates.length} item(s). Please check the console.`
      );
      console.error(
        "Failed updates:",
        failedUpdates.map((f) => f.error)
      );
    } else {
      toast.success(`${changedItems.length} item(s) updated successfully!`);
      setChanges({});
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perform Stock Take</CardTitle>
        <div className="pt-4 max-w-sm">
          <Label>Select a location to begin</Label>
          <Select
            value={selectedLocationId}
            onValue-change={setSelectedLocationId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a location..." />
            </SelectTrigger>
            <SelectContent>
              {initialLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {selectedLocationId ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {itemsInLocation.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-3 items-center gap-4"
                >
                  <Label htmlFor={item.id} className="col-span-2">
                    {item.store_products.name} - {item.variant_name}
                  </Label>

                  {/* FIX: Group the input and the unit together for better alignment */}
                  <div className="flex items-center gap-2">
                    <Input
                      id={item.id}
                      type="number"
                      min="0"
                      placeholder={String(item.quantity_on_hand)}
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                      className="text-right"
                    />
                    <span
                      className="text-sm text-muted-foreground w-16 truncate"
                      title={item.unit_of_measure}
                    >
                      {item.unit_of_measure}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Stock Take"}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Select a location to view its inventory.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

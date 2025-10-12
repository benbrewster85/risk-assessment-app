"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import {
  InventoryItem,
  StoreLocation,
  StoreCategory,
  StoreProduct,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: InventoryItem | null;
  locations: StoreLocation[];
  categories: StoreCategory[];
  products: StoreProduct[];
}

export function ItemModal({
  isOpen,
  onClose,
  itemToEdit,
  locations,
  categories,
  products,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [productChoice, setProductChoice] = useState("existing");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      productId: itemToEdit?.product_id || "",
      newProductName: "",
      categoryId: itemToEdit?.store_products.category_id || "",
      variantName: itemToEdit?.variant_name || "",
      locationId: itemToEdit?.location_id || "",
      quantity: itemToEdit?.quantity_on_hand || 0,
      unit: itemToEdit?.unit_of_measure || "EA",
      reorderLevel: itemToEdit?.reorder_level || 0,
    },
  });

  const isNewProduct = productChoice === "new";

  const onSubmit = async (formData: any) => {
    try {
      let finalProductId = formData.productId;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      if (isNewProduct) {
        if (!formData.newProductName || !formData.categoryId) {
          toast.error("New product name and category are required.");
          return;
        }
        const { data: newProduct, error } = await supabase
          .from("store_products")
          .insert({
            name: formData.newProductName,
            category_id: formData.categoryId,
            team_id: profile.team_id,
          })
          .select()
          .single();
        if (error) throw error;
        finalProductId = newProduct.id;
      }

      if (!finalProductId) {
        toast.error("Please select or create a product.");
        return;
      }

      // Step 2: Upsert the inventory item
      const inventoryItemData = {
        id: itemToEdit?.id,
        product_id: finalProductId,
        variant_name: formData.variantName,
        location_id: formData.locationId,
        unit_of_measure: formData.unit,
        reorder_level: formData.reorderLevel,
        // FIX: Set quantity to 0 for new items. The transaction will set the correct value.
        // For existing items, this value doesn't matter as the RPC function will handle the update.
        quantity_on_hand: itemToEdit ? formData.quantity : 0,
        team_id: profile.team_id,
      };

      const { data: savedItem, error: itemError } = await supabase
        .from("inventory_items")
        .upsert(inventoryItemData)
        .select()
        .single();
      if (itemError) throw itemError;

      // Step 3: Log the stock change as a transaction
      if (!itemToEdit || itemToEdit.quantity_on_hand !== formData.quantity) {
        const transactionType = itemToEdit ? "stock_take" : "initial";
        const newQuantity = formData.quantity;

        // For 'initial' transactions, the RPC adds the value.
        // For 'stock_take', the RPC sets the value. Let's make the RPC handle 'initial' the same way.
        await supabase.rpc("handle_inventory_transaction", {
          item_id_in: savedItem.id,
          user_id_in: user.id,
          type_in: transactionType,
          // For both initial and stock_take, we pass the absolute new quantity.
          quantity_change_in: newQuantity,
          notes_in: itemToEdit
            ? "Manual stock adjustment"
            : "Initial stock take",
        });
      }

      toast.success("Inventory item saved!");
      router.refresh();
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{itemToEdit ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            Add or edit an item in your inventory. The initial quantity will be
            logged as a stock take.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6"
        >
          {!itemToEdit && (
            <RadioGroup
              defaultValue="existing"
              onValueChange={setProductChoice}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="r1" />
                <Label htmlFor="r1">Use Existing Product</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="r2" />
                <Label htmlFor="r2">Create New Product</Label>
              </div>
            </RadioGroup>
          )}

          {isNewProduct ? (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
              <div>
                <Label>New Product Name</Label>
                <Input {...register("newProductName")} />
              </div>
              <div>
                <Label>Category</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>Product</Label>
              <Controller
                name="productId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!itemToEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Variant Name (e.g., 10mm, Blue)</Label>
              <Input {...register("variantName", { required: true })} />
            </div>
            <div>
              <Label>Location</Label>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                {...register("quantity", { valueAsNumber: true, min: 0 })}
                disabled={!!itemToEdit}
              />
            </div>
            <div>
              <Label>Unit (EA, Box, Bag)</Label>
              <Input {...register("unit")} />
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input
                type="number"
                {...register("reorderLevel", { valueAsNumber: true, min: 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

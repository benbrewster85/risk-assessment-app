"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 1. Import useRouter
import { createClient } from "@/lib/supabase/client"; // 2. Import Supabase client
import {
  InventoryItem,
  StoreLocation,
  StoreCategory,
  StoreProduct,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, PlusCircle, Trash } from "lucide-react";
import { ItemModal } from "./modals/ItemModal";
import { ConfirmDeleteDialog } from "./modals/ConfirmDeleteDialog"; // 3. Import the new dialog
import toast from "react-hot-toast"; // 4. Import toast

interface Props {
  items: InventoryItem[];
  locations: StoreLocation[];
  categories: StoreCategory[];
  products: StoreProduct[];
}

export function ItemManager({ items, locations, categories, products }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null); // 5. Add state for the delete confirmation

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  // 6. This is the function that runs when the user confirms deletion in the dialog
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", itemToDelete.id);

    if (error) {
      toast.error(`Failed to delete item: ${error.message}`);
    } else {
      toast.success("Item deleted successfully.");
      router.refresh();
    }
    setItemToDelete(null); // Close the dialog
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Inventory Items</CardTitle>
          <Button size="sm" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">
                      {item.store_products.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.store_products.store_categories.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.variant_name}</TableCell>
                  <TableCell>{item.store_locations.name}</TableCell>
                  <TableCell>
                    {item.quantity_on_hand} {item.unit_of_measure}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* 7. The delete button now opens the confirmation dialog */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setItemToDelete(item)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itemToEdit={selectedItem}
          locations={locations}
          categories={categories}
          products={products}
        />
      )}

      {/* 8. Render the confirmation dialog */}
      <ConfirmDeleteDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        description={`Are you sure you want to delete "${itemToDelete?.store_products.name} - ${itemToDelete?.variant_name}"? This action cannot be undone and will also remove all associated transaction history.`}
      />
    </>
  );
}

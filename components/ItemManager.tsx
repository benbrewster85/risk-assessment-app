"use client";

import { useState } from "react";
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
import { ItemModal } from "../components/modals/ItemModal";

interface Props {
  items: InventoryItem[];
  locations: StoreLocation[];
  categories: StoreCategory[];
  products: StoreProduct[];
}

export function ItemManager({ items, locations, categories, products }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    // You can add delete logic here, similar to the LibraryManager
    alert(
      `Delete functionality for ${item.store_products.name} - ${item.variant_name} is not yet implemented.`
    );
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item)}
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
    </>
  );
}

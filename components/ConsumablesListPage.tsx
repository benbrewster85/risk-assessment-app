// In /components/ConsumablesListPage.tsx

"use client";

import { useState, useMemo } from "react";
import {
  CategoryWithProducts,
  InventoryItem,
  StoreLocation,
  StoreProduct,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Archive,
  AlertTriangle,
  ChevronsRight,
  ShoppingCart,
} from "lucide-react";
import { CheckOutModal } from "./modals/CheckOutModal";
import { RequestOrderModal } from "./modals/RequestOrderModal";

// FIX: Moved this type definition outside of the component
// so it can be used in the Props interface.
type GroupedData = {
  location: StoreLocation;
  categories: Map<string, CategoryWithProducts>;
};

interface Props {
  initialData: GroupedData[];
  allLocations: StoreLocation[];
}

export function ConsumablesListPage({ initialData, allLocations }: Props) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    allLocations[0]?.id || ""
  );
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [isRequestOrderModalOpen, setRequestOrderModalOpen] = useState(false);

  const activeLocationData = useMemo(() => {
    return initialData.find((d) => d.location.id === selectedLocationId);
  }, [initialData, selectedLocationId]);

  const filteredCategories = useMemo(() => {
    if (!activeLocationData) return [];

    // Get categories as a standard array with the correct type
    const categoriesArray: CategoryWithProducts[] = Array.from(
      activeLocationData.categories.values()
    );

    if (!searchTerm) return categoriesArray;

    const lowercasedFilter = searchTerm.toLowerCase();

    // FIX: Add explicit type `CategoryWithProducts` to the `category` parameter
    const filtered = categoriesArray
      .map((category: CategoryWithProducts) => {
        // FIX: Add explicit type to the `product` parameter
        const filteredProducts = category.products.filter(
          (product: StoreProduct & { items: InventoryItem[] }) => {
            // FIX: Add explicit type to the `item` parameter
            const hasMatchingItem = product.items.some(
              (item: InventoryItem) =>
                item.variant_name.toLowerCase().includes(lowercasedFilter) ||
                item.store_products.name
                  .toLowerCase()
                  .includes(lowercasedFilter)
            );
            return (
              product.name.toLowerCase().includes(lowercasedFilter) ||
              hasMatchingItem
            );
          }
        );
        // FIX: The spread operator now works because `category` is a known object type
        return { ...category, products: filteredProducts };
      })
      .filter((category) => category.products.length > 0);

    return filtered;
  }, [activeLocationData, searchTerm]);

  const handleCheckOut = (item: InventoryItem) => {
    setSelectedItem(item);
    setCheckOutModalOpen(true);
  };

  const handleRequestOrder = (item: InventoryItem) => {
    setSelectedItem(item);
    setRequestOrderModalOpen(true);
  };

  const handleLowStockAlert = async (item: InventoryItem) => {
    alert(`Alert sent for ${item.store_products.name} - ${item.variant_name}!`);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ... rest of the JSX is the same as before ... */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Store Consumables</h1>
        <Button onClick={() => setRequestOrderModalOpen(true)}>
          <ShoppingCart className="mr-2 h-4 w-4" /> Request Non-Stock Item
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Browse Items</CardTitle>
            <div className="pt-2">
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {allLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Input
                placeholder="Search in this location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredCategories.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {/* FIX: Add explicit type for `category` here as well */}
                {filteredCategories.map((category: CategoryWithProducts) => (
                  <AccordionItem key={category.id} value={category.id}>
                    <AccordionTrigger>{category.name}</AccordionTrigger>
                    <AccordionContent>
                      {/* FIX: Add explicit type for `product` */}
                      {category.products.map(
                        (
                          product: StoreProduct & { items: InventoryItem[] }
                        ) => (
                          <div key={product.id} className="ml-4">
                            <h4 className="font-semibold">{product.name}</h4>
                            <ul className="list-disc pl-5">
                              {/* FIX: Add explicit type for `item` */}
                              {product.items.map((item: InventoryItem) => (
                                <li
                                  key={item.id}
                                  className="cursor-pointer hover:text-primary py-1 flex justify-between items-center"
                                  onClick={() => setSelectedItem(item)}
                                >
                                  <span>{item.variant_name}</span>
                                  <span
                                    className={`font-mono text-sm px-2 py-0.5 rounded ${item.quantity_on_hand <= item.reorder_level ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                                  >
                                    {item.quantity_on_hand}{" "}
                                    {item.unit_of_measure}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground text-center">
                No items found in this location.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedItem.store_products.name} -{" "}
                    <span className="text-lg font-medium">
                      {selectedItem.variant_name}
                    </span>
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedItem.store_products.store_categories.name}
                  </p>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-mono text-center">
                    {selectedItem.quantity_on_hand}{" "}
                    <span className="text-xl">
                      {selectedItem.unit_of_measure}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    in {selectedItem.store_locations.name}
                  </p>
                </div>

                {selectedItem.quantity_on_hand <=
                  selectedItem.reorder_level && (
                  <div className="flex items-center p-2 border border-yellow-300 bg-yellow-50 text-yellow-800 rounded-md">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <p className="text-sm">
                      Stock is at or below the reorder level of{" "}
                      {selectedItem.reorder_level}.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button onClick={() => handleCheckOut(selectedItem)}>
                    <Archive className="mr-2 h-4 w-4" /> Check Out
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRequestOrder(selectedItem)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Request Order
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleLowStockAlert(selectedItem)}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Flag Low Stock
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ChevronsRight className="h-10 w-10 mb-2" />
                <p>Select an item from the list to see details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isCheckOutModalOpen && selectedItem && (
        <CheckOutModal
          item={selectedItem}
          isOpen={isCheckOutModalOpen}
          onClose={() => setCheckOutModalOpen(false)}
        />
      )}

      <RequestOrderModal
        item={selectedItem}
        isOpen={isRequestOrderModalOpen}
        onClose={() => {
          setRequestOrderModalOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}

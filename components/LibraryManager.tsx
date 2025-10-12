"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StoreCategory, StoreLocation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, PlusCircle, Trash } from "lucide-react";
import { LibraryItemModal } from "./modals/LibraryItemModal";
import toast from "react-hot-toast";

interface Props {
  locations: StoreLocation[];
  categories: StoreCategory[];
}

type Item = { id?: string; name: string };
type ItemType = "location" | "category";
type TableName = "store_locations" | "store_categories";

export function LibraryManager({ locations, categories }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [currentItemType, setCurrentItemType] = useState<ItemType>("location");
  const [currentTable, setCurrentTable] =
    useState<TableName>("store_locations");
  const supabase = createClient();
  const router = useRouter();

  const handleOpenModal = (
    item: Item | null,
    type: ItemType,
    table: TableName
  ) => {
    setCurrentItem(item);
    setCurrentItemType(type);
    setCurrentTable(table);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: ItemType, table: TableName) => {
    if (
      confirm(
        `Are you sure you want to delete this ${type}? This cannot be undone.`
      )
    ) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        toast.error(`Failed to delete ${type}: ${error.message}`);
      } else {
        toast.success(`${type} deleted.`);
        router.refresh();
      }
    }
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Locations Manager */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manage Locations</CardTitle>
            <Button
              size="sm"
              onClick={() =>
                handleOpenModal(null, "location", "store_locations")
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {locations.map((loc) => (
                <li
                  key={loc.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                >
                  <span>{loc.name}</span>
                  <div className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleOpenModal(loc, "location", "store_locations")
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDelete(loc.id, "location", "store_locations")
                      }
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Categories Manager */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manage Categories</CardTitle>
            <Button
              size="sm"
              onClick={() =>
                handleOpenModal(null, "category", "store_categories")
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                >
                  <span>{cat.name}</span>
                  <div className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleOpenModal(cat, "category", "store_categories")
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDelete(cat.id, "category", "store_categories")
                      }
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <LibraryItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={currentItem}
          itemType={currentItemType}
          tableName={currentTable}
        />
      )}
    </>
  );
}

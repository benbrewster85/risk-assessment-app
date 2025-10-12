"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface Item {
  id?: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  itemType: "location" | "category";
  tableName: "store_locations" | "store_categories";
}

export function LibraryItemModal({
  isOpen,
  onClose,
  item,
  itemType,
  tableName,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(item?.name || "");
  }, [item]);

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Name cannot be empty.");
      return;
    }
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // FIX: Add a guard clause to ensure the user is logged in.
    if (!user) {
      toast.error(
        "Authentication error. Please refresh the page and log in again."
      );
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id) // The '!' is no longer needed as we've already checked for user.
      .single();

    const dataToUpsert = {
      id: item?.id,
      name: name,
      team_id: profile?.team_id,
    };

    const { error } = await supabase
      .from(tableName)
      .upsert(dataToUpsert)
      .select();

    setIsLoading(false);

    if (error) {
      toast.error(`Failed to save ${itemType}: ${error.message}`);
    } else {
      toast.success(
        `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} saved successfully!`
      );
      router.refresh();
      onClose();
    }
  };

  const title = item ? `Edit ${itemType}` : `Add New ${itemType}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Enter ${itemType} name`}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

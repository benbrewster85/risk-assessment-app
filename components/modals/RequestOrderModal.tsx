"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InventoryItem } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface Props {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestOrderModal({ item, isOpen, onClose }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (quantity <= 0) {
      toast.error("Invalid Quantity");
      return;
    }
    if (!item && !description) {
      toast.error("Please describe the item you need.");
      return;
    }

    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Authentication error. Please refresh and log in again.");
      setIsLoading(false);
      return;
    }

    // FIX 1: Get the user's profile to find their team_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      toast.error("Could not find your team profile.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("order_requests").insert({
      team_id: profile.team_id, // FIX 2: Add team_id to the insert object
      requested_by_id: user.id,
      inventory_item_id: item ? item.id : null,
      item_description: item ? null : description,
      quantity: quantity,
      notes: notes,
    });

    setIsLoading(false);

    if (error) {
      toast.error(`Failed to submit request: ${error.message}`);
    } else {
      toast.success(`Your order request has been submitted.`);
      router.refresh();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Item Order</DialogTitle>
          <DialogDescription>
            {item
              ? `Request a new order for ${item.store_products.name} - ${item.variant_name}.`
              : "Request an item that isn't currently stocked in the stores."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!item && (
            <div className="space-y-2">
              <Label htmlFor="description">Item Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please be specific, e.g., '3mm HSS drill bit for metal'"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Justification (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Required for Project ABC"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

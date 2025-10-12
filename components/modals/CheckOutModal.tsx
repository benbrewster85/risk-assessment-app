"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // 1. Import the correct modern client
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
import toast from "react-hot-toast";

interface Props {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckOutModal({ item, isOpen, onClose }: Props) {
  const supabase = createClient(); // 2. Create the client using the new helper
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (quantity <= 0 || quantity > item.quantity_on_hand) {
      toast.error(
        `Please enter a number between 1 and ${item.quantity_on_hand}.`
      );
      return;
    }

    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3. Add a guard clause to ensure the user is logged in.
    if (!user) {
      toast.error(
        "Authentication error. Please refresh the page and log in again."
      );
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.rpc("handle_inventory_transaction", {
      item_id_in: item.id,
      user_id_in: user.id, // Now we can be sure user.id exists
      type_in: "check_out",
      quantity_change_in: -quantity,
      notes_in: notes,
    });

    setIsLoading(false);

    if (error) {
      toast.error(`Failed to check out item: ${error.message}`);
    } else {
      toast.success(`${quantity} x ${item.variant_name} checked out.`);
      router.refresh(); // Re-fetch server data
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Check Out: {item.store_products.name} - {item.variant_name}
          </DialogTitle>
          <DialogDescription>
            Current stock: {item.quantity_on_hand} {item.unit_of_measure}. How
            many are you taking?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              max={item.quantity_on_hand}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., For Project XYZ"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Checking Out..." : "Confirm Check Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

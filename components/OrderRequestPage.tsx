"use client";

import { useState, useTransition, useMemo } from "react";
import { OrderRequest } from "@/lib/types";
import { updateOrderStatus } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  initialOrders: OrderRequest[];
}

export function OrderRequestPage({ initialOrders = [] }: Props) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return initialOrders;
    }
    return initialOrders.filter((o) =>
      ["pending", "approved", "ordered"].includes(o.status)
    );
  }, [initialOrders, filter]);

  const handleStatusChange = (
    orderId: string,
    status: "approved" | "ordered" | "received" | "rejected"
  ) => {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Order marked as ${status}.`);
      }
    });
  };

  const getStatusBadge = (status: OrderRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            Approved
          </Badge>
        );
      case "ordered":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">
            Ordered
          </Badge>
        );
      case "received":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Received
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Order Requests</CardTitle>
        <div className="space-x-2">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending Actions
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All Orders
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">
                    {order.inventory_items
                      ? `${order.inventory_items.store_products.name} - ${order.inventory_items.variant_name}`
                      : order.item_description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {order.quantity}
                  </div>
                </TableCell>
                {/* FIX: Combine first and last name for the full name */}
                <TableCell>
                  {order.profiles
                    ? `${order.profiles.first_name || ""} ${order.profiles.last_name || ""}`.trim()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(order.id, "approved")}
                      >
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(order.id, "ordered")}
                      >
                        Mark as Ordered
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(order.id, "received")}
                      >
                        Mark as Received
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleStatusChange(order.id, "rejected")}
                      >
                        Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

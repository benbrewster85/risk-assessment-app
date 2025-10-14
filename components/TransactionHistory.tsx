"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Define a more specific type for the transactions we've fetched
type Transaction = {
  id: string;
  created_at: string;
  transaction_type: string;
  quantity_change: number;
  quantity_after_transaction: number;
  notes: string | null;
  inventory_items: {
    variant_name: string;
    store_products: { name: string };
  } | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

interface Props {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) {
      return transactions;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return transactions.filter((t) => {
      const productName =
        t.inventory_items?.store_products.name.toLowerCase() || "";
      const variantName = t.inventory_items?.variant_name.toLowerCase() || "";
      return (
        productName.includes(lowercasedFilter) ||
        variantName.includes(lowercasedFilter)
      );
    });
  }, [transactions, searchTerm]);

  const getChangeCell = (transaction: Transaction) => {
    switch (transaction.transaction_type) {
      case "check_out":
        return (
          <span className="text-red-600 font-mono">
            {transaction.quantity_change}
          </span>
        );
      case "check_in":
        return (
          <span className="text-green-600 font-mono">
            +{transaction.quantity_change}
          </span>
        );
      case "initial":
      case "stock_take":
        return (
          <span className="text-blue-600 font-mono">
            {transaction.quantity_change} (Set)
          </span>
        );
      default:
        return <span className="font-mono">{transaction.quantity_change}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <div className="pt-4 max-w-sm">
          <Input
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Resulting Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="font-medium">
                    {t.inventory_items?.store_products.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t.inventory_items?.variant_name}
                  </div>
                </TableCell>
                <TableCell>
                  {t.profiles
                    ? `${t.profiles.first_name || ""} ${t.profiles.last_name || ""}`.trim()
                    : "System"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {t.transaction_type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{getChangeCell(t)}</TableCell>
                <TableCell className="font-mono">
                  {t.quantity_after_transaction}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

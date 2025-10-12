"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StoreCategory,
  StoreLocation,
  StoreProduct,
  InventoryItem,
  OrderRequest,
} from "@/lib/types";
import { LibraryManager } from "./LibraryManager";
import { ItemManager } from "./ItemManager";
import { StockTake } from "./StockTake";
import { TransactionHistory } from "./TransactionHistory";
import { OrderRequestPage } from "./OrderRequestPage";

interface Props {
  initialLocations: StoreLocation[];
  initialCategories: StoreCategory[];
  initialProducts: StoreProduct[];
  initialItems: InventoryItem[];
  initialTransactions: any[];
  initialOrders: OrderRequest[];
  defaultTab: string;
}

export function ConsumablesManagePage({
  initialLocations,
  initialCategories,
  initialProducts,
  initialItems,
  initialTransactions,
  initialOrders,
  defaultTab,
}: Props) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="stock_take">Stock Take</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>{" "}
        <TabsTrigger value="orders">Orders</TabsTrigger>
      </TabsList>

      <TabsContent value="library" className="mt-4">
        <LibraryManager
          locations={initialLocations}
          categories={initialCategories}
        />
      </TabsContent>

      <TabsContent value="items" className="mt-4">
        <ItemManager
          items={initialItems}
          locations={initialLocations}
          categories={initialCategories}
          products={initialProducts}
        />
      </TabsContent>

      <TabsContent value="stock_take" className="mt-4">
        <StockTake
          initialItems={initialItems}
          initialLocations={initialLocations}
        />
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <TransactionHistory transactions={initialTransactions} />
      </TabsContent>

      <TabsContent value="orders" className="mt-4">
        <OrderRequestPage initialOrders={initialOrders} />
      </TabsContent>
    </Tabs>
  );
}

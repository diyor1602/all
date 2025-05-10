import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Filter,
  Warehouse,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statuses } from "@/lib/status";
import React from "react";

// Add debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Balance = () => {
  const { toast } = useToast();

  const [groupedItems, setGroupedItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Add debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/warehouseManager/warehouses");
      setWarehouses(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Omborlar olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.get("/warehouseManager/balances", {
        params: {
          warehouse_id: selectedWarehouse === "all" ? "" : selectedWarehouse,
          page,
          search: debouncedSearchQuery,
        },
      });

      // Group balances by item ID while maintaining order
      const grouped = [];
      const itemMap = new Map();

      response.data.data.data.forEach((balance) => {
        const itemId = balance.item.id;
        let groupIndex = itemMap.get(itemId);

        if (groupIndex === undefined) {
          groupIndex = grouped.length;
          itemMap.set(itemId, groupIndex);
          grouped.push({
            item: balance.item,
            totalQuantity: 0,
            balances: [],
          });
        }

        grouped[groupIndex].totalQuantity += parseFloat(balance.quantity);
        grouped[groupIndex].balances.push(balance);
      });

      setTotalQuantity(response.data.total_quantity);

      setGroupedItems((prev) => {
        if (append) {
          // Merge new items while maintaining order
          const mergedGroups = [...prev];
          const existingItemMap = new Map(
            prev.map((group, index) => [group.item.id, index])
          );

          grouped.forEach((newGroup) => {
            const existingIndex = existingItemMap.get(newGroup.item.id);
            if (existingIndex !== undefined) {
              // Update existing group
              mergedGroups[existingIndex].totalQuantity +=
                newGroup.totalQuantity;
              mergedGroups[existingIndex].balances.push(...newGroup.balances);
            } else {
              // Add new group
              mergedGroups.push(newGroup);
            }
          });

          return mergedGroups;
        }
        return grouped;
      });

      setHasMore(page < response.data.data.last_page);
      setCurrentPage(page);
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Balanslar olishda xatolik",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchBalances();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchBalances(1);
  }, [selectedWarehouse, debouncedSearchQuery]);

  // Intersection Observer setup
  const observer = useRef();
  const lastItemRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchBalances(currentPage + 1, true);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, currentPage]
  );

  // Get low stock count
  const lowStockCount = groupedItems.filter(
    (group) => group.totalQuantity <= parseFloat(group.item.min_quantity)
  ).length;

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMore(true);
    fetchBalances(1);
  };

  const toggleExpand = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-0 bg-slate-50">
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/60 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Warehouse size={28} />
              <CardTitle className="text-2xl font-bold">
                Omborlar holati
              </CardTitle>
            </div>

            {lowStockCount > 0 && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                {lowStockCount} mahsulot kam qoldi
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap w-full gap-4 items-center">
              <div className="relative">
                <Select
                  value={selectedWarehouse}
                  onValueChange={setSelectedWarehouse}
                >
                  <SelectTrigger className="bg-white shadow-sm border-slate-200">
                    <div className="flex items-center gap-2">
                      <Filter size={18} className="text-slate-500" />
                      <SelectValue placeholder="Ombor tanlang" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha omborlar</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={18} className="text-slate-500" />
                </div>
                <Input
                  type="text"
                  placeholder="Qidirish..."
                  className="pl-10 bg-white shadow-sm border-slate-200 md:min-w-[400px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Button
                  variant="outline"
                  className="w-full md:w-auto bg-white shadow-sm border-slate-200 hover:bg-slate-200 transition-all"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw
                    size={18}
                    className={`mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Yangilash
                </Button>
              </div>
              <div className="text-sm text-slate-500 ml-auto">
                Jami: {parseFloat(totalQuantity).toLocaleString()}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-slate-200" />
                ))}
              </div>
            ) : groupedItems.length > 0 ? (
              <>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead className="font-medium text-slate-700">
                            Mahsulot
                          </TableHead>
                          <TableHead className="font-medium text-slate-700">
                            Kodi
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 text-center">
                            Jami miqdor
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 text-center">
                            Min. miqdor
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 text-center">
                            Birlik
                          </TableHead>
                          <TableHead className="font-medium text-slate-700">
                            Buyurtmalar
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedItems.map((group, index, array) => {
                          const isLowStock =
                            group.totalQuantity <=
                            parseFloat(group.item.min_quantity);
                          const isExpanded = expandedItems[group.item.id];
                          const isLastItem = index === array.length - 1;

                          // Count orders
                          const orderCount = group.balances.filter(
                            (b) => b.order
                          ).length;

                          return (
                            <React.Fragment key={group.item.id}>
                              <TableRow
                                ref={isLastItem ? lastItemRef : null}
                                className={cn(
                                  {
                                    "bg-red-300": isLowStock,
                                    "hover:bg-slate-50": !isLowStock,
                                    "border-b-0": isExpanded,
                                  },
                                  "cursor-pointer"
                                )}
                                onClick={() => toggleExpand(group.item.id)}
                              >
                                <TableCell className="w-8 p-2">
                                  {isExpanded ? (
                                    <ChevronDown
                                      size={18}
                                      className="text-slate-600"
                                    />
                                  ) : (
                                    <ChevronRight
                                      size={18}
                                      className="text-slate-600"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {group.item.name}
                                </TableCell>
                                <TableCell>{group.item.code}</TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={
                                      isLowStock ? "destructive" : "outline"
                                    }
                                    className={cn(
                                      "px-3 py-1",
                                      isLowStock
                                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                                        : ""
                                    )}
                                  >
                                    {group.totalQuantity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {group.item.min_quantity}
                                </TableCell>
                                <TableCell className="text-center">
                                  {group.item.unit.name}
                                </TableCell>
                                <TableCell>
                                  {orderCount > 0 ? (
                                    <Badge className="font-normal">
                                      {orderCount} ta buyurtma
                                    </Badge>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </TableCell>
                              </TableRow>

                              {isExpanded && (
                                <TableRow className="bg-slate-50">
                                  <TableCell colSpan={7} className="p-0">
                                    <div className="p-4">
                                      <div className="text-sm font-medium mb-2 text-slate-700">
                                        Barcha {group.item.name} balanslari:
                                      </div>
                                      <Table>
                                        <TableHeader className="bg-slate-200">
                                          <TableRow>
                                            <TableHead className="font-medium text-slate-700">
                                              Ombor
                                            </TableHead>
                                            <TableHead className="font-medium text-slate-700 text-center">
                                              Miqdor
                                            </TableHead>
                                            <TableHead className="font-medium text-slate-700">
                                              Buyurtma
                                            </TableHead>
                                            <TableHead className="font-medium text-slate-700">
                                              Buyurtma holati
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {group.balances.map((balance) => (
                                            <TableRow key={balance.id}>
                                              <TableCell className="max-w-10">
                                                {balance.warehouse.name}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {balance.quantity}{" "}
                                                {group.item.unit.name}
                                              </TableCell>
                                              <TableCell>
                                                {balance.order ? (
                                                  <div className="text-sm">
                                                    <div className="font-medium">
                                                      {balance.order.name}
                                                    </div>
                                                    <div className="text-slate-500">
                                                      ID: {balance.order.id}{" "}
                                                      Miqdor:{" "}
                                                      {balance.order.quantity ||
                                                        0}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <span className="text-slate-500">
                                                    Buyurtmasiz
                                                  </span>
                                                )}
                                              </TableCell>
                                              <TableCell>
                                                {balance.order && (
                                                  <Badge
                                                    variant="outline"
                                                    className={cn(
                                                      "capitalize",
                                                      statuses[
                                                        balance.order.status
                                                      ]?.secondaryBg,
                                                      statuses[
                                                        balance.order.status
                                                      ]?.textColor,
                                                      statuses[
                                                        balance.order.status
                                                      ]?.border
                                                    )}
                                                  >
                                                    {
                                                      statuses[
                                                        balance.order.status
                                                      ]?.text
                                                    }
                                                  </Badge>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {loadingMore && (
                          <div className="flex justify-center py-4 w-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                <div className="text-slate-400 mb-2">
                  <Warehouse size={48} strokeWidth={1} />
                </div>
                <p className="text-slate-600 font-medium">
                  Balanslar mavjud emas
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery
                    ? "Qidiruv bo'yicha natija topilmadi"
                    : "Hech qanday mahsulot mavjud emas"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Balance;

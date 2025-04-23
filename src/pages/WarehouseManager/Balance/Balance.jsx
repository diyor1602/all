import { useState, useEffect } from "react";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  RefreshCw,
  Filter,
  Warehouse,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statuses } from "@/lib/status";

const GroupedBalance = () => {
  const { toast } = useToast();

  const [groupedItems, setGroupedItems] = useState({});
  const [filteredGroupedItems, setFilteredGroupedItems] = useState({});
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState({});
  const itemsPerPage = 10;

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

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await api.get("/warehouseManager/balances", {
        params: {
          warehouse_id: selectedWarehouse === "all" ? "" : selectedWarehouse,
        },
      });

      // Group balances by item ID
      const grouped = {};
      response.data.forEach((balance) => {
        const itemId = balance.item.id;
        if (!grouped[itemId]) {
          grouped[itemId] = {
            item: balance.item,
            totalQuantity: 0,
            balances: [],
          };
        }
        grouped[itemId].totalQuantity += parseFloat(balance.quantity);
        grouped[itemId].balances.push(balance);
      });

      setGroupedItems(grouped);
      setFilteredGroupedItems(grouped);
      setCurrentPage(1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Balanslar olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchBalances();
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [selectedWarehouse]);

  useEffect(() => {
    // Filter grouped items based on search query
    const searchTerm = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(groupedItems).forEach(([itemId, group]) => {
      const { item, balances } = group;

      // Check if any item property matches search
      const itemMatches =
        item.name.toLowerCase().includes(searchTerm) ||
        item.code.toLowerCase().includes(searchTerm);

      // Check if any order property matches search
      const orderMatches = balances.some(
        (balance) =>
          balance.order &&
          ((balance.order.name &&
            balance.order.name.toLowerCase().includes(searchTerm)) ||
            (balance.order.id && String(balance.order.id).includes(searchTerm)))
      );

      // Check if quantity matches search
      const quantityMatches = String(group.totalQuantity).includes(searchTerm);

      if (itemMatches || orderMatches || quantityMatches) {
        filtered[itemId] = group;
      }
    });

    setFilteredGroupedItems(filtered);
    setCurrentPage(1);
  }, [searchQuery, groupedItems]);

  // Calculate pagination
  const groupedItemsList = Object.values(filteredGroupedItems);
  const totalPages = Math.ceil(groupedItemsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = groupedItemsList.slice(startIndex, endIndex);

  // Get low stock count
  const lowStockCount = Object.values(groupedItems).filter(
    (group) => group.totalQuantity <= parseFloat(group.item.min_quantity)
  ).length;

  const handleRefresh = () => {
    fetchBalances();
  };

  const toggleExpand = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}

          {pages}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-0 md:p-6 bg-slate-50 min-h-screen">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="pl-10 bg-white shadow-sm border-slate-200"
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
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-slate-200" />
                ))}
              </div>
            ) : groupedItemsList.length > 0 ? (
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
                        {currentItems
                          .sort((a, b) =>
                            a.item.name.localeCompare(b.item.name)
                          )
                          .map((group) => {
                            const isLowStock =
                              group.totalQuantity <=
                              parseFloat(group.item.min_quantity);
                            const isExpanded = expandedItems[group.item.id];

                            // Count orders
                            const orderCount = group.balances.filter(
                              (b) => b.order
                            ).length;

                            return (
                              <>
                                <TableRow
                                  key={group.item.id}
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
                                                <TableCell>
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
                                                        {balance.order
                                                          .quantity || 0}
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
                              </>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Jami {groupedItemsList.length} ta mahsulot
                  </div>
                  <div>{totalPages > 1 && renderPagination()}</div>
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

export default GroupedBalance;

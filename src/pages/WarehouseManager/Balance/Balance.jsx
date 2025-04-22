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
import { Search, RefreshCw, Filter, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

const Balance = () => {
  const { toast } = useToast();

  const [balances, setBalances] = useState([]);
  const [filteredBalances, setFilteredBalances] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
      setBalances(response.data);
      setFilteredBalances(response.data);
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
    // Filter balances based on search query
    const filtered = balances.filter((balance) => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        balance?.item?.name?.toLowerCase().includes(searchTerm) ||
        balance?.item?.code?.toLowerCase().includes(searchTerm) ||
        String(balance?.quantity).includes(searchTerm) ||
        (balance?.order?.name &&
          balance?.order?.name.toLowerCase().includes(searchTerm))
      );
    });

    setFilteredBalances(filtered);
    setCurrentPage(1);
  }, [searchQuery, balances]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBalances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBalances = filteredBalances.slice(startIndex, endIndex);

  // Get low stock count
  const lowStockCount = balances.filter(
    (balance) =>
      parseFloat(balance?.quantity) <= parseFloat(balance?.item?.min_quantity)
  ).length;

  const handleRefresh = () => {
    fetchBalances();
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
            ) : filteredBalances.length > 0 ? (
              <>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow>
                          <TableHead className="font-medium text-slate-700">
                            Mahsulot
                          </TableHead>
                          <TableHead className="font-medium text-slate-700">
                            Kodi
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 text-center">
                            Miqdori
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 text-center">
                            Min. miqdor
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 text-center">
                            Birlik
                          </TableHead>
                          <TableHead className="font-medium text-slate-700">
                            Buyurtma
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentBalances
                          .sort((a, b) =>
                            a?.item?.name.localeCompare(b?.item?.name)
                          )
                          .map((balance) => {
                            const isLowStock =
                              parseFloat(balance?.quantity) <=
                              parseFloat(balance?.item?.min_quantity);

                            return (
                              <TableRow
                                key={balance?.id}
                                className={cn({
                                  "bg-red-300": isLowStock,
                                  "hover:bg-slate-50": !isLowStock,
                                })}
                              >
                                <TableCell className="font-medium">
                                  {balance?.item?.name}
                                </TableCell>
                                <TableCell>{balance?.item?.code}</TableCell>
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
                                    {balance?.quantity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {balance?.item?.min_quantity}
                                </TableCell>
                                <TableCell className="text-center">
                                  {balance?.item?.unit?.name}
                                </TableCell>
                                <TableCell>
                                  {balance?.order ? (
                                    <Badge className="font-normal">
                                      {balance?.order?.id}{" "}
                                      {balance?.order?.name}
                                    </Badge>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Jami {filteredBalances.length} ta mahsulot
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

export default Balance;

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import formatNumber from "@/utils/formatNumber";

const statuses = {
  pending: { text: "Yangi", color: "bg-blue-500" },
  executed: { text: "Jarayonda", color: "bg-yellow-500" },
  completed: { text: "Bajarildi", color: "bg-green-500" },
};

const Orders = () => {
  const { toast } = useToast();
  const [incomesData, setIncomesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    warehouse_id: "",
    source_id: "",
    start_date: "",
    end_date: "",
  });
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageDialogData, setImageDialogData] = useState({
    src: "",
    alt: "",
    name: "",
  });
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const lastIncomeElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  // Create a debounced version of fetchIncomes
  const debouncedFetchIncomes = useCallback(
    (() => {
      let timeout;
      return (page = 1, filterParams = {}) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fetchIncomes(page, filterParams);
        }, 500); // 500ms delay
      };
    })(),
    [],
  );

  const fetchIncomes = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);

      // Add filter params if they exist
      if (filterParams.search) params.append("search", filterParams.search);
      if (filterParams.status) params.append("status", filterParams.status);
      if (filterParams.deadline)
        params.append("deadline", filterParams.deadline);

      const response = await api.get(`/supplier/purchaseOrder`);

      if (page === 1) {
        setIncomesData(response.data);
      } else {
        setIncomesData((prevData) => ({
          ...response.data,
          data: [...prevData.data, ...response.data.data],
        }));
      }

      setHasMore(response.data.current_page < response.data.last_page);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    // Convert 'all' value to empty string for API requests
    const apiValue = value === "all" ? "" : value;
    const newFilters = { ...filters, [key]: apiValue };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    debouncedFetchIncomes(1, newFilters);
  };

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setFilters({ ...filters, search: newValue });
    setCurrentPage(1); // Reset to first page when search changes
    debouncedFetchIncomes(1, { ...filters, search: newValue });
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      deadline: "",
    });
    setCurrentPage(1); // Reset to first page when filters are reset
    fetchIncomes(1, {});
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  useEffect(() => {
    if (currentPage > 1) {
      fetchIncomes(currentPage, filters);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchIncomes(1);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Buyurtmalar</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{""}</CardTitle>
          <CardDescription>{""}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                Qidirish
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Qidirish..."
                  className="pl-8"
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="source" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Barcha status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha status</SelectItem>
                  {Object.keys(statuses).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statuses[status].text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline" className="text-sm font-medium">
                Kun
              </label>
              <Input
                id="deadline"
                type="date"
                value={filters.deadline}
                onChange={(e) => handleFilterChange("deadline", e.target.value)}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="ml-auto"
          >
            Tozalash
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buyurtmalar ro'yxati</CardTitle>
          <CardDescription>
            {incomesData && `Jami: ${incomesData.total} ta buyurtma`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && currentPage === 1 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : incomesData && incomesData.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="text-sm whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Muddat</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead>Buyurtmachi</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomesData.data.map((income, index) => (
                    <React.Fragment key={index}>
                      <TableRow
                        ref={
                          index === incomesData.data.length - 1
                            ? lastIncomeElementRef
                            : null
                        }
                        key={income.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRowExpansion(income.id)}
                      >
                        <TableCell className="font-medium">
                          {income.id}
                        </TableCell>
                        <TableCell>{income.comment || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`${
                              statuses[income.status]?.color || "bg-gray-500"
                            } text-white px-2 py-1 rounded-md`}
                          >
                            {statuses[income.status]?.text || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(income.deadline)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge>{income.items?.length || 0} ta</Badge>
                            {expandedRows[income.id] ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {income?.created_by?.employee?.name ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {income?.created_by?.employee.name}
                              </span>
                            </div>
                          ) : (
                            income?.employee?.id || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            {income?.status === "pending" ? (
                              <Button
                                size="icon"
                                asChild
                                variant="outline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link to={`/supplier/orders/${income.id}`}>
                                  <Eye size={20} className="text-blue-500" />
                                </Link>
                              </Button>
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded row to show items */}
                      {expandedRows[income.id] &&
                        income.items &&
                        income.items.length > 0 && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={9} className="py-2 px-4">
                              <div className="rounded-md border border-border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Mahsulot</TableHead>
                                      <TableHead>Kod</TableHead>
                                      <TableHead>Aytilgan miqdor</TableHead>
                                      <TableHead>
                                        Olib kelingan miqdor
                                      </TableHead>
                                      <TableHead>Narx</TableHead>
                                      <TableHead>Valyuta</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {income.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell className="flex items-center gap-2">
                                          {item.item?.image ? (
                                            <div
                                              className="w-8 h-8 rounded overflow-hidden cursor-pointer"
                                              role="button"
                                              tabIndex={0}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setImageDialogData({
                                                  src: item.item.image,
                                                  alt:
                                                    item.item.name || "Image",
                                                  name: item.item.name || "",
                                                });
                                                setImageDialogOpen(true);
                                              }}
                                              onKeyDown={(e) => {
                                                if (
                                                  e.key !== "Enter" &&
                                                  e.key !== " "
                                                )
                                                  return;
                                                e.stopPropagation();
                                                setImageDialogData({
                                                  src: item.item.image,
                                                  alt:
                                                    item.item.name || "Image",
                                                  name: item.item.name || "",
                                                });
                                                setImageDialogOpen(true);
                                              }}
                                            >
                                              <img
                                                src={item.item.image}
                                                alt={item.item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                              <Package className="w-4 h-4" />
                                            </div>
                                          )}
                                          <span>{item.item?.name}</span>
                                        </TableCell>
                                        <TableCell>
                                          {item.item?.code || "-"}
                                        </TableCell>
                                        <TableCell>
                                          {formatNumber(item.ordered_quantity)}{" "}
                                          {item.item?.unit?.name}
                                        </TableCell>
                                        <TableCell>
                                          {formatNumber(item.received_quantity)}{" "}
                                          {item.item?.unit?.name}
                                        </TableCell>
                                        <TableCell>
                                          {item?.received_price
                                            ? formatNumber(item?.received_price)
                                            : formatNumber(item.item?.price)}
                                        </TableCell>
                                        <TableCell>
                                          {item.item?.currency?.name || "-"}
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
                  ))}
                </TableBody>
              </Table>
              {loading && currentPage > 1 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Buyurtmalar topilmadi</h3>
              <p className="text-muted-foreground mt-2">
                Yangi buyurtma qo'shish uchun yuqoridagi "Yangi buyurtma"
                tugmasini bosing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) {
            setImageDialogData({ src: "", alt: "", name: "" });
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imageDialogData.name || "Rasm"}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            <img
              src={imageDialogData.src}
              alt={imageDialogData.alt}
              className="w-full max-h-[70vh] object-contain rounded"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

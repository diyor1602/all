"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import {
  CirclePlus,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Download,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";

const OutcomePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [outcomesData, setOutcomesData] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    warehouse_id: "",
    destination_id: "",
    start_date: "",
    end_date: "",
  });
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const lastOutcomeElementRef = useCallback(
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
    [loading, hasMore]
  );

  const debouncedFetchOutcomes = useCallback(
    (() => {
      let timeout;
      return (page = 1, filterParams = {}) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fetchOutcomes(page, filterParams);
        }, 500); // 500ms delay
      };
    })(),
    []
  );

  const fetchOutcomes = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);

      // Add filter params if they exist
      if (filterParams.search) params.append("search", filterParams.search);
      if (filterParams.warehouse_id)
        params.append("warehouse_id", filterParams.warehouse_id);
      if (filterParams.destination_id)
        params.append("destination_id", filterParams.destination_id);
      if (filterParams.start_date)
        params.append("start_date", filterParams.start_date);
      if (filterParams.end_date)
        params.append("end_date", filterParams.end_date);

      const response = await api.get(
        `/warehouseManager/outcome?${params.toString()}`
      );

      if (page === 1) {
        setOutcomesData(response.data);
      } else {
        setOutcomesData((prevData) => ({
          ...response.data,
          data: [...prevData.data, ...response.data.data],
        }));
      }

      setHasMore(response.data.current_page < response.data.last_page);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Chiqimlar olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await api.get("/warehouseManager/destinations");
      setDestinations(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ishlab chiqarish joylarini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get("/warehouseManager/warehouses");
      setWarehouses(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Omborlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchOutcomes(page, filters);
  };

  const handleFilterChange = (key, value) => {
    // Convert 'all' value to empty string for API requests
    const apiValue = value === "all" ? "" : value;
    const newFilters = { ...filters, [key]: apiValue };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    debouncedFetchOutcomes(1, newFilters);
  };

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setFilters({ ...filters, search: newValue });
    setCurrentPage(1); // Reset to first page when search changes
    debouncedFetchOutcomes(1, { ...filters, search: newValue });
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      warehouse_id: "",
      destination_id: "",
      start_date: "",
      end_date: "",
    });
    setCurrentPage(1); // Reset to first page when filters are reset
    fetchOutcomes(1, {});
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleDownload = async (id) => {
    try {
      setDownloadingIds((prev) => [...prev, id]);

      const response = await api.get(`/warehouseManager/stockEntry/${id}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `chiqim_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: "Muvaffaqiyatli",
        description: "Fayl yuklab olindi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Chiqimlar export qilishda xatolik",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  useEffect(() => {
    if (currentPage > 1) {
      fetchOutcomes(currentPage, filters);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchOutcomes(1);
    fetchDestinations();
    fetchWarehouses();
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
        <h1 className="text-2xl font-bold">Chiqimlar</h1>
        <Button
          variant="default"
          onClick={() => navigate("/warehouseManager/outcome/new")}
        >
          <CirclePlus className="h-4 w-4 mr-2" /> Yangi chiqim qo'shish
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtrlash</CardTitle>
          <CardDescription>
            Kerakli parametrlar bo'yicha qidiring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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
              <label htmlFor="warehouse" className="text-sm font-medium">
                Ombor
              </label>
              <Select
                value={filters.warehouse_id || "all"}
                onValueChange={(value) =>
                  handleFilterChange("warehouse_id", value)
                }
              >
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Barcha omborlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha omborlar</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem
                      key={warehouse.id}
                      value={warehouse.id.toString()}
                    >
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="destination" className="text-sm font-medium">
                Chiqim turi
              </label>
              <Select
                value={filters.destination_id || "all"}
                onValueChange={(value) =>
                  handleFilterChange("destination_id", value)
                }
              >
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Barcha chiqim turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha chiqim turi</SelectItem>
                  {destinations.map((destination) => (
                    <SelectItem
                      key={destination.id}
                      value={destination.id.toString()}
                    >
                      {destination.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="start_date" className="text-sm font-medium">
                Boshlanish sana
              </label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  handleFilterChange("start_date", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-medium">
                Tugash sana
              </label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
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
          <CardTitle>Chiqimlar ro'yxati</CardTitle>
          <CardDescription>
            {outcomesData && `Jami: ${outcomesData.total} ta chiqim`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && currentPage === 1 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : outcomesData && outcomesData.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="text-sm whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Ombor</TableHead>
                    <TableHead>Chiqim turi</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead>Buyurtma</TableHead>
                    <TableHead>Mas'ul Xodim</TableHead>
                    <TableHead className="text-right">Yuklab olish</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outcomesData.data.map((outcome, index) => (
                    <React.Fragment key={index}>
                      <TableRow
                        ref={
                          index === outcomesData.data.length - 1
                            ? lastOutcomeElementRef
                            : null
                        }
                        key={outcome.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRowExpansion(outcome.id)}
                      >
                        <TableCell className="font-medium">
                          {outcome.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {outcome.warehouse?.name || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {outcome.destination ? (
                            <Badge variant="secondary" className="font-normal">
                              {outcome.destination.name}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{outcome.comment || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge>{outcome.items?.length || 0} ta</Badge>
                            {expandedRows[outcome.id] ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(outcome.created_at)}</TableCell>
                        <TableCell>
                          {outcome.order ? (
                            <span className="text-xs">
                              {outcome.order?.id} {outcome.order?.name}{" "}
                              {outcome.order?.quantity} (
                              {statuses[outcome.order?.status]?.text})
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {outcome?.responsible_user?.employee ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {outcome?.responsible_user?.employee?.name}
                              </span>
                            </div>
                          ) : (
                            outcome?.employee?.id || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(outcome.id);
                            }}
                            disabled={downloadingIds.includes(outcome.id)}
                          >
                            {downloadingIds.includes(outcome.id) ? (
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 text-blue-500" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded row to show items */}
                      {expandedRows[outcome.id] &&
                        outcome.items &&
                        outcome.items.length > 0 && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={9} className="py-2 px-4">
                              <div className="rounded-md border border-border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Mahsulot</TableHead>
                                      <TableHead>Kod</TableHead>
                                      <TableHead>Miqdor</TableHead>
                                      <TableHead>Narx</TableHead>
                                      <TableHead>Valyuta</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {outcome.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell className="flex items-center gap-2">
                                          {item.item.image ? (
                                            <div className="w-8 h-8 rounded overflow-hidden">
                                              <img
                                                src={
                                                  item.item.image ||
                                                  "/placeholder.svg"
                                                }
                                                alt={item.item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                              <Package className="w-4 h-4" />
                                            </div>
                                          )}
                                          <span>{item.item.name}</span>
                                        </TableCell>
                                        <TableCell>
                                          {item.item.code || "-"}
                                        </TableCell>
                                        <TableCell>
                                          {item.quantity}{" "}
                                          {item.item?.unit?.name}
                                        </TableCell>
                                        <TableCell>{item.price}</TableCell>
                                        <TableCell>
                                          {item.currency?.name || "-"}
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
              <h3 className="text-lg font-medium">Chiqimlar topilmadi</h3>
              <p className="text-muted-foreground mt-2">
                Yangi chiqim qo'shish uchun yuqoridagi "Yangi" tugmasini bosing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OutcomePage;

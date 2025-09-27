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
import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";

const IncomePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [incomesData, setIncomesData] = useState(null);
  const [sources, setSources] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    warehouse_id: "",
    source_id: "",
    start_date: "",
    end_date: "",
  });
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
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
    [loading, hasMore]
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
    []
  );

  const fetchIncomes = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);

      // Add filter params if they exist
      if (filterParams.search) params.append("search", filterParams.search);
      if (filterParams.warehouse_id)
        params.append("warehouse_id", filterParams.warehouse_id);
      if (filterParams.source_id)
        params.append("source_id", filterParams.source_id);
      if (filterParams.start_date)
        params.append("start_date", filterParams.start_date);
      if (filterParams.end_date)
        params.append("end_date", filterParams.end_date);

      const response = await api.get(
        `/warehouseManager/incoming?${params.toString()}`
      );

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
        description: "Kirimlar olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await api.get("/warehouseManager/sources");
      setSources(response.data);
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
      warehouse_id: "",
      source_id: "",
      start_date: "",
      end_date: "",
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
      link.setAttribute("download", `kirim_${id}.pdf`);
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
        description: "Kirimlar export qilishda xatolik",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  useEffect(() => {
    if (currentPage > 1) {
      fetchIncomes(currentPage, filters);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchIncomes(1);
    fetchSources();
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
        <h1 className="text-2xl font-bold">Kirimlar</h1>
        <Button
          variant="default"
          onClick={() => navigate("/warehouseManager/income/new")}
        >
          <CirclePlus className="h-4 w-4 mr-2" /> Yangi kirim qo'shish
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
              <label htmlFor="source" className="text-sm font-medium">
                Kirim turi
              </label>
              <Select
                value={filters.source_id || "all"}
                onValueChange={(value) =>
                  handleFilterChange("source_id", value)
                }
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Barcha kirim turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha kirim turi</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id.toString()}>
                      {source.name}
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
          <CardTitle>Kirimlar ro'yxati</CardTitle>
          <CardDescription>
            {incomesData && `Jami: ${incomesData.total} ta kirim`}
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
                    <TableHead>Ombor</TableHead>
                    <TableHead>Kirim turi</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead>Buyurtma</TableHead>
                    <TableHead>Xodim</TableHead>
                    <TableHead className="text-right">Yuklab olish</TableHead>
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
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {income.warehouse?.name || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {income.source ? (
                            <Badge variant="secondary" className="font-normal">
                              {income.source.name}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{income.comment || "-"}</TableCell>
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
                        <TableCell>{formatDate(income.created_at)}</TableCell>
                        <TableCell>
                          {income.order ? (
                            <span className="text-xs">
                              {income.order?.id} {income.order?.name}{" "}
                              {income.order?.quantity} (
                              {statuses[income.order?.status]?.text})
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {income?.employee?.name ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {income?.employee.name}
                              </span>
                            </div>
                          ) : (
                            income?.employee?.id || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(income.id);
                            }}
                            disabled={downloadingIds.includes(income.id)}
                          >
                            {downloadingIds.includes(income.id) ? (
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 text-blue-500" />
                            )}
                          </Button>
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
                                      <TableHead>Miqdor</TableHead>
                                      <TableHead>Narx</TableHead>
                                      <TableHead>Valyuta</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {income.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell className="flex items-center gap-2">
                                          {item.item.image ? (
                                            <div className="w-8 h-8 rounded overflow-hidden">
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
              <h3 className="text-lg font-medium">Kirimlar topilmadi</h3>
              <p className="text-muted-foreground mt-2">
                Yangi kirim qo'shish uchun yuqoridagi "Yangi" tugmasini bosing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomePage;

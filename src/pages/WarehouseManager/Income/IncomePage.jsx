import React, { useState, useEffect, useCallback } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CirclePlus,
  Search,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { statuses } from "@/lib/status";

const IncomePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [incomesData, setIncomesData] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [imageDialog, setImageDialog] = useState({
    open: false,
    src: null,
    name: null,
  });
  const FILTERS_KEY = "income_filters";
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTERS_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            search: "",
            warehouse_id: "",
            source_id: "",
            start_date: "",
            end_date: "",
          };
    } catch {
      return {
        search: "",
        warehouse_id: "",
        source_id: "",
        start_date: "",
        end_date: "",
      };
    }
  });

  const saveFilters = (newFilters) => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(newFilters));
    setFilters(newFilters);
  };

  const debounceRef = React.useRef(null);

  const fetchIncomes = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("type", "income");
      params.append("page", page);
      if (filterParams.search) params.append("search", filterParams.search);
      if (filterParams.warehouse_id)
        params.append("warehouseId", filterParams.warehouse_id);
      if (filterParams.source_id)
        params.append("sourceId", filterParams.source_id);
      if (filterParams.start_date)
        params.append("startDate", filterParams.start_date);
      if (filterParams.end_date)
        params.append("endDate", filterParams.end_date);

      const response = await api.get(
        `/warehouseManager/StockEntry?${params.toString()}`,
      );
      setIncomesData(response.data);
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Kirimlarni olishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get("/warehouseManager/warehouse");
      setWarehouses(response.data);
    } catch {
      // silently fail — filter will just be empty
    }
  };

  const fetchSources = async () => {
    try {
      const response = await api.get("/warehouseManager/source");
      setSources(response.data);
    } catch {
      // silently fail — filter will just be empty
    }
  };

  useEffect(() => {
    fetchIncomes(1);
    fetchWarehouses();
    fetchSources();
  }, []);

  const debouncedFetch = useCallback((page, filterParams) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchIncomes(page, filterParams);
    }, 400);
  }, []);

  const handleFilterChange = (key, value) => {
    const apiValue = value === "all" ? "" : value;
    const newFilters = { ...filters, [key]: apiValue };
    saveFilters(newFilters);
    debouncedFetch(1, newFilters);
  };

  const handleSearchChange = (e) => {
    const newFilters = { ...filters, search: e.target.value };
    saveFilters(newFilters);
    debouncedFetch(1, newFilters);
  };

  const resetFilters = () => {
    const empty = {
      search: "",
      warehouse_id: "",
      source_id: "",
      start_date: "",
      end_date: "",
    };
    saveFilters(empty);
    fetchIncomes(1, {});
  };

  const handlePageChange = (page) => {
    fetchIncomes(page, filters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tashkent",
    }).format(new Date(dateString));
  };

  const renderPagination = () => {
    if (!incomesData || incomesData.totalPages <= 1) return null;
    const current_page = incomesData.page;
    const last_page = incomesData.totalPages;
    const pages = [];

    if (last_page <= 7) {
      for (let i = 1; i <= last_page; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current_page > 3) pages.push("...");
      for (
        let i = Math.max(2, current_page - 1);
        i <= Math.min(last_page - 1, current_page + 1);
        i++
      )
        pages.push(i);
      if (current_page < last_page - 2) pages.push("...");
      pages.push(last_page);
    }

    return (
      <div className="flex items-center justify-center gap-1 py-4">
        <Button
          variant="outline"
          size="sm"
          disabled={current_page === 1}
          onClick={() => handlePageChange(current_page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === current_page ? "default" : "outline"}
              size="sm"
              onClick={() => p !== current_page && handlePageChange(p)}
              className="min-w-[36px]"
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={current_page === last_page}
          onClick={() => handlePageChange(current_page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kirimlar</h1>
        <Button onClick={() => navigate("/warehouseManager/income/new")}>
          <CirclePlus className="h-4 w-4 mr-2" />
          Yangi kirim qilish
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtrlash</CardTitle>
          <CardDescription>
            Kerakli parametrlar bo'yicha qidiring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Qidirish</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  className="pl-8"
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Manba</label>
              <Select
                value={filters.source_id || "all"}
                onValueChange={(v) => handleFilterChange("source_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha manbalar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha manbalar</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warehouse */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ombor</label>
              <Select
                value={filters.warehouse_id || "all"}
                onValueChange={(v) => handleFilterChange("warehouse_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha omborlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha omborlar</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Boshlanish sana</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  handleFilterChange("start_date", e.target.value)
                }
              />
            </div>

            {/* End date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tugash sana</label>
              <Input
                type="date"
                min={filters.start_date}
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        {hasActiveFilters && (
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="ml-auto"
            >
              Filtrlarni tozalash
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kirimlar ro'yxati</CardTitle>
          <CardDescription>
            {incomesData
              ? `Jami: ${incomesData.total ?? incomesData.data?.length ?? 0} ta kirim`
              : "Yuklanmoqda..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-full h-14" />
              ))}
            </div>
          ) : incomesData?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="text-sm whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Ombor</TableHead>
                    <TableHead>Manba</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead>Buyurtma</TableHead>
                    <TableHead>Mas'ul xodim</TableHead>
                    <TableHead>Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomesData.data.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRow(item.id)}
                      >
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {item.warehouse?.name || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.source ? (
                            <Badge variant="secondary" className="font-normal">
                              {item.source.name}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {item.comment || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge>{item.items?.length ?? 0} ta</Badge>
                            {expandedRows[item.id] ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.order ? (
                            <span className="text-xs flex items-center gap-1 flex-wrap">
                              #{item.order.id} {item.order.name}{" "}
                              {item.order.quantity &&
                                `(${item.order.quantity})`}
                              {item.order.status &&
                                statuses[item.order.status] &&
                                (() => {
                                  const s = statuses[item.order.status];
                                  return (
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${s.secondaryBg} ${s.textColor} ${s.border}`}
                                    >
                                      {s.text}
                                    </span>
                                  );
                                })()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {item.user?.employee?.name ||
                            item.responsibleUser?.employee?.name ||
                            "-"}
                        </TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                      </TableRow>

                      {/* Expanded items */}
                      {expandedRows[item.id] &&
                        item.items &&
                        item.items.length > 0 && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={8} className="py-2 px-4">
                              <div className="rounded-md border border-border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Mahsulot</TableHead>
                                      <TableHead>Kod</TableHead>
                                      <TableHead>Miqdor</TableHead>
                                      <TableHead>Narx</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {item.items.map((entry) => (
                                      <TableRow key={entry.id}>
                                        <TableCell className="flex items-center gap-2">
                                          {entry.item?.image ? (
                                            <button
                                              type="button"
                                              className="w-8 h-8 rounded overflow-hidden cursor-zoom-in flex-shrink-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setImageDialog({
                                                  open: true,
                                                  src: entry.item.image,
                                                  name: entry.item.name,
                                                });
                                              }}
                                            >
                                              <img
                                                src={entry.item.image}
                                                alt={entry.item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </button>
                                          ) : (
                                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                              <Package className="w-4 h-4" />
                                            </div>
                                          )}
                                          <span>{entry.item?.name}</span>
                                          {entry.roll_number && (
                                            <span className="text-xs text-muted-foreground">
                                              Roll: {entry.roll_number}
                                            </span>
                                          )}
                                          {entry.length && (
                                            <span className="text-xs text-muted-foreground">
                                              Lot: {entry.length}
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {entry.item?.code || "-"}
                                        </TableCell>
                                        <TableCell>
                                          {entry.quantity}{" "}
                                          {entry.item?.unit?.name}
                                        </TableCell>
                                        <TableCell>
                                          {entry.price}{" "}
                                          {entry.currency?.name || ""}
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
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Kirimlar topilmadi</h3>
              <p className="text-muted-foreground mt-2">
                Yangi kirim qo'shish uchun yuqoridagi tugmani bosing
              </p>
            </div>
          )}
        </CardContent>

        {renderPagination()}
      </Card>

      <Dialog
        open={imageDialog.open}
        onOpenChange={(open) => setImageDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-base font-semibold">
              {imageDialog.name || "Rasm"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/30 w-full h-[70vh] p-4">
            {imageDialog.src && (
              <img
                src={imageDialog.src}
                alt={imageDialog.name || "item-image"}
                className="max-h-full max-w-full object-contain rounded-md"
                loading="lazy"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomePage;

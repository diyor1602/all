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
  Plus,
  Search,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Tag,
  CalendarDays,
  User,
  X,
  Inbox,
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
  const defaultFilters = {
    search: "",
    warehouse_id: "",
    source_id: "",
    start_date: "",
    end_date: "",
  };
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTERS_KEY);
      return saved ? JSON.parse(saved) : defaultFilters;
    } catch {
      return defaultFilters;
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
    } catch (_) {
      /* filter stays empty */
    }
  };

  const fetchSources = async () => {
    try {
      const response = await api.get("/warehouseManager/source");
      setSources(response.data);
    } catch (_) {
      /* filter stays empty */
    }
  };

  useEffect(() => {
    fetchIncomes(1, filters);
    fetchWarehouses();
    fetchSources();
  }, []);

  const debouncedFetch = useCallback((page, filterParams) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchIncomes(page, filterParams),
      400,
    );
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
    saveFilters(defaultFilters);
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

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== "",
  ).length;

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

    const from = (current_page - 1) * (incomesData.pageSize ?? 20) + 1;
    const to = Math.min(
      current_page * (incomesData.pageSize ?? 20),
      incomesData.total ?? 0,
    );

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-sm text-muted-foreground">
          {from}–{to} / {incomesData.total ?? 0} ta
        </span>
        <div className="flex items-center gap-1">
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
              <span
                key={`e-${i}`}
                className="px-1 text-muted-foreground text-sm"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === current_page ? "default" : "outline"}
                size="sm"
                className="min-w-[36px]"
                onClick={() => p !== current_page && handlePageChange(p)}
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
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kirimlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {incomesData
              ? `Jami ${incomesData.total ?? 0} ta yozuv`
              : "Yuklanmoqda…"}
          </p>
        </div>
        <Button onClick={() => navigate("/warehouseManager/income/new")}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yangi kirim qilish
        </Button>
      </div>

      {/* ── Filter toolbar ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap gap-3 p-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Qidirish…"
              className="pl-8 h-9"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Source */}
          <Select
            value={filters.source_id || "all"}
            onValueChange={(v) => handleFilterChange("source_id", v)}
          >
            <SelectTrigger className="h-9 w-[170px]">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Manba" />
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

          {/* Warehouse */}
          <Select
            value={filters.warehouse_id || "all"}
            onValueChange={(v) => handleFilterChange("warehouse_id", v)}
          >
            <SelectTrigger className="h-9 w-[170px]">
              <Warehouse className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Ombor" />
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

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-9 w-[155px]"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
            />
            <span className="text-muted-foreground text-sm">—</span>
            <Input
              type="date"
              className="h-9 w-[145px]"
              min={filters.start_date}
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
            />
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground hover:text-foreground"
              onClick={resetFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Tozalash
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* ── Data table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : incomesData?.data?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table className="text-sm whitespace-nowrap">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-14 text-xs font-semibold text-muted-foreground">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Ombor
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Manba
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Izoh
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Mahsulotlar
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Buyurtma
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Mas'ul xodim
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Sana
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomesData.data.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleRow(item.id)}
                      >
                        {/* ID */}
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {item.id}
                        </TableCell>

                        {/* Warehouse */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">
                              {item.warehouse?.name || "—"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Source */}
                        <TableCell>
                          {item.source ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-medium">
                              <Tag className="h-3 w-3" />
                              {item.source.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Comment */}
                        <TableCell className="max-w-[160px]">
                          <span className="block truncate text-muted-foreground">
                            {item.comment || "—"}
                          </span>
                        </TableCell>

                        {/* Items count */}
                        <TableCell>
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold hover:bg-primary/20 transition-colors"
                          >
                            <Package className="h-3 w-3" />
                            {item.items?.length ?? 0} ta
                            {expandedRows[item.id] ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </TableCell>

                        {/* Order */}
                        <TableCell>
                          {item.order ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-muted-foreground font-mono">
                                #{item.order.id}
                              </span>
                              <span className="text-xs font-medium">
                                {item.order.name}
                              </span>
                              {item.order.quantity && (
                                <span className="text-xs text-muted-foreground">
                                  ({item.order.quantity})
                                </span>
                              )}
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
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Employee */}
                        <TableCell>
                          {item.user?.employee?.name ||
                          item.responsibleUser?.employee?.name ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <span className="text-sm">
                                {item.user?.employee?.name ||
                                  item.responsibleUser?.employee?.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* ── Expanded items ── */}
                      {expandedRows[item.id] && item.items?.length > 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={8}
                            className="p-0 border-b border-border"
                          >
                            <div className="bg-muted/20 px-6 py-3 border-t border-dashed border-border">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Mahsulotlar ro'yxati
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {item.items.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5"
                                  >
                                    {/* Image */}
                                    {entry.item?.image ? (
                                      <button
                                        type="button"
                                        className="w-10 h-10 rounded-md overflow-hidden cursor-zoom-in flex-shrink-0 ring-1 ring-border"
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
                                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                        <Package className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}

                                    {/* Name + meta */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">
                                        {entry.item?.name}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {entry.item?.code && (
                                          <span className="text-xs text-muted-foreground font-mono">
                                            {entry.item.code}
                                          </span>
                                        )}
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
                                      </div>
                                    </div>

                                    {/* Quantity */}
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-sm font-semibold">
                                        {entry.quantity}{" "}
                                        <span className="font-normal text-muted-foreground">
                                          {entry.item?.unit?.name}
                                        </span>
                                      </p>
                                      {entry.price && (
                                        <p className="text-xs text-muted-foreground">
                                          {entry.price} {entry.currency?.name}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Kirimlar topilmadi</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {activeFilterCount > 0
                ? "Filtrlarni tozalab qayta urinib ko'ring"
                : "Hali hech qanday kirim qo'shilmagan"}
            </p>
            {activeFilterCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={resetFilters}
              >
                Filtrlarni tozalash
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => navigate("/warehouseManager/income/new")}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Yangi kirim qilish
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Image dialog ── */}
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
                className="max-h-full max-w-full object-contain rounded-lg"
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

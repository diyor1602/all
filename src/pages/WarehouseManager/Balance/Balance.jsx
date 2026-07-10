import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
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
  Search,
  Package,
  Warehouse,
  X,
  Inbox,
  Layers,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const DEBOUNCE_DELAY = 400;
const PAGE_SIZE = 20;

const FILTERS_KEY = "balance_filters";
const defaultFilters = {
  search: "",
  warehouseId: "",
  hasRoll: "",
};

const Balance = () => {
  const { toast } = useToast();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [imageDialog, setImageDialog] = useState({
    open: false,
    src: null,
    name: null,
  });

  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTERS_KEY);
      return saved ? JSON.parse(saved) : defaultFilters;
    } catch {
      return defaultFilters;
    }
  });

  const debounceRef = useRef(null);
  const sentinelRef = useRef(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;
  const pageRef = useRef(page);
  pageRef.current = page;
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  const fetchPage = useCallback(
    async (pageNum, filterParams, replace) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams();
        params.append("Page", pageNum);
        params.append("PageSize", PAGE_SIZE);
        if (filterParams.search) params.append("Search", filterParams.search);
        if (filterParams.warehouseId)
          params.append("WarehouseId", filterParams.warehouseId);
        if (filterParams.hasRoll !== "")
          params.append("HasRoll", filterParams.hasRoll);

        const { data } = await api.get(
          `/warehouseManager/StockBalance?${params.toString()}`,
        );
        const incoming = data.data ?? [];
        setRows((prev) => (replace ? incoming : [...prev, ...incoming]));
        setTotal(data.total ?? 0);
        setPage(data.page ?? pageNum);
        setTotalPages(data.totalPages ?? 1);
      } catch {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description: "Balansni olishda xatolik yuz berdi!",
        });
      } finally {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [toast],
  );

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get("/warehouseManager/warehouse");
      setWarehouses(data);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchPage(1, filters, true);
    fetchWarehouses();
    return () => clearTimeout(debounceRef.current);
  }, []);

  // Infinite scroll observer — stable, uses refs to avoid re-creating on every state change
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !loadingMoreRef.current &&
          !loadingRef.current &&
          pageRef.current < totalPagesRef.current
        ) {
          fetchPage(pageRef.current + 1, filtersRef.current, false);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchPage]);

  const saveFilters = (newFilters) => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(newFilters));
    setFilters(newFilters);
  };

  const applyFilters = useCallback(
    (newFilters) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => fetchPage(1, newFilters, true),
        DEBOUNCE_DELAY,
      );
    },
    [fetchPage],
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      const v = value === "all" ? "" : value;
      const newFilters = { ...filters, [key]: v };
      saveFilters(newFilters);
      applyFilters(newFilters);
    },
    [filters, applyFilters],
  );

  const handleSearchChange = useCallback(
    (e) => {
      const newFilters = { ...filters, search: e.target.value };
      saveFilters(newFilters);
      applyFilters(newFilters);
    },
    [filters, applyFilters],
  );

  const resetFilters = useCallback(() => {
    saveFilters(defaultFilters);
    fetchPage(1, defaultFilters, true);
  }, [fetchPage]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== "",
  ).length;

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Balans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total !== null ? `Jami ${total} ta yozuv` : "Yuklanmoqda…"}
          </p>
        </div>
      </div>

      {/* ── Filter toolbar ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Mahsulot nomi yoki kodi…"
              className="pl-8 h-9"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          <Select
            value={filters.warehouseId || "all"}
            onValueChange={(v) => handleFilterChange("warehouseId", v)}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <Warehouse className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Ombor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha omborlar</SelectItem>
              {warehouses.map((w, index) => (
                <SelectItem key={index} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.hasRoll === "" ? "all" : filters.hasRoll}
            onValueChange={(v) =>
              handleFilterChange("hasRoll", v === "all" ? "" : v)
            }
          >
            <SelectTrigger className="h-9 w-[160px]">
              <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Turi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="true">Faqat rulonlar</SelectItem>
              <SelectItem value="false">Rulonsiz</SelectItem>
            </SelectContent>
          </Select>

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
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="text-sm whitespace-nowrap">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-14 text-xs font-semibold text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Mahsulot
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Turi
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Rang
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Ombor
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Rulon #
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Miqdor
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Min miqdor
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Narxi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((entry, index) => {
                  const isRoll = entry.rollNumber != null;
                  const qty = isRoll ? entry.length : entry.quantity;
                  const unit = entry.item?.unit?.name;
                  const minQty = entry.item?.minQuantity;
                  const belowMin =
                    minQty != null && qty != null && qty < minQty;

                  return (
                    <TableRow
                      key={index}
                      className={`transition-colors ${belowMin ? "bg-red-100 hover:bg-red-50" : "hover:bg-muted/30"}`}
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {entry.id}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {entry.item?.image ? (
                            <button
                              type="button"
                              className="w-9 h-9 rounded-md overflow-hidden cursor-zoom-in flex-shrink-0 ring-1 ring-border"
                              onClick={() =>
                                setImageDialog({
                                  open: true,
                                  src: entry.item.image,
                                  name: entry.item.name,
                                })
                              }
                            >
                              <img
                                src={entry.item.image}
                                alt={entry.item.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {entry.item?.name}
                            </p>
                            {entry.item?.code && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {entry.item.code}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {entry.item?.type?.name ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {entry.item.type.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {entry.item?.color?.name ? (
                          <div className="flex items-center gap-1.5">
                            {entry.item.color.hex && (
                              <span
                                className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                                style={{
                                  backgroundColor: `#${entry.item.color.hex}`,
                                }}
                              />
                            )}
                            <span className="text-sm">
                              {entry.item.color.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Warehouse className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">
                              {entry.warehouse?.name}
                            </p>
                            {entry.warehouse?.branch?.name && (
                              <p className="text-xs text-muted-foreground">
                                {entry.warehouse.branch.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isRoll ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold">
                            R{entry.rollNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {belowMin && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <span
                            className={`font-semibold ${belowMin ? "text-red-600" : ""}`}
                          >
                            {formatNumber(qty)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {unit}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {minQty != null ? (
                          <span
                            className={`font-medium ${belowMin ? "text-red-500" : "text-muted-foreground"}`}
                          >
                            {formatNumber(minQty)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {entry.item?.price ? (
                          <div>
                            <p className="font-medium">
                              {formatNumber(entry.item.price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.item.currency?.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Ma'lumot topilmadi</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {activeFilterCount > 0
                ? "Filtrlarni tozalab qayta urinib ko'ring"
                : "Hali hech qanday balans ma'lumoti yo'q"}
            </p>
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={resetFilters}
              >
                Filtrlarni tozalash
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-2">
        {loadingMore && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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

export default Balance;

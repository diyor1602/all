import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
  Clock,
  X,
  Send,
  SlidersHorizontal,
  CalendarDays,
  CheckCircle2,
  Play,
  Eye,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import formatNumber from "@/utils/formatNumber";

const STATUS_CONFIG = {
  pending: {
    text: "Kutilmoqda",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  supplier_confirmed: {
    text: "Tasdiqlandi",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  in_delivery: {
    text: "Yetkazilmoqda",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  received: {
    text: "Qabul qilindi",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  closed: {
    text: "Yopildi",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

const DOT_COLORS = {
  pending: "bg-blue-500",
  supplier_confirmed: "bg-violet-500",
  in_delivery: "bg-amber-500",
  received: "bg-green-500",
  closed: "bg-gray-400",
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    text: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[status] || "bg-gray-400"}`}
      />
      {cfg.text}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
};

const EMPTY_FILTERS = { search: "", status: "", startDate: "", endDate: "" };

const Orders = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [imageDialog, setImageDialog] = useState({
    open: false,
    src: null,
    name: null,
  });
  const debounceRef = useRef(null);
  const observer = useRef();

  const lastRowRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) setCurrentPage((p) => p + 1);
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const fetchOrders = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      const params = { Page: page, PageSize: 20 };
      if (filterParams.search) params.Search = filterParams.search;
      if (filterParams.status) params.Status = filterParams.status;
      if (filterParams.startDate) params.StartDate = filterParams.startDate;
      if (filterParams.endDate) params.EndDate = filterParams.endDate;

      const response = await api.get("/supplier/purchaseOrder", { params });

      if (page === 1) {
        setOrdersData(response.data);
      } else {
        setOrdersData((prev) => ({
          ...response.data,
          data: [...(prev?.data || []), ...response.data.data],
        }));
      }
      setHasMore(response.data.page < response.data.totalPages);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = (page, filterParams) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchOrders(page, filterParams),
      400,
    );
  };

  const handleFilterChange = (key, value) => {
    const v = value === "all" ? "" : value;
    const next = { ...filters, [key]: v };
    setFilters(next);
    setCurrentPage(1);
    debouncedFetch(1, next);
  };

  const handleSearchChange = (e) => {
    const next = { ...filters, search: e.target.value };
    setFilters(next);
    setCurrentPage(1);
    debouncedFetch(1, next);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
    fetchOrders(1, {});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    if (currentPage > 1) fetchOrders(currentPage, filters);
  }, [currentPage]);

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const openConfirmDialog = (id) => {
    setConfirmId(id);
    setConfirmDialogOpen(true);
  };

  const openRejectDialog = (id) => {
    setRejectId(id);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      toast({
        title: "Xatolik",
        description: "Izoh kiritish shart",
        variant: "destructive",
      });
      return;
    }
    setIsRejecting(true);
    try {
      await api.patch(`/supplier/purchaseOrder/${rejectId}/close`, {
        comment: rejectComment,
      });
      toast({ title: "Muvaffaqiyatli", description: "Buyurtma rad etildi" });
      setRejectDialogOpen(false);
      setRejectComment("");
      fetchOrders(1, filters);
    } catch {
      toast({
        title: "Xatolik",
        description: "Statusni o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await api.patch(`/supplier/purchaseOrder/${confirmId}/confirm`, {
        status: "supplier_confirmed",
        comment: null,
      });
      toast({ title: "Muvaffaqiyatli", description: "Buyurtma qabul qilindi" });
      setConfirmDialogOpen(false);
      fetchOrders(1, filters);
    } catch {
      toast({
        title: "Xatolik",
        description: "Statusni o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const isOverdue = (order) =>
    new Date(order.deadline) < new Date() &&
    order.status !== "closed" &&
    order.status !== "received";

  const statusCounts =
    ordersData?.data?.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}) || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold leading-none">Buyurtmalar</h1>
            {ordersData && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Jami {ordersData.total ?? 0} ta
              </p>
            )}
          </div>
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Qidirish..."
              className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1"
              value={filters.search}
              onChange={handleSearchChange}
            />
            {filters.search && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => handleFilterChange("search", "")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="h-9 w-9 shrink-0 relative"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="px-4 pb-3 space-y-2 border-t pt-3 bg-muted/20">
            <Select
              value={filters.status || "all"}
              onValueChange={(v) => handleFilterChange("status", v)}
            >
              <SelectTrigger className="h-9 text-sm bg-background">
                <SelectValue placeholder="Barcha statuslar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground px-0.5">
                  Dan
                </label>
                <Input
                  type="date"
                  className="h-9 text-sm bg-background"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground px-0.5">
                  Gacha
                </label>
                <Input
                  type="date"
                  className="h-9 text-sm bg-background"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-muted-foreground"
                onClick={resetFilters}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Filtrlarni tozalash
              </Button>
            )}
          </div>
        )}

        {/* Status chips — horizontal scroll */}
        {ordersData && Object.keys(statusCounts).length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() =>
                  handleFilterChange(
                    "status",
                    filters.status === status ? "" : status,
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  filters.status === status
                    ? "ring-2 ring-primary ring-offset-1"
                    : "active:scale-95"
                } ${STATUS_CONFIG[status]?.className || "bg-gray-100 text-gray-600 border-gray-200"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status] || "bg-gray-400"}`}
                />
                {STATUS_CONFIG[status]?.text || status}
                <span className="font-bold">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3 pb-8">
        {loading && currentPage === 1 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-36 rounded-lg" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
            ))}
          </div>
        ) : ordersData?.data?.length > 0 ? (
          <>
            {ordersData.data.map((order, index) => (
              <div
                key={order.id}
                ref={index === ordersData.data.length - 1 ? lastRowRef : null}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-mono font-bold text-base leading-none mt-0.5">
                      {order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span
                        className={
                          isOverdue(order)
                            ? "text-red-600 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {formatDate(order.deadline)}
                        {isOverdue(order) && (
                          <span className="ml-1.5 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
                            Muddati o'tdi
                          </span>
                        )}
                      </span>
                    </div>
                    {order.comments && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {order.comments}
                      </p>
                    )}
                  </div>

                  {/* Item names preview */}
                  {order.items?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {order.items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 text-xs bg-muted/60 text-foreground px-2 py-1 rounded-md max-w-[180px] truncate"
                        >
                          <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {item.item?.name || "—"}
                          </span>
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md">
                          +{order.items.length - 3} ta
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Items toggle */}
                <button
                  className="w-full px-4 py-2.5 flex items-center justify-between border-t bg-muted/30 text-sm active:bg-muted/50 transition-colors"
                  onClick={() =>
                    setExpandedRows((prev) => ({
                      ...prev,
                      [order.id]: !prev[order.id],
                    }))
                  }
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {order.items?.length || 0} ta mahsulot
                    </span>
                  </div>
                  {expandedRows[order.id] ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded items */}
                {expandedRows[order.id] && order.items?.length > 0 && (
                  <div className="border-t divide-y bg-muted/10">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3">
                        {/* Thumbnail */}
                        <div className="shrink-0">
                          {item.item?.image ? (
                            <button
                              type="button"
                              className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-border active:opacity-80 transition-opacity"
                              onClick={() =>
                                setImageDialog({
                                  open: true,
                                  src: item.item.image,
                                  name: item.item.name,
                                })
                              }
                            >
                              <img
                                src={item.item.image}
                                alt={item.item.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="font-medium text-sm leading-tight">
                            {item.item?.name || "—"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.item?.code && (
                              <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {item.item.code}
                              </span>
                            )}
                            {item.item?.type?.name && (
                              <span className="text-[11px] text-muted-foreground">
                                {item.item.type.name}
                              </span>
                            )}
                            {item.item?.color?.name && (
                              <span className="text-[11px] text-muted-foreground">
                                · {item.item.color.name}
                              </span>
                            )}
                          </div>

                          {/* Quantities grid */}
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            <div className="text-center rounded-xl bg-blue-50 border border-blue-100 px-2 py-1.5">
                              <p className="text-[10px] text-blue-500 font-medium leading-none mb-1">
                                So'ralgan
                              </p>
                              <p className="text-xs font-bold text-blue-700">
                                {formatNumber(item.requestedQuantity)}
                                <span className="font-normal text-blue-400 ml-0.5 text-[10px]">
                                  {item.item?.unit?.name}
                                </span>
                              </p>
                            </div>
                            <div className="text-center rounded-xl bg-violet-50 border border-violet-100 px-2 py-1.5">
                              <p className="text-[10px] text-violet-500 font-medium leading-none mb-1">
                                Tasdiqlangan
                              </p>
                              <p className="text-xs font-bold text-violet-700">
                                {item.confirmedQuantity != null ? (
                                  <>
                                    {formatNumber(item.confirmedQuantity)}
                                    <span className="font-normal text-violet-400 ml-0.5 text-[10px]">
                                      {item.item?.unit?.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-violet-300 font-normal">—</span>
                                )}
                              </p>
                            </div>
                            <div className="text-center rounded-xl bg-green-50 border border-green-100 px-2 py-1.5">
                              <p className="text-[10px] text-green-500 font-medium leading-none mb-1">
                                Qabul
                              </p>
                              <p className="text-xs font-bold text-green-700">
                                {item.receivedQuantity != null ? (
                                  <>
                                    {formatNumber(item.receivedQuantity)}
                                    <span className="font-normal text-green-400 ml-0.5 text-[10px]">
                                      {item.item?.unit?.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-green-300 font-normal">—</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Price + status */}
                          <div className="flex items-center justify-between pt-0.5">
                            {item.unitPrice > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {formatNumber(item.unitPrice)}
                                </span>{" "}
                                {item.currency?.name}
                              </span>
                            ) : (
                              <span />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Start action — supplier_confirmed only */}
                {order.status === "supplier_confirmed" && (
                  <div className="px-3 py-3 border-t">
                    <Button
                      className="w-full h-10 gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => navigate(`/supplier/orders/${order.id}`)}
                    >
                      <Play className="h-4 w-4" />
                      Boshlash
                    </Button>
                  </div>
                )}

                {/* Accept action — pending only */}
                {order.status === "pending" && (
                  <div className="px-3 py-3 border-t flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => openRejectDialog(order.id)}
                    >
                      <X className="h-4 w-4" />
                      Rad etish
                    </Button>
                    <Button
                      className="flex-1 h-10 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={() => openConfirmDialog(order.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Qabul qilish
                    </Button>
                  </div>
                )}

                {/* View action — all other statuses */}
                {order.status !== "supplier_confirmed" && order.status !== "pending" && (
                  <div className="px-3 py-3 border-t">
                    <Button
                      variant="outline"
                      className={`w-full h-10 gap-2 ${
                        order.status === "in_delivery"
                          ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                          : order.status === "received"
                            ? "border-green-200 text-green-700 hover:bg-green-50"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                      onClick={() => navigate(`/supplier/orders/${order.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      Ko'rish
                    </Button>
                  </div>
                )}

                {/* Footer — created date */}
                <div className="flex items-center gap-1.5 px-4 py-2 border-t bg-muted/10">
                  <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            {loading && currentPage > 1 && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Buyurtmalar topilmadi</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              {hasActiveFilters
                ? "Filtr shartlariga mos buyurtma topilmadi"
                : "Hali birorta buyurtma yo'q"}
            </p>
            {hasActiveFilters && (
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

      {/* Image dialog */}
      <Dialog
        open={imageDialog.open}
        onOpenChange={(open) => setImageDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
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

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Buyurtmani rad etish</DialogTitle>
            <DialogDescription>
              Buyurtmani rad etmoqchimisiz? Status "Yopildi"ga o'zgaradi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Izoh *</label>
            <Input
              placeholder="Rad etish sababini yozing..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectComment("");
              }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Rad etish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Buyurtmani tasdiqlash</DialogTitle>
            <DialogDescription>
              #{confirmId} raqamli buyurtmani qabul qilmoqchimisiz? Status
              "Tasdiqlandi"ga o'zgaradi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Qabul qilish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

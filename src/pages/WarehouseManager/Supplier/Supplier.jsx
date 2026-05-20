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
  Loader2,
  Trash2,
  MapPin,
  Clock,
  X,
  Send,
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
import { Card, CardContent } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import formatNumber from "@/utils/formatNumber";

const STATUS_CONFIG = {
  draft: {
    text: "Qoralama",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
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
  draft: "bg-slate-400",
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status] || "bg-gray-400"}`}
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

const Supplier = () => {
  const { toast } = useToast();
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendId, setSendId] = useState(null);
  const [isSending, setIsSending] = useState(false);
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
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((p) => p + 1);
        }
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

      const response = await api.get("/warehouseManager/purchaseOrder", {
        params,
      });

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

  useEffect(() => {
    if (currentPage > 1) fetchOrders(currentPage, filters);
  }, [currentPage]);

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const openSendDialog = (id) => {
    setSendId(id);
    setSendDialogOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      await api.patch(`/warehouseManager/purchaseOrder/${sendId}/status`, {
        status: "pending",
        comment: null,
      });
      toast({ title: "Muvaffaqiyatli", description: "Buyurtma yuborildi" });
      setSendDialogOpen(false);
      fetchOrders(1, filters);
    } catch {
      toast({
        title: "Xatolik",
        description: "Statusni o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/warehouseManager/purchaseOrder/${deleteId}`);
      toast({ title: "Muvaffaqiyatli", description: "Buyurtma o'chirildi" });
      setDeleteDialogOpen(false);
      fetchOrders(1, filters);
    } catch {
      toast({
        title: "Xatolik",
        description: "Buyurtma o'chirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Count orders by status for summary bar
  const statusCounts =
    ordersData?.data?.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}) || {};

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Buyurtmalar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Xarid buyurtmalarini kuzatish va boshqarish
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="create-order/">
            <CirclePlus className="h-4 w-4 mr-1.5" />
            Yangi buyurtma
          </Link>
        </Button>
      </div>

      {/* Status summary */}
      {ordersData && Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() =>
                handleFilterChange(
                  "status",
                  filters.status === status ? "" : status,
                )
              }
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                filters.status === status
                  ? "ring-2 ring-offset-1 ring-primary"
                  : "hover:shadow-sm"
              } ${STATUS_CONFIG[status]?.className || "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status] || "bg-gray-400"}`}
              />
              {STATUS_CONFIG[status]?.text || status}
              <span className="font-bold">{count}</span>
            </button>
          ))}
          {ordersData.total > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground">
              Jami: <strong>{ordersData.total}</strong>
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-none border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buyurtma raqami yoki izoh..."
                className="pl-8 h-9 text-sm"
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>

            <Select
              value={filters.status || "all"}
              onValueChange={(v) => handleFilterChange("status", v)}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
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

            <Input
              type="date"
              className="w-40 h-9 text-sm"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />

            <Input
              type="date"
              className="w-40 h-9 text-sm"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 gap-1.5 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card className="shadow-none border">
        <CardContent className="p-0">
          {loading && currentPage === 1 ? (
            <div className="p-5 space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-full h-12 rounded-lg" />
              ))}
            </div>
          ) : ordersData?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                    <TableHead className="pl-5 w-36 text-xs font-semibold">
                      Raqam
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Muddat
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Izoh
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Mahsulotlar
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Yaratilgan
                    </TableHead>
                    <TableHead className="pr-5 text-right text-xs font-semibold">
                      Amallar
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.data.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <TableRow
                        ref={
                          index === ordersData.data.length - 1
                            ? lastRowRef
                            : null
                        }
                        className="cursor-pointer hover:bg-muted/20 transition-colors border-b"
                        onClick={() =>
                          setExpandedRows((prev) => ({
                            ...prev,
                            [order.id]: !prev[order.id],
                          }))
                        }
                      >
                        <TableCell className="pl-5 py-3">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {order.orderNumber}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span
                              className={
                                new Date(order.deadline) < new Date() &&
                                order.status !== "closed" &&
                                order.status !== "received"
                                  ? "text-red-600 font-medium"
                                  : "text-foreground"
                              }
                            >
                              {formatDate(order.deadline)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-sm text-muted-foreground truncate max-w-40 block">
                            {order.comments || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className="text-xs font-medium tabular-nums"
                            >
                              {order.items?.length || 0} ta
                            </Badge>
                            {expandedRows[order.id] ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="py-3 pr-5 text-right">
                          {order.status === "draft" ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSendDialog(order.id);
                                }}
                              >
                                <Send className="h-3.5 w-3.5" />
                                Yuborish
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(order.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded items */}
                      {expandedRows[order.id] && order.items?.length > 0 && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-b">
                          <TableCell colSpan={8} className="py-3 px-8">
                            <div className="rounded-xl border border-border/60 overflow-hidden bg-background shadow-sm">
                              <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Buyurtma tarkibi — {order.items.length} ta
                                  mahsulot
                                </span>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent border-b border-border/40">
                                    <TableHead className="text-xs py-2 pl-4">
                                      Mahsulot
                                    </TableHead>
                                    <TableHead className="text-xs py-2">
                                      Kod
                                    </TableHead>
                                    <TableHead className="text-xs py-2">
                                      Turi / Rangi
                                    </TableHead>
                                    <TableHead className="text-xs py-2">
                                      So'ralgan
                                    </TableHead>
                                    <TableHead className="text-xs py-2">
                                      Tasdiqlangan
                                    </TableHead>
                                    <TableHead className="text-xs py-2">
                                      Qabul qilingan
                                    </TableHead>
                                    <TableHead className="text-xs py-2">
                                      Narx
                                    </TableHead>
                                    <TableHead className="text-xs py-2">
                                      Valyuta
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item) => (
                                    <TableRow
                                      key={item.id}
                                      className="hover:bg-muted/20 border-b border-border/30 last:border-0"
                                    >
                                      <TableCell className="py-2.5 pl-4">
                                        <div className="flex items-center gap-2.5">
                                          {item.item?.image ? (
                                            <button
                                              type="button"
                                              className="w-8 h-8 rounded-lg overflow-hidden cursor-zoom-in shrink-0 ring-1 ring-border hover:ring-2 hover:ring-primary transition-all"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setImageDialog({
                                                  open: true,
                                                  src: item.item.image,
                                                  name: item.item.name,
                                                });
                                              }}
                                            >
                                              <img
                                                src={item.item.image}
                                                alt={item.item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </button>
                                          ) : (
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                              <Package className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                          )}
                                          <span className="text-sm font-medium leading-tight">
                                            {item.item?.name || "—"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2.5">
                                        <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                          {item.item?.code || "—"}
                                        </span>
                                      </TableCell>
                                      <TableCell className="py-2.5">
                                        <div className="text-xs space-y-0.5">
                                          <div className="text-foreground">
                                            {item.item?.type?.name || "—"}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {item.item?.color?.name || "—"}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2.5 text-sm font-medium">
                                        {formatNumber(item.requestedQuantity)}{" "}
                                        <span className="text-xs text-muted-foreground font-normal">
                                          {item.item?.unit?.name}
                                        </span>
                                      </TableCell>
                                      <TableCell className="py-2.5 text-sm">
                                        {item.confirmedQuantity != null ? (
                                          <span className="font-medium">
                                            {formatNumber(
                                              item.confirmedQuantity,
                                            )}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">
                                            —
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-2.5 text-sm">
                                        {item.receivedQuantity != null ? (
                                          <span className="font-medium text-green-700">
                                            {formatNumber(
                                              item.receivedQuantity,
                                            )}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">
                                            —
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-2.5 text-sm font-semibold tabular-nums">
                                        {formatNumber(item.unitPrice)}
                                      </TableCell>
                                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                                        {item.currency?.name || "—"}
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
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">Buyurtmalar topilmadi</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                {hasActiveFilters
                  ? "Filtr shartlariga mos buyurtma topilmadi. Filtrlarni tozalang."
                  : "Hali birorta buyurtma yo'q. Yangi buyurtma qo'shing."}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={resetFilters}
                >
                  Filtrlarni tozalash
                </Button>
              ) : (
                <Button size="sm" className="mt-4" asChild>
                  <Link to="create-order/">
                    <CirclePlus className="h-4 w-4 mr-1.5" />
                    Yangi buyurtma
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image dialog */}
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

      {/* Send to pending confirmation dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Buyurtmani yuborish</DialogTitle>
            <DialogDescription>
              #{sendId} raqamli buyurtmani ta'minotchiga yubormoqchimisiz?
              Status "Kutilmoqda"ga o'zgaradi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleConfirmSend} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Yuborish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Buyurtmani o'chirish</DialogTitle>
            <DialogDescription>
              #{deleteId} raqamli buyurtmani o'chirmoqchimisiz? Bu amalni
              qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  O'chirilmoqda...
                </>
              ) : (
                "O'chirish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Supplier;

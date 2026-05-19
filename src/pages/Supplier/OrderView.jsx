import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  Package,
  ChevronDown,
  ChevronUp,
  Loader2,
  Truck,
  AlertCircle,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const STATUS_CONFIG = {
  draft: {
    text: "Qoralama",
    className: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-500",
  },
  pending: {
    text: "Kutilmoqda",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  supplier_confirmed: {
    text: "Tasdiqlandi",
    className: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  in_delivery: {
    text: "Yetkazilmoqda",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  received: {
    text: "Qabul qilindi",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  closed: {
    text: "Yopildi",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  },
};

const ITEM_STATUS_CONFIG = {
  pending: { text: "Kutilmoqda", className: "bg-blue-50 text-blue-600" },
  confirmed: { text: "Tasdiqlandi", className: "bg-violet-50 text-violet-600" },
  rejected: { text: "Rad etildi", className: "bg-red-50 text-red-600" },
  received: { text: "Qabul qilindi", className: "bg-green-50 text-green-600" },
};

const LOG_LABELS = {
  created: "Yaratildi",
  status_changed: "Status o'zgartirildi",
  supplier_confirmed: "Tasdiqlandi",
  in_delivery: "Yetkazilmoqda",
  received: "Qabul qilindi",
  closed: "Yopildi",
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

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    text: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.text}
    </span>
  );
};

const OrderView = () => {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [comment, setComment] = useState("");
  const [imageDialog, setImageDialog] = useState({
    open: false,
    src: null,
    name: null,
  });
  const [itemForms, setItemForms] = useState({});
  const [currencies, setCurrencies] = useState([]);

  const getItem = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/supplier/purchaseOrder/${id}`);
      setData(res.data);
      const initial = {};
      res.data.items.forEach((item) => {
        initial[item.id] = {
          confirmedQuantity: "",
          unitPrice: "",
          currencyId: "",
        };
      });
      setItemForms(initial);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await api.get("/currency");
      setCurrencies(res.data?.data ?? res.data ?? []);
    } catch {
      // silently fail — fallback to item's existing currency
    }
  };

  useEffect(() => {
    getItem();
    fetchCurrencies();
  }, []);

  const updateItemForm = (itemId, field, value) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    const items = data.items.map((item) => {
      const form = itemForms[item.id] || {};
      return {
        purchaseOrderItemId: item.id,
        confirmedQuantity: Number(form.confirmedQuantity) || 0,
        unitPrice: Number(form.unitPrice) || 0,
        currencyId: Number(form.currencyId) || item.currency?.id,
      };
    });

    const hasEmpty = items.some((i) => !i.confirmedQuantity);
    if (hasEmpty) {
      toast({
        title: "Xatolik",
        description: "Barcha mahsulotlar uchun tasdiqlangan miqdorni kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/supplier/purchaseOrder/${id}/status`, {
        comment: comment.trim() || null,
        items,
      });
      toast({ title: "Muvaffaqiyatli", description: "Yetkazish boshlandi" });
      navigate("/supplier/orders");
    } catch {
      toast({
        title: "Xatolik",
        description: "Yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue =
    data &&
    new Date(data.deadline) < new Date() &&
    data.status !== "closed" &&
    data.status !== "received";

  const canEdit = data?.status === "supplier_confirmed";

  const currencyOptions =
    currencies.length > 0
      ? currencies
      : (data?.items
          ?.map((i) => i.currency)
          .filter(Boolean)
          .filter(
            (c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx,
          ) ?? []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-mono font-bold text-base leading-none">
              {data.orderNumber}
            </p>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Order meta */}
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Muddat:</span>
            <span className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
              {formatDate(data.deadline)}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3" />
                Muddati o'tdi
              </span>
            )}
          </div>

          {data.comments && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2 leading-relaxed">
              {data.comments}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Mahsulotlar ({data.items.length})
            </h2>
          </div>

          {data.items.map((item) => {
            const form = itemForms[item.id] || {};

            return (
              <div
                key={item.id}
                className="rounded-2xl border bg-card overflow-hidden"
              >
                {/* Item header */}
                <div className="flex gap-3 p-3">
                  <div className="shrink-0">
                    {item.item?.image ? (
                      <button
                        type="button"
                        className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-border active:opacity-80"
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
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-sm leading-snug">
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
                  </div>
                </div>

                {/* Quantity info */}
                <div className="text-center rounded-xl bg-blue-100 border border-blue-100 border-t px-3 py-2.5 gap-2 m-2">
                  <p className="text-[10px] text-blue-500 font-medium leading-none mb-1.5">
                    So'ralgan
                  </p>
                  <p className="text-xs font-bold text-blue-700">
                    {formatNumber(item.requestedQuantity)}
                    <span className="font-normal text-blue-400 ml-0.5 text-[10px]">
                      {item.item?.unit?.name}
                    </span>
                  </p>
                </div>

                {/* Editable fields */}
                {canEdit && (
                  <div className="border-t px-3 py-3 space-y-3 bg-background">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Tasdiqlangan miqdor *
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Miqdorni kiriting"
                          className="h-9 text-sm"
                          value={form.confirmedQuantity}
                          onChange={(e) =>
                            updateItemForm(
                              item.id,
                              "confirmedQuantity",
                              e.target.value,
                            )
                          }
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {item.item?.unit?.name}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Narx
                        </label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-9 text-sm"
                          value={form.unitPrice}
                          onChange={(e) =>
                            updateItemForm(item.id, "unitPrice", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Valyuta
                        </label>
                        <Select
                          value={String(form.currencyId)}
                          onValueChange={(v) =>
                            updateItemForm(item.id, "currencyId", v)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Valyuta" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencyOptions.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Read-only price for non-editable states */}
                {!canEdit && item.unitPrice > 0 && (
                  <div className="border-t px-3 py-2 flex items-center justify-between bg-background">
                    <span className="text-xs text-muted-foreground">Narx:</span>
                    <span className="text-sm font-semibold">
                      {formatNumber(item.unitPrice)}{" "}
                      <span className="font-normal text-muted-foreground text-xs">
                        {item.currency?.name}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comment field */}
        {canEdit && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Izoh (ixtiyoriy)</label>
            <Input
              placeholder="Izoh qoldiring..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-10"
            />
          </div>
        )}

        {/* Activity log */}
        {data.logs?.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium active:bg-muted/40 transition-colors"
              onClick={() => setShowLogs((v) => !v)}
            >
              <span>Faoliyat tarixi ({data.logs.length})</span>
              {showLogs ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showLogs && (
              <div className="border-t divide-y">
                {[...data.logs].reverse().map((log) => (
                  <div key={log.id} className="px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {LOG_LABELS[log.action] || log.action}
                      </span>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    {(log.oldStatus || log.newStatus) && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {log.oldStatus && (
                          <StatusBadge status={log.oldStatus} />
                        )}
                        {log.oldStatus && log.newStatus && (
                          <span className="text-xs text-muted-foreground">
                            →
                          </span>
                        )}
                        {log.newStatus && (
                          <StatusBadge status={log.newStatus} />
                        )}
                      </div>
                    )}
                    {log.comment && (
                      <p className="text-xs text-muted-foreground">
                        {log.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky submit */}
      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t px-4 py-3">
          <Button
            className="w-full h-11 gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4" />
                Yetkazishni tasdiqlash
              </>
            )}
          </Button>
        </div>
      )}

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
    </div>
  );
};

export default OrderView;

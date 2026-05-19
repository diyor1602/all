import { useState, useEffect, useRef } from "react";
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
  Banknote,
  CreditCard,
  Landmark,
  ImageIcon,
  X,
  Check,
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

const PAYMENT_METHODS = [
  {
    key: "cash",
    label: "Naqt",
    icon: Banknote,
    color: "green",
    activeBg: "bg-green-600",
    activeText: "text-white",
    activeBorder: "border-green-600",
    inactiveBg: "bg-green-50",
    inactiveText: "text-green-700",
    inactiveBorder: "border-green-200",
    fieldBg: "bg-green-50/50",
    labelColor: "text-green-700",
  },
  {
    key: "card",
    label: "Karta",
    icon: CreditCard,
    color: "blue",
    activeBg: "bg-blue-600",
    activeText: "text-white",
    activeBorder: "border-blue-600",
    inactiveBg: "bg-blue-50",
    inactiveText: "text-blue-700",
    inactiveBorder: "border-blue-200",
    fieldBg: "bg-blue-50/50",
    labelColor: "text-blue-700",
  },
  {
    key: "debt",
    label: "Qarz",
    icon: Clock,
    color: "amber",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    activeBorder: "border-amber-500",
    inactiveBg: "bg-amber-50",
    inactiveText: "text-amber-700",
    inactiveBorder: "border-amber-200",
    fieldBg: "bg-amber-50/50",
    labelColor: "text-amber-700",
  },
  {
    key: "bank",
    label: "Bank",
    icon: Landmark,
    color: "violet",
    activeBg: "bg-violet-600",
    activeText: "text-white",
    activeBorder: "border-violet-600",
    inactiveBg: "bg-violet-50",
    inactiveText: "text-violet-700",
    inactiveBorder: "border-violet-200",
    fieldBg: "bg-violet-50/50",
    labelColor: "text-violet-700",
  },
];

const EMPTY_PAYMENT = { amount: "", currencyId: "", paidAt: "", comment: "" };

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

const todayISO = () => new Date().toISOString().split("T")[0];

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
  const fileInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [comment, setComment] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [imageDialog, setImageDialog] = useState({
    open: false,
    src: null,
    name: null,
  });
  const [itemForms, setItemForms] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [payments, setPayments] = useState(() =>
    Object.fromEntries(
      PAYMENT_METHODS.map((m) => [m.key, { enabled: false, ...EMPTY_PAYMENT }]),
    ),
  );

  const getItem = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/supplier/purchaseOrder/${id}`);
      setData(res.data);
      const initial = {};
      res.data.items.forEach((item) => {
        initial[item.id] = {
          confirmedQuantity: "",
          unitPrice: item.unitPrice ?? "",
          currencyId: item.currency?.id ? String(item.currency.id) : "",
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
      const res = await api.get("/supplier/currency");
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

  const togglePayment = (key) => {
    setPayments((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
        ...(prev[key].enabled ? EMPTY_PAYMENT : { paidAt: todayISO() }),
      },
    }));
  };

  const updatePayment = (key, field, value) => {
    setPayments((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachmentPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeFile = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

    const enabledPayments = PAYMENT_METHODS.filter(
      (m) => payments[m.key].enabled,
    );
    for (const m of enabledPayments) {
      const p = payments[m.key];
      if (!p.amount || !p.currencyId || !p.paidAt) {
        toast({
          title: "Xatolik",
          description: `${m.label} to'lovi uchun summa, valyuta va sanani kiriting`,
          variant: "destructive",
        });
        return;
      }
    }

    const paymentsJson = enabledPayments.map((m) => {
      const p = payments[m.key];
      return {
        method: m.key,
        amount: Number(p.amount),
        currencyId: Number(p.currencyId),
        paidAt: p.paidAt,
        comment: p.comment.trim() || "",
      };
    });

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("comment", comment.trim() || "");
      formData.append("itemsJson", JSON.stringify(items));
      formData.append("paymentsJson", JSON.stringify(paymentsJson));
      if (attachmentFile) formData.append("file", attachmentFile);

      await api.patch(`/supplier/purchaseOrder/${id}/status`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Mahsulotlar ({data.items.length})
          </h2>

          {data.items.map((item) => {
            const form = itemForms[item.id] || {};
            const itemStatus = ITEM_STATUS_CONFIG[item.status] || {
              text: item.status,
              className: "bg-gray-100 text-gray-600",
            };

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
                    <span
                      className={`inline-block text-[11px] px-2 py-0.5 rounded-md font-medium ${itemStatus.className}`}
                    >
                      {itemStatus.text}
                    </span>
                  </div>
                </div>

                {/* Quantity info */}
                <div className="border-t px-3 py-2.5 grid grid-cols-3 gap-2 bg-muted/10">
                  <div className="text-center rounded-xl bg-blue-50 border border-blue-100 px-2 py-2">
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
                  <div className="text-center rounded-xl bg-violet-50 border border-violet-100 px-2 py-2">
                    <p className="text-[10px] text-violet-500 font-medium leading-none mb-1.5">
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
                  <div className="text-center rounded-xl bg-green-50 border border-green-100 px-2 py-2">
                    <p className="text-[10px] text-green-500 font-medium leading-none mb-1.5">
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

                {/* Read-only price */}
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

        {/* ── Payments ── */}
        {canEdit && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">To'lov</h2>

            {/* Method toggle grid */}
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const active = payments[m.key].enabled;
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => togglePayment(m.key)}
                    className={`relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 font-medium text-sm transition-all active:scale-[0.97] ${
                      active
                        ? `${m.activeBg} ${m.activeText} ${m.activeBorder}`
                        : `${m.inactiveBg} ${m.inactiveText} ${m.inactiveBorder}`
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {m.label}
                    {active && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active payment forms */}
            {PAYMENT_METHODS.filter((m) => payments[m.key].enabled).map((m) => {
              const p = payments[m.key];
              const Icon = m.icon;
              return (
                <div
                  key={m.key}
                  className={`rounded-2xl border-2 overflow-hidden ${m.inactiveBorder}`}
                >
                  {/* Form header */}
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 ${m.inactiveBg}`}
                  >
                    <div className={`flex items-center gap-2 font-semibold text-sm ${m.inactiveText}`}>
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePayment(m.key)}
                      className={`p-1 rounded-full hover:bg-black/5 ${m.inactiveText}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="px-4 py-3 bg-background space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Summa *
                        </label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-9 text-sm"
                          value={p.amount}
                          onChange={(e) =>
                            updatePayment(m.key, "amount", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Valyuta *
                        </label>
                        <Select
                          value={String(p.currencyId)}
                          onValueChange={(v) =>
                            updatePayment(m.key, "currencyId", v)
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

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Sana *
                      </label>
                      <Input
                        type="date"
                        className="h-9 text-sm"
                        value={p.paidAt}
                        onChange={(e) =>
                          updatePayment(m.key, "paidAt", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Izoh
                      </label>
                      <Input
                        placeholder="Izoh..."
                        className="h-9 text-sm"
                        value={p.comment}
                        onChange={(e) =>
                          updatePayment(m.key, "comment", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Attachment ── */}
        {canEdit && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Fayl biriktirish</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />

            {attachmentFile ? (
              <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  {attachmentPreview ? (
                    <button
                      type="button"
                      className="w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-border"
                      onClick={() =>
                        setImageDialog({
                          open: true,
                          src: attachmentPreview,
                          name: attachmentFile.name,
                        })
                      }
                    >
                      <img
                        src={attachmentPreview}
                        alt={attachmentFile.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachmentFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(attachmentFile.size / 1024).toFixed(0)} KB
                    </p>
                    <button
                      type="button"
                      className="mt-1.5 text-xs text-blue-600 font-medium"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Almashtirish
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/40 transition-colors active:scale-[0.99] py-8 flex flex-col items-center gap-2.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-background border flex items-center justify-center shadow-sm">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Fayl tanlang
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rasm, PDF, Word yoki Excel
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* ── Comment ── */}
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

        {/* ── Activity log ── */}
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

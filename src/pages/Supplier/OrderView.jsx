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
  DialogFooter,
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
  ImageIcon,
  X,
  Check,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import { PAYMENT_METHODS } from "@/lib/supplierPaymentMethods";
import EmployeeSearch from "./EmployeeSearch";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  const [stores, setStores] = useState([]);
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchForItem, setEmployeeSearchForItem] = useState(null);

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
          paymentMethod: "",
          paymentCurrencies: [{ amount: "", currencyId: "" }],
          paymentDebts: [
            {
              amount: "",
              currencyId: "",
              debtorType: "",
              debtorStoreId: "",
              debtorEmployeeId: "",
              debtorEmployeeName: "",
              debtorName: "",
              debtorPhone: "",
            },
          ],
          paymentComment: "",
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

  const fetchStores = async () => {
    try {
      const res = await api.get("v1/supplier/stores", {
        params: { is_active: true },
      });
      setStores(res.data || []);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    getItem();
    fetchCurrencies();
    fetchStores();
  }, []);

  const updateItemForm = (itemId, field, value) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const updateItemPaymentCurrency = (itemId, currencyIndex, field, value) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        paymentCurrencies: prev[itemId].paymentCurrencies.map((row, idx) =>
          idx === currencyIndex ? { ...row, [field]: value } : row,
        ),
      },
    }));
  };

  const addItemPaymentCurrencyRow = (itemId) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        paymentCurrencies: [
          ...prev[itemId].paymentCurrencies,
          { amount: "", currencyId: "" },
        ],
      },
    }));
  };

  const removeItemPaymentCurrencyRow = (itemId, currencyIndex) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        paymentCurrencies: prev[itemId].paymentCurrencies.filter(
          (_, idx) => idx !== currencyIndex,
        ),
      },
    }));
  };

  const updateItemPaymentDebt = (itemId, debtIndex, field, value) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        paymentDebts: prev[itemId].paymentDebts.map((row, idx) =>
          idx === debtIndex ? { ...row, [field]: value } : row,
        ),
      },
    }));
  };

  const addItemPaymentDebtRow = (itemId) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        paymentDebts: [
          ...prev[itemId].paymentDebts,
          {
            amount: "",
            currencyId: "",
            debtorType: "",
            debtorStoreId: "",
            debtorEmployeeId: "",
            debtorEmployeeName: "",
            debtorName: "",
            debtorPhone: "",
          },
        ],
      },
    }));
  };

  const removeItemPaymentDebtRow = (itemId, debtIndex) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        paymentDebts: prev[itemId].paymentDebts.filter(
          (_, idx) => idx !== debtIndex,
        ),
      },
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

  const handlePreSubmit = () => {
    for (const item of data.items) {
      const form = itemForms[item.id] || {};

      // Skip items without confirmed quantity
      if (!form.confirmedQuantity || Number(form.confirmedQuantity) === 0) {
        continue;
      }

      // Validate payment method is selected
      if (!form.paymentMethod) {
        toast({
          title: "Xatolik",
          description: `${item.item?.name || "Mahsulot"} uchun to'lov turini tanlang`,
          variant: "destructive",
        });
        return;
      }

      // Validate based on payment method
      if (form.paymentMethod === "debt") {
        // Validate at least one debt entry is filled
        const hasValidDebt = form.paymentDebts?.some(
          (debt) => debt.amount && debt.currencyId && debt.debtorType,
        );

        if (!hasValidDebt) {
          toast({
            title: "Xatolik",
            description: `${item.item?.name || "Mahsulot"} uchun kamida bitta qarz qatori kiriting`,
            variant: "destructive",
          });
          return;
        }

        // Validate each debt entry
        for (const debt of form.paymentDebts) {
          // Skip empty rows
          if (!debt.amount && !debt.currencyId && !debt.debtorType) continue;

          // Validate all filled fields are complete
          if (
            (debt.amount && !debt.currencyId) ||
            (!debt.amount && debt.currencyId) ||
            (debt.amount && !debt.debtorType)
          ) {
            toast({
              title: "Xatolik",
              description: `${item.item?.name || "Mahsulot"} uchun har bir qarz qatori uchun summa, valyuta va qarz turini kiriting`,
              variant: "destructive",
            });
            return;
          }

          if (debt.debtorType === "store" && !debt.debtorStoreId) {
            toast({
              title: "Xatolik",
              description: `${item.item?.name || "Mahsulot"} uchun do'konni tanlang`,
              variant: "destructive",
            });
            return;
          }
          if (debt.debtorType === "employee" && !debt.debtorEmployeeId) {
            toast({
              title: "Xatolik",
              description: `${item.item?.name || "Mahsulot"} uchun xodimni tanlang`,
              variant: "destructive",
            });
            return;
          }
          if (
            debt.debtorType === "other" &&
            (!debt.debtorName || !debt.debtorPhone)
          ) {
            toast({
              title: "Xatolik",
              description: `${item.item?.name || "Mahsulot"} uchun begona shaxs ismi va telefon raqamini kiriting`,
              variant: "destructive",
            });
            return;
          }
        }
      } else {
        // For non-debt payments (cash, card, etc.), validate paymentCurrencies
        const hasValidCurrency = form.paymentCurrencies.some(
          (row) => row.amount && row.currencyId,
        );

        if (!hasValidCurrency) {
          toast({
            title: "Xatolik",
            description: `${item.item?.name || "Mahsulot"} uchun kamida bitta valyuta va summa kiriting`,
            variant: "destructive",
          });
          return;
        }

        // Validate all filled currency rows have both amount and currency
        for (const row of form.paymentCurrencies) {
          if (
            (row.amount && !row.currencyId) ||
            (!row.amount && row.currencyId)
          ) {
            toast({
              title: "Xatolik",
              description: `${item.item?.name || "Mahsulot"} uchun har bir valyuta qatori uchun summa va valyutani kiriting`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    const nowISO = new Date().toISOString();
    const items = data.items.map((item) => {
      const form = itemForms[item.id] || {};

      const paymentData = {
        method: form.paymentMethod,
        currencies: form.paymentCurrencies
          .filter((row) => row.amount && row.currencyId)
          .map((currencyRow) => ({
            amount: Number(currencyRow.amount),
            currencyId: Number(currencyRow.currencyId),
          })),
        comment: form.paymentComment?.trim() || "",
        paidAt: form.paymentMethod === "debt" ? null : nowISO,
      };

      if (form.paymentMethod === "debt") {
        paymentData.debts = form.paymentDebts
          .filter((debt) => debt.amount && debt.currencyId && debt.debtorType)
          .map((debt) => {
            const debtData = {
              amount: Number(debt.amount),
              currencyId: Number(debt.currencyId),
              debtorType: debt.debtorType,
              storeId: data.storeId,
            };

            if (debt.debtorType === "store") {
              debtData.debtorStoreId = Number(debt.debtorStoreId);
              debtData.debtorEmployeeId = null;
              debtData.debtorName = null;
              debtData.debtorPhone = null;
            } else if (debt.debtorType === "employee") {
              debtData.debtorStoreId = null;
              debtData.debtorEmployeeId = Number(debt.debtorEmployeeId);
              debtData.debtorName = null;
              debtData.debtorPhone = null;
            } else if (debt.debtorType === "other") {
              debtData.debtorStoreId = null;
              debtData.debtorEmployeeId = null;
              debtData.debtorName = debt.debtorName?.trim() || "";
              debtData.debtorPhone = debt.debtorPhone?.trim() || "";
            }

            return debtData;
          });
      }

      return {
        purchaseOrderItemId: item.id,
        confirmedQuantity: Number(form.confirmedQuantity) || 0,
        unitPrice: Number(form.unitPrice) || 0,
        currencyId: Number(form.currencyId) || item.currency?.id,
        payment: paymentData,
      };
    });

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("comment", comment.trim() || "");
      formData.append("itemsJson", JSON.stringify(items));
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
      setConfirmOpen(false);
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

  const itemTotalsByCurrency = {};
  if (data) {
    data.items.forEach((item) => {
      const form = itemForms[item.id] || {};
      const qty = Number(form.confirmedQuantity) || 0;
      const price = Number(form.unitPrice) || 0;
      const currId = String(form.currencyId || item.currency?.id || "");
      const currName =
        currencyOptions.find((c) => String(c.id) === currId)?.name ??
        item.currency?.name ??
        "";
      if (qty > 0 && price > 0 && currId) {
        if (!itemTotalsByCurrency[currId])
          itemTotalsByCurrency[currId] = { name: currName, total: 0 };
        itemTotalsByCurrency[currId].total += qty * price;
      }
    });
  }

  const paymentTotalsByCurrency = {};
  if (data) {
    data.items.forEach((item) => {
      const form = itemForms[item.id] || {};

      // For cash/card payments, use paymentCurrencies
      if (form.paymentMethod !== "debt") {
        form.paymentCurrencies?.forEach((currencyRow) => {
          const amount = Number(currencyRow.amount) || 0;
          const currId = String(currencyRow.currencyId || "");
          const currName =
            currencyOptions.find((c) => String(c.id) === currId)?.name ?? "";
          if (amount > 0 && currId) {
            if (!paymentTotalsByCurrency[currId])
              paymentTotalsByCurrency[currId] = { name: currName, total: 0 };
            paymentTotalsByCurrency[currId].total += amount;
          }
        });
      } else {
        // For debt payments, use paymentDebts
        form.paymentDebts?.forEach((debt) => {
          const amount = Number(debt.amount) || 0;
          const currId = String(debt.currencyId || "");
          const currName =
            currencyOptions.find((c) => String(c.id) === currId)?.name ?? "";
          if (amount > 0 && currId) {
            if (!paymentTotalsByCurrency[currId])
              paymentTotalsByCurrency[currId] = { name: currName, total: 0 };
            paymentTotalsByCurrency[currId].total += amount;
          }
        });
      }
    });
  }

  const hasItemPayments = data?.items.some(
    (item) => itemForms[item.id]?.paymentMethod,
  );

  const paymentMismatches = hasItemPayments
    ? (() => {
        const allCurrIds = new Set([
          ...Object.keys(itemTotalsByCurrency),
          ...Object.keys(paymentTotalsByCurrency),
        ]);
        const TOLERANCE = 0.01;
        return [...allCurrIds]
          .map((currId) => {
            const itemTotal = itemTotalsByCurrency[currId]?.total ?? 0;
            const payTotal = paymentTotalsByCurrency[currId]?.total ?? 0;
            const name =
              itemTotalsByCurrency[currId]?.name ??
              paymentTotalsByCurrency[currId]?.name ??
              "";
            return {
              currId,
              name,
              itemTotal,
              payTotal,
              diff: itemTotal - payTotal,
            };
          })
          .filter((m) => Math.abs(m.diff) > TOLERANCE);
      })()
    : [];

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
      <EmployeeSearch
        open={employeeSearchOpen}
        onOpenChange={setEmployeeSearchOpen}
        onSelectEmployee={(employee) => {
          if (employeeSearchForItem) {
            // Parse the item ID and debt index from the format "itemId-debtIndex"
            const [itemId, debtIndex] = employeeSearchForItem.split("-");
            if (debtIndex !== undefined) {
              updateItemPaymentDebt(
                itemId,
                parseInt(debtIndex),
                "debtorEmployeeId",
                employee.id,
              );
              updateItemPaymentDebt(
                itemId,
                parseInt(debtIndex),
                "debtorEmployeeName",
                employee.name,
              );
            } else {
              // Fallback for old format (just itemId)
              updateItemForm(itemId, "paymentDebtorEmployeeId", employee.id);
              updateItemForm(
                itemId,
                "paymentDebtorEmployeeName",
                employee.name,
              );
            }
          }
          setEmployeeSearchOpen(false);
          setEmployeeSearchForItem(null);
        }}
      />

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
          <div className="flex items-center gap-2 text-sm flex-wrap">
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

        {/* Order totals summary (for editing) */}
        {canEdit && Object.keys(itemTotalsByCurrency).length > 0 && (
          <div className="rounded-2xl border bg-muted/20 px-4 py-3 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Buyurtma jami narxi
            </p>
            <div className="space-y-1.5">
              {Object.entries(itemTotalsByCurrency).map(
                ([currId, { name, total }]) => {
                  const paid = paymentTotalsByCurrency[currId]?.total ?? 0;
                  const diff = total - paid;
                  const exact = hasItemPayments && diff === 0;
                  const over = hasItemPayments && diff < 0;
                  const under = hasItemPayments && diff > 0 && paid > 0;
                  return (
                    <div key={currId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {name}
                        </span>
                        <span className="text-sm font-bold">
                          {formatNumber(total)}
                        </span>
                      </div>
                      {hasItemPayments && (
                        <div
                          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            exact
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : over
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : under
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-muted/40 text-muted-foreground border border-transparent"
                          }`}
                        >
                          <span>
                            {exact
                              ? "To'lov to'liq ✓"
                              : over
                                ? `Ortiqcha: ${formatNumber(Math.abs(diff))} ${name}`
                                : under
                                  ? `Qoldi: ${formatNumber(diff)} ${name}`
                                  : `Kiritilmagan: ${formatNumber(total)} ${name}`}
                          </span>
                          {!exact && (
                            <span className="font-normal opacity-70">
                              Kiritildi: {formatNumber(paid)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
              {/* Extra currencies in payments not in items */}
              {hasItemPayments &&
                Object.entries(paymentTotalsByCurrency)
                  .filter(([currId]) => !itemTotalsByCurrency[currId])
                  .map(([currId, { name, total }]) => (
                    <div
                      key={currId}
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-100 text-xs font-medium"
                    >
                      <span>
                        Ortiqcha: {formatNumber(total)} {name}
                      </span>
                      <span className="font-normal opacity-70">
                        buyurtmada yo'q
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        )}

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
                        Tasdiqlangan miqdor * (
                        {formatNumber(form.confirmedQuantity)})
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
                          Narx ({formatNumber(form.unitPrice)})
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

                    {form.confirmedQuantity > 0 && form.unitPrice > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-green-100 px-3 py-2.5">
                        <span className="text-xs font-medium text-green-700">
                          Jami narxi
                        </span>
                        <span className="text-sm font-bold text-green-800">
                          {formatNumber(
                            Number(form.confirmedQuantity) *
                              Number(form.unitPrice),
                          )}{" "}
                          <span className="text-xs font-normal text-green-600">
                            {currencyOptions.find(
                              (c) => String(c.id) === String(form.currencyId),
                            )?.name ?? item.currency?.name}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Payment section per item */}
                    <div className="border-t pt-3 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        To'lov
                      </p>

                      {/* Payment method selection */}
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.map((m) => {
                          const active = form.paymentMethod === m.key;
                          const Icon = m.icon;
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => {
                                updateItemForm(item.id, "paymentMethod", m.key);
                                // Reset payment fields when method changes
                                updateItemForm(item.id, "paymentCurrencies", [
                                  { amount: "", currencyId: "" },
                                ]);
                                updateItemForm(item.id, "paymentComment", "");
                                updateItemForm(item.id, "paymentDebts", [
                                  {
                                    amount: "",
                                    currencyId: "",
                                    debtorType: "",
                                    debtorStoreId: "",
                                    debtorEmployeeId: "",
                                    debtorEmployeeName: "",
                                    debtorName: "",
                                    debtorPhone: "",
                                  },
                                ]);
                              }}
                              className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 font-medium text-xs transition-all active:scale-[0.97] ${
                                active
                                  ? `${m.activeBg} ${m.activeText} ${m.activeBorder}`
                                  : `${m.inactiveBg} ${m.inactiveText} ${m.inactiveBorder}`
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              {m.label}
                              {active && (
                                <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white/30 flex items-center justify-center">
                                  <Check className="h-2 w-2" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Payment form fields */}
                      {form.paymentMethod &&
                        (() => {
                          const method = PAYMENT_METHODS.find(
                            (m) => m.key === form.paymentMethod,
                          );
                          if (!method) return null;

                          return (
                            <div
                              className={`rounded-xl border-2 overflow-hidden ${method.inactiveBorder}`}
                            >
                              <div className={`px-3 py-2 ${method.inactiveBg}`}>
                                <div
                                  className={`flex items-center gap-2 font-semibold text-xs ${method.inactiveText}`}
                                >
                                  <method.icon className="h-3.5 w-3.5" />
                                  {method.label}
                                </div>
                              </div>

                              <div className="px-3 py-3 bg-background space-y-2.5">
                                {/* Multi-currency rows (for non-debt payments) */}
                                {form.paymentMethod !== "debt" && (
                                  <div className="space-y-2">
                                    {form.paymentCurrencies?.map(
                                      (currencyRow, index) => (
                                        <div
                                          key={index}
                                          className="grid grid-cols-2 gap-2"
                                        >
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-muted-foreground">
                                              Summa * (
                                              {formatNumber(currencyRow.amount)}
                                              )
                                            </label>
                                            <Input
                                              type="number"
                                              min="0"
                                              placeholder="0"
                                              className="h-8 text-xs"
                                              value={currencyRow.amount}
                                              onChange={(e) =>
                                                updateItemPaymentCurrency(
                                                  item.id,
                                                  index,
                                                  "amount",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-muted-foreground">
                                              Valyuta *
                                            </label>
                                            <div className="flex gap-1">
                                              <Select
                                                value={String(
                                                  currencyRow.currencyId,
                                                )}
                                                onValueChange={(v) =>
                                                  updateItemPaymentCurrency(
                                                    item.id,
                                                    index,
                                                    "currencyId",
                                                    v,
                                                  )
                                                }
                                                className="flex-1"
                                              >
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue placeholder="Valyuta" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {currencyOptions.map((c) => (
                                                    <SelectItem
                                                      key={c.id}
                                                      value={String(c.id)}
                                                    >
                                                      {c.name}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              {form.paymentCurrencies.length >
                                                1 && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    removeItemPaymentCurrencyRow(
                                                      item.id,
                                                      index,
                                                    )
                                                  }
                                                  className="p-1.5 h-8 rounded-md hover:bg-destructive/10 text-destructive"
                                                >
                                                  <X className="h-3.5 w-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addItemPaymentCurrencyRow(item.id)
                                      }
                                      className="text-[11px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                                    >
                                      <span className="text-base">+</span>{" "}
                                      Valyuta qo'shish
                                    </button>
                                  </div>
                                )}

                                {/* Debt-specific fields */}
                                {form.paymentMethod === "debt" && (
                                  <div className="space-y-2">
                                    {form.paymentDebts?.map(
                                      (debt, debtIndex) => (
                                        <div
                                          key={debtIndex}
                                          className="rounded-lg border bg-muted/20 p-2 space-y-2"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-medium text-muted-foreground">
                                              Qarz #{debtIndex + 1}
                                            </span>
                                            {form.paymentDebts.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeItemPaymentDebtRow(
                                                    item.id,
                                                    debtIndex,
                                                  )
                                                }
                                                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-medium text-muted-foreground">
                                                Summa * (
                                                {formatNumber(debt.amount)})
                                              </label>
                                              <Input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className="h-7 text-[11px]"
                                                value={debt.amount}
                                                onChange={(e) =>
                                                  updateItemPaymentDebt(
                                                    item.id,
                                                    debtIndex,
                                                    "amount",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-medium text-muted-foreground">
                                                Valyuta *
                                              </label>
                                              <Select
                                                value={String(debt.currencyId)}
                                                onValueChange={(v) =>
                                                  updateItemPaymentDebt(
                                                    item.id,
                                                    debtIndex,
                                                    "currencyId",
                                                    v,
                                                  )
                                                }
                                              >
                                                <SelectTrigger className="h-7 text-[11px]">
                                                  <SelectValue placeholder="Valyuta" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {currencyOptions.map((c) => (
                                                    <SelectItem
                                                      key={c.id}
                                                      value={String(c.id)}
                                                    >
                                                      {c.name}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <label className="text-[10px] font-medium text-muted-foreground">
                                              Qarz beruvchi turi *
                                            </label>
                                            <Select
                                              value={debt.debtorType}
                                              onValueChange={(v) => {
                                                updateItemPaymentDebt(
                                                  item.id,
                                                  debtIndex,
                                                  "debtorType",
                                                  v,
                                                );
                                                // Reset dependent fields when type changes
                                                updateItemPaymentDebt(
                                                  item.id,
                                                  debtIndex,
                                                  "debtorStoreId",
                                                  "",
                                                );
                                                updateItemPaymentDebt(
                                                  item.id,
                                                  debtIndex,
                                                  "debtorEmployeeId",
                                                  "",
                                                );
                                                updateItemPaymentDebt(
                                                  item.id,
                                                  debtIndex,
                                                  "debtorEmployeeName",
                                                  "",
                                                );
                                                updateItemPaymentDebt(
                                                  item.id,
                                                  debtIndex,
                                                  "debtorName",
                                                  "",
                                                );
                                                updateItemPaymentDebt(
                                                  item.id,
                                                  debtIndex,
                                                  "debtorPhone",
                                                  "",
                                                );
                                              }}
                                            >
                                              <SelectTrigger className="h-7 text-[11px]">
                                                <SelectValue placeholder="Turini tanlang" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="store">
                                                  Magazin
                                                </SelectItem>
                                                <SelectItem value="employee">
                                                  Xodim
                                                </SelectItem>
                                                <SelectItem value="other">
                                                  Begona shaxs
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {debt.debtorType === "store" && (
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-medium text-muted-foreground">
                                                Do'kon *
                                              </label>
                                              <Select
                                                value={String(
                                                  debt.debtorStoreId,
                                                )}
                                                onValueChange={(v) =>
                                                  updateItemPaymentDebt(
                                                    item.id,
                                                    debtIndex,
                                                    "debtorStoreId",
                                                    v,
                                                  )
                                                }
                                              >
                                                <SelectTrigger className="h-7 text-[11px]">
                                                  <SelectValue placeholder="Do'konni tanlang" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {stores.map((store) => (
                                                    <SelectItem
                                                      key={store.id}
                                                      value={String(store.id)}
                                                    >
                                                      {store.name}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )}

                                          {debt.debtorType === "employee" && (
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-medium text-muted-foreground">
                                                Xodim *
                                              </label>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full h-7 text-[11px] justify-start"
                                                onClick={() => {
                                                  setEmployeeSearchForItem(
                                                    `${item.id}-${debtIndex}`,
                                                  );
                                                  setEmployeeSearchOpen(true);
                                                }}
                                              >
                                                {debt.debtorEmployeeName
                                                  ? debt.debtorEmployeeName
                                                  : "Xodimni tanlang"}
                                              </Button>
                                            </div>
                                          )}

                                          {debt.debtorType === "other" && (
                                            <>
                                              <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-muted-foreground">
                                                  Ism *
                                                </label>
                                                <Input
                                                  placeholder="Ismi"
                                                  className="h-7 text-[11px]"
                                                  value={debt.debtorName}
                                                  onChange={(e) =>
                                                    updateItemPaymentDebt(
                                                      item.id,
                                                      debtIndex,
                                                      "debtorName",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-muted-foreground">
                                                  Telefon *
                                                </label>
                                                <Input
                                                  placeholder="+998 90 123 45 67"
                                                  className="h-7 text-[11px]"
                                                  value={debt.debtorPhone}
                                                  onChange={(e) =>
                                                    updateItemPaymentDebt(
                                                      item.id,
                                                      debtIndex,
                                                      "debtorPhone",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      ),
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addItemPaymentDebtRow(item.id)
                                      }
                                      className="text-[11px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                                    >
                                      <span className="text-base">+</span> Qarz
                                      qo'shish
                                    </button>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-muted-foreground">
                                    Izoh
                                  </label>
                                  <Input
                                    placeholder="Izoh..."
                                    className="h-8 text-xs"
                                    value={form.paymentComment}
                                    onChange={(e) =>
                                      updateItemForm(
                                        item.id,
                                        "paymentComment",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                )}

                {/* Read-only price */}
                {!canEdit && item.unitPrice > 0 && (
                  <div className="border-t px-3 py-2.5 flex items-center justify-between bg-muted/10">
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(
                        item.confirmedQuantity ?? item.requestedQuantity,
                      )}{" "}
                      {item.item?.unit?.name} × {formatNumber(item.unitPrice)}{" "}
                      {item.currency?.name}
                    </div>
                    <div className="text-sm font-bold text-emerald-700">
                      {formatNumber(
                        (item.confirmedQuantity ?? item.requestedQuantity) *
                          item.unitPrice,
                      )}{" "}
                      <span className="text-xs font-normal text-emerald-600">
                        {item.currency?.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Read-only: total + payments + attachments ── */}
        {!canEdit && (
          <>
            {/* Order total */}
            {(() => {
              const totals = {};
              data.items.forEach((item) => {
                if (!item.unitPrice) return;
                const qty = item.confirmedQuantity ?? item.requestedQuantity;
                const currId = String(item.currency?.id ?? "");
                const currName = item.currency?.name ?? "";
                if (!totals[currId])
                  totals[currId] = { name: currName, total: 0 };
                totals[currId].total += qty * item.unitPrice;
              });
              const entries = Object.entries(totals);
              if (!entries.length) return null;
              return (
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/20">
                    <p className="text-sm font-semibold">Buyurtma jami</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {entries.map(([currId, { name, total }]) => (
                      <div
                        key={currId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-muted-foreground">
                          {name}
                        </span>
                        <span className="text-base font-bold text-emerald-700">
                          {formatNumber(total)}{" "}
                          <span className="text-sm font-normal text-emerald-600">
                            {name}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Payments */}
            {data.payments?.length > 0 && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20">
                  <p className="text-sm font-semibold">To'lovlar</p>
                </div>
                <div className="divide-y">
                  {data.payments.map((pay) => {
                    const method = PAYMENT_METHODS.find(
                      (m) => m.key === pay.method,
                    );
                    const Icon = method?.icon ?? Banknote;
                    return (
                      <div
                        key={pay.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${method?.inactiveBg ?? "bg-muted"}`}
                        >
                          <Icon
                            className={`h-4 w-4 ${method?.inactiveText ?? "text-muted-foreground"}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold ${method?.inactiveText ?? ""}`}
                          >
                            {method?.label ?? pay.method}
                          </p>
                          {pay.comment && (
                            <p className="text-xs text-muted-foreground truncate">
                              {pay.comment}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(pay.paidAt)}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-bold shrink-0 ${method?.inactiveText ?? ""}`}
                        >
                          {formatNumber(pay.amount)}{" "}
                          <span className="text-xs font-normal">
                            {pay.currency?.name}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Payment totals by currency */}
                {(() => {
                  const totals = {};
                  data.payments.forEach((pay) => {
                    const currId = String(pay.currency?.id ?? "");
                    const currName = pay.currency?.name ?? "";
                    if (!totals[currId])
                      totals[currId] = { name: currName, total: 0 };
                    totals[currId].total += pay.amount;
                  });
                  return (
                    <div className="border-t px-4 py-2.5 bg-muted/10 flex flex-wrap gap-3">
                      {Object.entries(totals).map(
                        ([currId, { name, total }]) => (
                          <span
                            key={currId}
                            className="text-xs text-muted-foreground"
                          >
                            Jami:{" "}
                            <span className="font-semibold text-foreground">
                              {formatNumber(total)} {name}
                            </span>
                          </span>
                        ),
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Attachments */}
            {data.attachments?.length > 0 && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20">
                  <p className="text-sm font-semibold">Fayllar</p>
                </div>
                <div className="divide-y">
                  {data.attachments.map((att) => {
                    const isImage = att.fileType?.startsWith("image/");
                    return (
                      <div
                        key={att.id}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        {isImage ? (
                          <button
                            type="button"
                            className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-border shrink-0 active:opacity-80"
                            onClick={() =>
                              setImageDialog({
                                open: true,
                                src: att.filePath,
                                name: att.fileName,
                              })
                            }
                          >
                            <img
                              src={att.filePath}
                              alt={att.fileName}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {att.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(att.createdAt)}
                          </p>
                          {isImage && (
                            <button
                              type="button"
                              className="mt-1 text-xs text-blue-600 font-medium"
                              onClick={() =>
                                setImageDialog({
                                  open: true,
                                  src: att.filePath,
                                  name: att.fileName,
                                })
                              }
                            >
                              Ko'rish
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
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
            onClick={handlePreSubmit}
            disabled={submitting}
          >
            <Truck className="h-4 w-4" />
            Yetkazishni tasdiqlash
          </Button>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm w-full p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-600" />
              Tasdiqlash
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.orderNumber} · {data.branch?.name}
            </p>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
            {/* Items summary */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Mahsulotlar
              </p>
              <div className="space-y-2">
                {data.items.map((item) => {
                  const form = itemForms[item.id] || {};
                  const qty = Number(form.confirmedQuantity) || 0;
                  const price = Number(form.unitPrice) || 0;
                  const currName =
                    currencyOptions.find(
                      (c) => String(c.id) === String(form.currencyId),
                    )?.name ?? item.currency?.name;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-muted/20 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        {item.item?.image && (
                          <img
                            src={item.item.image}
                            alt={item.item.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <p className="text-sm font-medium leading-snug line-clamp-2">
                          {item.item?.name}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="rounded-lg bg-blue-50 border border-blue-100 py-1.5 px-1">
                          <p className="text-[10px] text-blue-500 font-medium leading-none mb-1">
                            So'ralgan
                          </p>
                          <p className="text-xs font-bold text-blue-700">
                            {formatNumber(item.requestedQuantity)}
                            <span className="font-normal text-[10px] ml-0.5 text-blue-400">
                              {item.item?.unit?.name}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-lg bg-violet-50 border border-violet-100 py-1.5 px-1">
                          <p className="text-[10px] text-violet-500 font-medium leading-none mb-1">
                            Tasdiqlangan
                          </p>
                          <p className="text-xs font-bold text-violet-700">
                            {formatNumber(qty)}
                            <span className="font-normal text-[10px] ml-0.5 text-violet-400">
                              {item.item?.unit?.name}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 py-1.5 px-1">
                          <p className="text-[10px] text-emerald-500 font-medium leading-none mb-1">
                            Jami
                          </p>
                          <p className="text-xs font-bold text-emerald-700">
                            {price > 0 ? formatNumber(qty * price) : "—"}
                            {price > 0 && (
                              <span className="font-normal text-[10px] ml-0.5 text-emerald-400">
                                {currName}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payments summary */}
            {data.items.some((item) => itemForms[item.id]?.paymentMethod) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  To'lov
                </p>
                <div className="space-y-2">
                  {data.items.map((item) => {
                    const form = itemForms[item.id] || {};
                    if (!form.paymentMethod) return null;

                    const method = PAYMENT_METHODS.find(
                      (m) => m.key === form.paymentMethod,
                    );
                    if (!method) return null;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl px-3 py-2.5 border ${method.inactiveBg} ${method.inactiveBorder}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <method.icon
                            className={`h-3.5 w-3.5 ${method.inactiveText}`}
                          />
                          <span
                            className={`text-xs font-medium ${method.inactiveText}`}
                          >
                            {item.item?.name}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${method.inactiveText} ml-auto`}
                          >
                            {method.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.paymentMethod === "debt"
                            ? form.paymentDebts?.map((debt, idx) => {
                                const currName = currencyOptions.find(
                                  (c) =>
                                    String(c.id) === String(debt.currencyId),
                                )?.name;
                                const debtorLabel =
                                  debt.debtorType === "store"
                                    ? stores.find(
                                        (s) =>
                                          String(s.id) ===
                                          String(debt.debtorStoreId),
                                      )?.name
                                    : debt.debtorType === "employee"
                                      ? debt.debtorEmployeeName || "Xodim"
                                      : debt.debtorName;
                                return (
                                  <span
                                    key={idx}
                                    className={`text-xs font-bold ${method.inactiveText}`}
                                  >
                                    {formatNumber(Number(debt.amount))}{" "}
                                    <span className="text-[11px] font-normal">
                                      {currName}
                                    </span>
                                    {debtorLabel && (
                                      <span className="text-[10px] font-normal opacity-70 ml-1">
                                        ({debtorLabel})
                                      </span>
                                    )}
                                  </span>
                                );
                              })
                            : form.paymentCurrencies?.map(
                                (currencyRow, idx) => {
                                  const currName = currencyOptions.find(
                                    (c) =>
                                      String(c.id) ===
                                      String(currencyRow.currencyId),
                                  )?.name;
                                  return (
                                    <span
                                      key={idx}
                                      className={`text-xs font-bold ${method.inactiveText}`}
                                    >
                                      {formatNumber(Number(currencyRow.amount))}{" "}
                                      <span className="text-[11px] font-normal">
                                        {currName}
                                      </span>
                                    </span>
                                  );
                                },
                              )}
                        </div>
                        {form.paymentComment && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {form.paymentComment}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attachment */}
            {attachmentFile && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Fayl
                </p>
                <div className="flex items-center gap-2.5 rounded-xl border bg-muted/20 px-3 py-2.5">
                  <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">
                    {attachmentFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                    {(attachmentFile.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              </div>
            )}

            {/* Comment */}
            {comment.trim() && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Izoh
                </p>
                <p className="text-sm text-foreground bg-muted/30 rounded-xl px-3 py-2.5 leading-relaxed">
                  {comment}
                </p>
              </div>
            )}

            {/* Payment mismatch error */}
            {paymentMismatches.length > 0 && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm font-semibold text-red-700">
                    To'lov summasi mos emas
                  </p>
                </div>
                <div className="space-y-1.5">
                  {paymentMismatches.map(
                    ({ currId, name, itemTotal, payTotal, diff }) => (
                      <div
                        key={currId}
                        className="rounded-lg bg-white border border-red-100 px-3 py-2 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Kerak:</span>
                          <span className="font-semibold text-foreground">
                            {formatNumber(itemTotal)} {name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Kiritildi:
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatNumber(payTotal)} {name}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between text-xs font-bold pt-0.5 border-t border-red-100 mt-1 ${diff > 0 ? "text-amber-600" : "text-red-600"}`}
                        >
                          <span>{diff > 0 ? "Yetishmaydi:" : "Ortiqcha:"}</span>
                          <span>
                            {formatNumber(Math.abs(diff))} {name}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <p className="text-xs text-red-600">
                  To'lov summalarini tuzatib, qayta urinib ko'ring.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 pb-4 pt-3 border-t flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Bekor qilish
            </Button>
            <Button
              className="flex-1 h-10 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60"
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
                  Yuborish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

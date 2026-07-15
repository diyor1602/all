import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Paperclip,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const STATUS_CONFIG = {
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
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    text: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.text}
    </span>
  );
};

const StepIndicator = ({ step, label, status }) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          status === "done"
            ? "bg-green-100"
            : status === "loading"
              ? "bg-blue-100"
              : status === "error"
                ? "bg-red-100"
                : "bg-gray-100"
        }`}
      >
        {status === "done" && (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        )}
        {status === "loading" && (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        )}
        {status === "error" && <XCircle className="w-4 h-4 text-red-600" />}
        {status === "idle" && (
          <span className="text-xs font-bold text-gray-400">{step}</span>
        )}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            status === "done"
              ? "text-green-700"
              : status === "loading"
                ? "text-blue-700"
                : status === "error"
                  ? "text-red-700"
                  : "text-gray-500"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
};

const ReceiveOrder = () => {
  const { toast } = useToast();
  const { orderId } = useParams();
  const preselectedOrderId = orderId;

  // Orders list
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedItems, setExpandedItems] = useState(false);

  // Static data for income form
  const [warehouses, setWarehouses] = useState([]);
  const [sources, setSources] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Income form state
  const [warehouseId, setWarehouseId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [comment, setComment] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Per-item receive state: { [purchaseOrderItemId]: { receivedQuantity, price, currencyId, lots } }
  const [itemForms, setItemForms] = useState({});

  // Employee dialog
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptId, setEmpDeptId] = useState("");
  const [empResults, setEmpResults] = useState([]);
  const [empSearching, setEmpSearching] = useState(false);
  const [empPage, setEmpPage] = useState(1);
  const [empTotalPages, setEmpTotalPages] = useState(1);
  const [empLoadingMore, setEmpLoadingMore] = useState(false);
  const empSentinelRef = useRef(null);

  // Image preview
  const [imageDialog, setImageDialog] = useState({
    open: false,
    src: null,
    name: null,
  });

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Progress dialog
  const [progressOpen, setProgressOpen] = useState(false);
  const [step1Status, setStep1Status] = useState("idle");
  const [step2Status, setStep2Status] = useState("idle");
  const [step1Error, setStep1Error] = useState("");
  const [step2Error, setStep2Error] = useState("");
  const [progressDone, setProgressDone] = useState(false);

  useEffect(() => {
    fetchOrders("", preselectedOrderId);
    fetchStaticData();
  }, []);

  const fetchOrders = async (q = "", autoSelectId = null) => {
    try {
      setOrdersLoading(true);
      const res = await api.get("/warehouseManager/purchaseOrder", {
        params: { Status: "in_delivery", PageSize: 50, Search: q || undefined },
      });
      const list = res.data?.data ?? res.data ?? [];
      setOrders(list);
      if (autoSelectId) {
        const match = list.find((o) => String(o.id) === String(autoSelectId));
        if (match) selectOrder(match);
      }
    } catch {
      toast({
        title: "Xatolik",
        description: "Buyurtmalarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchStaticData = async () => {
    try {
      const [wRes, sRes, dRes] = await Promise.all([
        api.get("/warehouseManager/warehouse"),
        api.get("/warehouseManager/source"),
        api.get("/warehouseManager/department"),
      ]);
      setWarehouses(wRes.data ?? []);
      setSources(sRes.data ?? []);
      setDepartments(dRes.data ?? []);
    } catch {
      // non-critical, proceed
    }
  };

  // Debounced order search
  const searchRef = useRef(null);
  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchOrders(v), 400);
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setExpandedItems(true);
    const initial = {};
    order.items.forEach((item) => {
      initial[item.id] = {
        receivedQuantity:
          item.confirmedQuantity ?? item.requestedQuantity ?? "",
        price: item.unitPrice ?? "",
        currencyId: item.currency?.id ? String(item.currency.id) : "",
        lots: [],
      };
    });
    setItemForms(initial);
  };

  const updateItemForm = (itemId, field, value) =>
    setItemForms((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));

  const addLot = (itemId) =>
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        lots: [...(prev[itemId]?.lots ?? []), { rollNumber: "", length: "" }],
      },
    }));

  const updateLot = (itemId, idx, field, value) =>
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        lots: prev[itemId].lots.map((l, i) =>
          i === idx ? { ...l, [field]: value } : l,
        ),
      },
    }));

  const removeLot = (itemId, idx) =>
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        lots: prev[itemId].lots.filter((_, i) => i !== idx),
      },
    }));

  // Employee search
  const searchEmployees = async (page = 1, dept = empDeptId) => {
    if (page === 1) setEmpSearching(true);
    else setEmpLoadingMore(true);
    try {
      const res = await api.get("/warehouseManager/employee", {
        params: {
          search: empSearch || undefined,
          status: "working",
          departmentId: dept && dept !== "all" ? dept : undefined,
          page,
        },
      });
      const data = res.data?.data ?? [];
      setEmpResults((prev) => (page === 1 ? data : [...prev, ...data]));
      setEmpPage(page);
      setEmpTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast({
        title: "Xatolik",
        description: "Xodimlarni topib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      if (page === 1) setEmpSearching(false);
      else setEmpLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!empSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !empLoadingMore &&
          !empSearching &&
          empPage < empTotalPages
        )
          searchEmployees(empPage + 1);
      },
      { threshold: 0.1 },
    );
    observer.observe(empSentinelRef.current);
    return () => observer.disconnect();
  }, [empPage, empTotalPages, empLoadingMore, empSearching]);

  // Validation
  const handlePreSubmit = () => {
    if (!selectedOrder) return;
    if (!warehouseId) {
      toast({
        title: "Xatolik",
        description: "Omborni tanlang",
        variant: "destructive",
      });
      return;
    }
    if (!sourceId) {
      toast({
        title: "Xatolik",
        description: "Manbani tanlang",
        variant: "destructive",
      });
      return;
    }
    if (!selectedEmployee) {
      toast({
        title: "Xatolik",
        description: "Xodimni tanlang",
        variant: "destructive",
      });
      return;
    }
    if (!comment.trim()) {
      toast({
        title: "Xatolik",
        description: "Izoh kiriting",
        variant: "destructive",
      });
      return;
    }

    for (const item of selectedOrder.items) {
      const form = itemForms[item.id] || {};

      if (!form.currencyId) {
        toast({
          title: "Xatolik",
          description: `"${item.item?.name}" uchun valyutani tanlang`,
          variant: "destructive",
        });
        return;
      }
    }
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmOpen(false);
    setStep1Status("idle");
    setStep2Status("idle");
    setStep1Error("");
    setStep2Error("");
    setProgressDone(false);
    setProgressOpen(true);

    // Step 1: Mark purchase order as received
    setStep1Status("loading");
    try {
      await api.patch(
        `/warehouseManager/purchaseOrder/${selectedOrder.id}/receive`,
        {
          items: selectedOrder.items.map((item) => {
            const form = itemForms[item.id] || {};
            const hasLots = form.lots?.length > 0;
            return {
              purchaseOrderItemId: item.id,
              receivedQuantity: hasLots
                ? form.lots.reduce((s, l) => s + (Number(l.length) || 0), 0)
                : Number(form.receivedQuantity) || 0,
            };
          }),
        },
      );
      setStep1Status("done");
    } catch (err) {
      setStep1Status("error");
      setStep1Error(
        err.response?.data?.message || "Buyurtmani qabul qilib bo'lmadi",
      );
      setProgressDone(true);
      return;
    }

    // Step 2: Create stock income entry
    setStep2Status("loading");
    try {
      await api.post("/warehouseManager/StockEntry", {
        warehouseId: Number(warehouseId),
        type: "income",
        comment: comment || null,
        orderId: null,
        sourceId: sourceId ? Number(sourceId) : null,
        userId: selectedEmployee?.user?.id ?? null,
        items: selectedOrder.items.flatMap((item) => {
          const form = itemForms[item.id] || {};
          const hasLots = form.lots?.length > 0;
          if (hasLots) {
            return form.lots.map((lot) => ({
              itemId: item.itemId ?? item.item?.id,
              price: form.price ? Number(form.price) : null,
              currencyId: form.currencyId ? Number(form.currencyId) : null,
              rollNumber: lot.rollNumber ? Number(lot.rollNumber) : null,
              length: lot.length ? Number(lot.length) : null,
            }));
          }
          return [
            {
              itemId: item.itemId ?? item.item?.id,
              price: form.price ? Number(form.price) : null,
              currencyId: form.currencyId ? Number(form.currencyId) : null,
              quantity: Number(form.receivedQuantity) || 0,
            },
          ];
        }),
      });
      setStep2Status("done");
    } catch (err) {
      setStep2Status("error");
      setStep2Error(
        err.response?.data?.message || "Ombor kirimini yaratib bo'lmadi",
      );
      setProgressDone(true);
      return;
    }

    setProgressDone(true);
    // reset form
    setSelectedOrder(null);
    setItemForms({});
    setWarehouseId("");
    setSourceId("");
    setComment("");
    setSelectedEmployee(null);
    fetchOrders();
  };

  const closeProgress = () => {
    setProgressOpen(false);
    setStep1Status("idle");
    setStep2Status("idle");
  };

  const isOverdue = (order) =>
    order.deadline && new Date(order.deadline) < new Date();

  // Totals per currency from itemForms
  const totalsByCurrency = {};
  if (selectedOrder) {
    selectedOrder.items.forEach((item) => {
      const price = Number(item.unitPrice) || 0;
      if (!price) return;
      const form = itemForms[item.id] || {};
      const hasLots = form.lots?.length > 0;
      const qty = hasLots
        ? form.lots.reduce((s, l) => s + (Number(l.length) || 0), 0)
        : Number(form.receivedQuantity) || 0;
      const currId = item.currency?.id ? String(item.currency.id) : "";
      const currName = item.currency?.name ?? "";
      if (qty > 0 && currId) {
        if (!totalsByCurrency[currId])
          totalsByCurrency[currId] = { name: currName, total: 0 };
        totalsByCurrency[currId].total += price * qty;
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Buyurtma qabul qilish
      </h1>

      {/* Order selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Yetkazilayotgan buyurtma tanlash
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Buyurtma raqami bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto -mx-1 px-1">
          {ordersLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-300">
              <Package className="w-10 h-10" />
              <p className="text-sm text-gray-400">
                Yetkazilayotgan buyurtma topilmadi
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const overdue = isOverdue(order);
              const isSelected = selectedOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  onClick={() => selectOrder(order)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-100 bg-gray-50 hover:border-amber-200 hover:bg-amber-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-gray-900">
                          {order.orderNumber}
                        </span>
                        <StatusBadge status={order.status} />
                        {isSelected && (
                          <span className="text-xs text-amber-600 font-semibold">
                            ✓ Tanlangan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span
                          className={overdue ? "text-red-600 font-medium" : ""}
                        >
                          {formatDate(order.deadline)}
                          {overdue && " · Muddati o'tdi"}
                        </span>
                      </div>
                      {order.branch?.name && (
                        <p className="text-xs text-gray-400">
                          {order.branch.name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                      {order.items?.length ?? 0} ta mahsulot
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Receive form — only when order selected */}
      {selectedOrder && (
        <>
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 border-b bg-gray-50 text-left"
              onClick={() => setExpandedItems((v) => !v)}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Mahsulotlar ({selectedOrder.items.length})
              </p>
              {expandedItems ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedItems && (
              <div className="divide-y divide-gray-100">
                {selectedOrder.items.map((item, idx) => {
                  const form = itemForms[item.id] || {};
                  const hasLots = form.lots?.length > 0;

                  return (
                    <div key={item.id} className="p-4 space-y-3">
                      {/* Item header */}
                      <div className="flex gap-3">
                        <span className="text-xs text-gray-400 w-5 pt-0.5 shrink-0 font-medium">
                          {idx + 1}
                        </span>
                        {item.item?.image ? (
                          <button
                            type="button"
                            className="w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-gray-200"
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
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 leading-snug">
                            {item.item?.name}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.item?.code && (
                              <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                                {item.item.code}
                              </span>
                            )}
                            {item.item?.unit?.name && (
                              <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                {item.item.unit.name}
                              </span>
                            )}
                            {item.item?.color?.name && (
                              <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                {item.item.color.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity badges */}
                      <div className="grid grid-cols-3 gap-2 ml-8">
                        <div className="text-center rounded-lg bg-blue-50 border border-blue-100 px-2 py-1.5">
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
                        <div className="text-center rounded-lg bg-violet-50 border border-violet-100 px-2 py-1.5">
                          <p className="text-[10px] text-violet-500 font-medium leading-none mb-1">
                            Tasdiqlangan
                          </p>
                          <p className="text-xs font-bold text-violet-700">
                            {item.confirmedQuantity != null
                              ? formatNumber(item.confirmedQuantity)
                              : "—"}
                            <span className="font-normal text-violet-400 ml-0.5 text-[10px]">
                              {item.item?.unit?.name}
                            </span>
                          </p>
                        </div>
                        <div className="text-center rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1.5">
                          <p className="text-[10px] text-emerald-500 font-medium leading-none mb-1">
                            Narx
                          </p>
                          <p className="text-xs font-bold text-emerald-700">
                            {item.unitPrice
                              ? formatNumber(item.unitPrice)
                              : "—"}
                            <span className="font-normal text-emerald-400 ml-0.5 text-[10px]">
                              {item.currency?.name}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Receive inputs */}
                      <div className="ml-8 space-y-3 pt-1">
                        {/* Quantity or lots */}
                        {!hasLots ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500 w-16 shrink-0">
                              Qabul
                            </span>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={form.receivedQuantity}
                              onChange={(e) =>
                                updateItemForm(
                                  item.id,
                                  "receivedQuantity",
                                  e.target.value,
                                )
                              }
                              className="w-28 h-8 text-sm"
                            />
                            <span className="text-xs text-gray-500">
                              {item.item?.unit?.name}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {form.lots.map((lot, lotIdx) => (
                              <div
                                key={lotIdx}
                                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400">
                                      №
                                    </span>
                                    <Input
                                      type="number"
                                      placeholder="—"
                                      value={lot.rollNumber}
                                      onChange={(e) =>
                                        updateLot(
                                          item.id,
                                          lotIdx,
                                          "rollNumber",
                                          e.target.value,
                                        )
                                      }
                                      className="w-16 h-7 text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400">
                                      Uzunlik
                                    </span>
                                    <Input
                                      type="number"
                                      placeholder="—"
                                      value={lot.length}
                                      onChange={(e) =>
                                        updateLot(
                                          item.id,
                                          lotIdx,
                                          "length",
                                          e.target.value,
                                        )
                                      }
                                      className="w-20 h-7 text-xs"
                                    />
                                    <span className="text-xs text-gray-400">
                                      {item.item?.unit?.name}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeLot(item.id, lotIdx)}
                                  className="text-gray-300 hover:text-red-500 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => addLot(item.id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Rulon qo'shish
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total */}
          {Object.keys(totalsByCurrency).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 space-y-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Jami summa
              </span>
              {Object.entries(totalsByCurrency).map(
                ([currId, { name, total }]) => (
                  <div
                    key={currId}
                    className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100"
                  >
                    <span className="text-sm font-medium text-emerald-700">
                      {name}
                    </span>
                    <span className="text-lg font-bold text-emerald-800">
                      {formatNumber(total)}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Attachments */}
          {selectedOrder.attachments?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fayllar ({selectedOrder.attachments.length})
              </p>
              <div className="space-y-2">
                {selectedOrder.attachments.map((att, i) => {
                  const isImage = att.fileType?.startsWith("image/");
                  return isImage ? (
                    <button
                      key={att.id ?? i}
                      type="button"
                      onClick={() =>
                        setImageDialog({
                          open: true,
                          src: att.filePath,
                          name: att.fileName,
                        })
                      }
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 w-full text-left transition-colors"
                    >
                      <img
                        src={att.filePath}
                        alt={att.fileName}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-gray-200"
                      />
                      <p className="text-sm text-gray-700 truncate flex-1">
                        {att.fileName}
                      </p>
                    </button>
                  ) : (
                    <a
                      key={att.id ?? i}
                      href={att.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 w-full text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-700 truncate flex-1">
                        {att.fileName}
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Income form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Ombor kirimi ma'lumotlari
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Ombor <span className="text-red-500">*</span>
                </label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Omborni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Manba <span className="text-red-500">*</span>
                </label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Manbani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Xodim <span className="text-red-500">*</span>
                </label>
                {selectedEmployee ? (
                  <div className="flex items-center gap-2 px-3 h-10 rounded-md border border-input bg-white text-sm">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="flex-1 truncate text-gray-900">
                      {selectedEmployee.name}
                    </span>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal text-gray-500 bg-white"
                    onClick={() => {
                      setEmpDialogOpen(true);
                      searchEmployees(1);
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Xodimni tanlang
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Izoh <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Kirim haqida izoh..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-white resize-none"
                rows={2}
              />
            </div>
          </div>

          <Button
            className="w-full h-11 text-base gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handlePreSubmit}
          >
            <CheckCircle2 className="w-5 h-5" />
            Qabul qilish
          </Button>
        </>
      )}

      {/* ── Confirmation dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm w-full p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              Qabul tasdiqlash
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedOrder?.orderNumber} · {selectedOrder?.branch?.name}
            </p>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
            {/* Items */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Mahsulotlar
              </p>
              {selectedOrder?.items.map((item) => {
                const form = itemForms[item.id] || {};
                const hasLots = form.lots?.length > 0;
                const qty = hasLots
                  ? form.lots.reduce((s, l) => s + (Number(l.length) || 0), 0)
                  : Number(form.receivedQuantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const currName = item.currency?.name;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border bg-gray-50 p-3 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {item.item?.image && (
                        <img
                          src={item.item.image}
                          alt={item.item.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <p className="text-sm font-medium leading-snug">
                        {item.item?.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      <div className="rounded-lg bg-blue-50 border border-blue-100 py-1.5 px-1">
                        <p className="text-[10px] text-blue-500 font-medium leading-none mb-0.5">
                          So'ralgan
                        </p>
                        <p className="text-xs font-bold text-blue-700">
                          {formatNumber(item.requestedQuantity)}
                          <span className="font-normal text-[10px] ml-0.5">
                            {item.item?.unit?.name}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg bg-violet-50 border border-violet-100 py-1.5 px-1">
                        <p className="text-[10px] text-violet-500 font-medium leading-none mb-0.5">
                          Tasdiqlangan
                        </p>
                        <p className="text-xs font-bold text-violet-700">
                          {item.confirmedQuantity != null
                            ? formatNumber(item.confirmedQuantity)
                            : "—"}
                          <span className="font-normal text-[10px] ml-0.5">
                            {item.item?.unit?.name}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-100 py-1.5 px-1">
                        <p className="text-[10px] text-amber-500 font-medium leading-none mb-0.5">
                          Qabul
                        </p>
                        <p className="text-xs font-bold text-amber-700">
                          {formatNumber(qty)}
                          <span className="font-normal text-[10px] ml-0.5">
                            {item.item?.unit?.name}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 py-1.5 px-1">
                        <p className="text-[10px] text-emerald-500 font-medium leading-none mb-0.5">
                          Jami
                        </p>
                        <p className="text-xs font-bold text-emerald-700">
                          {price > 0 ? formatNumber(qty * price) : "—"}
                          {price > 0 && (
                            <span className="font-normal text-[10px] ml-0.5">
                              {currName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {hasLots && (
                      <p className="text-[11px] text-gray-400">
                        {form.lots.length} ta rulon
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Income info */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Ombor kirimi
              </p>
              <div className="rounded-xl border bg-gray-50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ombor</span>
                  <span className="font-medium">
                    {warehouses.find((w) => String(w.id) === warehouseId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Manba</span>
                  <span className="font-medium">
                    {sources.find((s) => String(s.id) === sourceId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Xodim</span>
                  <span className="font-medium">{selectedEmployee?.name}</span>
                </div>
                {comment && (
                  <div className="pt-1 border-t">
                    <p className="text-gray-500 text-xs">Izoh</p>
                    <p className="text-gray-700 mt-0.5">{comment}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            {Object.keys(totalsByCurrency).length > 0 && (
              <div className="space-y-1">
                {Object.entries(totalsByCurrency).map(
                  ([currId, { name, total }]) => (
                    <div
                      key={currId}
                      className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2"
                    >
                      <span className="text-sm text-emerald-700">{name}</span>
                      <span className="text-base font-bold text-emerald-800">
                        {formatNumber(total)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-4 pb-4 pt-3 border-t flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={() => setConfirmOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              className="flex-1 h-10 gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              onClick={handleSubmit}
            >
              <CheckCircle2 className="w-4 h-4" />
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Progress dialog ── */}
      <Dialog open={progressOpen} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm w-full"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Jarayon
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <StepIndicator
              step={1}
              label="Buyurtmani qabul qilish (Purchase Order)"
              status={step1Status}
            />
            {step1Error && (
              <div className="ml-11 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{step1Error}</p>
              </div>
            )}

            <div className="ml-4 w-px h-4 bg-gray-200" />

            <StepIndicator
              step={2}
              label="Ombor kirimi yaratish (Stock Entry)"
              status={step2Status}
            />
            {step2Error && (
              <div className="ml-11 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{step2Error}</p>
              </div>
            )}
          </div>

          {progressDone && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                step1Status === "done" && step2Status === "done"
                  ? "bg-green-50 border-green-100 text-green-700"
                  : "bg-amber-50 border-amber-100 text-amber-700"
              }`}
            >
              {step1Status === "done" && step2Status === "done" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Buyurtma muvaffaqiyatli
                  qabul qilindi!
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" /> Ba'zi amallar bajarilmadi.
                  Iltimos tekshiring.
                </>
              )}
            </div>
          )}

          {progressDone && (
            <Button className="w-full mt-1" onClick={closeProgress}>
              Yopish
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Employee dialog ── */}
      <Dialog
        open={empDialogOpen}
        onOpenChange={(v) => {
          setEmpDialogOpen(v);
          if (!v) {
            setEmpSearch("");
            setEmpDeptId("");
            setEmpResults([]);
            setEmpPage(1);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xodim tanlash</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Select
              value={empDeptId}
              onValueChange={(v) => {
                setEmpDeptId(v);
                searchEmployees(1, v);
              }}
            >
              <SelectTrigger className="bg-white flex-1">
                <SelectValue placeholder="Bo'lim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha bo'limlar</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input
                placeholder="Ism bo'yicha..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchEmployees(1)}
                className="pr-9"
              />
              <button
                onClick={() => searchEmployees(1)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="min-h-48 max-h-80 overflow-y-auto -mx-1 px-1">
            {empSearching ? (
              <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
                <Loader2 className="animate-spin w-5 h-5" />
                <span className="text-sm">Qidirilmoqda...</span>
              </div>
            ) : empResults.length > 0 ? (
              <div className="space-y-0.5">
                {empResults.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setEmpDialogOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-gray-50 border border-transparent transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {emp.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {emp.position?.name && (
                          <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {emp.position.name}
                          </span>
                        )}
                        {emp.department?.name && (
                          <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {emp.department.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                <div ref={empSentinelRef} className="py-1">
                  {empLoadingMore && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300 gap-2">
                <User className="w-8 h-8" />
                <p className="text-sm text-gray-400">Xodimni qidiring</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Image preview ── */}
      <Dialog
        open={imageDialog.open}
        onOpenChange={(open) => setImageDialog((p) => ({ ...p, open }))}
      >
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base font-semibold">
              {imageDialog.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/30 w-full h-[60vh] p-4">
            {imageDialog.src && (
              <img
                src={imageDialog.src}
                alt={imageDialog.name}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiveOrder;

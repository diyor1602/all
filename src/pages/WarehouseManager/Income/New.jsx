import { useState, useEffect, useRef, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Search,
  Package,
  User,
  X,
  ClipboardList,
} from "lucide-react";
import { statuses } from "@/lib/status";

const ItemBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
    {children}
  </span>
);

const seasonLabels = {
  winter: "Qish",
  summer: "Bahor",
};

const New = () => {
  const { toast } = useToast();

  const [warehouses, setWarehouses] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sources, setSources] = useState([]);
  const [types, setTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [warehouseId, setWarehouseId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sourceId, setSourceId] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [comment, setComment] = useState("");
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Order search dialog
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderSearchText, setOrderSearchText] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // Item search dialog
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [itemSearchText, setItemSearchText] = useState("");
  const [searchingItems, setSearchingItems] = useState(false);
  const [loadingMoreItems, setLoadingMoreItems] = useState(false);
  const [itemResults, setItemResults] = useState([]);
  const [itemPage, setItemPage] = useState(1);
  const [itemTotalPages, setItemTotalPages] = useState(1);
  const itemSentinelRef = useRef(null);

  // Employee search dialog
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [empSearchText, setEmpSearchText] = useState("");
  const [empDeptId, setEmpDeptId] = useState("");
  const [empGroupId, setEmpGroupId] = useState("");
  const [searchingEmps, setSearchingEmps] = useState(false);
  const [loadingMoreEmps, setLoadingMoreEmps] = useState(false);
  const [empResults, setEmpResults] = useState([]);
  const [empPage, setEmpPage] = useState(1);
  const [empTotalPages, setEmpTotalPages] = useState(1);
  const empSentinelRef = useRef(null);

  const [stockBalances, setStockBalances] = useState({});

  const [previewImage, setPreviewImage] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  useEffect(() => {
    getStaticData();
  }, []);

  const getStaticData = async () => {
    try {
      const [
        warehousesRes,
        ordersRes,
        deptsRes,
        sourcesRes,
        typesRes,
        currenciesRes,
      ] = await Promise.all([
        api.get("/warehouseManager/warehouse"),
        api.get("/warehouseManager/order"),
        api.get("/warehouseManager/department"),
        api.get("/warehouseManager/source"),
        api.get("/warehouseManager/itemType"),
        api.get("/warehouseManager/Currency"),
      ]);
      setWarehouses(warehousesRes.data);
      setAllOrders(ordersRes.data?.data || ordersRes.data || []);
      setDepartments(deptsRes.data || []);
      setSources(sourcesRes.data);
      setTypes(typesRes.data);
      setCurrencies(currenciesRes.data ?? []);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = useMemo(() => {
    const q = orderSearchText.trim().toLowerCase();
    return allOrders.filter((o) => {
      const matchesStatus =
        orderStatusFilter === "all" || o.status === orderStatusFilter;
      const haystack = [
        o.name,
        o.id,
        statuses[o.status]?.text,
        o.seasonYear,
        seasonLabels[o.seasonType] || o.seasonType,
        `${seasonLabels[o.seasonType] || o.seasonType || ""} ${o.seasonYear || ""}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [allOrders, orderSearchText, orderStatusFilter]);

  // --- Item search ---

  const searchItems = async (typeOverride, pageNum = 1) => {
    const type = typeOverride !== undefined ? typeOverride : selectedType;
    if (pageNum === 1) setSearchingItems(true);
    else setLoadingMoreItems(true);
    try {
      const res = await api.get("/warehouseManager/item", {
        params: {
          search: itemSearchText || undefined,
          typeId: type && type !== "all" ? type : undefined,
          page: pageNum,
        },
      });
      const newData = res.data?.data || [];
      setItemResults((prev) =>
        pageNum === 1 ? newData : [...prev, ...newData],
      );
      setItemPage(pageNum);
      setItemTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast({
        title: "Xatolik",
        description: "Mahsulotlarni topib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      if (pageNum === 1) setSearchingItems(false);
      else setLoadingMoreItems(false);
    }
  };

  useEffect(() => {
    if (!itemSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMoreItems &&
          !searchingItems &&
          itemPage < itemTotalPages
        ) {
          searchItems(undefined, itemPage + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(itemSentinelRef.current);
    return () => observer.disconnect();
  }, [itemPage, itemTotalPages, loadingMoreItems, searchingItems]);

  const loadStockBalance = async (itemId) => {
    try {
      const res = await api.get("/warehouseManager/stockBalance", {
        params: { ItemId: itemId, PageSize: 100 },
      });
      const data = res.data?.data ?? res.data ?? [];
      setStockBalances((prev) => ({ ...prev, [itemId]: data }));
    } catch {
      // silently fail — stock info is supplementary
    }
  };

  const addItem = (item) => {
    if (!items.find((i) => i.itemId === item.id)) {
      setItems((prev) => [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          code: item.code,
          image: item.image,
          unitLabel: item.unit?.name || "",
          color: item.color || null,
          quantity: "",
          price: "",
          currencyId: "",
          lots: [],
        },
      ]);
      loadStockBalance(item.id);
    }
    setOpenItemDialog(false);
  };

  const removeItem = (itemId) =>
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));

  const updateItem = (itemId, field, value) =>
    setItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, [field]: value } : i)),
    );

  const addEmptyLot = (itemId) =>
    setItems((prev) =>
      prev.map((i) =>
        i.itemId !== itemId
          ? i
          : {
              ...i,
              lots: [...i.lots, { _stockId: null, rollNumber: "", length: "" }],
            },
      ),
    );

  const addLotFromStock = (itemId, stockItem) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.itemId !== itemId) return i;
        if (i.lots.some((l) => l._stockId === stockItem.id)) return i;
        return {
          ...i,
          lots: [
            ...i.lots,
            {
              _stockId: stockItem.id,
              rollNumber: String(stockItem.rollNumber),
              length: stockItem.length != null ? String(stockItem.length) : "",
            },
          ],
        };
      }),
    );

  const updateLot = (itemId, lotIdx, field, value) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.itemId !== itemId) return i;
        return {
          ...i,
          lots: i.lots.map((l, idx) =>
            idx === lotIdx ? { ...l, [field]: value } : l,
          ),
        };
      }),
    );

  const removeLot = (itemId, lotIdx) =>
    setItems((prev) =>
      prev.map((i) =>
        i.itemId !== itemId
          ? i
          : { ...i, lots: i.lots.filter((_, idx) => idx !== lotIdx) },
      ),
    );

  // --- Employee search ---

  const searchEmployees = async (pageNum = 1, deptOverride, groupOverride) => {
    const dept = deptOverride !== undefined ? deptOverride : empDeptId;
    const group = groupOverride !== undefined ? groupOverride : empGroupId;
    if (pageNum === 1) setSearchingEmps(true);
    else setLoadingMoreEmps(true);
    try {
      const res = await api.get("/warehouseManager/employee", {
        params: {
          search: empSearchText || undefined,
          status: "working",
          departmentId: dept && dept !== "all" ? dept : undefined,
          groupId: group && group !== "all" ? group : undefined,
          page: pageNum,
        },
      });
      const newData = res.data?.data || [];
      setEmpResults((prev) =>
        pageNum === 1 ? newData : [...prev, ...newData],
      );
      setEmpPage(pageNum);
      setEmpTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast({
        title: "Xatolik",
        description: "Xodimlarni topib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      if (pageNum === 1) setSearchingEmps(false);
      else setLoadingMoreEmps(false);
    }
  };

  useEffect(() => {
    if (!empSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMoreEmps &&
          !searchingEmps &&
          empPage < empTotalPages
        ) {
          searchEmployees(empPage + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(empSentinelRef.current);
    return () => observer.disconnect();
  }, [empPage, empTotalPages, loadingMoreEmps, searchingEmps]);

  // --- Submit ---

  const handleSubmit = async () => {
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
    if (!comment.trim()) {
      toast({
        title: "Xatolik",
        description: "Izoh kiriting",
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

    if (items.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta mahsulot qo'shing",
        variant: "destructive",
      });
      return;
    }
    for (const item of items) {
      if (
        item.lots.length === 0 &&
        (!item.quantity || Number(item.quantity) <= 0)
      ) {
        toast({
          title: "Xatolik",
          description: `"${item.name}" uchun miqdor kiriting`,
          variant: "destructive",
        });
        return;
      }
      if (!item.currencyId) {
        toast({
          title: "Xatolik",
          description: `"${item.name}" uchun valyutani tanlang`,
          variant: "destructive",
        });
        return;
      }
    }

    const allRollNumbers = items
      .flatMap((i) => i.lots.map((l) => l.rollNumber))
      .filter(Boolean);
    const seen = new Set();
    for (const rn of allRollNumbers) {
      if (seen.has(rn)) {
        toast({
          title: "Xatolik",
          description: `Rulon raqami takrorlanmoqda: ${rn}`,
          variant: "destructive",
        });
        return;
      }
      seen.add(rn);
    }

    setSubmitting(true);
    try {
      await api.post("/warehouseManager/StockEntry", {
        warehouseId: Number(warehouseId),
        type: "income",
        comment: comment || null,
        orderId: selectedOrder ? selectedOrder.id : null,
        sourceId: sourceId ? Number(sourceId) : null,
        userId: selectedEmployee ? selectedEmployee.user.id : null,
        items: items.flatMap((i) =>
          i.lots.length > 0
            ? i.lots.map((lot) => ({
                itemId: i.itemId,
                price: i.price ? Number(i.price) : null,
                currencyId: i.currencyId ? Number(i.currencyId) : null,
                rollNumber: lot.rollNumber ? Number(lot.rollNumber) : null,
                length: lot.length ? Number(lot.length) : null,
              }))
            : [
                {
                  itemId: i.itemId,
                  price: i.price ? Number(i.price) : null,
                  currencyId: i.currencyId ? Number(i.currencyId) : null,
                  quantity: Number(i.quantity),
                },
              ],
        ),
      });

      toast({ title: "Muvaffaqiyatli", description: "Kirim saqlandi" });
      setWarehouseId("");
      setSelectedOrder(null);
      setSourceId("");
      setSelectedEmployee(null);
      setComment("");
      setItems([]);
      setStockBalances({});
    } catch (err) {
      toast({
        title: "Xatolik",
        description:
          err.response?.data?.message || "Saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Yangi Kirim</h1>

      {/* Main info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Asosiy ma'lumotlar
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
              Buyurtma
            </label>
            {selectedOrder ? (
              <div className="flex items-start gap-2 px-3 py-2 min-h-10 rounded-md border border-input bg-white text-sm">
                <ClipboardList className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate leading-tight">
                    {selectedOrder.name}
                  </p>
                  {selectedOrder.status && statuses[selectedOrder.status] && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-0.5 ${statuses[selectedOrder.status].secondaryBg} ${statuses[selectedOrder.status].textColor}`}
                    >
                      {statuses[selectedOrder.status].text}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start font-normal text-gray-500 bg-white"
                onClick={() => setOpenOrderDialog(true)}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Buyurtmani tanlang
              </Button>
            )}
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Xodim <span className="text-red-500">*</span>
            </label>
            {selectedEmployee ? (
              <div className="flex items-center gap-2 px-3 h-10 rounded-md border border-input bg-white text-sm">
                {selectedEmployee.img ? (
                  <img
                    src={selectedEmployee.img}
                    alt={selectedEmployee.name}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}
                <span className="flex-1 truncate text-gray-900">
                  {selectedEmployee.name}
                </span>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start font-normal text-gray-500 bg-white"
                onClick={() => {
                  setOpenEmployeeDialog(true);
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
            rows={3}
          />
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Mahsulotlar{" "}
            {items.length > 0 && (
              <span className="text-primary">({items.length})</span>
            )}
          </p>
          <Button
            size="sm"
            onClick={() => {
              setOpenItemDialog(true);
              searchItems();
            }}
            className="gap-1.5 h-8"
          >
            <Plus className="w-3.5 h-3.5" />
            Qo'shish
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
            <Package className="w-10 h-10" />
            <p className="text-sm text-gray-400">Mahsulotlar qo'shilmagan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.itemId}
                className="flex gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 group"
              >
                <div className="text-xs text-gray-400 w-5 pt-1 flex-shrink-0 font-medium">
                  {idx + 1}
                </div>

                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    onClick={() => {
                      setPreviewImage(item.image);
                      setImgDialogOpen(true);
                    }}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 cursor-zoom-in"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.code && <ItemBadge>{item.code}</ItemBadge>}
                      {item.unitLabel && (
                        <ItemBadge>{item.unitLabel}</ItemBadge>
                      )}
                      {item.color?.name && (
                        <ItemBadge>
                          {item.color.hex && (
                            <span
                              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                              style={{ backgroundColor: `#${item.color.hex}` }}
                            />
                          )}
                          {item.color.name}
                        </ItemBadge>
                      )}
                    </div>
                  </div>

                  {/* Stock chips */}
                  {(stockBalances[item.itemId] ?? []).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">Mavjud rulonlar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {stockBalances[item.itemId].map((s) => {
                          const isAdded = item.lots.some(
                            (l) => l._stockId === s.id,
                          );
                          return (
                            <button
                              key={s.id}
                              disabled={isAdded}
                              onClick={() => addLotFromStock(item.itemId, s)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors ${
                                isAdded
                                  ? "bg-primary/10 border-primary/30 text-primary cursor-default"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                              }`}
                            >
                              <span className="font-medium">
                                R{s.rollNumber}
                              </span>
                              {s.length != null && (
                                <span className="text-gray-400">
                                  · {s.length}m
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Price — always visible */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      Bir donasi uchun narxi
                    </span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.itemId, "price", e.target.value)
                      }
                      className="w-28 h-8 text-sm bg-white"
                    />
                    <Select
                      value={item.currencyId}
                      onValueChange={(v) =>
                        updateItem(item.itemId, "currencyId", v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white w-24">
                        <SelectValue placeholder="Valyuta" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(() => {
                      const price = Number(item.price) || 0;
                      const total =
                        item.lots.length > 0
                          ? price *
                            item.lots.reduce(
                              (s, l) => s + (Number(l.length) || 0),
                              0,
                            )
                          : price * (Number(item.quantity) || 0);
                      return total > 0 ? (
                        <span className="text-xs font-medium text-gray-700">
                          = {total.toLocaleString()}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {item.lots.length === 0 ? (
                    /* No rolls — simple quantity input */
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 whitespace-nowrap w-10">
                        Miqdor
                      </span>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.itemId, "quantity", e.target.value)
                        }
                        className="w-24 h-8 text-sm bg-white"
                      />
                      {item.unitLabel && (
                        <span className="text-xs text-gray-500">
                          {item.unitLabel}
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Lot rows */
                    <div className="space-y-1.5">
                      {item.lots.map((lot, lotIdx) => (
                        <div
                          key={lotIdx}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100"
                        >
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400 w-10 flex-shrink-0">
                                Rulon#
                              </span>
                              <Input
                                type="number"
                                placeholder="—"
                                value={lot.rollNumber}
                                disabled={lot._stockId !== null}
                                onChange={(e) =>
                                  updateLot(
                                    item.itemId,
                                    lotIdx,
                                    "rollNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-16 h-7 text-xs bg-white disabled:bg-gray-50"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400 w-14 flex-shrink-0">
                                Uzunlik
                              </span>
                              <Input
                                type="number"
                                placeholder="—"
                                value={lot.length}
                                onChange={(e) =>
                                  updateLot(
                                    item.itemId,
                                    lotIdx,
                                    "length",
                                    e.target.value,
                                  )
                                }
                                className="w-20 h-7 text-xs bg-white"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeLot(item.itemId, lotIdx)}
                            className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add roll button */}
                  <button
                    onClick={() => addEmptyLot(item.itemId)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Rulon qo'shish
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.itemId)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 self-start mt-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 &&
        (() => {
          const totals = {};
          for (const i of items) {
            const price = Number(i.price) || 0;
            if (!price) continue;
            const qty =
              i.lots.length > 0
                ? i.lots.reduce((s, l) => s + (Number(l.length) || 0), 0)
                : Number(i.quantity) || 0;
            const key = i.currencyId || "__none__";
            totals[key] = (totals[key] || 0) + price * qty;
          }
          const entries = Object.entries(totals).filter(([, v]) => v > 0);
          if (entries.length === 0) return null;
          return (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 space-y-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Jami summa
              </span>
              {entries.map(([currencyId, total]) => {
                const currency = currencies.find(
                  (c) => String(c.id) === currencyId,
                );
                return (
                  <div
                    key={currencyId}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {currency?.name ?? "Valyutasiz"}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-lg font-bold text-gray-900">
                        {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-11 text-base"
      >
        {submitting ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            Saqlanmoqda...
          </>
        ) : (
          "Saqlash"
        )}
      </Button>

      {/* Order search dialog */}
      <Dialog
        open={openOrderDialog}
        onOpenChange={(v) => {
          setOpenOrderDialog(v);
          if (!v) {
            setOrderSearchText("");
            setOrderStatusFilter("all");
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Buyurtma tanlash</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Select
              value={orderStatusFilter}
              onValueChange={setOrderStatusFilter}
            >
              <SelectTrigger className="bg-white w-44 flex-shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                {Object.entries(statuses).map(([key, s]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`}
                      />
                      {s.text}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Buyurtma nomi yoki raqami..."
                value={orderSearchText}
                onChange={(e) => setOrderSearchText(e.target.value)}
                className="bg-white pr-9"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="min-h-48 max-h-[28rem] overflow-y-auto -mx-1 px-1">
            {filteredOrders.length > 0 ? (
              <div className="space-y-1">
                {filteredOrders.map((order) => {
                  const st = statuses[order.status];
                  const modelNames =
                    order.orderModels
                      ?.flatMap(
                        (om) =>
                          om.subModels
                            ?.map((sm) => sm.subModel?.name)
                            .filter(Boolean) ||
                          [om.model?.name].filter(Boolean),
                      )
                      .filter(Boolean) || [];
                  return (
                    <button
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setOpenOrderDialog(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                        selectedOrder?.id === order.id
                          ? "border-primary/30 bg-primary/5"
                          : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {order.name}
                            </span>
                            {st && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${st.secondaryBg} ${st.textColor}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${st.color}`}
                                />
                                {st.text}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            <span className="text-xs text-gray-500">
                              Miqdor:{" "}
                              <span className="text-gray-700 font-medium">
                                {order.quantity?.toLocaleString()}
                              </span>
                            </span>
                            {order.price > 0 && (
                              <span className="text-xs text-gray-500">
                                Narx:{" "}
                                <span className="text-gray-700 font-medium">
                                  {order.price?.toLocaleString()}
                                </span>
                              </span>
                            )}
                            {order.seasonYear && (
                              <span className="text-xs text-gray-500">
                                Mavsum:{" "}
                                <span className="text-gray-700 font-medium">
                                  {seasonLabels[order.seasonType] ||
                                    order.seasonType}{" "}
                                  {order.seasonYear}
                                </span>
                              </span>
                            )}
                          </div>

                          {modelNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {modelNames.slice(0, 4).map((name, i) => (
                                <ItemBadge key={i}>{name}</ItemBadge>
                              ))}
                              {modelNames.length > 4 && (
                                <ItemBadge>+{modelNames.length - 4}</ItemBadge>
                              )}
                            </div>
                          )}
                        </div>

                        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                          #{order.id}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300 gap-2">
                <ClipboardList className="w-8 h-8" />
                <p className="text-sm text-gray-400">
                  {allOrders.length === 0
                    ? "Buyurtmalar yuklanmoqda..."
                    : "Buyurtma topilmadi"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Item search dialog */}
      <Dialog
        open={openItemDialog}
        onOpenChange={(v) => {
          setOpenItemDialog(v);
          if (!v) {
            setItemSearchText("");
            setSelectedType("");
            setItemResults([]);
            setItemPage(1);
            setItemTotalPages(1);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mahsulot tanlash</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Select
              value={selectedType}
              onValueChange={(v) => {
                setSelectedType(v);
                searchItems(v);
              }}
            >
              <SelectTrigger className="bg-white w-36 flex-shrink-0">
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Qidirish..."
                value={itemSearchText}
                onChange={(e) => setItemSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchItems()}
                className="bg-white pr-9"
              />
              <button
                onClick={() => searchItems()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="min-h-48 max-h-96 overflow-y-auto -mx-1 px-1">
            {searchingItems ? (
              <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
                <Loader2 className="animate-spin w-5 h-5" />
                <span className="text-sm">Qidirilmoqda...</span>
              </div>
            ) : itemResults.length > 0 ? (
              <div className="space-y-0.5">
                {itemResults.map((item, index) => {
                  const alreadyAdded = items.some((i) => i.itemId === item.id);
                  return (
                    <button
                      key={index}
                      onClick={() => addItem(item)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                        alreadyAdded
                          ? "bg-primary/5 border border-primary/20"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.code && <ItemBadge>{item.code}</ItemBadge>}
                          {item.unit?.name && (
                            <ItemBadge>{item.unit.name}</ItemBadge>
                          )}
                          {item.color?.name && (
                            <ItemBadge>
                              {item.color.hex && (
                                <span
                                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                                  style={{
                                    backgroundColor: `#${item.color.hex}`,
                                  }}
                                />
                              )}
                              {item.color.name}
                            </ItemBadge>
                          )}
                          {item.price > 0 && (
                            <ItemBadge>
                              {item.price.toLocaleString()}{" "}
                              {item.currency?.name}
                            </ItemBadge>
                          )}
                        </div>
                      </div>
                      {alreadyAdded && (
                        <span className="text-xs text-primary font-semibold flex-shrink-0">
                          Qo'shilgan
                        </span>
                      )}
                    </button>
                  );
                })}
                <div ref={itemSentinelRef} className="py-1">
                  {loadingMoreItems && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300 gap-2">
                <Search className="w-8 h-8" />
                <p className="text-sm text-gray-400">Mahsulotni qidiring</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee search dialog */}
      <Dialog
        open={openEmployeeDialog}
        onOpenChange={(v) => {
          setOpenEmployeeDialog(v);
          if (!v) {
            setEmpSearchText("");
            setEmpDeptId("");
            setEmpGroupId("");
            setEmpResults([]);
            setEmpPage(1);
            setEmpTotalPages(1);
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
                setEmpGroupId("");
                setEmpResults([]);
                setEmpPage(1);
                searchEmployees(1, v, "");
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

            {departments.find((d) => String(d.id) === empDeptId)?.groups
              ?.length > 0 && (
              <Select
                value={empGroupId}
                onValueChange={(v) => {
                  setEmpGroupId(v);
                  setEmpResults([]);
                  setEmpPage(1);
                  searchEmployees(1, empDeptId, v);
                }}
              >
                <SelectTrigger className="bg-white flex-1">
                  <SelectValue placeholder="Guruh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha guruhlar</SelectItem>
                  {departments
                    .find((d) => String(d.id) === empDeptId)
                    .groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="relative">
            <Input
              type="text"
              placeholder="Ism bo'yicha qidirish..."
              value={empSearchText}
              onChange={(e) => setEmpSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchEmployees(1)}
              className="bg-white pr-9"
            />
            <button
              onClick={() => searchEmployees(1)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="min-h-48 max-h-96 overflow-y-auto -mx-1 px-1">
            {searchingEmps ? (
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
                      setOpenEmployeeDialog(false);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-gray-50 border border-transparent transition-colors"
                  >
                    {emp.img ? (
                      <img
                        src={emp.img}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {emp.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {emp.position?.name && (
                          <ItemBadge>{emp.position.name}</ItemBadge>
                        )}
                        {emp.department?.name && (
                          <ItemBadge>{emp.department.name}</ItemBadge>
                        )}
                        {emp.group?.name && (
                          <ItemBadge>{emp.group.name}</ItemBadge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                <div ref={empSentinelRef} className="py-1">
                  {loadingMoreEmps && (
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

      {/* Image preview dialog */}
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent>
          <img
            src={previewImage}
            alt="preview"
            className="w-full max-h-[80vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default New;

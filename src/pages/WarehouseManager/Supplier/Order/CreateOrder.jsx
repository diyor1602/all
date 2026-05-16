import { useState, useEffect, useRef } from "react";
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
import { Loader2, Plus, Trash2, Search, Package } from "lucide-react";

const ItemBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
    {children}
  </span>
);

const New = () => {
  const { toast } = useToast();

  const [types, setTypes] = useState([]);

  const [deadline, setDeadline] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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

  const [stockBalances, setStockBalances] = useState({});

  const [previewImage, setPreviewImage] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  useEffect(() => {
    api
      .get("/warehouseManager/itemType")
      .then((res) => setTypes(res.data))
      .catch(() => {});
  }, []);

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
          requestedQuantity: "",
          comment: "",
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

  const handleSubmit = async () => {
    if (!deadline) {
      toast({
        title: "Xatolik",
        description: "Muddatni kiriting",
        variant: "destructive",
      });
      return;
    }
    if (!deadlineTime) {
      toast({
        title: "Xatolik",
        description: "Vaqtni kiriting",
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
    if (items.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta mahsulot qo'shing",
        variant: "destructive",
      });
      return;
    }
    for (const item of items) {
      if (!item.requestedQuantity || Number(item.requestedQuantity) <= 0) {
        toast({
          title: "Xatolik",
          description: `"${item.name}" uchun miqdor kiriting`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post("/warehouseManager/purchaseOrder", {
        deadline: deadline
          ? `${deadline}${deadlineTime ? `T${deadlineTime}` : ""}`
          : null,
        comments: comment || null,
        items: items.map((i) => ({
          itemId: i.itemId,
          requestedQuantity: Number(i.requestedQuantity),
          comment: i.comment || null,
        })),
      });

      toast({ title: "Muvaffaqiyatli", description: "Buyurtma saqlandi" });
      setDeadline("");
      setDeadlineTime("");
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
      <h1 className="text-2xl font-semibold text-gray-900">Yangi buyurtma</h1>

      {/* Main info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Asosiy ma'lumotlar
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Muddat <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Vaqt <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Izoh <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="Ta'minotchiga izoh..."
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
          <div className="space-y-3">
            {items.map((item, idx) => {
              const stockRegular = (stockBalances[item.itemId] ?? []).filter(
                (s) => !s.rollNumber,
              );
              const stockRolls = (stockBalances[item.itemId] ?? []).filter(
                (s) => s.rollNumber,
              );
              return (
                <div
                  key={item.itemId}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  {/* Item header */}
                  <div className="flex gap-3 p-3 bg-gray-50 border-b border-gray-100">
                    <div className="text-xs text-gray-400 w-5 pt-0.5 flex-shrink-0 font-medium">
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
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 cursor-zoom-in"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
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
                                style={{
                                  backgroundColor: `#${item.color.hex}`,
                                }}
                              />
                            )}
                            {item.color.name}
                          </ItemBadge>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.itemId)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock balance */}
                  {(stockRegular.length > 0 || stockRolls.length > 0) && (
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-blue-50/40 space-y-2">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        Ombordagi qoldiq
                      </p>

                      {stockRegular.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {stockRegular.map((s) => (
                            <span key={s.id} className="text-xs text-gray-700">
                              <span className="font-medium text-gray-500">
                                {s.warehouse?.name}:
                              </span>{" "}
                              <span className="font-semibold text-gray-800">
                                {s.quantity || s.length} {item.unitLabel}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {stockRolls.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400">Rulonlar:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {stockRolls.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium bg-white border-gray-200 text-gray-700"
                              >
                                <span>R{s.rollNumber}</span>
                                <span className="text-gray-400">·</span>
                                <span>
                                  {s.length} {item.unitLabel}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inputs */}
                  <div className="px-4 py-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          Miqdor
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={item.requestedQuantity}
                          onChange={(e) =>
                            updateItem(
                              item.itemId,
                              "requestedQuantity",
                              e.target.value,
                            )
                          }
                          className="w-28 h-8 text-sm bg-white"
                        />
                        {item.unitLabel && (
                          <span className="text-sm text-gray-500">
                            {item.unitLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        Izoh
                      </span>
                      <Input
                        type="text"
                        placeholder="—"
                        value={item.comment}
                        onChange={(e) =>
                          updateItem(item.itemId, "comment", e.target.value)
                        }
                        className="flex-1 h-8 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

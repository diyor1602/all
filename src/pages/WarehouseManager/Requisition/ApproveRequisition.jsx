import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Loader2,
  Package,
  Trash2,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const isImage = (fileType) => fileType?.startsWith("image/");

const ItemBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
    {children}
  </span>
);

const ApproveRequisition = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requisition, setRequisition] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [giveItems, setGiveItems] = useState([]);
  const [stockBalances, setStockBalances] = useState({});
  const [stockLoaded, setStockLoaded] = useState({});
  const [itemDetails, setItemDetails] = useState({});
  const [comment, setComment] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    loadWarehouses();
    loadRequisition();
  }, [id]);

  const loadWarehouses = async () => {
    try {
      const res = await api.get("/warehouseManager/warehouse");
      setWarehouses(res.data ?? []);
    } catch {
      // silently fail
    }
  };

  const loadRequisition = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/warehouseManager/requisition/${id}`);
      const req = res.data;
      setRequisition(req);

      const items = req.items || [];
      setGiveItems(
        items.map((item) => ({
          requisitionItemId: item.id,
          itemId: item.itemId ?? item.item?.id,
          itemInfo: item.item,
          requestedQuantity: item.requestedQuantity,
          unitLabel: item.unitLabel || item.item?.unit?.name || "",
          givenQuantity: "",
          warehouseId: "",
          rolls: [],
        })),
      );

      const uniqueItemIds = [
        ...new Set(items.map((i) => i.itemId ?? i.item?.id).filter(Boolean)),
      ];
      uniqueItemIds.forEach((itemId) => {
        loadItemDetails(itemId);
        loadStockBalance(itemId);
      });
    } catch (err) {
      toast({
        title: "Xatolik",
        description: err.response?.data?.message || "Ma'lumotni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadItemDetails = async (itemId) => {
    try {
      const res = await api.get(`/warehouseManager/item/${itemId}`);
      setItemDetails((prev) => ({ ...prev, [itemId]: res.data }));
    } catch {
      // silently fail — itemInfo from requisition is used as fallback
    }
  };

  const loadStockBalance = async (itemId) => {
    try {
      const res = await api.get("/warehouseManager/stockBalance", {
        params: { ItemId: itemId, PageSize: 100 },
      });
      const data = res.data?.data ?? res.data ?? [];
      setStockBalances((prev) => ({ ...prev, [itemId]: data }));

      const autoWarehouseId = data[0]?.warehouse?.id
        ? String(data[0].warehouse.id)
        : null;
      if (autoWarehouseId) {
        setGiveItems((prev) =>
          prev.map((i) =>
            i.itemId === itemId && !i.warehouseId
              ? { ...i, warehouseId: autoWarehouseId }
              : i,
          ),
        );
      }
    } catch {
      // silently fail
    } finally {
      setStockLoaded((prev) => ({ ...prev, [itemId]: true }));
    }
  };

  const getAvailableQty = (itemId, warehouseId) =>
    (stockBalances[itemId] ?? [])
      .filter(
        (s) =>
          !s.rollNumber &&
          (!warehouseId || String(s.warehouse?.id) === warehouseId),
      )
      .reduce((sum, s) => sum + (s.quantity || s.length || 0), 0);

  const getStockRollMaxLength = (itemId, stockId) =>
    (stockBalances[itemId] ?? []).find((s) => s.id === stockId)?.length ?? null;

  const handleWarehouseChange = (reqItemId, newWarehouseId) => {
    setGiveItems((prev) =>
      prev.map((i) =>
        i.requisitionItemId !== reqItemId
          ? i
          : {
              ...i,
              warehouseId: newWarehouseId,
              rolls: i.rolls.filter((r) => r._stockId === null),
            },
      ),
    );
  };

  const updateGiveItem = (reqItemId, field, value) =>
    setGiveItems((prev) =>
      prev.map((i) =>
        i.requisitionItemId === reqItemId ? { ...i, [field]: value } : i,
      ),
    );

  const addRollFromStock = (reqItemId, stockItem) => {
    setGiveItems((prev) =>
      prev.map((i) => {
        if (i.requisitionItemId !== reqItemId) return i;
        if (i.rolls.some((r) => r._stockId === stockItem.id)) return i;
        return {
          ...i,
          rolls: [
            ...i.rolls,
            {
              _stockId: stockItem.id,
              rollNumber: String(stockItem.rollNumber),
              length: stockItem.length != null ? String(stockItem.length) : "",
            },
          ],
        };
      }),
    );
  };

  const updateRoll = (reqItemId, rollIdx, field, value) =>
    setGiveItems((prev) =>
      prev.map((i) => {
        if (i.requisitionItemId !== reqItemId) return i;
        return {
          ...i,
          rolls: i.rolls.map((r, idx) =>
            idx === rollIdx ? { ...r, [field]: value } : r,
          ),
        };
      }),
    );

  const removeRoll = (reqItemId, rollIdx) =>
    setGiveItems((prev) =>
      prev.map((i) =>
        i.requisitionItemId !== reqItemId
          ? i
          : { ...i, rolls: i.rolls.filter((_, idx) => idx !== rollIdx) },
      ),
    );

  const calcGivenQty = (item) =>
    item.rolls.length > 0
      ? item.rolls.reduce((sum, r) => sum + (Number(r.length) || 0), 0)
      : Number(item.givenQuantity) || 0;

  const handleConfirm = () => {
    for (const item of giveItems) {
      for (const roll of item.rolls) {
        if (!roll.length || Number(roll.length) <= 0) {
          toast({
            title: "Xatolik",
            description: `"${resolveInfo(item)?.name ?? item.itemId}" — barcha rulonlar uchun uzunlik kiriting`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const filledItems = giveItems.filter((i) => calcGivenQty(i) > 0);
    if (filledItems.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta mahsulot uchun miqdor kiriting",
        variant: "destructive",
      });
      return;
    }

    for (const item of filledItems) {
      if (!item.warehouseId) {
        toast({
          title: "Xatolik",
          description: `"${resolveInfo(item)?.name ?? item.itemId}" — omborni tanlang`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate quantity does not exceed available stock
    for (const item of filledItems) {
      if (item.rolls.length === 0) {
        const availQty = getAvailableQty(item.itemId, item.warehouseId);
        if (availQty > 0 && Number(item.givenQuantity) > availQty) {
          toast({
            title: "Xatolik",
            description: `"${resolveInfo(item)?.name ?? item.itemId}" uchun kiritilgan miqdor (${item.givenQuantity}) mavjud qoldiqdan (${availQty} ${item.unitLabel}) oshib ketdi`,
            variant: "destructive",
          });
          return;
        }
      } else {
        for (const roll of item.rolls) {
          if (roll._stockId !== null) {
            const maxLength = getStockRollMaxLength(item.itemId, roll._stockId);
            if (maxLength !== null && Number(roll.length) > maxLength) {
              toast({
                title: "Xatolik",
                description: `R${roll.rollNumber} uchun kiritilgan uzunlik (${roll.length}) mavjud uzunlikdan (${maxLength} ${item.unitLabel}) oshib ketdi`,
                variant: "destructive",
              });
              return;
            }
          }
        }
      }
    }

    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmOpen(false);
    const filledItems = giveItems.filter((i) => calcGivenQty(i) > 0);
    setSubmitting(true);
    try {
      await api.post(`/warehouseManager/Requisition/${id}/give`, {
        items: filledItems.map((i) => ({
          requisitionItemId: i.requisitionItemId,
          givenQuantity: calcGivenQty(i),
          warehouseId: i.warehouseId ? Number(i.warehouseId) : undefined,
          rolls: i.rolls.map((r) => ({
            rollNumber: Number(r.rollNumber),
            length: r.length !== "" ? Number(r.length) : null,
          })),
        })),
        comment: comment || null,
      });

      toast({ title: "Muvaffaqiyatli", description: "Talabnoma tasdiqlandi" });
      navigate(-1);
    } catch (err) {
      toast({
        title: "Xatolik",
        description: err.response?.data?.error || "Saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Prefer freshly fetched item details over requisition-embedded data
  const resolveInfo = (giveItem) =>
    itemDetails[giveItem.itemId] ?? giveItem.itemInfo;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!requisition) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Talabnomani tasdiqlash
          </h1>
          {requisition.requisitionNumber && (
            <p className="text-sm text-gray-400 font-mono">
              #{requisition.requisitionNumber}
            </p>
          )}
        </div>
      </div>

      {/* Requisition meta */}
      {(requisition.comment || requisition.attachments?.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {requisition.comment && (
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{requisition.comment}</p>
            </div>
          )}
          {requisition.attachments?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Fayllar
              </p>
              <div className="flex flex-wrap gap-2">
                {requisition.attachments.map((att) =>
                  isImage(att.fileType) ? (
                    <button
                      key={att.id}
                      onClick={() => {
                        setSelectedImage(att.filePath);
                        setDialogOpen(true);
                      }}
                      className="group relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
                    >
                      <img
                        src={att.filePath}
                        alt={att.fileName}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    </button>
                  ) : (
                    <a
                      key={att.id}
                      href={att.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600 max-w-48"
                    >
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{att.fileName}</span>
                    </a>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Mahsulotlar{" "}
          {giveItems.length > 0 && (
            <span className="text-primary">({giveItems.length})</span>
          )}
        </p>

        <div className="space-y-3">
          {giveItems.map((giveItem, idx) => {
            const info = resolveInfo(giveItem);
            const stock = stockBalances[giveItem.itemId] ?? [];

            const regularStock = stock.filter(
              (s) =>
                !s.rollNumber &&
                (!giveItem.warehouseId ||
                  String(s.warehouse?.id) === giveItem.warehouseId),
            );
            const rollsInStock = stock.filter(
              (s) =>
                s.rollNumber != null &&
                (!giveItem.warehouseId ||
                  String(s.warehouse?.id) === giveItem.warehouseId),
            );
            const addedStockIds = new Set(
              giveItem.rolls.map((r) => r._stockId),
            );

            const isStockEmpty =
              stockLoaded[giveItem.itemId] && stock.length === 0;

            const availQty = getAvailableQty(
              giveItem.itemId,
              giveItem.warehouseId,
            );
            const enteredQty = Number(giveItem.givenQuantity) || 0;
            const qtyExceeds =
              giveItem.rolls.length === 0 &&
              availQty > 0 &&
              enteredQty > availQty;

            return (
              <div
                key={giveItem.requisitionItemId}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                {/* ── Item header ── */}
                <div className="flex gap-3 p-3 bg-gray-50 border-b border-gray-100">
                  <div className="text-xs text-gray-400 w-5 pt-0.5 flex-shrink-0 font-medium">
                    {idx + 1}
                  </div>

                  {info?.image ? (
                    <img
                      src={info.image}
                      alt={info.name}
                      onClick={() => {
                        setSelectedImage(info.image);
                        setDialogOpen(true);
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
                      {info?.name ?? `#${giveItem.itemId}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {info?.code && <ItemBadge>{info.code}</ItemBadge>}
                      {giveItem.unitLabel && (
                        <ItemBadge>{giveItem.unitLabel}</ItemBadge>
                      )}
                      {info?.color?.name && (
                        <ItemBadge>
                          {info.color.hex && (
                            <span
                              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                              style={{ backgroundColor: `#${info.color.hex}` }}
                            />
                          )}
                          {info.color.name}
                        </ItemBadge>
                      )}
                      {info?.type?.name && (
                        <ItemBadge>{info.type.name}</ItemBadge>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Talab</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {giveItem.requestedQuantity}
                      {giveItem.unitLabel && ` ${giveItem.unitLabel}`}
                    </p>
                  </div>
                </div>

                {/* ── Available stock info ── */}
                {(regularStock.length > 0 || rollsInStock.length > 0) && (
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-blue-50/40 space-y-2">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      Ombordagi qoldiq
                    </p>

                    {regularStock.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {regularStock.map((s) => (
                          <span key={s.id} className="text-xs text-gray-700">
                            <span className="font-medium text-gray-500">
                              {s.warehouse?.name}:
                            </span>{" "}
                            <span className="font-semibold text-gray-800">
                              {s.quantity || s.length} {giveItem.unitLabel}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {rollsInStock.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">
                          Rulon belgilash uchun bosing:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rollsInStock.map((s) => {
                            const isAdded = addedStockIds.has(s.id);
                            return (
                              <button
                                key={s.id}
                                disabled={isAdded || s.length <= 0}
                                onClick={() =>
                                  addRollFromStock(
                                    giveItem.requisitionItemId,
                                    s,
                                  )
                                }
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium transition-colors ${
                                  isAdded
                                    ? "bg-primary/10 border-primary/30 text-primary cursor-default"
                                    : s.length <= 0
                                      ? "bg-red-50 border-red-200 text-red-600 cursor-not-allowed"
                                      : "bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5"
                                }`}
                              >
                                <span>R{s.rollNumber}</span>
                                <span className="text-gray-400">·</span>
                                <span>
                                  {s.length} {giveItem.unitLabel}
                                </span>
                                {isAdded && (
                                  <span className="text-primary">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Berilgan miqdor inputs ── */}
                <div className="px-4 py-3 space-y-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Berilgan miqdor
                  </p>

                  {isStockEmpty && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="text-amber-500 text-base leading-none">⚠</span>
                      <p className="text-xs font-medium text-amber-700">
                        Omborda mahsulot mavjud emas
                      </p>
                    </div>
                  )}

                  <Select
                    disabled={isStockEmpty}
                    value={giveItem.warehouseId}
                    onValueChange={(v) =>
                      handleWarehouseChange(giveItem.requisitionItemId, v)
                    }
                  >
                    <SelectTrigger className="h-8 text-sm bg-white max-w-64">
                      <SelectValue placeholder="Omborni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {giveItem.rolls.length === 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          disabled={isStockEmpty}
                          value={giveItem.givenQuantity}
                          onChange={(e) =>
                            updateGiveItem(
                              giveItem.requisitionItemId,
                              "givenQuantity",
                              e.target.value,
                            )
                          }
                          className={`w-28 h-8 text-sm bg-white ${qtyExceeds ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        />
                        {giveItem.unitLabel && (
                          <span className="text-sm text-gray-500">
                            {giveItem.unitLabel}
                          </span>
                        )}
                        {availQty > 0 && (
                          <span
                            className={`text-xs ${qtyExceeds ? "text-red-500 font-semibold" : "text-gray-400"}`}
                          >
                            mavjud: {availQty} {giveItem.unitLabel}
                          </span>
                        )}
                      </div>
                      {qtyExceeds && (
                        <p className="text-xs text-red-500">
                          Kiritilgan miqdor mavjud qoldiqdan oshib ketdi
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {giveItem.rolls.map((roll, rollIdx) => {
                        const maxLength =
                          roll._stockId !== null
                            ? getStockRollMaxLength(
                                giveItem.itemId,
                                roll._stockId,
                              )
                            : null;
                        const enteredLen = Number(roll.length) || 0;
                        const lengthExceeds =
                          maxLength !== null && enteredLen > maxLength;

                        return (
                          <div
                            key={rollIdx}
                            className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                              <span className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                                R{roll.rollNumber}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400">
                                  Uzunlik
                                </span>
                                <Input
                                  type="number"
                                  placeholder="—"
                                  value={roll.length}
                                  onChange={(e) =>
                                    updateRoll(
                                      giveItem.requisitionItemId,
                                      rollIdx,
                                      "length",
                                      e.target.value,
                                    )
                                  }
                                  className={`w-20 h-7 text-xs bg-white ${lengthExceeds ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                                />
                                <span className="text-xs text-gray-400">
                                  {giveItem.unitLabel}
                                </span>
                                {maxLength !== null && (
                                  <span
                                    className={`text-xs ${lengthExceeds ? "text-red-500 font-semibold" : "text-gray-400"}`}
                                  >
                                    / max {maxLength}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                removeRoll(giveItem.requisitionItemId, rollIdx)
                              }
                              className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <p className="text-xs text-gray-400">
                        Jami: {calcGivenQty(giveItem)} {giveItem.unitLabel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comment */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Izoh
        </p>
        <Textarea
          placeholder="Izoh qoldiring..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-white resize-none"
          rows={3}
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleConfirm}
        disabled={submitting}
        className="w-full h-11 text-base"
      >
        {submitting ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            Saqlanmoqda...
          </>
        ) : (
          "Tasdiqlash"
        )}
      </Button>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Chiqimni tasdiqlang
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Quyidagi mahsulotlarni berishni tasdiqlaysizmi?
              </p>
            </div>

            <div className="space-y-2">
              {giveItems
                .filter((i) => calcGivenQty(i) > 0)
                .map((item) => {
                  const given = calcGivenQty(item);
                  const requested = item.requestedQuantity;
                  const isShort = given < requested;
                  const isOver = given > requested;

                  const styles = isShort
                    ? {
                        wrap: "bg-red-50 border-red-200",
                        name: "text-red-800",
                        given: "text-red-600 font-semibold",
                        sep: "text-red-300",
                        requested: "text-red-400",
                      }
                    : isOver
                      ? {
                          wrap: "bg-green-50 border-green-200",
                          name: "text-green-800",
                          given: "text-green-600 font-semibold",
                          sep: "text-green-300",
                          requested: "text-green-400",
                        }
                      : {
                          wrap: "bg-blue-50 border-blue-200",
                          name: "text-blue-800",
                          given: "text-blue-600 font-semibold",
                          sep: "text-blue-300",
                          requested: "text-blue-400",
                        };

                  return (
                    <div
                      key={item.requisitionItemId}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${styles.wrap}`}
                    >
                      <span
                        className={`text-sm font-medium truncate flex-1 min-w-0 mr-3 ${styles.name}`}
                      >
                        {resolveInfo(item)?.name ?? `#${item.itemId}`}
                      </span>
                      <span className="flex-shrink-0 font-mono text-xs flex items-center gap-1">
                        <span className={styles.given}>{given}</span>
                        <span className={styles.sep}>/</span>
                        <span className={styles.requested}>{requested}</span>
                        {item.unitLabel && (
                          <span className="text-gray-400 ml-0.5">
                            {item.unitLabel}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>

            {giveItems.some(
              (i) =>
                calcGivenQty(i) > 0 && calcGivenQty(i) < i.requestedQuantity,
            ) && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Bir yoki bir nechta mahsulot talab qilinganidan kam berilmoqda.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Ha, tasdiqlash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <img
            src={selectedImage}
            alt="preview"
            className="w-full max-h-[80vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveRequisition;

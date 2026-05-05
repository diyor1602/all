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
  Plus,
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
  const [comment, setComment] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      uniqueItemIds.forEach(loadStockBalance);
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

  const loadStockBalance = async (itemId) => {
    try {
      const res = await api.get("/warehouseManager/stockBalance", {
        params: { ItemId: itemId, PageSize: 100 },
      });
      const data = res.data?.data ?? res.data ?? [];
      setStockBalances((prev) => ({ ...prev, [itemId]: data }));

      // Auto-select the warehouse from the first stock record
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
      // silently fail — stock info is supplementary
    }
  };

  const handleWarehouseChange = (reqItemId, newWarehouseId) => {
    setGiveItems((prev) =>
      prev.map((i) =>
        i.requisitionItemId !== reqItemId
          ? i
          : {
              ...i,
              warehouseId: newWarehouseId,
              // clear stock-sourced rolls since they belong to the old warehouse
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
              quantity: "",
            },
          ],
        };
      }),
    );
  };

  const addEmptyRoll = (reqItemId) =>
    setGiveItems((prev) =>
      prev.map((i) =>
        i.requisitionItemId !== reqItemId
          ? i
          : {
              ...i,
              rolls: [
                ...i.rolls,
                { _stockId: null, rollNumber: "", length: "", quantity: "" },
              ],
            },
      ),
    );

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

  const handleSubmit = async () => {
    const filledItems = giveItems.filter(
      (i) => i.givenQuantity && Number(i.givenQuantity) > 0,
    );
    if (filledItems.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta mahsulot uchun miqdor kiriting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/warehouseManager/Requisition/${id}/give`, {
        items: filledItems.map((i) => ({
          requisitionItemId: i.requisitionItemId,
          givenQuantity: Number(i.givenQuantity),
          warehouseId: i.warehouseId ? Number(i.warehouseId) : undefined,
          rolls: i.rolls
            .filter((r) => r.rollNumber && r.quantity)
            .map((r) => ({
              rollNumber: Number(r.rollNumber),
              length: r.length !== "" ? Number(r.length) : null,
              quantity: Number(r.quantity),
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
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Mahsulotlar ({giveItems.length} ta)
        </p>

        {giveItems.map((giveItem) => {
          const info = giveItem.itemInfo;
          const stock = stockBalances[giveItem.itemId] ?? [];
          const rollsInStock = stock.filter(
            (s) =>
              s.rollNumber != null &&
              (!giveItem.warehouseId ||
                String(s.warehouse?.id) === giveItem.warehouseId),
          );
          const addedStockIds = new Set(giveItem.rolls.map((r) => r._stockId));
          const showRolls =
            rollsInStock.length > 0 || giveItem.rolls.length > 0;

          return (
            <div
              key={giveItem.requisitionItemId}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Item header */}
              <div className="p-4 flex items-start gap-3">
                {info?.image ? (
                  <img
                    src={info.image}
                    alt={info.name}
                    onClick={() => {
                      setSelectedImage(info.image);
                      setDialogOpen(true);
                    }}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0 cursor-zoom-in"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">
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

              {/* Given qty + rolls */}
              <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
                {/* Warehouse selector */}
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-36 flex-shrink-0">
                    Ombor
                  </label>
                  <Select
                    value={giveItem.warehouseId}
                    onValueChange={(v) =>
                      handleWarehouseChange(giveItem.requisitionItemId, v)
                    }
                  >
                    <SelectTrigger className="h-8 text-sm bg-white flex-1 max-w-64">
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
                </div>

                {/* Given quantity row */}
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-36 flex-shrink-0">
                    Berilgan miqdor
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={giveItem.givenQuantity}
                    onChange={(e) =>
                      updateGiveItem(
                        giveItem.requisitionItemId,
                        "givenQuantity",
                        e.target.value,
                      )
                    }
                    className="w-28 h-8 text-sm bg-white"
                  />
                  {giveItem.unitLabel && (
                    <span className="text-sm text-gray-500">
                      {giveItem.unitLabel}
                    </span>
                  )}
                </div>

                {/* Rolls section */}
                {showRolls ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Rulonlar
                      </p>
                      <button
                        onClick={() => addEmptyRoll(giveItem.requisitionItemId)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        Qo'shish
                      </button>
                    </div>

                    {/* Available stock rolls as chips */}
                    {rollsInStock.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {rollsInStock.map((s) => {
                          const isAdded = addedStockIds.has(s.id);
                          return (
                            <button
                              key={s.id}
                              disabled={isAdded}
                              onClick={() =>
                                addRollFromStock(giveItem.requisitionItemId, s)
                              }
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
                              <span className="text-gray-400">
                                · {s.quantity}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Editable roll rows */}
                    {giveItem.rolls.length > 0 && (
                      <div className="space-y-1.5">
                        {giveItem.rolls.map((roll, rollIdx) => (
                          <div
                            key={rollIdx}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <div className="flex items-center gap-2 flex-1 flex-wrap">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400 w-10 flex-shrink-0">
                                  Rulon#
                                </span>
                                <Input
                                  type="text"
                                  placeholder="1"
                                  value={roll.rollNumber}
                                  onChange={(e) =>
                                    updateRoll(
                                      giveItem.requisitionItemId,
                                      rollIdx,
                                      "rollNumber",
                                      e.target.value,
                                    )
                                  }
                                  className="w-16 h-7 text-xs bg-white"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400 w-14 flex-shrink-0">
                                  Uzunlik
                                </span>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={roll.length}
                                  onChange={(e) =>
                                    updateRoll(
                                      giveItem.requisitionItemId,
                                      rollIdx,
                                      "length",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20 h-7 text-xs bg-white"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400 w-14 flex-shrink-0">
                                  Miqdor
                                </span>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={roll.quantity}
                                  onChange={(e) =>
                                    updateRoll(
                                      giveItem.requisitionItemId,
                                      rollIdx,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20 h-7 text-xs bg-white"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                removeRoll(giveItem.requisitionItemId, rollIdx)
                              }
                              className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => addEmptyRoll(giveItem.requisitionItemId)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Rulon qo'shish
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
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
          "Tasdiqlash"
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <div className="w-full h-[80vh] overflow-auto flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveRequisition;

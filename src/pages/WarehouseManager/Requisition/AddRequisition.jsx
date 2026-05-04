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
import {
  Loader2,
  Plus,
  Trash2,
  Search,
  Paperclip,
  X,
  Package,
} from "lucide-react";

const AddRequisition = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const sentinelRef = useRef(null);

  useEffect(() => {
    getWarehouses();
    getTypes();
  }, []);

  const getWarehouses = async () => {
    try {
      const res = await api.get("/warehouseManager/warehouse");
      setWarehouses(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Omborlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const getTypes = async () => {
    try {
      const res = await api.get("/warehouseManager/itemType");
      setTypes(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Turlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const searchItems = async (typeOverride, pageNum = 1) => {
    const type = typeOverride !== undefined ? typeOverride : selectedType;
    if (pageNum === 1) setSearching(true);
    else setLoadingMore(true);
    try {
      const res = await api.get("/warehouseManager/item", {
        params: {
          search: searchText || undefined,
          typeId: type && type !== "all" ? type : undefined,
          page: pageNum,
        },
      });
      const newData = res.data?.data || [];
      setSearchResults((prev) => (pageNum === 1 ? newData : [...prev, ...newData]));
      setPage(pageNum);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast({
        title: "Xatolik",
        description: "Mahsulotlarni topib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      if (pageNum === 1) setSearching(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !searching && page < totalPages) {
          searchItems(undefined, page + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, searching]);

  const addItem = (item) => {
    const exists = items.find((i) => i.itemId === item.id);
    if (exists) {
      setItems((prev) =>
        prev.map((i) =>
          i.itemId === item.id
            ? { ...i, requestedQuantity: i.requestedQuantity + 1 }
            : i,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          code: item.code,
          image: item.image,
          unitLabel: item.unit?.name || "",
          requestedQuantity: 1,
          comment: "",
        },
      ]);
    }
    setOpenDialog(false);
  };

  const removeItem = (itemId) =>
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));

  const updateItem = (itemId, field, value) =>
    setItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, [field]: value } : i)),
    );

  const handleFiles = (e) => {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files)]);
    e.target.value = "";
  };

  const removeFile = (index) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!selectedWarehouse) {
      toast({
        title: "Xatolik",
        description: "Ombor tanlanmagan",
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
    const invalidItem = items.find((i) => !i.requestedQuantity || Number(i.requestedQuantity) < 1);
    if (invalidItem) {
      toast({
        title: "Xatolik",
        description: `"${invalidItem.name}" uchun miqdor kiritilmagan`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("WarehouseId", selectedWarehouse);
      formData.append("Comment", comment);

      items.forEach(
        ({ itemId, comment: itemComment, requestedQuantity, unitLabel }, i) => {
          formData.append(`Items[${i}][itemId]`, itemId);
          formData.append(`Items[${i}][requestedQuantity]`, Number(requestedQuantity));
          formData.append(`Items[${i}][unitLabel]`, unitLabel);
          formData.append(`Items[${i}][comment]`, itemComment);
        },
      );

      attachments.forEach((file) => formData.append("Attachments", file));

      await api.post("/warehouseManager/Requisition", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({ title: "Muvaffaqiyatli", description: "Requisitsiya yaratildi" });
      setSelectedWarehouse("");
      setComment("");
      setItems([]);
      setAttachments([]);
    } catch {
      toast({
        title: "Xatolik",
        description: "Saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Yangi Talabnoma</h1>

      {/* Main info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Asosiy ma'lumotlar
        </p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Ombor</label>
          <Select
            value={selectedWarehouse}
            onValueChange={setSelectedWarehouse}
          >
            <SelectTrigger className="bg-white">
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Izoh</label>
          <Textarea
            placeholder="Talabnoma haqida izoh..."
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
            onClick={() => setOpenDialog(true)}
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

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.code} {item.unitLabel && `· ${item.unitLabel}`}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={1}
                        value={item.requestedQuantity}
                        onChange={(e) =>
                          updateItem(
                            item.itemId,
                            "requestedQuantity",
                            e.target.value,
                          )
                        }
                        className="w-20 h-8 text-sm bg-white"
                      />
                      {item.unitLabel && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {item.unitLabel}
                        </span>
                      )}
                    </div>
                    <Input
                      type="text"
                      placeholder="Izoh..."
                      value={item.comment}
                      onChange={(e) =>
                        updateItem(item.itemId, "comment", e.target.value)
                      }
                      className="flex-1 h-8 text-sm bg-white"
                    />
                  </div>
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

      {/* Attachments */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Fayllar
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Biriktirish
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFiles}
          />
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Fayllar biriktirilmagan
          </p>
        ) : (
          <div className="space-y-1.5">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
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
        open={openDialog}
        onOpenChange={(v) => {
          setOpenDialog(v);
          if (!v) {
            setSearchText("");
            setSelectedType("");
            setSearchResults([]);
            setPage(1);
            setTotalPages(1);
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
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchItems()}
                className="bg-white pr-9"
              />
              <button
                onClick={searchItems}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="min-h-48 max-h-96 overflow-y-auto -mx-1 px-1">
            {searching ? (
              <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
                <Loader2 className="animate-spin w-5 h-5" />
                <span className="text-sm">Qidirilmoqda...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-0.5">
                {searchResults.map((item) => {
                  const alreadyAdded = items.some((i) => i.itemId === item.id);
                  return (
                    <button
                      key={item.id}
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
                        <p className="text-xs text-gray-400">
                          {item.code} {item.unit?.name && `· ${item.unit.name}`}
                        </p>
                      </div>
                      {alreadyAdded && (
                        <span className="text-xs text-primary font-semibold flex-shrink-0">
                          Qo'shilgan
                        </span>
                      )}
                    </button>
                  );
                })}
                <div ref={sentinelRef} className="py-1">
                  {loadingMore && (
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

export default AddRequisition;

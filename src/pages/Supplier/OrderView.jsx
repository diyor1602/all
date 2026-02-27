import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Loader2,
  Plus,
  Calendar,
  Hash,
  Package,
  CheckCircle2,
  X,
  Search,
  Image as ImageIcon,
  ChevronRight,
  Camera,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import formatNumber from "@/utils/formatNumber";

/* -------------------- utils -------------------- */
const formatDate = (dateInput) =>
  dateInput
    ? new Date(dateInput).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const getTimeRemaining = (deadline) => {
  if (!deadline) return null;

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;

  if (diff <= 0) return "Muddati o'tgan";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} kun ${hours} soat`;
  } else if (hours > 0) {
    return `${hours} soat`;
  } else {
    return "1 soatdan kam";
  }
};

/* -------------------- component -------------------- */
const OrderView = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [comment, setComment] = useState("");
  const [addedItems, setAddedItems] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Dialog & Search States
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const debouncedSearchText = useDebounce(searchText, 500);

  /* -------------------- image preview (upload) -------------------- */
  const uploadPreview = useMemo(() => {
    if (!selectedImage) return null;
    return URL.createObjectURL(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    };
  }, [uploadPreview]);

  /* -------------------- fetch order -------------------- */
  const getOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/supplier/orders/${id}`);
      const normalizedItems = res.data.items.map((i) => ({
        ...i,
        received_quantity: "",
        received_price: "",
      }));
      setOrder({ ...res.data, items: normalizedItems });
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Buyurtma ma'lumotlari olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrder();
  }, [id]);

  /* -------------------- time remaining countdown -------------------- */
  useEffect(() => {
    if (!order?.deadline) return;

    const updateTime = () => {
      setTimeRemaining(getTimeRemaining(order.deadline));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [order?.deadline]);

  /* -------------------- search -------------------- */
  useEffect(() => {
    if (!debouncedSearchText.trim()) {
      setSearchResults([]);
      return;
    }
    const search = async () => {
      setSearching(true);
      try {
        const res = await api.get("/supplier/items/search", {
          params: { search: debouncedSearchText },
        });
        setSearchResults(res.data);
      } catch {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Mahsulot qidirishda xatolik",
        });
      } finally {
        setSearching(false);
      }
    };
    search();
  }, [debouncedSearchText]);

  /* -------------------- handlers -------------------- */
  const updateOrderItem = (itemId, field, value) => {
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, [field]: value } : i,
      ),
    }));
  };

  const updateAddedItem = (itemId, field, value) => {
    setAddedItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
    );
  };

  const handleAddItem = (item) => {
    setAddedItems((prev) => [
      ...prev,
      { ...item, received_quantity: "", received_price: "" },
    ]);
    setAddDialogOpen(false);
    setSearchText("");
  };

  const handleRemoveAddedItem = (itemId) => {
    setAddedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  /* -------------------- submit -------------------- */
  const handleSubmit = async () => {
    setSubmitting(true);
    const itemsPayload = [
      ...order.items.map((i) => ({
        id: i.id,
        received_quantity: i.received_quantity,
        received_price: i.received_price,
      })),
      ...addedItems.map((i) => ({
        item_id: i.id,
        received_quantity: i.received_quantity,
        received_price: i.received_price,
      })),
    ].filter(
      (i) => Number(i.received_quantity) > 0 && Number(i.received_price) > 0,
    );

    if (!itemsPayload.length) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          "Kamida bitta mahsulot miqdori va narxi to‘ldirilishi kerak",
      });
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    if (selectedImage) formData.append("image", selectedImage);
    formData.append("comment", comment);
    itemsPayload.forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        formData.append(`items[${index}][${key}]`, value);
      });
    });

    try {
      await api.post(`/supplier/submits/${id}`, formData);
      toast({ title: "Muvaffaqiyatli", description: "Ma'lumotlar saqlandi" });
      navigate("/supplier/orders");
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Yuborishda xatolik yuz berdi",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-muted-foreground animate-pulse">Yuklanmoqda...</p>
      </div>
    );

  if (order?.status !== "pending")
    return (
      <div className="h-screen flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full p-8 space-y-4">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold">Buyurtma faol emas</h2>
          <p className="text-muted-foreground">
            Ushbu buyurtma yopilgan yoki hali tasdiqlanmagan.
          </p>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Package className="text-primary" /> Buyurtma #{order.id}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border">
                <Calendar size={14} /> Deadline: {formatDate(order.deadline)}
              </span>
              <Badge
                className={
                  timeRemaining === "Muddati o'tgan"
                    ? "bg-red-500 hover:bg-red-600"
                    : timeRemaining?.includes("1 soatdan kam")
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-emerald-500 hover:bg-emerald-600"
                }
              >
                {timeRemaining || "Hisoblanmoqda..."}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            variant="outline"
            className="md:w-auto w-full bg-white shadow-sm gap-2"
          >
            <Plus size={18} /> Yangi mahsulot
          </Button>
        </div>

        {/* Client Note */}
        {order.comment && (
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4 flex gap-3 italic text-slate-600 text-sm">
              <div className="text-blue-500 font-bold">Izoh:</div>
              {order.comment}
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        <div className="grid gap-4">
          {[...order.items, ...addedItems].map((item, idx) => {
            const isOriginal = !!item.item;
            const product = isOriginal ? item.item : item;

            return (
              <Card
                key={idx}
                className="overflow-hidden border-none shadow-sm group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Product Image Section */}
                  <div
                    className="w-full md:w-40 h-40 bg-slate-100 relative cursor-zoom-in overflow-hidden"
                    onClick={() =>
                      product.image && setViewingImage(product.image)
                    }
                  >
                    {product.image ? (
                      <>
                        <img
                          src={product.image}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={40} />
                      </div>
                    )}
                    {!isOriginal && (
                      <Badge
                        className="absolute top-2 left-2 bg-purple-600 shadow-lg"
                        size="sm"
                      >
                        Qo'shilgan
                      </Badge>
                    )}
                  </div>

                  {/* Product Details Section */}
                  <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">
                          {product.name}
                        </h3>

                        {!isOriginal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveAddedItem(item.id)}
                          >
                            <X size={18} />
                          </Button>
                        )}
                      </div>
                      <div className="text-gray-600 text-sm">
                        Buyurtma qilingan:{" "}
                        <span className="font-bold">
                          {formatNumber(item.ordered_quantity)}{" "}
                          {product.unit.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Hash size={12} /> {product.code}
                        </span>
                        <span>
                          Narxi: {formatNumber(product.price)}{" "}
                          {product.currency.name}
                        </span>
                        <span>Lot: {product.lot || "N/A"}</span>
                        <span>Rangi: {product.color?.name || "—"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Olingan miqdor ({formatNumber(item.received_quantity)}{" "}
                          {product.unit.name})
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-11 border-slate-200 focus:border-primary"
                          value={item.received_quantity}
                          onChange={(e) =>
                            isOriginal
                              ? updateOrderItem(
                                  item.id,
                                  "received_quantity",
                                  e.target.value,
                                )
                              : updateAddedItem(
                                  item.id,
                                  "received_quantity",
                                  e.target.value,
                                )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Bir dona narxi ({formatNumber(item.received_price)})
                        </label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="h-11 border-slate-200 focus:border-emerald-500 text-emerald-700 font-semibold"
                          value={item.received_price}
                          onChange={(e) =>
                            isOriginal
                              ? updateOrderItem(
                                  item.id,
                                  "received_price",
                                  e.target.value,
                                )
                              : updateAddedItem(
                                  item.id,
                                  "received_price",
                                  e.target.value,
                                )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer Submission Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon size={16} /> Hujjat/Chek rasmi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative aspect-video rounded-lg border-2 border-dashed border-slate-200 hover:border-primary transition-colors flex flex-col items-center justify-center overflow-hidden">
                {uploadPreview ? (
                  <>
                    <img
                      src={uploadPreview}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="text-slate-400 mb-2" size={24} />
                    <span className="text-xs text-slate-500 px-4 text-center">
                      Yuklash uchun bosing
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setSelectedImage(e.target.files[0])}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-none shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-sm flex items-center gap-2">
                Qo'shimcha izoh
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <Textarea
                placeholder="Buyurtma haqida eslatmalar..."
                className="h-full min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-slate-700"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* PC Submit Button */}
        <Button
          disabled={submitting}
          onClick={handleSubmit}
          className="hidden md:flex w-full h-14 text-lg font-bold gap-3 shadow-xl shadow-primary/20"
        >
          {submitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <CheckCircle2 /> Buyurtmani yakunlash
            </>
          )}
        </Button>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t md:hidden z-40">
        <Button
          disabled={submitting}
          onClick={handleSubmit}
          className="w-full h-12 text-base font-bold shadow-lg"
        >
          {submitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Buyurtmani yakunlash"
          )}
        </Button>
      </div>

      {/* Global Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={viewingImage}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-slate-900"
              alt="Item Preview"
            />
            <Button
              className="absolute top-6 right-6 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md"
              size="icon"
              variant="ghost"
              onClick={() => setViewingImage(null)}
            >
              <X className="text-white" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Search Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Mahsulot qo'shish</DialogTitle>
            <DialogDescription>
              Omboringizdan mahsulotni tanlang
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-0 space-y-4">
            <div className="relative group">
              <Search
                className="absolute left-3 top-3 text-slate-400 group-focus-within:text-primary transition-colors"
                size={18}
              />
              <Input
                placeholder="Mahsulot nomi yoki kodi..."
                className="pl-10 h-11"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {searching ? (
                <div className="py-10 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </div>
              ) : (
                searchResults.map((item) => {
                  const alreadyInOrder = order.items.some(
                    (i) => i.item?.id === item.id,
                  );
                  const alreadyAdded = addedItems.some((i) => i.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate uppercase">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter">
                          {item.code} • {item.color?.name} • {item.lot}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={
                          alreadyInOrder || alreadyAdded ? "ghost" : "default"
                        }
                        disabled={alreadyInOrder || alreadyAdded}
                        onClick={() => handleAddItem(item)}
                        className="rounded-full h-8"
                      >
                        {alreadyInOrder || alreadyAdded ? (
                          "Qo'shilgan"
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
              {!searching && searchText && searchResults.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">
                  Mahsulot topilmadi
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;

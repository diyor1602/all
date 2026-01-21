import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

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

/* -------------------- component -------------------- */
const OrderView = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [comment, setComment] = useState("");

  const [addedItems, setAddedItems] = useState([]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const debouncedSearchText = useDebounce(searchText, 500);

  /* -------------------- image preview -------------------- */
  const imagePreview = useMemo(() => {
    if (!selectedImage) return null;
    return URL.createObjectURL(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
      {
        ...item,
        received_quantity: "",
        received_price: "",
      },
    ]);
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
        description: "Kamida bitta mahsulot to‘ldirilishi kerak",
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

      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma qabul qilindi",
      });

      setAddedItems([]);
      setComment("");
      setSelectedImage(null);
      getOrder();
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Buyurtma qabul qilishda xatolik",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- render -------------------- */
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (order?.status !== "active")
    return <div>Buyurtma Aktiv statusida emas!</div>;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div>ID: {order.id}</div>
        <div>Deadline: {formatDate(order.deadline)}</div>
        <div>Izoh: {order.comment}</div>

        {order.items.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded space-y-2">
            <div>{item.item?.name}</div>
            <Input
              type="number"
              placeholder="Olingan miqdor"
              value={item.received_quantity}
              onChange={(e) =>
                updateOrderItem(item.id, "received_quantity", e.target.value)
              }
            />
            <Input
              type="number"
              placeholder="Jami narxi"
              value={item.received_price}
              onChange={(e) =>
                updateOrderItem(item.id, "received_price", e.target.value)
              }
            />
          </div>
        ))}

        {addedItems.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded space-y-2">
            <div>{item.name}</div>
            <Input
              type="number"
              placeholder="Olingan miqdor"
              value={item.received_quantity}
              onChange={(e) =>
                updateAddedItem(item.id, "received_quantity", e.target.value)
              }
            />
            <Input
              type="number"
              placeholder="Jami narxi"
              value={item.received_price}
              onChange={(e) =>
                updateAddedItem(item.id, "received_price", e.target.value)
              }
            />
          </div>
        ))}

        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedImage(e.target.files[0])}
        />

        {imagePreview && <img src={imagePreview} className="max-w-xs" />}

        <Button onClick={() => setAddDialogOpen(true)}>
          Yana mahsulot qo'shish
        </Button>

        <Input
          placeholder="Izoh"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <Button disabled={submitting} onClick={handleSubmit}>
          {submitting ? <Loader2 className="animate-spin" /> : "Yakunlash"}
        </Button>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi mahsulot qo'shish</DialogTitle>
            <DialogDescription>
              Topilgan: {searchResults.length}
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Qidirish"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {searching ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              searchResults.map((item) => {
                const alreadyAdded =
                  addedItems.some((i) => i.id === item.id) ||
                  order.items.some((i) => i.item?.id === item.id);

                return (
                  <div key={item.id} className="border p-3 rounded">
                    <div>{item.name}</div>
                    <Button
                      size="sm"
                      disabled={alreadyAdded}
                      onClick={() => handleAddItem(item)}
                    >
                      {alreadyAdded ? "Qo'shilgan" : "Qo'shish"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderView;

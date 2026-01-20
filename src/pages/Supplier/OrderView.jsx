import { useState, useEffect } from "react";
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

const formatDate = (dateInput) => {
  return dateInput
    ? new Date(dateInput).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
};

const OrderView = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [items, setItems] = useState([
    {
      recieved_price: "",
      recieved_quantity: "",
      id: "",
    },
  ]);
  const [addedItems, setAddedItems] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const debouncedSearchText = useDebounce(searchText, 500);

  const getOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/supplier/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
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
  }, []);

  useEffect(() => {
    if (debouncedSearchText.trim()) {
      searchItem();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchText]);

  const searchItem = async () => {
    if (!debouncedSearchText.trim()) return;

    setSearching(true);
    try {
      const res = await api.get("/supplier/items/search", {
        params: {
          search: debouncedSearchText,
        },
      });
      setSearchResults(res.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Mahsulot qidirishda xatolik",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAddItem = (item) => {
    setAddedItems((prev) => [...prev, item]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("items", JSON.stringify(order?.items));
    formData.append("comment", comment);
    try {
      const res = await api.post(`supplier/submits/${id}`, formData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma qabul qilindi",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Buyurtma qabul qilishda xatolik",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (order?.status !== "active")
    return <div>Buyurtma Aktiv statusida emas!</div>;

  return (
    <>
      <div className="flex flex-col gap-2">
        <div>ID: {order?.id}</div>
        <div>Deadline: {formatDate(order?.deadline)}</div>
        <div>Izoh: {order?.comment}</div>
        <div className="flex flex-col gap-2 mt-2">
          {order?.items?.map((item, index) => (
            <div key={index} className="bg-white flex flex-col gap-2">
              <div>Nomi: {item.item?.name}</div>
              <div>
                Miqdori: {item.quantity} {item.item?.unit?.name}
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Olingan miqdor"
                  min={0}
                  step={0.1}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Jami narxi"
                  min={0}
                  step={0.1}
                />
              </div>
              <div>Rangi: {item.item?.color?.name}</div>
              {item?.item?.image && <img src={item?.item?.image} alt="" />}
            </div>
          ))}
        </div>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedImage(e.target.files[0])}
        />

        {selectedImage && (
          <div>
            <img src={URL.createObjectURL(selectedImage)} alt="" />
          </div>
        )}

        <Button onClick={() => setAddDialogOpen(true)}>
          Yana mahsulot qo'shish
        </Button>

        <Input
          type="text"
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
              Topilgan mahsulotlar: {searchResults?.length || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder="Qidirish"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-2">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-600" />
              </div>
            ) : searchResults?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Mahsulotlar topilmadi
              </div>
            ) : (
              searchResults?.map((item, index) => {
                const isInAdded = addedItems?.find(
                  (addedItem) => addedItem.id === item.id,
                );

                const isInDefault = order?.items?.find(
                  (orderItem) => orderItem.item?.id === item.id,
                );

                const isAlreadyAdded = isInDefault || isInAdded;

                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 hover:border-blue-300"
                  >
                    <div className="flex items-start gap-4 flex-wrap">
                      {item.image && (
                        <img
                          src={item.image}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          alt={item.name}
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Rangi:
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {item.color?.name || "Noma'lum"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Lot:</span>
                            <span className="text-sm font-medium text-gray-700">
                              {item.lot || "Noma'lum"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Button
                          onClick={() => handleAddItem(item)}
                          size="sm"
                          disabled={isAlreadyAdded}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isAlreadyAdded ? "Qo'shilgan" : "Qo'shish"}
                        </Button>
                      </div>
                    </div>
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

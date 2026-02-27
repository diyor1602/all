import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
} from "@/components/ui/dialog";

import { ImageOff, Plus, Trash } from "lucide-react";

const CreateOrder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [itemSearches, setItemSearches] = useState([""]);
  const [showItemResults, setShowItemResults] = useState([false]);
  const itemRefs = useRef([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);
  const [types, setTypes] = useState([]);

  const [formData, setFormData] = useState({
    supplier_id: "",
    comment: "",
    deadline: "",
    items: [
      {
        type_id: "",
        item_id: "",
        item_name: "",
        quantity: "",
        code: "",
        color: "",
        lot: "",
      },
    ],
  });

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/warehouseManager/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  const fetchItems = async (searchTerm = "", typeId) => {
    try {
      const response = await api.get("/warehouseManager/items/search", {
        params: {
          search: searchTerm,
          type_id: typeId,
        },
      });

      const selectedItemIds = formData.items
        .filter((item) => item.item_id)
        .map((item) => item.item_id);

      const filteredItems = response.data.filter(
        (item) => !selectedItemIds.includes(item.id.toString()),
      );

      setItems(filteredItems);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await api.get("/warehouseManager/types");
      setTypes(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchTypes();
  }, []);

  useEffect(() => {
    if (suppliers.length === 1) {
      setFormData((prev) => ({
        ...prev,
        supplier_id: suppliers[0].id.toString(),
      }));
    }
  }, [suppliers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      itemRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target)) {
          setShowItemResults((prev) => {
            const newState = [...prev];
            newState[index] = false;
            return newState;
          });
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const handleItemSelect = (index, item) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        item_id: item.id.toString(),
        item_name: item.name,
        code: item.code,
        color: item.color?.name || "",
        lot: item.lot || "",
        image: item.image || null,
      };
      return {
        ...prev,
        items: newItems,
      };
    });

    const newSearches = [...itemSearches];
    newSearches[index] = item.name;
    setItemSearches(newSearches);

    const newShowResults = [...showItemResults];
    newShowResults[index] = false;
    setShowItemResults(newShowResults);
  };

  const handleItemSearchChange = (value, index) => {
    const typeId = formData.items?.[index]?.type_id;
    if (!typeId) {
      toast({
        title: "Diqqat!",
        description: "Avval turini tanlang",
        variant: "destructive",
      });
      return;
    }

    const newSearches = [...itemSearches];
    newSearches[index] = value;
    setItemSearches(newSearches);

    const newShowResults = [...showItemResults];
    newShowResults[index] = true;
    setShowItemResults(newShowResults);

    fetchItems(value, typeId);
  };

  const handleItemTypeChange = (index, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        type_id: value,
        item_id: "",
        item_name: "",
        code: "",
        color: "",
        lot: "",
        image: null,
      };
      return {
        ...prev,
        items: newItems,
      };
    });

    setItems([]);

    setItemSearches((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });

    setShowItemResults((prev) => {
      const next = [...prev];
      next[index] = false;
      return next;
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          type_id: "",
          item_id: "",
          item_name: "",
          quantity: "",
        },
      ],
    }));

    setItemSearches([...itemSearches, ""]);
    setShowItemResults([...showItemResults, false]);
    itemRefs.current = [...itemRefs.current, null];
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

    const newSearches = [...itemSearches];
    newSearches.splice(index, 1);
    setItemSearches(newSearches);

    const newShowResults = [...showItemResults];
    newShowResults.splice(index, 1);
    setShowItemResults(newShowResults);

    itemRefs.current.splice(index, 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplier_id || !formData.deadline || !formData.items.length) {
      toast({
        title: "Diqqat!",
        description: "Barcha majburiy maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    const hasItemId = formData.items.every((item) => item.item_id);
    const hasQuantity = formData.items.every((item) => item.quantity);

    if (!hasItemId || !hasQuantity) {
      toast({
        title: "Diqqat!",
        description: "Barcha maxsulotlar uchun miqdorni kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/warehouseManager/supplierOrders", formData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli yaratildi",
        style: {
          background: "green",
          color: "white",
        },
      });
      navigate("/warehouseManager/settings/supplier/");
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Buyurtma yaratishda xatolik",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-20">
      <h1 className="text-2xl font-bold mb-6">
        Ta'minotchi uchun yangi buyurtma
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ta'minotchi</label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) =>
                handleSelectChange(value, "supplier_id")
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Ta'minotchi tanlash" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.employee?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Qachongacha?</label>
            <Input
              type="datetime-local"
              name="deadline"
              min={new Date().toISOString().slice(0, 16)}
              value={formData.deadline}
              onChange={handleInputChange}
              className="bg-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Izoh</label>
          <Input
            type="text"
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Izoh yozing"
            className="bg-white"
          />
        </div>

        <div className="space-y-4 rounded-lg border bg-muted/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Maxsulotlar</h2>
          </div>

          {formData.items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-lg border bg-white p-4 shadow-sm"
            >
              <div
                className="relative md:col-span-8"
                ref={(el) => (itemRefs.current[index] = el)}
              >
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={item.type_id || ""}
                    onValueChange={(value) =>
                      handleItemTypeChange(index, value)
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="text"
                    placeholder="Maxsulotlar qidirish..."
                    value={itemSearches[index]}
                    disabled={!item.type_id}
                    onChange={(e) =>
                      handleItemSearchChange(e.target.value, index)
                    }
                    className="bg-white"
                  />
                </div>
                {showItemResults[index] && items.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 overflow-hidden rounded-lg border bg-white shadow-xl">
                    <div className="max-h-56 overflow-auto">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="group flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/60"
                          onClick={() => handleItemSelect(index, item)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {item.name}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-0.5">
                              <div className="truncate">
                                Turi: {item.type?.name}
                              </div>
                              <div className="truncate">Kod: {item.code}</div>
                              <div className="truncate">
                                Rang: {item.color?.name || "-"}
                              </div>
                              <div className="truncate">Lot: {item.lot}</div>
                            </div>
                          </div>

                          {item.image ? (
                            <div className="h-14 w-14 overflow-hidden rounded-md border bg-muted/20">
                              <img
                                src={item.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 overflow-hidden rounded-md border bg-muted/20 flex items-center justify-center">
                              <ImageOff className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.item_id && (
                  <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="grid grid-cols-1 gap-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Kod:</span>
                          <span className="text-muted-foreground truncate">
                            {item.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Rang:</span>
                          <span className="text-muted-foreground truncate">
                            {item.color || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Lot:</span>
                          <span className="text-muted-foreground truncate">
                            {item.lot || "-"}
                          </span>
                        </div>
                      </div>

                      {item.image ? (
                        <button
                          type="button"
                          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white shadow-sm transition hover:shadow-md"
                          onClick={() => {
                            setSelectedItem(item);
                            setImgDialogOpen(true);
                          }}
                        >
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/10">
                          <div className="flex flex-col items-center gap-1">
                            <ImageOff className="h-5 w-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              Rasm yo'q
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Input
                type="number"
                placeholder="Miqdor"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                className="bg-white md:col-span-3"
              />

              <div className="flex items-start justify-end md:col-span-1">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeItem(index)}
                  className="h-9 w-9 p-0"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-1">
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              className="w-full"
            >
              <Plus /> Maxsulot qo'shish
            </Button>
          </div>
        </div>

        <div className="flex justify-end items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/warehouseManager/settings/supplier/")}
          >
            Bekor qilish
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Yaratilmoqda..." : "Buyurtma yaratish"}
          </Button>
        </div>
      </form>
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.item_name}</DialogTitle>
            <DialogDescription>{selectedItem?.code}</DialogDescription>
          </DialogHeader>
          <div className="max-w-[90vw] max-h-[90vh] overflow-auto">
            <img src={selectedItem?.image} alt="" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateOrder;

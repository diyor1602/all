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

import { Plus, Trash } from "lucide-react";

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

  const [formData, setFormData] = useState({
    supplier_id: "",
    comment: "",
    deadline: "",
    items: [
      {
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
        title: "Error",
        description: "Failed to fetch suppliers",
        variant: "destructive",
      });
    }
  };

  const fetchItems = async (searchTerm = "") => {
    if (!searchTerm.trim()) {
      setItems([]);
      return;
    }

    try {
      const response = await api.get("/warehouseManager/items/search", {
        params: {
          search: searchTerm,
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
        title: "Error",
        description: "Failed to fetch items",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSuppliers();
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
    const newSearches = [...itemSearches];
    newSearches[index] = value;
    setItemSearches(newSearches);

    const newShowResults = [...showItemResults];
    newShowResults[index] = true;
    setShowItemResults(newShowResults);

    fetchItems(value);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
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
    <div className="p-4 md:max-w-4xl mx-auto bg-white rounded-lg shadow-md">
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Maxsulotlar</h2>
          </div>

          {formData.items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
            >
              <div
                className="relative"
                ref={(el) => (itemRefs.current[index] = el)}
              >
                <Input
                  type="text"
                  placeholder="Maxsulotlar qidirish..."
                  value={itemSearches[index]}
                  onChange={(e) =>
                    handleItemSearchChange(e.target.value, index)
                  }
                  className="bg-white"
                />
                {showItemResults[index] && items.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                    <div className="max-h-48 overflow-auto">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col gap-1"
                          onClick={() => handleItemSelect(index, item)}
                        >
                          <span>{item.name}</span>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <div>
                              <div>Kod: {item.code}</div>
                              <div>Rang: {item.color?.name || "-"}</div>
                              <div>Lot: {item.lot}</div>
                            </div>
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                className="w-20 h-20 object-cover"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.item_id && (
                  <div className="mt-2 p-2 border rounded-md bg-muted/30">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Kod:</span>
                        <span className="text-sm text-muted-foreground">
                          {item.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Rang:</span>
                        <span className="text-sm text-muted-foreground">
                          {item.color || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Lot:</span>
                        <span className="text-sm text-muted-foreground">
                          {item.lot || "-"}
                        </span>
                      </div>
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-20 h-20 object-cover"
                          onClick={() => {
                            setSelectedItem(item);
                            setImgDialogOpen(true);
                          }}
                        />
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
                className="bg-white"
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeItem(index)}
                  className="ml-auto"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" onClick={addItem} variant="outline">
            <Plus /> Maxsulot qo'shish
          </Button>
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

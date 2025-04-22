"use client";

import { useEffect, useState, useRef } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { statuses } from "@/lib/status";

const New = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [allSources, setAllSources] = useState([]);
  const [filteredSources, setFilteredSources] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [openSourceCombobox, setOpenSourceCombobox] = useState(false);
  const [itemSearches, setItemSearches] = useState([""]);
  const [showItemResults, setShowItemResults] = useState([false]);
  const [openOrderCombobox, setOpenOrderCombobox] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const itemRefs = useRef([]);
  const [openContragentCombobox, setOpenContragentCombobox] = useState(false);

  const [formData, setFormData] = useState({
    warehouse_id: "",
    source_id: "",
    source_name: "",
    comment: "",
    order_id: "",
    contragent_id: "", // Add contragent_id to formData
    items: [
      {
        item_id: "",
        item_name: "", // Added to store the displayed name
        quantity: "",
        price: "",
        currency_id: "",
      },
    ],
  });

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

      // Get all currently selected item IDs except the current one being edited
      const selectedItemIds = formData.items
        .filter((item) => item.item_id)
        .map((item) => item.item_id);

      // Filter out already selected items
      const filteredItems = response.data.filter(
        (item) => !selectedItemIds.includes(item.id.toString())
      );

      setItems(filteredItems);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchAllSources = async () => {
    try {
      const response = await api.get("/warehouseManager/sources");
      setAllSources(response.data);
      setFilteredSources(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ishlab chiqarishlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await api.get("/warehouseManager/currencies");
      setCurrencies(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Valutaralar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchContragents = async () => {
    try {
      const response = await api.get("/warehouseManager/contragents");
      setContragents(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ishlab chiqarishlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get("/warehouseManager/warehouses");
      setWarehouses(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Sotuvchilar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get("/warehouseManager/orders");
      setOrders(response.data);
      return response.data;
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyumlar olishda xatolik",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchOrders();
    fetchCurrencies();
    fetchContragents();
    fetchAllSources();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle item dropdowns
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
        price: item.price || "",
        currency_id: item.currency?.id ? item.currency.id.toString() : "",
      };
      return {
        ...prev,
        items: newItems,
      };
    });

    // Update the search field with the selected item name
    const newSearches = [...itemSearches];
    newSearches[index] = item.name;
    setItemSearches(newSearches);

    // Hide the results
    const newShowResults = [...showItemResults];
    newShowResults[index] = false;
    setShowItemResults(newShowResults);
  };

  // Fix the handleSourceSelect function to properly handle source selection
  const handleSourceSelect = (sourceId) => {
    // If sourceId is "new", we're creating a new source
    if (sourceId === "new") {
      setFormData((prev) => ({
        ...prev,
        source_id: "",
        source_name: newSourceName,
      }));
    } else {
      // Find the source by ID - convert both to strings for comparison
      const source = allSources.find(
        (s) => s.id.toString() === sourceId.toString()
      );
      if (source) {
        setFormData((prev) => ({
          ...prev,
          source_id: sourceId.toString(), // Ensure it's stored as string
          source_name: "", // Clear source_name when selecting existing source
        }));
      }
    }
    setOpenSourceCombobox(false);
  };

  const addItem = () => {
    // Get all currently selected item IDs
    const selectedItemIds = formData.items
      .filter((item) => item.item_id)
      .map((item) => item.item_id);

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: "",
          item_name: "",
          quantity: "",
          price: "",
          currency_id: "",
        },
      ],
    }));

    // Add a new empty search term for the new item
    setItemSearches([...itemSearches, ""]);
    setShowItemResults([...showItemResults, false]);

    // Add a new ref for the new item
    itemRefs.current = [...itemRefs.current, null];
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

    // Remove the search term for this item
    const newSearches = [...itemSearches];
    newSearches.splice(index, 1);
    setItemSearches(newSearches);

    // Remove the show results state for this item
    const newShowResults = [...showItemResults];
    newShowResults.splice(index, 1);
    setShowItemResults(newShowResults);

    // Remove the ref for this item
    itemRefs.current.splice(index, 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.source_id && !formData.source_name) {
      toast({
        title: "Diqqat",
        description: "Kirim turini tanlang",
        variant: "destructive",
      });
      return;
    }

    if (!formData.warehouse_id || !formData.items.length) {
      toast({
        title: "Diqqat",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const dataToSubmit = { ...formData };

      // If we have a new source name but no source_id, use the source_name
      if (!dataToSubmit.source_id && dataToSubmit.source_name) {
        dataToSubmit.source_id = null;
      } else {
        delete dataToSubmit.source_name;
      }

      // Remove item_name from each item before submitting
      dataToSubmit.items = dataToSubmit.items.map((item) => {
        const { item_name, ...rest } = item;
        return rest;
      });

      await api.post("/warehouseManager/incoming", dataToSubmit);
      toast({
        title: "Muvaffaqiyatli",
        description: "Kirim muvaffaqiyatli yaratildi",
        style: {
          background: "green",
          color: "white",
        },
      });
      navigate("/warehouseManager/income");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kirim yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSourceSearchChange = (value) => {
    setNewSourceName(value);

    if (value.trim() === "") {
      setFilteredSources(allSources);
    } else {
      const filtered = allSources.filter((source) =>
        source.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSources(filtered);
    }
  };

  const handleItemSearchChange = (value, index) => {
    // Update the search term for this specific item
    const newSearches = [...itemSearches];
    newSearches[index] = value;
    setItemSearches(newSearches);

    // Show the results dropdown
    const newShowResults = [...showItemResults];
    newShowResults[index] = true;
    setShowItemResults(newShowResults);

    // Fetch items based on the search term
    fetchItems(value);
  };

  // Get the selected order display text
  const getSelectedOrderText = () => {
    if (!formData.order_id) return "";

    const selectedOrder = orders.find(
      (order) => order.id.toString() === formData.order_id
    );
    if (!selectedOrder) return "";

    return `${selectedOrder.name} - ${selectedOrder.comment} (${
      statuses[selectedOrder.status]?.text
    })`;
  };

  // Get the selected source display text
  const getSelectedSourceText = () => {
    if (formData.source_name) return formData.source_name;
    if (!formData.source_id) return "";

    const selectedSource = allSources.find(
      (source) => source.id.toString() === formData.source_id
    );
    if (!selectedSource) return "";

    return selectedSource.name;
  };

  const getSelectedContragentText = () => {
    if (!formData.contragent_id) return "";

    const selectedContragent = contragents.find(
      (contragent) => contragent.id.toString() === formData.contragent_id
    );
    if (!selectedContragent) return "";

    return selectedContragent.name;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Yangi kirim</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ombor</label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) =>
                handleSelectChange(value, "warehouse_id")
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Omborni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem
                    key={warehouse.id}
                    value={warehouse.id.toString()}
                  >
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Kirim turi</label>
            <Popover
              open={openSourceCombobox}
              onOpenChange={setOpenSourceCombobox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSourceCombobox}
                  className="w-full justify-between"
                >
                  {getSelectedSourceText() || "Kirim turini tanlang"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Kirim turini qidirish..."
                    value={newSourceName}
                    onValueChange={handleSourceSearchChange}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-3 px-4">
                        <p>Kirim turi topilmadi</p>
                        {newSourceName.trim() !== "" && (
                          <Button
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={() => handleSourceSelect("new")}
                            type="button"
                          >
                            "{newSourceName}" ni yangi kirim turi sifatida
                            qo'shish
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredSources.map((source) => (
                        <CommandItem
                          key={source.id}
                          value={source.id.toString()}
                          onSelect={(value) => handleSourceSelect(value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.source_id === source.id.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {source.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Buyurtma</label>
          <Popover open={openOrderCombobox} onOpenChange={setOpenOrderCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openOrderCombobox}
                className="w-full justify-between"
              >
                {formData.order_id
                  ? getSelectedOrderText()
                  : "Buyurtmani tanlang"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Buyurtmani qidirish..." />
                <CommandEmpty>Buyurtma topilmadi</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {orders.map((order) => (
                      <CommandItem
                        key={order.id}
                        value={order.id}
                        onSelect={() => {
                          setFormData((prev) => {
                            // Check if order has a contragent and set contragent_id if it does
                            const contragentId = order.contragent
                              ? order.contragent.id.toString()
                              : prev.contragent_id;
                            return {
                              ...prev,
                              order_id: order.id.toString(),
                              contragent_id: contragentId,
                            };
                          });
                          setOpenOrderCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.order_id === order.id.toString()
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>
                            {order?.id} {order?.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {order?.comment} ({order?.quantity}) (
                            {statuses[order?.status]?.text})
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kontragent</label>
          <Popover
            open={openContragentCombobox}
            onOpenChange={setOpenContragentCombobox}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openContragentCombobox}
                className="w-full justify-between"
              >
                {formData.contragent_id
                  ? getSelectedContragentText()
                  : "Kontragentni tanlang"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Kontragentni qidirish..." />
                <CommandEmpty>Kontragent topilmadi</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {contragents.map((contragent) => (
                      <CommandItem
                        key={contragent.id}
                        value={contragent.id}
                        onSelect={() => {
                          setFormData((prev) => ({
                            ...prev,
                            contragent_id: contragent.id.toString(),
                          }));
                          setOpenContragentCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.contragent_id === contragent.id.toString()
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{contragent.name}</span>
                          {contragent.description && (
                            <span className="text-xs text-muted-foreground">
                              {contragent.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Izoh</label>
          <Input
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Izoh kiriting"
            className="bg-white"
          />
        </div>

        <h2 className="text-lg font-semibold">Mahsulotlar</h2>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg"
            >
              <div
                className="relative"
                ref={(el) => (itemRefs.current[index] = el)}
              >
                <Input
                  placeholder="Mahsulotni qidirish..."
                  value={itemSearches[index]}
                  onChange={(e) =>
                    handleItemSearchChange(e.target.value, index)
                  }
                  className="bg-white"
                  onFocus={() => {
                    if (itemSearches[index]) {
                      const newShowResults = [...showItemResults];
                      newShowResults[index] = true;
                      setShowItemResults(newShowResults);
                    }
                  }}
                />
                {showItemResults[index] && items.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="py-1">
                      {items.map((product) => (
                        <div
                          key={product.id}
                          className="px-4 py-2 hover:bg-muted cursor-pointer"
                          onClick={() => handleItemSelect(index, product)}
                        >
                          {product.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {showItemResults[index] &&
                  items.length === 0 &&
                  itemSearches[index] && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                      <div className="px-4 py-3 text-sm">
                        <p>Mahsulot topilmadi</p>
                      </div>
                    </div>
                  )}
              </div>

              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                placeholder="Miqdor"
                className="bg-white"
              />

              <Input
                type="number"
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, "price", e.target.value)
                }
                placeholder="Narx"
                className="bg-white"
              />

              <Select
                value={item.currency_id}
                onValueChange={(value) =>
                  handleItemChange(index, "currency_id", value)
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Valyuta" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem
                      key={currency.id}
                      value={currency.id.toString()}
                    >
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="destructive"
                onClick={() => removeItem(index)}
                className="mt-2 md:mt-0 w-fit"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <Button type="button" onClick={addItem} variant="outline">
              + Mahsulot qo'shish
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/warehouseManager/income")}
          >
            Bekor qilish
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default New;

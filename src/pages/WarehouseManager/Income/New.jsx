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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const specialTypes = ["Mato", "Astar", "Мато", "Астар"];

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
  const [types, setTypes] = useState([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const [formData, setFormData] = useState({
    warehouse_id: "",
    source_id: "",
    source_name: "",
    comment: "",
    order_id: "",
    contragent_id: "", // Add contragent_id to formData
    items: [
      {
        type_id: "",
        item_id: "",
        item_name: "", // Added to store the displayed name
        quantity: "",
        price: "",
        currency_id: "",
        code: "", // Add code
        color: "", // Add color
        lot: "", // Add lot
        image: "", // Add image
        roll_number: "", // Add roll_number
        length: "", // Add length
      },
    ],
  });

  const fetchItems = async (searchTerm = "", typeId = "") => {
    try {
      const response = await api.get("/warehouseManager/items/search", {
        params: {
          search: searchTerm,
          type_id: typeId,
        },
      });

      // Get all currently selected item IDs except the current one being edited
      const selectedItemIds = formData.items
        .filter((item) => item.item_id)
        .map((item) => item.item_id);

      // Filter out already selected items
      const filteredItems = response.data.filter(
        (item) => !selectedItemIds.includes(item.id.toString()),
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

  const fetchTypes = async () => {
    try {
      const response = await api.get("/warehouseManager/types");
      setTypes(response.data);
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
    fetchTypes();
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
        image: "",
        roll_number: "", // Reset roll_number
        length: "", // Reset length
      };
      return {
        ...prev,
        items: newItems,
      };
    });

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

    setItems([]);
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
        code: item.code || "",
        color: item.color?.name || "",
        lot: item.lot || "",
        image: item.image,
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
        (s) => s.id.toString() === sourceId.toString(),
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
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          type_id: "",
          item_id: "",
          item_name: "",
          quantity: "",
          price: "",
          currency_id: "",
          code: "",
          color: "",
          lot: "",
          roll_number: "", // Add roll_number
          length: "", // Add length
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

    // check items' id
    const hasInvalidId = formData.items.some(
      (item) => !item.item_id || item.item_id <= 0,
    );
    if (hasInvalidId) {
      toast({
        title: "Diqqat",
        description: "Mahsulotni tanlang",
        variant: "destructive",
      });
      return;
    }

    // check items' quantity
    const hasInvalidQuantity = formData.items.some(
      (item) => !item.quantity || item.quantity <= 0,
    );
    if (hasInvalidQuantity) {
      toast({
        title: "Diqqat",
        description: "Mahsulotlar sonini kiriting",
        variant: "destructive",
      });
      return;
    }

    // check items' price
    const hasInvalidPrice = formData.items.some(
      (item) => !item.price || item.price <= 0,
    );
    if (hasInvalidPrice) {
      toast({
        title: "Diqqat",
        description: "Mahsulotlar narxini tekshiring",
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
        description:
          error.response?.data?.message || "Kirim yaratishda xatolik yuz berdi",
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
        source.name.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredSources(filtered);
    }
  };

  const handleItemSearchChange = (value, index) => {
    // Update the search term for this specific item
    const newSearches = [...itemSearches];
    newSearches[index] = value;
    setItemSearches(newSearches);

    const typeId = formData.items[index]?.type_id;
    if (!typeId) {
      setItems([]);
      const newShowResults = [...showItemResults];
      newShowResults[index] = false;
      setShowItemResults(newShowResults);
      return;
    }

    // Show the results dropdown
    const newShowResults = [...showItemResults];
    newShowResults[index] = true;
    setShowItemResults(newShowResults);

    // Fetch items based on the search term
    fetchItems(value, typeId);
  };

  // Get the selected order display text
  const getSelectedOrderText = () => {
    if (!formData.order_id) return "";

    const selectedOrder = orders.find(
      (order) => order.id.toString() === formData.order_id,
    );
    if (!selectedOrder) return "";

    return `${selectedOrder.name} (${statuses[selectedOrder.status]?.text} | ${selectedOrder.quantity} dona)`;
  };

  // Get the selected source display text
  const getSelectedSourceText = () => {
    if (formData.source_name) return formData.source_name;
    if (!formData.source_id) return "";

    const selectedSource = allSources.find(
      (source) => source.id.toString() === formData.source_id,
    );
    if (!selectedSource) return "";

    return selectedSource.name;
  };

  const getSelectedContragentText = () => {
    if (!formData.contragent_id) return "";

    const selectedContragent = contragents.find(
      (contragent) => contragent.id.toString() === formData.contragent_id,
    );
    if (!selectedContragent) return "";

    return selectedContragent.name;
  };

  // Helper function to check if type requires roll_number and length
  const isSpecialType = (typeId) => {
    if (!typeId) return false;
    const type = types.find((t) => t.id.toString() === typeId.toString());
    return type && specialTypes.includes(type.name);
  };

  return (
    <div>
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
                                : "opacity-0",
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              order_id: "",
                            }));
                            setOpenContragentCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.contragent_id ===
                                contragent.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
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
            <label className="text-sm font-medium">Buyurtma</label>
            <Popover
              open={openOrderCombobox}
              onOpenChange={setOpenOrderCombobox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openOrderCombobox}
                  className="w-full justify-between"
                  disabled={!formData.contragent_id}
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
                      {orders
                        .filter(
                          (order) =>
                            order.contragent.id.toString() ===
                            formData.contragent_id,
                        )
                        .map((order) => (
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
                                  : "opacity-0",
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
              className="rounded-xl border bg-white/60 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    Mahsulot #{index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tur, mahsulot, miqdor va narxni kiriting
                  </span>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeItem(index)}
                  className="h-9 px-3"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Tur</label>
                  <Select
                    value={item.type_id || ""}
                    onValueChange={(value) =>
                      handleItemTypeChange(index, value)
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Tur tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-4">
                  <label className="text-sm font-medium">Mahsulot</label>
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
                      disabled={!item.type_id}
                      onFocus={() => {
                        if (itemSearches[index]) {
                          const newShowResults = [...showItemResults];
                          newShowResults[index] = true;
                          setShowItemResults(newShowResults);
                        }
                      }}
                    />
                    {item.item_id && (
                      <div className="mt-2 rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-1 flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Kod:</span>
                              <span className="text-sm text-muted-foreground">
                                {item.code || "-"}
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
                          </div>
                          {item.image && (
                            <img
                              src={item.image}
                              alt=""
                              className="h-16 w-16 rounded-md border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setSelectedImage(item.image);
                                setImageDialogOpen(true);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {showItemResults[index] && items.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
                        <div className="max-h-72 overflow-auto p-1">
                          {items.map((product) => (
                            <div
                              key={product.id}
                              className="flex gap-3 rounded-md px-3 py-2 hover:bg-muted cursor-pointer"
                              onClick={() => handleItemSelect(index, product)}
                            >
                              <div className="flex flex-1 flex-col">
                                <span className="text-sm font-medium">
                                  {product.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {product.code}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {product.color?.name} {product.lot}
                                </span>
                              </div>
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt=""
                                  className="h-12 w-12 rounded-md border object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {showItemResults[index] &&
                      items.length === 0 &&
                      itemSearches[index] && (
                        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
                          <div className="px-4 py-3 text-sm text-muted-foreground">
                            <p>Mahsulot topilmadi</p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Miqdor</label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    placeholder="0"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Narx</label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(index, "price", e.target.value)
                    }
                    placeholder="0"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Valyuta</label>
                  <Select
                    value={item.currency_id}
                    onValueChange={(value) =>
                      handleItemChange(index, "currency_id", value)
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Valyuta tanlang" />
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
                </div>

                {/* Show roll_number and length fields only for Mato and Astar types */}
                {isSpecialType(item.type_id) && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">
                        Rulon raqami
                      </label>
                      <Input
                        value={item.roll_number}
                        onChange={(e) =>
                          handleItemChange(index, "roll_number", e.target.value)
                        }
                        placeholder="Rulon raqami"
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Uzunlik</label>
                      <Input
                        type="number"
                        value={item.length}
                        onChange={(e) =>
                          handleItemChange(index, "length", e.target.value)
                        }
                        placeholder="Uzunlik"
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
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

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Mahsulot rasmi</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImage}
              alt="Product image"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default New;

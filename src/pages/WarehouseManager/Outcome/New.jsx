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
  const [alldestinations, setAlldestinations] = useState([]);
  const [filtereddestinations, setFiltereddestinations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [opendestinationCombobox, setOpendestinationCombobox] = useState(false);
  const [itemSearches, setItemSearches] = useState([""]);
  const [showItemResults, setShowItemResults] = useState([false]);
  const [openOrderCombobox, setOpenOrderCombobox] = useState(false);
  const [newdestinationName, setNewdestinationName] = useState("");
  const [users, setUsers] = useState([]);
  const itemRefs = useRef([]);
  const [openContragentCombobox, setOpenContragentCombobox] = useState(false);
  const [openResponsibleUserCombobox, setOpenResponsibleUserCombobox] =
    useState(false);

  const [formData, setFormData] = useState({
    warehouse_id: "",
    destination_id: "",
    destination_name: "",
    comment: "",
    order_id: "",
    contragent_id: "",
    responsible_user_id: "", // Add responsible_user_id field
    items: [
      {
        item_id: "",
        item_name: "",
        quantity: "",
        price: "",
        currency_id: "",
      },
    ],
  });

  const fetchUsers = async () => {
    try {
      const response = await api.get("/warehouseManager/users");
      setUsers(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Foydalanuvchilar olishda xatolik",
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

  const fetchAlldestinations = async () => {
    try {
      const response = await api.get("/warehouseManager/destinations");
      setAlldestinations(response.data);
      setFiltereddestinations(response.data);
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
    fetchUsers();
    fetchAlldestinations();
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

  // Fix the handledestinationSelect function to properly handle destination selection
  const handledestinationSelect = (destinationId) => {
    // If destinationId is "new", we're creating a new destination
    if (destinationId === "new") {
      setFormData((prev) => ({
        ...prev,
        destination_id: "",
        destination_name: newdestinationName,
      }));
    } else {
      // Find the destination by ID - convert both to strings for comparison
      const destination = alldestinations.find(
        (s) => s.id.toString() === destinationId.toString()
      );
      if (destination) {
        setFormData((prev) => ({
          ...prev,
          destination_id: destinationId.toString(), // Ensure it's stored as string
          destination_name: "", // Clear destination_name when selecting existing destination
        }));
      }
    }
    setOpendestinationCombobox(false);
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

    if (!formData.destination_id && !formData.destination_name) {
      toast({
        title: "Diqqat",
        description: "Chiqim turini tanlang",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.warehouse_id ||
      !formData.items.length ||
      !formData.responsible_user_id
    ) {
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

      // If we have a new destination name but no destination_id, use the destination_name
      if (!dataToSubmit.destination_id && dataToSubmit.destination_name) {
        dataToSubmit.destination_id = null;
      } else {
        delete dataToSubmit.destination_name;
      }

      // Remove item_name from each item before submitting
      dataToSubmit.items = dataToSubmit.items.map((item) => {
        const { item_name, ...rest } = item;
        return rest;
      });

      await api.post("/warehouseManager/outcome", dataToSubmit);
      toast({
        title: "Muvaffaqiyatli",
        description: "Chiqim muvaffaqiyatli yaratildi",
        style: {
          background: "green",
          color: "white",
        },
      });
      navigate("/warehouseManager/outcome");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Chiqim yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handledestinationSearchChange = (value) => {
    setNewdestinationName(value);

    if (value.trim() === "") {
      setFiltereddestinations(alldestinations);
    } else {
      const filtered = alldestinations.filter((destination) =>
        destination.name.toLowerCase().includes(value.toLowerCase())
      );
      setFiltereddestinations(filtered);
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

  // Get the selected destination display text
  const getSelecteddestinationText = () => {
    if (formData.destination_name) return formData.destination_name;
    if (!formData.destination_id) return "";

    const selecteddestination = alldestinations.find(
      (destination) => destination.id.toString() === formData.destination_id
    );
    if (!selecteddestination) return "";

    return selecteddestination.name;
  };

  const getSelectedContragentText = () => {
    if (!formData.contragent_id) return "";

    const selectedContragent = contragents.find(
      (contragent) => contragent.id.toString() === formData.contragent_id
    );
    if (!selectedContragent) return "";

    return selectedContragent.name;
  };

  const getSelectedResponsibleUserText = () => {
    if (!formData.responsible_user_id) return "";

    const selectedUser = users.find(
      (user) => user.id.toString() === formData.responsible_user_id
    );
    if (!selectedUser) return "";

    return selectedUser.employee
      ? selectedUser.employee.name
      : selectedUser.username;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Yangi chiqim</h1>

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
            <label className="text-sm font-medium">Chiqim turi</label>
            <Popover
              open={opendestinationCombobox}
              onOpenChange={setOpendestinationCombobox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={opendestinationCombobox}
                  className="w-full justify-between"
                >
                  {getSelecteddestinationText() || "Chiqim turini tanlang"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Chiqim turini qidirish..."
                    value={newdestinationName}
                    onValueChange={handledestinationSearchChange}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-3 px-4">
                        <p>Chiqim turi topilmadi</p>
                        {newdestinationName.trim() !== "" && (
                          <Button
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={() => handledestinationSelect("new")}
                            type="button"
                          >
                            "{newdestinationName}" ni yangi chiqim turi sifatida
                            qo'shish
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {filtereddestinations.map((destination) => (
                        <CommandItem
                          key={destination.id}
                          value={destination.id.toString()}
                          onSelect={(value) => handledestinationSelect(value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.destination_id ===
                                destination.id.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {destination.name}
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
          <label className="text-sm font-medium">Mas'ul shaxs</label>
          <Popover
            open={openResponsibleUserCombobox}
            onOpenChange={setOpenResponsibleUserCombobox}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openResponsibleUserCombobox}
                className="w-full justify-between"
              >
                {formData.responsible_user_id
                  ? getSelectedResponsibleUserText()
                  : "Mas'ul shaxsni tanlang"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Mas'ul shaxsni qidirish..." />
                <CommandEmpty>Mas'ul shaxs topilmadi</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => {
                          setFormData((prev) => ({
                            ...prev,
                            responsible_user_id: user.id.toString(),
                          }));
                          setOpenResponsibleUserCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.responsible_user_id === user.id.toString()
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>
                            {user.employee ? user.employee.name : user.username}
                          </span>
                          {user.employee && user.employee.phone && (
                            <span className="text-xs text-muted-foreground">
                              {user.employee.user_id} (
                              {user.employee?.department?.name}) (
                              {user.employee?.position?.name})
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
            onClick={() => navigate("/warehouseManager/outcome")}
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

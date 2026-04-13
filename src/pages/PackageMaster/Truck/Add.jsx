import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  Snowflake,
  TreePalm,
  Search,
  X,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { statuses } from "@/lib/status";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import formatNumber from "@/utils/formatNumber";

const Add = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: "",
    driver_name: "",
    driver_phone: "",
    comment: "",
  });
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Matrix state for size and color management
  const [matrices, setMatrices] = useState({}); // Store matrix for each item

  // Matrix helper functions
  const uid = () => Math.random().toString(36).slice(2, 9);

  const initializeMatrix = (itemId) => {
    setMatrices((prev) => ({
      ...prev,
      [itemId]: {
        sizes: [],
        colors: [],
        quantities: {},
      },
    }));
  };

  const addSize = (itemId) => {
    setMatrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        sizes: [...prev[itemId].sizes, { id: uid(), name: "" }],
      },
    }));
  };

  const addColor = (itemId) => {
    setMatrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        colors: [...prev[itemId].colors, { id: uid(), name: "" }],
      },
    }));
  };

  const updateQty = (itemId, sizeId, colorId, value) => {
    const key = `${sizeId}-${colorId}`;
    setMatrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantities: {
          ...prev[itemId].quantities,
          [key]: value,
        },
      },
    }));
  };

  const deleteSize = (itemId, sizeId) => {
    setMatrices((prev) => {
      const matrix = prev[itemId];
      const sizes = matrix.sizes.filter((s) => s.id !== sizeId);
      const quantities = { ...matrix.quantities };

      Object.keys(quantities).forEach((key) => {
        if (key.startsWith(sizeId + "-")) {
          delete quantities[key];
        }
      });

      return {
        ...prev,
        [itemId]: { ...matrix, sizes, quantities },
      };
    });
  };

  const deleteColor = (itemId, colorId) => {
    setMatrices((prev) => {
      const matrix = prev[itemId];
      const colors = matrix.colors.filter((c) => c.id !== colorId);
      const quantities = { ...matrix.quantities };

      Object.keys(quantities).forEach((key) => {
        if (key.endsWith("-" + colorId)) {
          delete quantities[key];
        }
      });

      return {
        ...prev,
        [itemId]: { ...matrix, colors, quantities },
      };
    });
  };

  const updateSizeName = (itemId, sizeId, name) => {
    setMatrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        sizes: prev[itemId].sizes.map((s) =>
          s.id === sizeId ? { ...s, name } : s,
        ),
      },
    }));
  };

  const updateColorName = (itemId, colorId, name) => {
    setMatrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        colors: prev[itemId].colors.map((c) =>
          c.id === colorId ? { ...c, name } : c,
        ),
      },
    }));
  };

  const initializeMatrixFromOrder = (order) => {
    if (!order?.order_model?.sizes) {
      initializeMatrix(order.id);
      return;
    }

    // Extract unique sizes and colors from order sizes
    const uniqueSizes = [
      ...new Map(
        order.order_model.sizes.map((s) => [
          s.size_name,
          { id: uid(), name: s.size_name },
        ]),
      ).values(),
    ];
    const uniqueColors = [
      ...new Map(
        order.order_model.sizes.map((s) => [
          s.color_name,
          { id: uid(), name: s.color_name },
        ]),
      ).values(),
    ];

    // Build quantities matrix
    const quantities = {};
    order.order_model.sizes.forEach((size) => {
      const sizeObj = uniqueSizes.find((s) => s.name === size.size_name);
      const colorObj = uniqueColors.find((c) => c.name === size.color_name);
      if (sizeObj && colorObj) {
        const key = `${sizeObj.id}-${colorObj.id}`;
        quantities[key] = size.quantity;
      }
    });

    setMatrices((prev) => ({
      ...prev,
      [order.id]: {
        sizes: uniqueSizes,
        colors: uniqueColors,
        quantities: quantities,
      },
    }));
  };

  // Generate consistent color for group keys
  const getGroupColor = (groupKey) => {
    if (!groupKey) return "bg-white";

    const colors = [
      "bg-red-100",
      "bg-blue-100",
      "bg-green-100",
      "bg-yellow-100",
      "bg-purple-100",
      "bg-pink-100",
      "bg-indigo-100",
      "bg-orange-100",
      "bg-teal-100",
      "bg-cyan-100",
    ];

    // Generate hash from group key to get consistent color
    let hash = 0;
    for (let i = 0; i < groupKey.length; i++) {
      hash = groupKey.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const getOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("packageMaster/orders");
      setOrders(res?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const text = searchText.toLowerCase();

    return orders?.filter((order) => {
      const name = order?.name?.toLowerCase() || "";
      const quantity = String(order?.quantity || "");
      const year = String(order?.season_year || "");
      const season = order?.season_type === "winter" ? "qish" : "bahor";

      const submodels =
        order?.order_model?.submodels
          ?.map((s) => s?.submodel?.name?.toLowerCase())
          ?.join(" ") || "";

      return (
        name.includes(text) ||
        quantity.includes(text) ||
        year.includes(text) ||
        season.includes(text) ||
        submodels.includes(text)
      );
    });
  }, [orders, searchText]);

  const handleSelect = (order) => {
    const newItem = { ...order, shipped_quantity: order.quantity };
    setItems((prev) => [...prev, newItem]);
    initializeMatrixFromOrder(order);
    setOpen(false);
  };

  const handleSubmit = async () => {
    // check shipped_quantity
    const hasInvalidQuantity = items.some(
      (item) => item.shipped_quantity > item.quantity,
    );
    if (hasInvalidQuantity) {
      toast({
        title: "Xatolik",
        description:
          "Yetkazilgan soni buyurtma sonidan katta bo'lishi mumkin emas!",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }

    // check driver details
    if (!form.driver_name || !form.driver_phone || !form.vehicle_number) {
      toast({
        title: "Xatolik",
        description:
          "Driver ismi, telefon raqami va mashina raqamini kiriting!",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((item) => {
          const matrix = matrices[item.id] || {
            sizes: [],
            colors: [],
            quantities: {},
          };
          const packages = [];

          matrix.sizes.forEach((size) => {
            matrix.colors.forEach((color) => {
              const key = `${size.id}-${color.id}`;
              const qty = Number(matrix.quantities[key] || 0);

              if (size.name && color.name && qty > 0) {
                packages.push({
                  color_name: color.name,
                  size_name: size.name,
                  qty: qty,
                  capacity: Math.ceil(qty / 10), // Default capacity calculation
                });
              }
            });
          });

          return {
            order_id: item.id,
            planned_qty: item.quantity,
            shipped_qty: item.shipped_quantity,
            group_key: item.group_key || null,
            packages: packages.length > 0 ? packages : undefined,
          };
        }),
      };

      await api.post("trucks", payload);
      toast({
        title: "Muvaffaqiyat",
        description: "Truck muvaffaqiyatli qo'shildi!",
      });
      setItems([]);
      setMatrices({});
      setForm({
        vehicle_number: "",
        driver_name: "",
        driver_phone: "",
        comment: "",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Truck qo'shishda xatolik yuz berdi!",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[90vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Truck form */}
        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
          <div className="font-semibold text-lg">🚚 Truck ma'lumotlari</div>

          <div className="grid md:grid-cols-2 gap-3">
            <Input
              placeholder="Transport raqami"
              value={form.vehicle_number}
              onChange={(e) =>
                setForm({ ...form, vehicle_number: e.target.value })
              }
            />
            <Input
              placeholder="Haydovchi ismi"
              value={form.driver_name}
              onChange={(e) =>
                setForm({ ...form, driver_name: e.target.value })
              }
            />
            <Input
              placeholder="Haydovchi telefon"
              value={form.driver_phone}
              onChange={(e) =>
                setForm({ ...form, driver_phone: e.target.value })
              }
            />
            <Input
              placeholder="Izoh"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg">&#128233; Buyurtmalar</div>
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Qo'shish
            </Button>
          </div>

          {items.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Jami soni:{" "}
                {formatNumber(
                  items.reduce(
                    (sum, item) => sum + (item.shipped_quantity || 0),
                    0,
                  ),
                )}{" "}
                ta
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {items?.map((item, index) => (
            <div
              key={index}
              className={`shadow-md relative p-2 ${getGroupColor(item.group_key)}`}
            >
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
                className="absolute top-2 right-2"
              >
                <X />
              </Button>
              <div className="space-y-2">
                <div className="font-medium text-sm">{item?.name}</div>

                <div className="text-xs text-gray-500">
                  Buyurtma soni: {item?.quantity} ta{" "}
                  {item?.order_model?.submodels[0]?.submodel?.name}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">
                    Yetkazilgan soni:
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={item.shipped_quantity || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setItems((prev) =>
                        prev.map((i, iIndex) =>
                          iIndex === index
                            ? { ...i, shipped_quantity: value }
                            : i,
                        ),
                      );
                    }}
                    className="w-20 h-6 text-xs bg-white"
                  />
                  <span className="text-xs text-gray-500">
                    / {item.quantity} ta
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Group kaliti:</label>
                  <Input
                    placeholder="Kalit"
                    value={item.group_key || ""}
                    onChange={(e) => {
                      setItems((prev) =>
                        prev.map((i, iIndex) =>
                          iIndex === index
                            ? { ...i, group_key: e.target.value }
                            : i,
                        ),
                      );
                    }}
                    className="w-32 h-6 text-xs bg-white"
                  />
                </div>

                {/* Size and Color Matrix */}
                {matrices[item.id] && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        onClick={() => addSize(item.id)}
                        className="text-xs bg-blue-500 hover:bg-blue-600"
                      >
                        <Plus className="w-3 h-3 mr-1" /> O'lcham
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addColor(item.id)}
                        className="text-xs bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Rang
                      </Button>
                    </div>

                    {matrices[item.id].sizes.length > 0 &&
                      matrices[item.id].colors.length > 0 && (
                        <div className="overflow-auto rounded border border-gray-200">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2 font-semibold">
                                  O'lcham/Rang
                                </th>
                                {matrices[item.id].colors.map((color) => (
                                  <th key={color.id} className="border p-1">
                                    <div className="flex gap-1">
                                      <Input
                                        value={color.name}
                                        placeholder="Rang"
                                        className="w-16 h-5 text-xs"
                                        onChange={(e) =>
                                          updateColorName(
                                            item.id,
                                            color.id,
                                            e.target.value,
                                          )
                                        }
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                          deleteColor(item.id, color.id)
                                        }
                                        className="w-5 h-5 text-red-500"
                                      >
                                        <Trash2 size={10} />
                                      </Button>
                                    </div>
                                  </th>
                                ))}
                                <th className="border p-1 bg-blue-50 font-bold">
                                  Jami
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {matrices[item.id].sizes.map((size) => {
                                const rowTotal = matrices[
                                  item.id
                                ].colors.reduce((sum, color) => {
                                  const key = `${size.id}-${color.id}`;
                                  return (
                                    sum +
                                    Number(
                                      matrices[item.id].quantities[key] || 0,
                                    )
                                  );
                                }, 0);

                                return (
                                  <tr key={size.id}>
                                    <td className="border p-1">
                                      <div className="flex gap-1">
                                        <Input
                                          value={size.name}
                                          placeholder="O'lcham"
                                          className="w-16 h-5 text-xs"
                                          onChange={(e) =>
                                            updateSizeName(
                                              item.id,
                                              size.id,
                                              e.target.value,
                                            )
                                          }
                                        />
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() =>
                                            deleteSize(item.id, size.id)
                                          }
                                          className="w-5 h-5"
                                        >
                                          <Trash2 size={10} />
                                        </Button>
                                      </div>
                                    </td>
                                    {matrices[item.id].colors.map((color) => {
                                      const key = `${size.id}-${color.id}`;
                                      return (
                                        <td
                                          key={color.id}
                                          className="border p-1"
                                        >
                                          <Input
                                            type="number"
                                            className="w-12 h-5 text-xs"
                                            value={
                                              matrices[item.id].quantities[
                                                key
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              updateQty(
                                                item.id,
                                                size.id,
                                                color.id,
                                                e.target.value,
                                              )
                                            }
                                          />
                                        </td>
                                      );
                                    })}
                                    <td className="border p-1 bg-blue-50 font-bold text-center">
                                      {rowTotal}
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr>
                                <td className="border p-1 bg-gray-100 font-bold text-center">
                                  Jami
                                </td>
                                {matrices[item.id].colors.map((color) => {
                                  const columnTotal = matrices[
                                    item.id
                                  ].sizes.reduce((sum, size) => {
                                    const key = `${size.id}-${color.id}`;
                                    return (
                                      sum +
                                      Number(
                                        matrices[item.id].quantities[key] || 0,
                                      )
                                    );
                                  }, 0);
                                  return (
                                    <td
                                      key={color.id}
                                      className="border p-1 bg-gray-100 font-bold text-center"
                                    >
                                      {columnTotal}
                                    </td>
                                  );
                                })}
                                <td className="border p-1 bg-gray-200 font-bold text-center">
                                  {matrices[item.id].sizes.reduce(
                                    (grandTotal, size) =>
                                      grandTotal +
                                      matrices[item.id].colors.reduce(
                                        (rowTotal, color) => {
                                          const key = `${size.id}-${color.id}`;
                                          return (
                                            rowTotal +
                                            Number(
                                              matrices[item.id].quantities[
                                                key
                                              ] || 0,
                                            )
                                          );
                                        },
                                        0,
                                      ),
                                    0,
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                  </div>
                )}

                <div
                  className={`${statuses[item.status]?.color} text-white text-[10px] px-2 py-1 rounded-full w-fit`}
                >
                  {statuses[item.status]?.text}
                </div>
                <div className="text-xs">
                  {item?.season_type === "winter" ? (
                    <div className="text-blue-500 flex items-center gap-1">
                      <Snowflake size={12} />
                      {item?.season_year}
                    </div>
                  ) : (
                    <div className="text-green-500 flex items-center gap-1">
                      <TreePalm size={12} />
                      {item?.season_year}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {items?.length > 0 && (
            <Button
              className="mt-4"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCheck />
              )}{" "}
              Saqlash
            </Button>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buyurtmani tanlang</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Qidirish (nomi, model, soni, mavsum...)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* List */}
          <div className="grid gap-3 max-h-[60vh] overflow-auto pr-1">
            {filteredOrders?.length === 0 && (
              <div className="text-center text-gray-400 py-6">
                Hech narsa topilmadi 😕
              </div>
            )}

            {filteredOrders?.map((order) => {
              const submodels =
                order?.order_model?.submodels
                  ?.map((s) => s?.submodel?.name)
                  ?.join(", ") || "-";

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    if (!items.some((item) => item.id === order.id)) {
                      handleSelect(order);
                    }
                  }}
                  disabled={items.some((item) => item.id === order.id)}
                  className={`cursor-pointer border rounded-xl p-3 hover:shadow-md hover:border-primary transition ${
                    items.some((item) => item.id === order.id)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{order?.name}</div>

                      <div className="text-xs text-gray-500">
                        {order?.quantity} ta • {submodels}
                      </div>

                      <div
                        className={`${statuses[order.status]?.color} text-white text-[10px] px-2 py-1 rounded-full w-fit`}
                      >
                        {statuses[order.status]?.text}
                      </div>
                    </div>

                    {/* Season */}
                    <div className="text-xs">
                      {order?.season_type === "winter" ? (
                        <div className="text-blue-500 flex items-center gap-1">
                          <Snowflake size={12} />
                          {order?.season_year}
                        </div>
                      ) : (
                        <div className="text-green-500 flex items-center gap-1">
                          <TreePalm size={12} />
                          {order?.season_year}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Add;

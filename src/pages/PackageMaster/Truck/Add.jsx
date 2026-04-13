import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Snowflake, TreePalm, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { statuses } from "@/lib/status";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Add = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: "",
    driver_name: "",
    driver_phone: "",
    comment: "",
  });
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

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

  // 🔍 Kuchli filter
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
    setItems((prev) => [...prev, order]);
    setOpen(false);
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
            <div className="font-semibold text-lg">📦 Buyurtmalar</div>
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Qo'shish
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {items?.map((item, index) => (
            <div key={index} className="bg-white shadow-md relative p-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
                className="absolute top-2 right-2"
              >
                <X />
              </Button>
              <div className="space-y-1">
                <div className="font-medium text-sm">{item?.name}</div>

                <div className="text-xs text-gray-500">
                  {item?.quantity} ta •{" "}
                  {item?.order_model?.submodels[0]?.submodel?.name}
                </div>

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

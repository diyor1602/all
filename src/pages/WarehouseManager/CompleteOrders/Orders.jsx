import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import formatNumber from "@/utils/formatNumber";

const formatTime = (time) => {
  const date = new Date(time);
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Orders = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [search, setSearch] = useState(
    () => localStorage.getItem("orders-search") || "",
  );
  const [status, setStatus] = useState(
    () => localStorage.getItem("orders-status") || "all",
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/v1/warehouseManager/orders");
      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ma'lumotlar olishda xatolik yuz berish mumkin",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompleteOrder = async () => {
    setSubmitting(true);
    try {
      await api.post("/v1/warehouseManager/completeOrders", {
        order_id: selectedItem?.id,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: `Buyurtma statusi ${
          selectedItem?.warehouse_complete_order ? "bajarilmadi" : "bajarildi"
        }ga o'tkazildi`,
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
        position: "bottom-right",
      });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Buyurtma bajarishda xatolik yuz berish mumkin",
        duration: 1200,
        position: "bottom-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = data?.filter((item) => {
    const matchesStatus =
      status === "all" ||
      (status === "completed" && item?.warehouse_complete_order) ||
      (status === "not_completed" && !item?.warehouse_complete_order);

    const searchLower = search.toLowerCase();

    const matchesSearch =
      item.id.toString().includes(searchLower) ||
      item.name.toLowerCase().includes(searchLower) ||
      item.order_model?.submodels
        ?.map((s) => s?.submodel?.name)
        .join(", ")
        .toLowerCase()
        .includes(searchLower) ||
      item.quantity.toString().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <div className="font-bold mb-2">
        Buyurtmalar ({filteredData?.length}) (
        {formatNumber(
          filteredData?.reduce((acc, item) => acc + item?.quantity, 0),
        )}{" "}
        ta)
      </div>
      <div className="flex gap-2 flex-col">
        <Input
          placeholder="Qidirish..."
          value={search}
          className="bg-white"
          onChange={(e) => {
            setSearch(e.target.value);
            localStorage.setItem("orders-search", e.target.value);
          }}
        />

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            localStorage.setItem("orders-status", value);
          }}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Statusni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="completed">Bajarildi</SelectItem>
            <SelectItem value="not_completed">Bajarilmadi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 size={40} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {filteredData
            ?.sort((a, b) => b.id - a.id)
            ?.map((item) => {
              const complete = item?.warehouse_complete_order;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "border rounded-lg p-4 transition-all duration-200 hover:shadow-sm",
                    complete
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200",
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">#{item.id}</div>
                      <div className="text-gray-900 font-medium">
                        {item.name}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDialogOpen(true);
                      }}
                      className={cn(
                        "transition-colors",
                        complete
                          ? "hover:bg-red-100 hover:border-red-300"
                          : "hover:bg-green-100 hover:border-green-300",
                      )}
                    >
                      {complete ? <X size={16} /> : <Check size={16} />}
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-gray-600">
                      <span className="font-medium">Modellar:</span>{" "}
                      {item.order_model?.submodels
                        ?.map((submodel) => submodel?.submodel?.name)
                        .join(", ")}
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Miqdor:</span>
                      <span className="font-medium">{item.quantity}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Mavsum:</span>
                      <span className="font-medium">
                        {item.season_year}{" "}
                        {item.season_type === "winter" ? "Qish" : "Bahor"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={cn(
                          "font-medium",
                          complete ? "text-green-700" : "text-red-700",
                        )}
                      >
                        {complete ? "Bajarildi" : "Bajarilmadi"}
                      </span>
                    </div>

                    {complete && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          {formatTime(
                            item?.warehouse_complete_order?.created_at,
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Buyurtmani{" "}
              <span className="font-bold">
                {selectedItem?.warehouse_complete_order
                  ? "bajarilmadi"
                  : "bajarildi"}
              </span>
              ga o'tkazishga rozimisiz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-center justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCompleteOrder} disabled={submitting}>
              {submitting ? "Tasdiqlanmoqda..." : "Tasdiqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Orders;

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

const CompleteOrders = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/warehouseManager/orders");
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
      await api.post("/warehouseManager/completeOrders", {
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
      <div className="font-bold mb-2">Buyurtmalar ({filteredData?.length})</div>
      <div className="flex gap-2 flex-col">
        <Input
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
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
                    "p-2",
                    complete ? "bg-green-100" : "bg-red-100"
                  )}
                >
                  <div>{item.id}</div>
                  <div>{item.name}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDialogOpen(true);
                    }}
                  >
                    {complete ? <X /> : <Check />}
                  </Button>
                  <div>
                    {item.order_model?.submodels
                      ?.map((submodel) => submodel?.submodel?.name)
                      .join(", ")}
                  </div>
                  <div>{item.quantity}</div>
                  <div>
                    {item.season_year}{" "}
                    {item.season_type === "winter" ? "Qish" : "Bahor"}
                  </div>
                  <div>{complete ? "Bajarildi" : "Bajarilmadi"}</div>
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

export default CompleteOrders;

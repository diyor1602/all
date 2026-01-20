import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (order?.status !== "active")
    return <div>Buyurtma Aktiv statusida emas!</div>;

  return (
    <div>
      <div>ID: {order?.id}</div>
      <div>Deadline: {formatDate(order?.deadline)}</div>
      <div>Izoh: {order?.comment}</div>
      <div className="flex flex-col gap-2 mt-2">
        {order?.items?.map((item, index) => (
          <div key={index} className="bg-white ">
            <div>{item.item?.name}</div>
            <div>
              {item.quantity} {item.item?.unit?.name}
            </div>
            <div>{item.item?.color?.name}</div>
            {item?.item?.image && <img src={item?.item?.image} alt="" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderView;

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { statuses } from "@/lib/status";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/qualityController/orders");
      setOrders(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders?.map((order, i) => (
        <div key={i} className="flex flex-col gap-2 bg-white p-4 rounded-md">
          <div>ID: {order.id}</div>
          <div>Status: {statuses[order.status]?.text}</div>
          <div>Nomi: {order.name}</div>
          <div>Miqdori: {order.quantity} ta</div>
          <div>Boshlanish: {formatDate(order.start_date)}</div>
          <div>Tugash: {formatDate(order.end_date)}</div>
          <div>Model: {order.order_model?.model?.name}</div>
          <div>Material: {order.order_model?.material?.name || "-"}</div>
          <div className="flex flex-wrap gap-2">
            {order.order_model?.sizes?.map((size, i) => (
              <div key={i} className="bg-gray-100 p-2 rounded-md">
                {size.size.name}{" "}
                <span className="text-sm text-gray-500">
                  {size.quantity} ta
                </span>
              </div>
            ))}
          </div>
          <div>Submodel: {order.order_model?.submodels[0]?.submodel?.name}</div>
          <div>
            Tikkan gurux: {order.order_model?.submodels[0]?.group?.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Orders;

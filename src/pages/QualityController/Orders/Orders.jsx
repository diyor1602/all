import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { statuses } from "@/lib/status";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredOrders = orders.filter((order) => {
    const searchStr = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(searchStr) ||
      order.name.toLowerCase().includes(searchStr) ||
      order.order_model?.model?.name.toLowerCase().includes(searchStr) ||
      (order.order_model?.material?.name || "")
        .toLowerCase()
        .includes(searchStr) ||
      order.order_model?.sub_models[0]?.submodel?.name
        .toLowerCase()
        .includes(searchStr)
    );
  });

  const OrderSkeleton = () => (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-lg border shadow-sm animate-pulse">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
      <div className="flex flex-wrap gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto space-y-6">
      <div className="sticky top-0 z-10 py-4">
        <div className="relative bg-white rounded-md">
          <Search
            className="absolute left-3 top-2.5 text-muted-foreground"
            size={15}
          />
          <Input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order, i) => (
            <Link
              to={`/qualityController/orders/${order.id}`}
              key={i}
              className="flex flex-col gap-3 bg-white p-5 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="text-sm text-muted-foreground">
                  ID: {order.id}
                </div>
                <div className="px-2.5 py-0.5 rounded-full text-sm bg-primary/10 text-primary">
                  {statuses[order.status]?.text}
                </div>
              </div>

              <div className="border-b pb-3">
                <div className="text-lg font-semibold text-primary">
                  {order.order_model?.sub_models[0]?.submodel?.name ||
                    "No Submodel"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Nomi: {order.name}</div>
                <div className="font-medium">
                  Miqdori: {order.quantity} dona
                </div>
                <div className="font-medium">
                  Model: {order.order_model?.model?.name}
                </div>{" "}
                <div className="font-medium">
                  O'tgan: {order.good_count} dona
                </div>{" "}
                <div className="font-medium">
                  Miqdori: {order.quantity} dona
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

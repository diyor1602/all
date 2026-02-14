import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { statuses } from "@/lib/status";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    localStorage.getItem("otkSearchQuery") || "",
  );

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

  const filteredOrders = orders
    .filter((order) => {
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
    })
    .sort((a, b) => {
      const getProgress = (order) => {
        return order.quantity > 0
          ? (order.good_final_count / order.quantity) * 100
          : 0;
      };

      const progressA = getProgress(a);
      const progressB = getProgress(b);

      // Orders with progress > 0 and < 100 come first
      const aInProgress = progressA > 0 && progressA < 100;
      const bInProgress = progressB > 0 && progressB < 100;

      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;

      // Within the same group, sort by progress (descending)
      return progressB - progressA;
    });

  const OrderSkeleton = () => (
    <div className="flex flex-col gap-3 bg-white p-5 rounded-xl border shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="border-b pb-3">
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        <Skeleton className="h-2 w-full" />
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              localStorage.setItem("otkSearchQuery", e.target.value);
            }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order, i) => {
            const progressPercentage =
              order.quantity > 0
                ? (order.good_count / order.quantity) * 100
                : 0;
            const isCompleted = progressPercentage >= 100;

            return (
              <div
                key={i}
                className="flex flex-col gap-4 bg-white p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono text-muted-foreground">
                      #{order.id}
                    </span>
                  </div>
                  <Badge
                    variant={isCompleted ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {statuses[order.status]?.text}
                  </Badge>
                </div>

                <div className="border-b pb-3">
                  <h3 className="text-lg font-semibold text-primary">
                    {order.order_model?.sub_models[0]?.submodel?.name ||
                      "No Submodel"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.order_model?.model?.name}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Nomi:
                    </span>
                    <span className="text-sm font-medium">{order.name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Jami miqdor:
                    </span>
                    <span className="text-sm font-semibold">
                      {order.quantity} dona
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Intermediate Progress */}
                    <div className="flex flex-col items-center gap-2">
                      <CircularProgress
                        value={
                          order.quantity > 0
                            ? ((order?.good_intermediate_count || 0) /
                                order.quantity) *
                              100
                            : 0
                        }
                        size={55}
                        strokeWidth={3}
                      />
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Astar
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order?.good_intermediate_count || 0}/{order.quantity}
                        </div>
                      </div>
                    </div>

                    {/* Body Progress */}
                    <div className="flex flex-col items-center gap-2">
                      <CircularProgress
                        value={
                          order.quantity > 0
                            ? ((order?.good_body_count || 0) / order.quantity) *
                              100
                            : 0
                        }
                        size={55}
                        strokeWidth={3}
                      />
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tana
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order?.good_body_count || 0}/{order.quantity}
                        </div>
                      </div>
                    </div>

                    {/* Final Progress */}
                    <div className="flex flex-col items-center gap-2">
                      <CircularProgress
                        value={
                          order.quantity > 0
                            ? ((order?.good_final_count || 0) /
                                order.quantity) *
                              100
                            : 0
                        }
                        size={55}
                        strokeWidth={3}
                      />
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Finish
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order?.good_final_count || 0}/{order.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to={`/qualityController/orders/${order.id}`}>
                    <Button className="w-full" size="sm">
                      BOSHLASH
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;

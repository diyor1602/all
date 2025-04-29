import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { statuses } from "@/lib/status";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Search,
  Package,
  Hash,
  Box,
  Ruler,
  Layers,
  PaintBucket,
  PackageOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Orders = () => {
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/packageMaster/orders");
      setOrders(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response.data.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      order.order_model?.model?.name?.toLowerCase().includes(searchLower) ||
      order.order_model?.material?.name?.toLowerCase().includes(searchLower) ||
      order.order_model?.submodels?.some((submodel) =>
        submodel.submodel?.name?.toLowerCase().includes(searchLower)
      )
    );
  });

  const OrderSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buyurtmalarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
      >
        {loading ? (
          Array(6)
            .fill(0)
            .map((_, i) => <OrderSkeleton key={i} />)
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order, i) => (
            <motion.div key={i} variants={item}>
              <Link
                to={`/packageMaster/order/view/${order.id}`}
                className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transform transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <Hash className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      #{order.id}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      statuses[order.status]?.secondaryBg || "bg-gray-50"
                    } ${
                      statuses[order.status]?.textColor || "text-gray-700"
                    } border ${
                      statuses[order.status]?.border || "border-gray-200"
                    }`}
                  >
                    {statuses[order.status]?.text || "Noma'lum"}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{order.name}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Box className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Miqdori:{" "}
                      <span className="font-medium text-gray-900">
                        {order.quantity}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Layers className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Model:{" "}
                      <span className="font-medium text-gray-900">
                        {order.order_model?.model?.name}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <PaintBucket className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Material:{" "}
                      <span className="font-medium text-gray-900">
                        {order.order_model?.material?.name || "-"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Box className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <span className="text-gray-600">Submodellar:</span>
                      <div className="font-medium text-gray-900 mt-1">
                        {order.order_model?.submodels
                          ?.map((submodel) => submodel.submodel?.name)
                          .join(", ") || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Ruler className="text-gray-400" size={16} />
                      <span className="text-gray-600">O'lchamlar:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center pt-1">
                      {order.order_model?.sizes?.map((size) => (
                        <div
                          key={size.id}
                          className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-sm"
                        >
                          <span className="font-medium text-gray-900">
                            {size.size?.name}
                          </span>
                          <span className="text-gray-500 ml-1">
                            ({size?.quantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PackageOpen className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Buyurtmalar topilmadi
              </h3>
              <p className="text-gray-500">
                Hozircha hech qanday buyurtma mavjud emas.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Orders;

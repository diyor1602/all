import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { statuses } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import {
  Box,
  Calendar,
  ChevronRight,
  Package,
  Tag,
  Search,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Orders = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/constructor/orders", {
        params: {
          planned_time: selectedDate,
        },
      });
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = orders.filter(
        (order) =>
          order.name?.toLowerCase().includes(lowercaseQuery) ||
          order.id?.toString().includes(lowercaseQuery) ||
          order.quantity?.toString().includes(lowercaseQuery) ||
          order.orderModel?.model?.name
            ?.toLowerCase()
            .includes(lowercaseQuery) ||
          order.orderModel?.material?.name
            ?.toLowerCase()
            .includes(lowercaseQuery)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const navigateDay = (direction) => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);

    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }

    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Buyurtmalar ({filteredOrders?.length})
          </h1>
        </div>

        {/* Date navigation and search controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay("prev")}
              className="rounded-lg h-10 w-10 flex items-center justify-center bg-white border-gray-200 hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </Button>

            <div className="relative flex-grow">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="pl-10 h-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay("next")}
              className="rounded-lg h-10 w-10 flex items-center justify-center bg-white border-gray-200 hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            />
            <Input
              type="text"
              placeholder="Buyurtmalarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-xl overflow-hidden border border-gray-200 shadow-md"
            >
              <Skeleton className="h-2 w-full" />
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <Skeleton className="h-12 w-full mb-4 rounded-lg" />
                <Skeleton className="h-12 w-full mb-4 rounded-lg" />
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-10 w-28 rounded-full" />
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
                <Skeleton className="h-12 w-full mb-5 rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
          <div className="text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600">
              Buyurtmalar mavjud emas
            </h3>
            <p className="text-gray-500 mt-2">
              Bu sana uchun buyurtmalar topilmadi
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <motion.div key={order.id} variants={item} whileHover={{ y: -5 }}>
              <Card className="overflow-hidden rounded-xl hover:shadow-xl transition-all duration-300 border-gray-200 shadow-md max-w-md bg-white">
                {/* Status indicator with gradient */}
                <div className={`h-2 ${statuses[order.status]?.color}`} />

                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className={`flex items-center gap-2 ${
                        statuses[order?.status]?.secondaryBg
                      } px-3 py-1.5 rounded-lg`}
                    >
                      <Tag
                        size={16}
                        className={statuses[order?.status]?.textColor}
                      />
                      <span
                        className={`${
                          statuses[order?.status]?.textColor
                        } font-bold`}
                      >
                        #{order?.id}
                      </span>
                    </div>

                    <Badge
                      className={`${
                        statuses[order?.status]?.color
                      } px-3 py-1 font-medium rounded-full shadow-sm hover:${
                        statuses[order?.status]?.color
                      } hover:opacity-90`}
                    >
                      {statuses[order?.status]?.text || "Unknown"}
                    </Badge>
                  </div>

                  {/* Order name with subtle background */}
                  <div
                    className={`${
                      statuses[order?.status]?.border
                    } mb-4 bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border-l-4`}
                  >
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                      {order?.name}
                    </h3>
                  </div>
                  <div
                    className={`${
                      statuses[order?.status]?.border
                    } mb-4 bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border-l-4`}
                  >
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                      {order?.orderModel?.material?.name}
                    </h3>
                  </div>

                  {/* Quantity with highlight - CHANGED FROM BLUE TO PURPLE */}
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className={`flex items-center gap-2 ${
                        statuses[order?.status]?.secondaryBg
                      } px-4 py-2 rounded-full`}
                    >
                      <Package
                        size={18}
                        className={statuses[order?.status]?.textColor}
                      />
                      <span
                        className={`${
                          statuses[order?.status]?.textColor
                        } font-bold text-lg`}
                      >
                        {order?.quantity}
                      </span>
                      <span
                        className={`${
                          statuses[order?.status]?.textColor
                        } text-lg`}
                      >
                        ta
                      </span>
                    </div>

                    {/* Model pill */}
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 flex items-center gap-1.5"
                    >
                      <Box size={14} className="text-gray-500" />
                      {order.orderModel?.model?.name}
                    </Badge>
                  </div>

                  {/* Date range with card effect */}
                  <div className="flex mb-5 p-3 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 w-full">
                      <Calendar size={16} className="text-gray-500" />
                      <div className="flex justify-between w-full text-sm">
                        <span className="text-gray-700 font-medium">
                          {formatDate(order.start_date)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-700 font-medium">
                          {formatDate(order.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Button with gradient */}
                  <Button
                    className={`w-full mt-2 gap-2 text-white shadow-md py-6 rounded-lg font-medium ${
                      statuses[order.status]?.color
                    } hover:opacity-90 hover:${statuses[order.status]?.color}`}
                    onClick={() => navigate(`/technologist/orders/${order.id}`)}
                  >
                    Batafsil
                    <ChevronRight size={18} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

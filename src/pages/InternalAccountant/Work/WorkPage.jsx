import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  AlertCircle,
  Tag,
  Box,
  Calendar,
  ChevronRight,
  CirclePlus,
} from "lucide-react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { statuses } from "@/lib/status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
  },
};

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

const getStatusColor = (status) => {
  return statuses[status]?.color || "bg-gray-100 text-gray-800 border-gray-300";
};

const WorkPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/internalAccountant/orders");
      setOrders(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtmalar ro'yxati olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        order?.id.toString().includes(searchTerm) ||
        order?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order?.quantity?.toString().includes(searchTerm) ||
        order?.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order?.order_model?.model?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "quantity-high") return b.quantity - a.quantity;
      if (sortBy === "quantity-low") return a.quantity - b.quantity;
      return 0;
    });

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div>Buyurtmalar</div>
            <Badge className="text-sm">
              <div className="flex items-center gap-1">
                <span>{filteredOrders.length}</span> <span>ta</span>
              </div>
            </Badge>
          </div>

          <div className="flex flex-col gap-2 w-full md:flex-row md:w-auto">
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Qidiruv..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Holati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {Object.entries(statuses).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Eng yangi</SelectItem>
                <SelectItem value="oldest">Eng eski</SelectItem>
                <SelectItem value="quantity-high">Eng ko'p miqdorda</SelectItem>
                <SelectItem value="quantity-low">Eng kam miqdorda</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/internalAccountant/orders/new")}>
              <CirclePlus /> Tezkor ish qo'shish
            </Button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-sm"
        >
          <AlertCircle size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Buyurtmalar topilmadi
          </h3>
          <p className="text-gray-500">
            Qidiruv parametrlarini o'zgartiring yoki yangi buyurtma qo'shing
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredOrders.map((order) => (
            <motion.div key={order.id} variants={item} whileHover={{ y: -5 }}>
              <Card className="overflow-hidden rounded-xl hover:shadow-xl transition-all duration-300 border-gray-200 shadow-md max-w-md bg-white">
                {/* Status indicator with gradient */}
                <div
                  className={`h-2 ${
                    getStatusColor(order.status).split(" ")[0]
                  }`}
                />

                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className={`flex items-center gap-2 ${
                        statuses[order.status]?.secondaryBg
                      } px-3 py-1.5 rounded-lg`}
                    >
                      <Tag
                        size={16}
                        className={statuses[order.status]?.textColor}
                      />
                      <span
                        className={`${
                          statuses[order.status]?.textColor
                        } font-bold`}
                      >
                        #{order.id}
                      </span>
                    </div>

                    <Badge
                      className={`${getStatusColor(
                        order.status
                      )} px-3 py-1 font-medium rounded-full shadow-sm`}
                    >
                      {statuses[order.status]?.text || "Noma'lum"}
                    </Badge>
                  </div>

                  {/* Order name with subtle background */}
                  <div
                    className={`${
                      statuses[order.status]?.border
                    } mb-4 bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border-l-4`}
                  >
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                      {order.name}
                    </h3>
                  </div>

                  {/* Quantity with highlight - CHANGED FROM BLUE TO PURPLE */}
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className={`flex items-center gap-2 ${
                        statuses[order.status]?.secondaryBg
                      } px-4 py-2 rounded-full`}
                    >
                      <Package
                        size={18}
                        className={statuses[order.status]?.textColor}
                      />
                      <span
                        className={`${
                          statuses[order.status]?.textColor
                        } font-bold text-lg`}
                      >
                        {order.quantity}
                      </span>
                      <span
                        className={`${
                          statuses[order.status]?.textColor
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
                      {order.order_model?.model?.name}
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
                    className={`w-full mt-2 gap-2 text-white shadow-md py-6 rounded-lg font-medium ${getStatusColor(
                      order.status
                    )} hover:opacity-90 hover:${getStatusColor(order.status)}`}
                    onClick={() =>
                      navigate(`/internalAccountant/work/${order.id}`)
                    }
                  >
                    Batafsil
                    <ChevronRight size={18} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default WorkPage;

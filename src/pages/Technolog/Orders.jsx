import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Package, AlertCircle } from "lucide-react";
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

const getStatusColor = (status) => {
  return statuses[status]?.color || "bg-gray-100 text-gray-800 border-gray-300";
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get("/technologist/orders");
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
    fetchOrders();
  }, []);

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        order.id.toString().includes(searchTerm) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quantity.toString().includes(searchTerm) ||
        (order.order_model?.model?.name || "")
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div>Buyurtmalar</div>
            <Badge className="text-sm">{filteredOrders.length} ta</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Qidiruv..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Eng yangi</SelectItem>
                <SelectItem value="oldest">Eng eski</SelectItem>
                <SelectItem value="quantity-high">Eng ko'p miqdorda</SelectItem>
                <SelectItem value="quantity-low">Eng kam miqdorda</SelectItem>
              </SelectContent>
            </Select>
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
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => navigate(`/technologist/orders/${order?.id}`)}
              >
                <div
                  className={`h-2 ${
                    getStatusColor(order.status).split(" ")[0]
                  }`}
                />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 font-medium flex-wrap">
                      <Package className="text-primary" size={18} />
                      <span className="text-primary">#{order?.id}</span> /
                      <span className="truncate max-w-[150px]">
                        {order?.name}
                      </span>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} border`}>
                      {statuses[order?.status]?.text || "Noma'lum"}
                    </Badge>
                  </div>

                  <div className="mt-3 text-gray-600">
                    {order?.order_model?.model?.name}
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <Badge variant="outline" className="gap-1">
                      <Package size={14} /> {order?.quantity} ta
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Batafsil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Orders;

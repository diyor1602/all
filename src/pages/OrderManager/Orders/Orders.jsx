import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  AlertCircle,
  Tag,
  Box,
  Calendar,
  Eye,
  Snowflake,
  Sun,
  Edit,
} from "lucide-react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { statuses } from "@/lib/status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import formatNumber from "@/utils/formatNumber";

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
  const [searchTerm, setSearchTerm] = useState(
    localStorage.getItem("searchTerm") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    localStorage.getItem("statusFilter") || "all",
  );
  const [sortBy, setSortBy] = useState(
    localStorage.getItem("sortBy") || "newest",
  );
  const [seasonYear, setSeasonYear] = useState(
    localStorage.getItem("seasonYear") || String(new Date().getFullYear()),
  );
  const [seasonType, setSeasonType] = useState(
    localStorage.getItem("seasonType") || "all",
  );

  const [availableYears, setAvailableYears] = useState([]);

  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orderManager/orders");
      const years = response.data.map((order) => order.season_year);
      const uniqueYears = Array.from(new Set(years));
      setAvailableYears(uniqueYears);
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

  const handleStatusActive = async (id) => {
    if (orders.find((order) => order.id === id).status === "inactive") {
      if (!window.confirm("Buyurtmani aktiv qilishni tasdiqlaysizmi?")) {
        return;
      }
      try {
        await api.patch(`/orderManager/orders/change/${id}`, {
          status: "active",
        });
        toast({
          title: "Muvaffaqiyatli",
          description: "Buyurtma aktiv qilindi!",
          style: {
            backgroundColor: "green",
            color: "white",
          },
        });
        fetchOrders();
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Holat o'zgartirishda xatolik",
          variant: "destructive",
        });
      }
    } else if (orders.find((order) => order.id === id).status === "active") {
      if (!window.confirm("Buyurtmani aktiv emasga o'zgartirasizmi?")) {
        return;
      }
      try {
        await api.patch(`/orderManager/orders/change/${id}`, {
          status: "inactive",
        });
        toast({
          title: "Muvaffaqiyatli",
          description: "Buyurtma statusi aktiv emasga o'zgartirildi!",
          style: {
            backgroundColor: "green",
            color: "white",
          },
        });
        fetchOrders();
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Holat o'zgartirishda xatolik",
          variant: "destructive",
        });
      }
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        searchTerm === "" ||
        order?.id.toString().includes(searchTerm) ||
        order?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order?.quantity?.toString().includes(searchTerm) ||
        order?.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order?.order_model?.model?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesSeasonYear =
        seasonYear === "all" || String(order.season_year) === seasonYear;

      const matchesSeasonType =
        seasonType === "all" || order.season_type === seasonType;

      return (
        matchesSearch && matchesStatus && matchesSeasonYear && matchesSeasonType
      );
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
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
              <div className="grid grid-cols-9 gap-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20 mx-auto" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16 mx-auto" />
                <Skeleton className="h-6 w-16 mx-auto" />
                <Skeleton className="h-6 w-20 mx-auto" />
                <Skeleton className="h-6 w-20 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div>Buyurtmalar</div>
            <Badge className="text-sm">
              <div className="flex items-center gap-1">
                <span>{filteredOrders.length}</span> <span>ta</span>
                <span>
                  {filteredOrders?.reduce(
                    (acc, order) => acc + order.quantity,
                    0,
                  )}
                </span>
              </div>
            </Badge>
          </div>

          <div className="flex flex-col gap-2 w-full md:flex-row md:w-auto flex-wrap">
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Qidiruv..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  localStorage.setItem("searchTerm", e.target.value);
                }}
                className="pl-8 w-full md:w-64 bg-white"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                localStorage.setItem("statusFilter", value);
              }}
            >
              <SelectTrigger className="w-full md:w-40 bg-white">
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

            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value);
                localStorage.setItem("sortBy", value);
              }}
            >
              <SelectTrigger className="w-full md:w-40 bg-white">
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Eng yangi</SelectItem>
                <SelectItem value="oldest">Eng eski</SelectItem>
                <SelectItem value="quantity-high">Eng ko'p miqdorda</SelectItem>
                <SelectItem value="quantity-low">Eng kam miqdorda</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={seasonYear}
              onValueChange={(value) => {
                setSeasonYear(value);
                localStorage.setItem("seasonYear", value);
              }}
            >
              <SelectTrigger className="w-full md:w-40 bg-white">
                <SelectValue placeholder="Yil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={seasonType}
              onValueChange={(value) => {
                setSeasonType(value);
                localStorage.setItem("seasonType", value);
              }}
            >
              <SelectTrigger className="w-full md:w-40 bg-white">
                <SelectValue placeholder="Mavsum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="winter">Qish</SelectItem>
                <SelectItem value="summer">Bahor</SelectItem>
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
          <p className="text-gray-500">Qidiruv parametrlarini o'zgartiring</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <Table className="bg-white rounded-lg shadow-sm text-xs">
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="w-48">Nomi</TableHead>
                <TableHead className="w-24 text-center">Miqdor</TableHead>
                <TableHead className="w-24 text-center">Narx</TableHead>
                <TableHead className="w-32">Model</TableHead>
                <TableHead className="w-32">Submodel</TableHead>
                <TableHead className="w-24 text-center">Yil</TableHead>
                <TableHead className="w-24 text-center">Mavsum</TableHead>
                <TableHead className="w-32 text-center">Holati</TableHead>
                <TableHead className="w-32 text-center">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders
                .sort(
                  // show the price = 0 in the top
                  (a, b) => {
                    if (a.price === 0 && b.price !== 0) return -1;
                    if (a.price !== 0 && b.price === 0) return 1;
                    return 0;
                  },
                )
                ?.map((order) => (
                  <motion.tr
                    key={order.id}
                    variants={item}
                    whileHover={{ scale: 1.01 }}
                    className="border-b hover:bg-gray-50 transition-all duration-100 ease-in-out"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-gray-500" />
                        <span className="font-bold">#{order.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`p-2 rounded border-l-4 ${statuses[order.status]?.border} bg-gradient-to-r from-gray-50 to-white`}
                      >
                        <span className="font-medium text-gray-800">
                          {order.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className={`flex items-center justify-center gap-1 ${statuses[order.status]?.secondaryBg} px-3 py-1.5 rounded-full`}
                      >
                        <Package
                          size={12}
                          className={statuses[order.status]?.textColor}
                        />
                        <span
                          className={`font-bold ${statuses[order.status]?.textColor}`}
                        >
                          {order.quantity}
                        </span>
                        <span className={statuses[order.status]?.textColor}>
                          ta
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(order?.price, 2)}$
                    </TableCell>
                    <TableCell>
                      <div className="bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1 w-fit whitespace-nowrap">
                        <Box size={12} className="text-gray-500" />
                        {order.order_model?.model?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.order_model?.submodels
                          ?.slice(0, 2)
                          .map((submodel) => (
                            <div
                              key={submodel.id}
                              className="bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1 text-xs whitespace-nowrap"
                            >
                              <Box size={12} className="text-gray-500" />
                              {submodel?.submodel?.name}
                            </div>
                          ))}
                        {order.order_model?.submodels?.length > 2 && (
                          <div className="border border-gray-300 px-2 py-1 rounded text-xs text-gray-600 whitespace-nowrap">
                            +{order.order_model.submodels.length - 2}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar size={12} className="text-gray-500" />
                        <span className="font-medium text-gray-700">
                          {order.season_year}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className={`px-2 py-1 rounded text-sm font-medium flex items-center justify-center gap-1 ${
                          order.season_type === "winter"
                            ? "bg-blue-100 text-blue-700"
                            : order.season_type === "summer"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.season_type === "winter" ? (
                          <>
                            <Snowflake size={14} className="text-blue-500" />{" "}
                            Qish
                          </>
                        ) : order.season_type === "summer" ? (
                          <>
                            <Sun size={14} className="text-orange-500" /> Bahor
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className={`${getStatusColor(
                          order.status,
                        )} px-3 py-1 font-medium rounded-full shadow-sm cursor-pointer hover:opacity-80 inline-block text-white whitespace-nowrap`}
                        onClick={() => handleStatusActive(order.id)}
                      >
                        {statuses[order.status]?.text || "Noma'lum"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" asChild>
                          <Link to={`/orderManager/orders/${order.id}`}>
                            <Eye size={12} className="text-blue-500" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" asChild>
                          <Link to={`/orderManager/orders/edit/${order.id}`}>
                            <Edit size={12} className="text-green-500" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Orders;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, AlertCircle, ChevronRight } from "lucide-react";
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

const getStatusColor = (status) => {
  return statuses[status]?.color || "bg-gray-100 text-gray-800 border-gray-300";
};

const OrderWithMinutes = () => {
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
      const response = await api.get("/cuttingMaster/orders");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-md" />
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
          <p className="text-gray-500">
            Qidiruv parametrlarini o'zgartiring yoki yangi buyurtma qo'shing
          </p>
        </motion.div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">ID</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="w-[120px]">Miqdor</TableHead>
                <TableHead className="w-[160px]">Mavsum</TableHead>
                <TableHead>Submodellar</TableHead>
                <TableHead className="w-[140px]">Daqiqasi</TableHead>
                <TableHead className="w-[140px]">Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const submodels = order.order_model?.submodels || [];
                const shownSubmodels = submodels.slice(0, 2);
                const extraCount = Math.max(
                  0,
                  submodels.length - shownSubmodels.length,
                );

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold text-gray-800">
                      #{order.id}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {order.name}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {order.order_model?.model?.name || "-"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {order.quantity} ta
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium">{order.season_year}</span>
                        <span className="text-xs text-gray-500">
                          {order.season_type === "winter"
                            ? "Qish"
                            : order.season_type === "summer"
                              ? "Bahor"
                              : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {shownSubmodels.map((submodel) => (
                          <Badge
                            key={submodel.id}
                            variant="outline"
                            className="bg-gray-50 text-gray-700 border-gray-200"
                          >
                            {submodel?.submodel?.name}
                          </Badge>
                        ))}
                        {extraCount > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-700 border-gray-200"
                          >
                            +{extraCount}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatNumber(order?.order_model?.minute)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(order.status)} px-3 py-1 font-medium rounded-full shadow-sm`}
                      >
                        {statuses[order.status]?.text || "Noma'lum"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default OrderWithMinutes;

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { statuses } from "@/lib/status";
import api from "@/utils/api";
import {
  Calendar,
  Clock,
  Eye,
  Filter,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [contragentFilter, setContragentFilter] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/warehouseManager/orders");
      setOrders(response.data);
      setFilteredOrders(response.data);
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

  useEffect(() => {
    let result = orders;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.contragent.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      if (statusFilter !== "all") {
        result = result.filter((order) => order.status === statusFilter);
      }
    }

    // Apply contragent filter
    if (contragentFilter) {
      if (contragentFilter !== "all") {
        result = result.filter(
          (order) => order.contragent.name === contragentFilter
        );
      }
    }

    setFilteredOrders(result);
  }, [searchTerm, statusFilter, contragentFilter, orders]);

  // Get unique contragents for filter
  const uniqueContragents = Array.from(
    new Set(orders.map((order) => order.contragent.name))
  );

  // Format date function
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("ru-RU");
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge
  const StatusBadge = ({ status }) => {
    const statusInfo = statuses[status];

    if (!statusInfo) return <Badge>Unknown</Badge>;

    return (
      <Badge
        className={`${statusInfo.secondaryBg} ${statusInfo.textColor} ${statusInfo.border} border`}
      >
        {statusInfo.text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buyurtmalar</h1>
          <p className="text-muted-foreground">
            Barcha buyurtmalar ro'yxati va ularning holati
          </p>
        </div>
        <Button onClick={fetchOrders} className="shrink-0">
          <RefreshCw className="mr-2 h-4 w-4" />
          Yangilash
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Buyurtmalar
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length} ta ko'rsatilmoqda
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jami Miqdor</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders
                .reduce((sum, order) => sum + order.quantity, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Barcha buyurtmalar miqdori
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mijozlar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueContragents.length}</div>
            <p className="text-xs text-muted-foreground">Faol mijozlar soni</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Joriy Ishlar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                orders.filter(
                  (order) =>
                    order.status !== "completed" && order.status !== "inactive"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Faol buyurtmalar soni
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrlash va Qidirish</CardTitle>
          <CardDescription>
            Buyurtmalarni nomi, mijozi yoki holati bo'yicha filtrlang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buyurtma nomi yoki mijoz bo'yicha qidirish..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter || ""}
              onValueChange={(value) => setStatusFilter(value || null)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Holat bo'yicha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {Object.keys(statuses).map((status) => (
                  <SelectItem key={status} value={status}>
                    {statuses[status].text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={contragentFilter || ""}
              onValueChange={(value) => setContragentFilter(value || null)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Mijoz bo'yicha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha mijozlar</SelectItem>
                {uniqueContragents.map((contragent) => (
                  <SelectItem key={contragent} value={contragent}>
                    {contragent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="shrink-0"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter(null);
                setContragentFilter(null);
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Tozalash
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buyurtmalar Ro'yxati</CardTitle>
          <CardDescription>
            {filteredOrders.length} ta buyurtma ko'rsatilmoqda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Ko'rish</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead className="text-center">Miqdor</TableHead>
                  <TableHead className="text-center">Holat</TableHead>
                  <TableHead className="text-center">Boshlanish</TableHead>
                  <TableHead className="text-center">Tugash</TableHead>
                  <TableHead className="hidden md:table-cell">Izoh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {Array.from({ length: 8 }).map((_, cellIndex) => (
                        <TableCell key={`cell-${index}-${cellIndex}`}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Buyurtmalar topilmadi.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders
                    .sort((a, b) => b.id - a.id)
                    .map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.name}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              navigate(
                                `/warehouseManager/settings/orders/${order.id}`
                              );
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                        </TableCell>
                        <TableCell>{order.contragent.name}</TableCell>
                        <TableCell className="text-center">
                          {order.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(order.start_date)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(order.end_date)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {order.comment || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;

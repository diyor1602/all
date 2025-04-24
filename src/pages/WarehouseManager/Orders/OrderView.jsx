"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Package2,
  Calendar,
  Tag,
  Clock,
  MapPin,
  Building2,
  ArrowLeft,
  Loader2,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
} from "lucide-react";
import api from "@/utils/api";
import { statuses } from "@/lib/status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [filteredStockBalance, setFilteredStockBalance] = useState([]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/warehouseManager/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtma ma'lumotlarini olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order?.stock_balance) {
      setFilteredStockBalance(order.stock_balance);
    }
  }, [order]);

  const chartData = useMemo(() => {
    if (!order?.stock_entry) return [];

    // Group entries by date and type
    const groupedData = order.stock_entry.reduce((acc, entry) => {
      const date = new Date(entry.created_at).toLocaleDateString();

      if (!acc[date]) {
        acc[date] = { date, incoming: 0, outgoing: 0 };
      }

      const totalQuantity = entry.items.reduce(
        (sum, item) => sum + Number.parseFloat(item.quantity),
        0
      );

      if (entry.type === "incoming") {
        acc[date].incoming += totalQuantity;
      } else {
        acc[date].outgoing += totalQuantity;
      }

      return acc;
    }, {});

    return Object.values(groupedData);
  }, [order]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
            Ma'lumotlar yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="rounded-full bg-amber-100 p-6 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <Info className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Buyurtma topilmadi
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          So'ralgan buyurtma mavjud emas yoki o'chirilgan
        </p>
        <Button onClick={() => navigate(-1)} size="lg" className="gap-2">
          <ArrowLeft className="h-5 w-5" />
          Orqaga qaytish
        </Button>
      </div>
    );
  }

  const status = statuses[order.status];
  const incomingTotal = chartData.reduce((sum, item) => sum + item.incoming, 0);
  const outgoingTotal = chartData.reduce((sum, item) => sum + item.outgoing, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full p-0 sm:h-9 sm:w-9"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Orqaga</span>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
                  #{order.id} {order.name}
                </h1>
              </div>
            </div>
          </div>
          <Badge className={`${status.color} px-3 py-1 text-sm font-medium`}>
            {status.text}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
            <TabsTrigger value="overview">Umumiy ma'lumot</TabsTrigger>
            <TabsTrigger value="statistics">Statistika</TabsTrigger>
            <TabsTrigger value="activities">Ombor harakatlari</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold">
                    Buyurtma tafsilotlari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Nomi
                          </p>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {order.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Package2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Miqdori
                          </p>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {order.quantity}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Boshlanish sanasi
                          </p>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {new Date(order.start_date).toLocaleDateString(
                              "ru-RU"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Tugash sanasi
                          </p>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {new Date(order.end_date).toLocaleDateString(
                              "ru-RU"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Izoh
                    </h3>
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                      <p className="text-slate-700 dark:text-slate-300">
                        {order.comment}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Ombor qoldiqlari
                      </h3>

                      {order.stock_balance &&
                        order.stock_balance.length > 0 && (
                          <div className="mt-2 sm:mt-0">
                            <Select
                              defaultValue="all"
                              onValueChange={(value) => {
                                if (value === "all") {
                                  setFilteredStockBalance(order.stock_balance);
                                } else {
                                  setFilteredStockBalance(
                                    order.stock_balance.filter(
                                      (item) =>
                                        item.warehouse.id.toString() === value
                                    )
                                  );
                                }
                              }}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Ombor tanlang" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Barcha omborlar
                                </SelectItem>
                                {Array.from(
                                  new Set(
                                    order.stock_balance.map(
                                      (item) => item.warehouse.id
                                    )
                                  )
                                ).map((warehouseId) => {
                                  const warehouse = order.stock_balance.find(
                                    (item) => item.warehouse.id === warehouseId
                                  ).warehouse;
                                  return (
                                    <SelectItem
                                      key={warehouseId}
                                      value={warehouseId.toString()}
                                    >
                                      {warehouse.name}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                    </div>

                    {order.stock_balance && order.stock_balance.length > 0 ? (
                      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Mahsulot
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Kod
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Miqdor
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Narx
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Min. miqdor
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Holat
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Ombor
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {filteredStockBalance.map((item) => (
                                <tr
                                  key={item.id}
                                  className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {item.item.image ? (
                                        <div className="h-10 w-10 overflow-hidden rounded-md flex-shrink-0">
                                          <img
                                            src={
                                              item.item.image ||
                                              "/placeholder.svg"
                                            }
                                            alt={item.item.name}
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700">
                                          <Package2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                      )}
                                      <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {item.item.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                    {item.item.code}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-block min-w-[60px] rounded-full bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                                      {Number.parseFloat(item.quantity).toFixed(
                                        2
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                                    {Number.parseFloat(item.item.price).toFixed(
                                      2
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                                    {item.item.min_quantity}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span
                                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                                        Number(item.quantity) <
                                        Number(item.item.min_quantity)
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      }`}
                                    >
                                      {Number(item.quantity) <
                                      Number(item.item.min_quantity)
                                        ? "Kam qoldiq"
                                        : "Yetarli"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {item.warehouse.name}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                        <p className="text-slate-700 dark:text-slate-300">
                          Ombor qoldiqlari mavjud emas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Ombor statistikasi
                </CardTitle>
                <CardDescription>
                  Buyurtma bo'yicha ombor harakatlari statistikasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorIncoming"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorOutgoing"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="incoming"
                        name="Kirim"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorIncoming)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="outgoing"
                        name="Chiqim"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorOutgoing)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Ombor harakatlari
                </CardTitle>
                <CardDescription>
                  Buyurtma bo'yicha barcha ombor harakatlari
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {order.stock_entry.map((entry) => (
                    <Card
                      key={entry.id}
                      className="overflow-hidden border-0 shadow-md"
                    >
                      <div
                        className={`h-1 w-full ${
                          entry.type === "incoming"
                            ? "bg-emerald-500 dark:bg-emerald-600"
                            : "bg-rose-500 dark:bg-rose-600"
                        }`}
                      />
                      <CardContent className="p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                entry.type === "incoming"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              }`}
                            >
                              {entry.type === "incoming" ? (
                                <ArrowDownToLine className="h-5 w-5" />
                              ) : (
                                <ArrowUpFromLine className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <Badge
                                variant={
                                  entry.type === "incoming"
                                    ? "success"
                                    : "destructive"
                                }
                                className="px-3 py-1 text-sm font-medium"
                              >
                                #{entry.id}{" "}
                                {entry.type === "incoming" ? "Kirim" : "Chiqim"}
                              </Badge>
                              <Badge className="ml-2 px-3 py-1 text-sm font-medium bg-slate-100 text-black">
                                {entry.source?.name || entry.destination?.name}
                              </Badge>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {new Date(entry.created_at).toLocaleString(
                                  "ru-RU"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800">
                            <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {entry.warehouse.name}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                            <h4 className="font-medium text-slate-800 dark:text-slate-200">
                              Xodim ma'lumotlari
                            </h4>
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                  {entry.employee.name}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <span>ID: {entry.employee.id}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {entry.items && entry.items.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-slate-800 dark:text-slate-200">
                                Mahsulotlar
                              </h4>
                              <div className="space-y-2">
                                {entry.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-800/50"
                                  >
                                    <div className="flex items-center gap-3">
                                      {item.item.image ? (
                                        <div className="h-10 w-10 overflow-hidden rounded-md">
                                          <img
                                            src={
                                              item.item.image ||
                                              "/placeholder.svg" ||
                                              "/placeholder.svg"
                                            }
                                            alt={item.item.name}
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-200 dark:bg-slate-700">
                                          <Package2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">
                                          {item.item.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          Kod: {item.item.code}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-slate-800 dark:text-slate-200">
                                        {Number.parseFloat(
                                          item.quantity
                                        ).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Narx:{" "}
                                        {Number.parseFloat(item.price).toFixed(
                                          2
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {entry.comment && (
                          <div className="mt-4 rounded-md bg-slate-50 p-3 dark:bg-slate-800/50">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                Izoh:
                              </span>{" "}
                              {entry.comment}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrderView;

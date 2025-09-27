import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Search,
  Package,
  Calendar,
  MessageSquare,
  Send,
  AlertCircle,
  Tag,
  ShoppingBag,
  CheckCircle,
  Loader2,
  Shell,
  Clock,
  ChevronDown,
  ChevronUp,
  RulerIcon,
} from "lucide-react";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [comments, setComments] = useState({});
  const [planDates, setPlanDates] = useState({});
  const [sending, setSending] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/cuttingMaster/orders", {
        params: { status: "active" },
      });
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
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
    const filtered = orders.filter(
      (order) =>
        order?.name?.toLowerCase().includes(search.toLowerCase()) ||
        order?.id.toString().includes(search) ||
        order?.quantity?.toString().includes(search) ||
        order?.comment?.toLowerCase().includes(search.toLowerCase()) ||
        order?.order_model?.model?.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        order?.order_model?.material?.name
          .toLowerCase()
          .includes(search.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [search, orders]);

  const handleCommentChange = (orderId, value) => {
    setComments((prev) => ({ ...prev, [orderId]: value }));
  };

  const handlePlanDateChange = (orderId, value) => {
    setPlanDates((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleSendToConstructor = async (orderId) => {
    const orderComment = comments[orderId] || "";
    const orderPlanDate = planDates[orderId] || "";

    try {
      if (!orderPlanDate) {
        toast({
          title: "Diqqat",
          description: "Reja vaqtini kiriting!",
          variant: "destructive",
        });
        return;
      }
      setSending(true);
      await api.post("/cuttingMaster/sendToConstructor", {
        order_id: orderId,
        planned_time: orderPlanDate || null,
        comment: orderComment || null,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Konstruktorga muvaffaqiyatli jo'natildi.",
        style: { backgroundColor: "green", color: "white" },
      });

      fetchOrders();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const toggleDetails = (orderId) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const calculateDeadline = (endDate) => {
    if (!endDate) return null;

    const today = new Date();
    const deadline = parseISO(endDate);
    const daysRemaining = differenceInDays(deadline, today);

    return daysRemaining;
  };

  const isOverdue = (startDate) => {
    if (!startDate) return false;

    const today = new Date();
    const start = parseISO(startDate);

    return isAfter(today, start);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 sm:p-6">
        <div
          className="text-3xl font-extrabold text-purple-700 mb-8"
          aria-live="polite"
        >
          Buyurtmalar yuklanmoqda
        </div>
        <div className="flex gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            aria-hidden="true"
          >
            <Skeleton className="w-20 h-20 rounded-lg bg-gradient-to-r from-blue-200 to-purple-200" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            aria-hidden="true"
          >
            <Skeleton className="w-20 h-20 rounded-lg bg-gradient-to-r from-purple-200 to-pink-200" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            aria-hidden="true"
          >
            <Skeleton className="w-20 h-20 rounded-lg bg-gradient-to-r from-pink-200 to-blue-200" />
          </motion.div>
        </div>
        <div className="mt-8 flex flex-col gap-4 w-full max-w-md px-4">
          <Skeleton className="w-full h-6 rounded-full bg-gradient-to-r from-blue-200 to-purple-200" />
          <Skeleton className="w-3/4 h-6 rounded-full bg-gradient-to-r from-purple-200 to-pink-200" />
          <Skeleton className="w-5/6 h-6 rounded-full bg-gradient-to-r from-pink-200 to-blue-200" />
          <Skeleton className="w-2/3 h-6 rounded-full bg-gradient-to-r from-blue-200 to-purple-200" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-3 sm:p-6"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="mb-6 flex items-center justify-between gap-3 flex-wrap"
        >
          <h1 className="text-4xl font-extrabold text-purple-800 mb-2">
            Buyurtmalar ({filteredOrders?.length})
          </h1>
          <div className="text-lg font-semibold text-purple-800">
            {filteredOrders?.reduce(
              (total, order) => total + Number.parseInt(order?.quantity),
              0
            )}{" "}
            ta
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Qidirish..."
            className="pl-10 py-6 bg-white shadow-md rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Qidirish"
          />
        </motion.div>

        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12 px-4 bg-white rounded-xl shadow-sm"
            >
              <AlertCircle className="mx-auto h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">
                Buyurtmalar topilmadi
              </h3>
              <p className="mt-2 text-gray-600 text-lg">
                Boshqa qidiruv so'rovini kiriting
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const daysRemaining = calculateDeadline(order.start_date);
                const isOrderOverdue = isOverdue(order.start_date);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ${
                        isOrderOverdue ? "border-red-300" : ""
                      }`}
                    >
                      <CardHeader
                        className={`px-6 py-4 ${
                          isOrderOverdue ? "bg-red-500" : "bg-sky-500"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full flex-wrap gap-4">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-4`}>
                              <Package className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                              <CardTitle
                                className={`font-bold text-xl text-white`}
                              >
                                {order?.name}
                                <span className="ml-2 opacity-70">
                                  #{order?.id}
                                </span>
                              </CardTitle>
                              <div
                                className={`flex items-center text-sm text-white mt-1`}
                              >
                                <Tag className="h-4 w-4 mr-1" />
                                <span>{order?.order_model?.model?.name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge className="bg-indigo-100 text-indigo-800">
                              <ShoppingBag className="h-3 w-3 mr-1" />
                              {order?.quantity} ta
                            </Badge>

                            {/* Date information */}
                            <div
                              className={`flex items-center px-3 py-1 rounded-md ${
                                isOrderOverdue
                                  ? "bg-red-200 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">
                                {order.start_date
                                  ? format(
                                      parseISO(order.start_date),
                                      "dd.MM.yyyy"
                                    )
                                  : "No start date"}
                              </span>
                            </div>

                            {order.start_date && (
                              <div
                                className={`flex items-center px-3 py-1 rounded-md ${
                                  daysRemaining < 0
                                    ? "bg-red-200 text-red-800"
                                    : daysRemaining < 3
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">
                                  {daysRemaining < 0
                                    ? `${Math.abs(daysRemaining)} kun kechikdi`
                                    : `${daysRemaining} kun qoldi`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                              <Tag className="h-5 w-5 mr-2 text-pink-600" />
                              Submodellar
                            </h4>
                            <div className="flex flex-wrap gap-2 bg-pink-50 p-2 rounded-lg border border-pink-100">
                              {order?.order_model?.submodels?.map(
                                (submodel) => (
                                  <Badge
                                    key={submodel.id}
                                    className="bg-white text-pink-700 border border-pink-200 px-2 py-1 text-sm hover:bg-pink-50"
                                  >
                                    {submodel?.submodel?.name}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                              Izoh
                            </h4>
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-gray-700 text-sm">
                              {order?.comment || "Izoh yo'q"}
                            </div>
                          </div>
                        </div>

                        {order?.order_model?.sizes &&
                          order.order_model.sizes.length > 0 &&
                          (() => {
                            // Get unique sizes and colors
                            const sizes = [
                              ...new Set(
                                order.order_model.sizes.map(
                                  (size) => size.size?.name
                                )
                              ),
                            ].sort((a, b) => a.localeCompare(b));
                            const colors = [
                              ...new Set(
                                order.order_model.sizes.map(
                                  (size) => size.color?.name
                                )
                              ),
                            ].sort((a, b) => a.localeCompare(b));

                            // Create a map for quick lookup
                            const sizeColorMap = new Map();
                            order.order_model.sizes.forEach((item) => {
                              const key = `${item.size?.name}-${item.color?.name}`;
                              sizeColorMap.set(key, item.quantity || 0);
                            });

                            // Calculate row and column totals
                            const rowTotals = new Map();
                            const colTotals = new Map(
                              colors.map((color) => [color, 0])
                            );

                            sizes.forEach((size) => {
                              let total = 0;
                              colors.forEach((color) => {
                                const quantity =
                                  sizeColorMap.get(`${size}-${color}`) || 0;
                                total += quantity;
                                colTotals.set(
                                  color,
                                  (colTotals.get(color) || 0) + quantity
                                );
                              });
                              rowTotals.set(size, total);
                            });

                            const grandTotal = Array.from(
                              rowTotals.values()
                            ).reduce((sum, val) => sum + val, 0);

                            return (
                              <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
                                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                                  <RulerIcon className="h-4 w-4 mr-2 text-indigo-500" />
                                  <span>O'lchamlar</span>
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-collapse bg-white">
                                    <thead>
                                      <tr>
                                        <th className="bg-yellow-100 border border-gray-300 p-2 text-center">
                                          O'lcham
                                        </th>
                                        {colors.map((color, index) => (
                                          <th
                                            key={index}
                                            className="border border-gray-300 p-2 text-center"
                                          >
                                            {color}
                                          </th>
                                        ))}
                                        <th className="bg-blue-200 border border-gray-300 p-2 text-center font-semibold">
                                          Jami
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sizes.map((size) => (
                                        <tr key={size}>
                                          <td className="bg-yellow-50 border border-gray-300 p-2 font-medium text-center">
                                            {size}
                                          </td>
                                          {colors.map((color) => {
                                            const quantity =
                                              sizeColorMap.get(
                                                `${size}-${color}`
                                              ) || 0;
                                            return (
                                              <td
                                                key={`${size}-${color}`}
                                                className="border border-gray-200 p-2 text-center"
                                              >
                                                {quantity || ""}
                                              </td>
                                            );
                                          })}
                                          <td className="bg-blue-100 border border-gray-300 p-2 text-center font-medium">
                                            {rowTotals.get(size) || 0}
                                          </td>
                                        </tr>
                                      ))}
                                      <tr>
                                        <td className="bg-green-50 border border-gray-300 p-2 font-semibold text-center">
                                          Jami
                                        </td>
                                        {colors.map((color) => (
                                          <td
                                            key={`total-${color}`}
                                            className="bg-green-50 border border-gray-300 p-2 text-center font-semibold"
                                          >
                                            {colTotals.get(color) || 0}
                                          </td>
                                        ))}
                                        <td className="bg-blue-100 border border-gray-300 p-2 text-center font-bold">
                                          {grandTotal}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}

                        {expandedDetails[order.id] && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                                <Shell className="h-5 w-5 mr-2 text-purple-600" />
                                Material
                              </h4>
                              <div className="font-medium text-gray-800 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                {order?.order_model?.material?.name || "-"}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                Instruksiyalar
                              </h4>
                              <Card className="bg-green-50 border border-green-100">
                                <div className="divide-y divide-green-100">
                                  {order?.instructions?.map((instruction) => (
                                    <div
                                      key={instruction.id}
                                      className="p-3 flex flex-col"
                                    >
                                      <div className="font-bold text-gray-800 text-base mb-1">
                                        {instruction?.title}
                                      </div>
                                      <div className="text-gray-700 text-sm">
                                        {instruction?.description}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                              <h4 className="text-lg font-bold text-purple-800 mb-3">
                                Konstruktorga jo'natish
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-bold text-gray-700 flex items-center mb-1">
                                    <Calendar className="h-4 w-4 mr-1 text-purple-600" />
                                    Reja vaqti
                                  </label>
                                  <Input
                                    type="datetime-local"
                                    value={planDates[order.id] || ""}
                                    onChange={(e) =>
                                      handlePlanDateChange(
                                        order.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Reja vaqtini tanlang"
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-bold text-gray-700 flex items-center mb-1">
                                    <MessageSquare className="h-4 w-4 mr-1 text-purple-600" />
                                    Konstruktor uchun izoh
                                  </label>
                                  <Textarea
                                    value={comments[order.id] || ""}
                                    onChange={(e) =>
                                      handleCommentChange(
                                        order.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Konstruktor uchun izoh yozing"
                                    className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-sm min-h-20"
                                  />
                                </div>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <Button
                                  onClick={() =>
                                    handleSendToConstructor(order.id)
                                  }
                                  disabled={sending}
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-300 text-sm font-bold"
                                >
                                  {sending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Yuborilmoqda...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-4 w-4" />
                                      Konstruktorga jo'natish
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="px-6 py-2 bg-gray-50 flex justify-center">
                        <Button
                          variant="ghost"
                          onClick={() => toggleDetails(order.id)}
                          className="text-gray-600 hover:text-gray-900 flex items-center"
                        >
                          {expandedDetails[order.id] ? (
                            <>
                              <ChevronUp className="h-5 w-5 mr-1" />
                              Kamroq ko'rsatish
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-5 w-5 mr-1" />
                              Ko'proq ko'rsatish
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Orders;

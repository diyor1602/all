"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Package,
  Calendar,
  MessageSquare,
  AlertCircle,
  Tag,
  ShoppingBag,
  Ruler,
  CheckCircle,
  Shell,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { statuses } from "@/lib/status";

const formatDate = (date) => {
  if (!date) return "Sana ko'rsatilmagan";
  return `${date?.split(" ")?.[0]?.split("-")?.reverse()?.join(".")}, ${date
    ?.split(" ")?.[1]
    ?.slice(0, 5)}`;
};

const Cutting = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/cuttingMaster/orders", {
        params: { status: "cutting" },
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

  const totalQuantity = filteredOrders?.reduce(
    (total, order) => total + Number.parseInt(order?.quantity || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 sm:p-6">
        <div
          className="text-3xl font-extrabold text-purple-700 mb-8"
          aria-live="polite"
        >
          Buyurtmalar yuklanmoqda
        </div>
        <div className="flex gap-4">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              aria-hidden="true"
            >
              <Skeleton className="w-20 h-20 rounded-lg bg-gradient-to-r from-purple-200 to-indigo-200" />
            </motion.div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-4 w-full max-w-md px-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton
              key={index}
              className={`w-${
                ["full", "3/4", "5/6", "2/3"][index]
              } h-6 rounded-full bg-gradient-to-r from-purple-200 to-indigo-200`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-3 sm:p-6"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 justify-between flex-wrap w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-800">
              Buyurtmalar
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-white px-2 py-1 text-sm font-medium"
              >
                {filteredOrders?.length} ta buyurtma
              </Badge>
              <Badge
                variant="outline"
                className="bg-white px-2 py-1 text-sm font-medium"
              >
                {parseFloat(totalQuantity)?.toLocaleString("ru-RU")} ta mahsulot
              </Badge>
            </div>
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
            className="pl-10 py-6 bg-white shadow-md rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-base sm:text-lg"
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
            <Accordion type="single" collapsible className="space-y-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AccordionItem
                    value={order.id.toString()}
                    className="border-none rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
                  >
                    <AccordionTrigger className="px-4 sm:px-6 py-4 hover:bg-gray-50 [&[data-state=open]>div]:bg-purple-50">
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center justify-between w-full flex-wrap gap-2 sm:gap-4">
                          <div className="flex items-center">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg mr-3">
                              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="text-left">
                              <h3
                                className="font-bold text-lg sm:text-xl text-gray-800"
                                aria-label="Buyurtma nomi"
                              >
                                {order?.name}
                                <span className="text-purple-600 ml-2">
                                  #{order?.id}
                                </span>
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Tag className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {order?.order_model?.model?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {order?.start_date && (
                              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(order?.start_date)}
                              </Badge>
                            )}
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              <ShoppingBag className="h-3 w-3 mr-1" />
                              {order?.quantity} ta
                            </Badge>
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                            <Tag className="h-4 w-4 mr-2 text-purple-600" />
                            Submodellar
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {order?.order_model?.submodels?.map((submodel) => (
                              <Badge
                                key={submodel.id}
                                variant="outline"
                                className="bg-white text-purple-700 border border-purple-200 px-2 py-1"
                              >
                                {submodel?.submodel?.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                <Tag className="h-4 w-4 mr-2 text-purple-600" />
                                Model
                              </h4>
                              <div className="font-medium text-gray-800 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                {order?.order_model?.model?.name}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                <Shell className="h-4 w-4 mr-2 text-purple-600" />
                                Material
                              </h4>
                              <div className="font-medium text-gray-800 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                {order?.order_model?.material?.name}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-indigo-600" />
                                Izoh
                              </h4>
                              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-gray-700">
                                {order?.comment || "Izoh yo'q"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                <Ruler className="h-4 w-4 mr-2 text-indigo-600" />
                                O'lchamlar
                              </h4>
                              <div className="flex flex-wrap gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                {order?.order_model?.sizes?.map((size) => (
                                  <Badge
                                    key={size.id}
                                    variant="outline"
                                    className="bg-white text-indigo-700 border border-indigo-200 px-2 py-1"
                                  >
                                    <span className="font-medium">
                                      {size?.size?.name}
                                    </span>{" "}
                                    {size?.quantity ? (
                                      <span className="font-normal ml-1 text-gray-600">
                                        {size?.quantity} ta
                                      </span>
                                    ) : (
                                      ""
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Instruksiyalar
                          </h4>
                          <Card className="bg-green-50 border border-green-100">
                            <div className="divide-y divide-green-100">
                              {order?.instructions?.length > 0 ? (
                                order?.instructions?.map((instruction) => (
                                  <div
                                    key={instruction.id}
                                    className="p-3 flex flex-col"
                                  >
                                    <div className="font-medium text-gray-800 mb-1">
                                      {instruction?.title}
                                    </div>
                                    <div className="text-gray-700 text-sm">
                                      {instruction?.description}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-gray-600">
                                  Instruksiyalar mavjud emas
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-purple-600" />
                            Vaqt ma'lumotlari
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Reja vaqti
                              </div>
                              <div className="text-sm font-medium">
                                {order?.order_printing_time?.planned_time
                                  ? new Date(
                                      order?.order_printing_time?.planned_time
                                    ).toLocaleString("en-GB")
                                  : "Belgilanmagan"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Status
                              </div>
                              <Badge
                                className={`${
                                  order?.order_printing_time?.status ===
                                  "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {statuses[order?.order_printing_time?.status]
                                  ?.text ||
                                  order?.order_printing_time?.status ||
                                  "Belgilanmagan"}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Bajarilgan vaqti
                              </div>
                              <div className="text-sm font-medium">
                                {order?.order_printing_time?.actual_time
                                  ? new Date(
                                      order?.order_printing_time?.actual_time
                                    ).toLocaleString("en-GB")
                                  : "Bajarilmagan"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                <User className="h-3 w-3 inline mr-1" />
                                Ma'sul
                              </div>
                              <div className="text-sm font-medium">
                                {order?.order_printing_time?.user?.employee
                                  ?.name || "Belgilanmagan"}
                              </div>
                            </div>
                          </div>

                          {order?.order_printing_time?.comment && (
                            <div className="mt-3">
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Izoh
                              </div>
                              <div className="text-sm bg-white p-3 rounded-lg border border-gray-200">
                                {order?.order_printing_time?.comment}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          className="mt-6 w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            navigate(`/cuttingMaster/start/${order?.id}`);
                          }}
                        >
                          Boshlash
                        </Button>
                      </CardContent>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Cutting;

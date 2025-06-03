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
} from "lucide-react";

const Printing = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Add this utility function to calculate days remaining
  const getDaysRemaining = (plannedDate) => {
    if (!plannedDate) return { days: 0, isPast: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const planned = new Date(plannedDate);
    planned.setHours(0, 0, 0, 0);

    const diffTime = planned - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: Math.abs(diffDays),
      isPast: diffDays < 0,
    };
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/cuttingMaster/orders", {
        params: { status: "printing" },
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                  className={`border-none rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300 ${
                    order?.order_printing_time?.planned_time &&
                    getDaysRemaining(order?.order_printing_time?.planned_time)
                      .isPast
                      ? "ring-2 ring-red-400"
                      : ""
                  }`}
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between w-full flex-wrap gap-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-purple-400 to-blue-500 p-2 rounded-lg mr-4">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3
                            className="font-bold text-xl text-gray-800"
                            aria-label="Buyurtma nomi"
                          >
                            {order?.name}
                            <span className="text-primary ml-2">
                              #{order?.id}
                            </span>
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Tag className="h-4 w-4 mr-1" />
                            <span>{order?.order_model?.model?.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {order?.order_printing_time?.planned_time &&
                          (() => {
                            const { days, isPast } = getDaysRemaining(
                              order?.order_printing_time?.planned_time
                            );
                            return (
                              <Badge
                                className={`${
                                  isPast
                                    ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                } flex items-center gap-1`}
                              >
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {order?.order_printing_time?.planned_time
                                    ?.split(" ")[0]
                                    ?.split("-")
                                    ?.reverse()
                                    ?.join(".")}
                                  {isPast ? (
                                    <span className="ml-1 font-bold text-red-700">
                                      {days} kun o'tdi
                                    </span>
                                  ) : (
                                    <span className="ml-1">
                                      {days} kun qoldi
                                    </span>
                                  )}
                                </span>
                              </Badge>
                            );
                          })()}
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          {order?.quantity} ta
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="p-6 bg-gradient-to-r from-gray-50 to-white">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                              <Tag className="h-5 w-5 mr-2 text-purple-600" />
                              Model
                            </h4>
                            <div className="font-bold text-lg text-gray-800 bg-purple-50 p-3 rounded-lg border border-purple-100">
                              {order?.order_model?.model?.name}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                              <Shell className="h-5 w-5 mr-2 text-purple-600" />
                              Material
                            </h4>
                            <div className="font-bold text-lg text-gray-800 bg-purple-50 p-3 rounded-lg border border-purple-100">
                              {order?.order_model?.material?.name}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                              Izoh
                            </h4>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-gray-700 text-base">
                              {order?.comment || "Izoh yo'q"}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                              <Ruler className="h-5 w-5 mr-2 text-indigo-600" />
                              O'lchamlar
                            </h4>
                            <div className="flex flex-wrap gap-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                              {order?.order_model?.sizes?.map((size) => (
                                <Badge
                                  key={size.id}
                                  className="bg-white text-indigo-700 border border-indigo-200 px-3 py-2 text-base"
                                >
                                  <span className="font-bold">
                                    {size?.size?.name}
                                  </span>{" "}
                                  {size?.quantity ? (
                                    <span className="font-medium mx-1 text-black">
                                      {size?.quantity} ta
                                    </span>
                                  ) : (
                                    ""
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-gray-700 mb-2 flex items-center">
                              <Tag className="h-5 w-5 mr-2 text-pink-600" />
                              Submodellar
                            </h4>
                            <div className="flex flex-wrap gap-2 bg-pink-50 p-4 rounded-lg border border-pink-100">
                              {order?.order_model?.submodels?.map(
                                (submodel) => (
                                  <Badge
                                    key={submodel.id}
                                    className="bg-white text-pink-700 border border-pink-200 px-3 py-1.5 text-base"
                                  >
                                    {submodel?.submodel?.name}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                          Instruksiyalar
                        </h4>
                        <Card className="bg-green-50 border border-green-100">
                          <div className="divide-y divide-green-100">
                            {order?.instructions?.map((instruction) => (
                              <div
                                key={instruction.id}
                                className="p-4 flex flex-col"
                              >
                                <div className="font-bold text-gray-800 text-lg mb-1">
                                  {instruction?.title}
                                </div>
                                <div className="text-gray-700 text-base">
                                  {instruction?.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-base font-bold text-gray-700 flex items-center mb-2">
                              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                              Reja vaqti
                            </label>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                              {order?.order_printing_time?.planned_time
                                ?.split(" ")[0]
                                ?.split("-")
                                ?.reverse()
                                ?.join(".")}{" "}
                              {order?.order_printing_time?.planned_time
                                ?.split(" ")[1]
                                ?.slice(0, 5)}
                            </div>
                          </div>
                          <div>
                            <label className="text-base font-bold text-gray-700 flex items-center mb-2">
                              <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                              Izoh
                            </label>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                              {order?.order_printing_time?.comment ||
                                "Izoh yo'q"}
                            </div>
                          </div>
                          <div>Status: Konstruktorda</div>
                          <div>
                            Bajarilgan vaqti:{" "}
                            {order?.order_printing_time?.actual_time ||
                              "Bajarilmagan"}
                          </div>
                          <div>
                            Ma'sul:{" "}
                            {order?.order_printing_time?.user?.employee?.name}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Printing;

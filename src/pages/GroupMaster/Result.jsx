"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  MessageSquare,
  AlertCircle,
  Tag,
  ShoppingBag,
  Ruler,
  Shell,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const Result = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/groupMaster/orders", {
        params: { status: "tailoring" },
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
        order?.id?.toString().includes(search) ||
        order?.quantity?.toString().includes(search) ||
        order?.comment?.toLowerCase().includes(search.toLowerCase()) ||
        order?.orderModel?.model?.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        order?.orderModel?.material?.name
          .toLowerCase()
          .includes(search.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [search, orders]);

  const calculateProgress = (quantity, remainAmount) => {
    if (!quantity || quantity === 0) return 0;
    const completed = remainAmount || 0;
    return Math.round((completed / quantity) * 100);
  };

  const toggleCardExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-violet-50 to-fuchsia-50 p-4 sm:p-6">
        <div
          className="text-3xl font-extrabold text-violet-700 mb-8"
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
            <Skeleton className="w-20 h-20 rounded-lg bg-gradient-to-r from-violet-200 to-fuchsia-200" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            aria-hidden="true"
          >
            <Skeleton className="w-20 h-20 rounded-lg bg-gradient-to-r from-fuchsia-200 to-pink-200" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            aria-hidden="true"
          >
            <Skeleton className="w-20 h-20 rounded-lg bg-gradient-to-r from-pink-200 to-violet-200" />
          </motion.div>
        </div>
        <div className="mt-8 flex flex-col gap-4 w-full max-w-md px-4">
          <Skeleton className="w-full h-6 rounded-full bg-gradient-to-r from-violet-200 to-fuchsia-200" />
          <Skeleton className="w-3/4 h-6 rounded-full bg-gradient-to-r from-fuchsia-200 to-pink-200" />
          <Skeleton className="w-5/6 h-6 rounded-full bg-gradient-to-r from-pink-200 to-violet-200" />
          <Skeleton className="w-2/3 h-6 rounded-full bg-gradient-to-r from-violet-200 to-fuchsia-200" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-violet-50 to-fuchsia-50 p-3 sm:p-6"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="mb-6 flex items-center justify-between gap-3 flex-wrap"
        >
          <h1 className="text-4xl font-extrabold text-violet-800 mb-2">
            Buyurtmalar ({filteredOrders?.length})
          </h1>
          <div className="text-lg font-semibold text-violet-800 bg-white/70 px-4 py-2 rounded-full shadow-sm">
            Jami:{" "}
            {filteredOrders?.reduce(
              (total, order) => total + Number.parseInt(order?.quantity || 0),
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
            className="pl-10 py-6 bg-white shadow-md rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 text-lg"
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
              <AlertCircle className="mx-auto h-12 w-12 text-violet-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">
                Buyurtmalar topilmadi
              </h3>
              <p className="mt-2 text-gray-600 text-lg">
                Boshqa qidiruv so'rovini kiriting
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order, index) => {
                const progress = calculateProgress(
                  order?.quantity,
                  order?.remainAmount
                );
                const isExpanded = expandedCard === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card className="overflow-hidden transition-all duration-300 shadow hover:shadow-md">
                      <CardHeader
                        className={`pb-2 ${
                          isExpanded
                            ? "bg-gradient-to-r from-violet-50 to-fuchsia-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-1.5 rounded-lg">
                              <Package className="h-4 w-4 text-white" />
                            </div>
                            <CardTitle className="text-base sm:text-lg">
                              {order?.name}
                              <span className="text-violet-600 ml-1 text-xs sm:text-sm">
                                #{order?.id}
                              </span>
                            </CardTitle>
                          </div>
                          <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-200 text-xs whitespace-nowrap">
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            {order?.quantity} ta
                          </Badge>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Jarayon</span>
                            <span className="font-medium">
                              {order?.remainAmount || 0} / {order?.quantity}
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-2"
                            indicatorclassname={`${
                              progress < 30
                                ? "bg-red-500"
                                : progress < 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                        </div>

                        {order?.orderModel?.submodels?.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1 bg-violet-50 p-1.5 rounded-lg">
                              {order?.orderModel?.submodels?.map((submodel) => (
                                <Badge
                                  key={submodel.id}
                                  className="bg-white text-violet-700 border border-violet-200 text-xs hover:bg-violet-50"
                                >
                                  {submodel?.submodel?.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-xs sm:text-sm px-2 py-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/groupMaster/result/${order?.id}`);
                            }}
                          >
                            Natija kiritish
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-violet-600 hover:text-violet-800 hover:bg-violet-50 text-xs px-2 py-1 h-auto"
                            onClick={() => toggleCardExpand(order.id)}
                          >
                            {isExpanded ? "Yopish" : "Batafsil"}
                          </Button>
                        </div>
                      </CardHeader>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CardContent className="pt-3 pb-2 space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <Tag className="h-3 w-3 mr-1 text-violet-600" />
                                    Model
                                  </div>
                                  <div className="font-medium text-gray-800 bg-violet-50 p-1.5 rounded-lg text-xs">
                                    {order?.orderModel?.model?.name}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <Shell className="h-3 w-3 mr-1 text-violet-600" />
                                    Material
                                  </div>
                                  <div className="font-medium text-gray-800 bg-violet-50 p-1.5 rounded-lg text-xs">
                                    {order?.orderModel?.material?.name}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <ShoppingBag className="h-3 w-3 mr-1 text-violet-600" />
                                    Jami
                                  </div>
                                  <div className="font-medium text-gray-800 bg-violet-50 p-1.5 rounded-lg text-xs">
                                    {order?.quantity} ta
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <Shell className="h-3 w-3 mr-1 text-violet-600" />
                                    Qoldiq
                                  </div>
                                  <div className="font-medium text-gray-800 bg-violet-50 p-1.5 rounded-lg text-xs">
                                    {order?.remainAmount} ta
                                  </div>
                                </div>
                              </div>

                              {order?.comment && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <MessageSquare className="h-3 w-3 mr-1 text-violet-600" />
                                    Izoh
                                  </div>
                                  <div className="bg-violet-50 p-1.5 rounded-lg text-gray-700 text-xs">
                                    {order?.comment}
                                  </div>
                                </div>
                              )}

                              {order?.orderModel?.sizes?.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <Ruler className="h-3 w-3 mr-1 text-violet-600" />
                                    O'lchamlar
                                  </div>
                                  <div className="flex flex-wrap gap-1 bg-violet-50 p-1.5 rounded-lg">
                                    {order?.orderModel?.sizes?.map((size) => (
                                      <Badge
                                        key={size.id}
                                        className="bg-white text-violet-700 border border-violet-200 text-xs"
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
                              )}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
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

export default Result;

"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Package,
  MessageSquare,
  AlertCircle,
  Tag,
  ShoppingBag,
  Ruler,
  Shell,
  RulerIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Tailoring = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

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
        order?.orderModel?.submodels?.some((submodel) =>
          submodel?.submodel?.name.toLowerCase().includes(search.toLowerCase())
        )
    );
    setFilteredOrders(filtered);
  }, [search, orders]);

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
      <div className="max-w-7xl mx-auto">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-purple-400 to-blue-500 p-2 rounded-lg mr-3">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-800">
                              {order?.name}
                            </CardTitle>
                            <p className="text-sm text-purple-600 font-medium">
                              #{order?.id}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-800">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          {order?.quantity} ta
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Key Information Section */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-2 rounded-lg border border-purple-100">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center mb-1">
                              <Tag className="h-3 w-3 mr-1 text-purple-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Model
                              </span>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {order?.orderModel?.model?.name}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center mb-1">
                              <Shell className="h-3 w-3 mr-1 text-purple-600" />
                              <span className="text-xs font-medium text-gray-600">
                                Material
                              </span>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {order?.orderModel?.material?.name || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Submodels */}
                      <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border-2 border-pink-200">
                        <div className="flex items-center mb-3">
                          <Tag className="h-5 w-5 mr-2 text-pink-600" />
                          <span className="text-base font-bold text-gray-800">
                            Submodellar
                          </span>
                          <Badge className="ml-2 bg-pink-200 text-pink-800 text-xs hover:bg-pink-200 transition-colors">
                            {order?.orderModel?.submodels?.length || 0} ta
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order?.orderModel?.submodels?.map((submodel) => (
                            <Badge
                              key={submodel.id}
                              className="bg-white text-pink-800 border-2 border-pink-300 text-sm px-3 py-1.5 font-semibold hover:bg-pink-100 transition-colors"
                            >
                              {submodel?.submodel?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Sizes */}
                      {order?.orderModel?.sizes &&
                        order.orderModel.sizes.length > 0 &&
                        (() => {
                          // Get unique sizes and colors
                          const sizes = [
                            ...new Set(
                              order.orderModel.sizes.map(
                                (size) => size.size?.name
                              )
                            ),
                          ].sort((a, b) => a.localeCompare(b));
                          const colors = [
                            ...new Set(
                              order.orderModel.sizes.map(
                                (size) => size.color?.name
                              )
                            ),
                          ].sort((a, b) => a.localeCompare(b));

                          // Create a map for quick lookup
                          const sizeColorMap = new Map();
                          order.orderModel.sizes.forEach((item) => {
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

                      {/* Comment */}
                      {order?.comment && (
                        <div>
                          <div className="flex items-center mb-2">
                            <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-sm font-bold text-gray-700">
                              Izoh
                            </span>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-sm text-gray-700">
                              {order?.comment}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        className="w-full mt-4"
                        onClick={() => {
                          navigate(`/groupMaster/tailoring/${order?.id}`);
                        }}
                      >
                        Ish biriktirish
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Tailoring;

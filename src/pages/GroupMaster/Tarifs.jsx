import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import {
  Search,
  Package,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Layers,
  LayoutGrid,
  TrendingUp,
  Loader,
  Sun,
  Snowflake,
} from "lucide-react";
import { statuses } from "@/lib/status";
import { useNavigate } from "react-router-dom";
import formatNumber from "@/utils/formatNumber";

const Tarifs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/groupMaster/orders/all");
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarni yuklashda xatolik",
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
        order?.order_model?.model?.name
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    setFilteredOrders(filtered);
  }, [search, orders]);

  if (loading) return <LoadingState />;

  const totalQuantity = filteredOrders?.reduce(
    (total, order) => total + Number(order?.quantity || 0),
    0,
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Buyurtmalar
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <LayoutGrid className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-slate-600">
                    {formatNumber(filteredOrders.length)} ta buyurtma
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-600">
                    {formatNumber(totalQuantity)} dona
                  </span>
                </div>
              </div>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="ID yoki nom bo'yicha qidirish..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Orders Grid */}
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const OrderCard = ({ order, navigate }) => {
  const statusCfg = statuses[order?.status] || {
    color: "bg-slate-500",
    secondaryBg: "bg-slate-50",
    textColor: "text-slate-700",
    text: "Noma'lum",
  };

  const submodels = order?.order_model?.submodels || [];

  return (
    <motion.div
      onClick={() => navigate(`/groupMaster/tarifs/${order.id}`)}
      className={`group relative flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300
         border border-slate-200/60 rounded-[20px] p-4 
        hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-1 bg-white`}
    >
      {/* Visual Status Side-Bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusCfg.color} opacity-80`}
      />

      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors leading-tight truncate">
              {order.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Package className={`h-3 w-3 ${statusCfg.textColor}`} />
              <span className="text-xs font-medium text-slate-600 truncate">
                {order?.order_model?.model?.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] tracking-wider text-slate-400 uppercase">
              #{order.id}
            </span>
            <div
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white shadow-sm ${statusCfg.color}`}
            >
              {statusCfg.text}
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Season */}
          <div className="flex items-center gap-1.5">
            <div
              className={`p-1 rounded-lg ${
                order?.season_type === "winter"
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              {order?.season_type === "winter" ? (
                <Snowflake className="h-3.5 w-3.5 text-blue-600" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-600" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                {order?.season_year}
              </span>
              <span
                className={`text-[9px] font-medium ${
                  order?.season_type === "winter"
                    ? "text-blue-600"
                    : "text-amber-600"
                }`}
              >
                {order?.season_type === "winter" ? "Qish" : "Bahor"}
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div className="text-right">
            <p className="text-[9px] uppercase font-bold text-slate-400">
              Soni
            </p>
            <p className="text-sm font-black text-slate-900">
              {formatNumber(order.quantity)}{" "}
              <span className="text-[9px] font-normal text-slate-400">ta</span>
            </p>
          </div>

          {/* Submodel */}
          <div className="">
            <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">
              Submodel
            </p>
            <div className="flex items-center gap-1 overflow-hidden">
              <Layers className={`h-3 w-3 shrink-0 ${statusCfg.textColor}`} />
              <p className="text-xs font-bold text-slate-900 truncate">
                {submodels[0]?.submodel?.name || "-"}
              </p>
              {submodels.length > 1 && (
                <span
                  className={`px-1 py-0.5 rounded text-[8px] font-bold ${statusCfg.color} bg-opacity-20 ${statusCfg.textColor}`}
                >
                  +{submodels.length - 1}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/40">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-40" />
          <p className="text-[10px] truncate font-medium text-slate-500">
            {order.comment || "Izoh yo'q"}
          </p>
        </div>

        <div
          className={`ml-3 h-8 w-8 rounded-xl flex items-center justify-center transition-all 
          bg-white shadow-sm border border-slate-100
          group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white`}
        >
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
    <div className="relative mb-4">
      <Loader className="animate-spin" />
    </div>
    <h2 className="text-xl font-bold text-slate-800">Yuklanmoqda</h2>
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-24 bg-white rounded-[32px] border-2 border-dashed border-slate-200"
  >
    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
      <AlertCircle className="h-10 w-10 text-slate-300" />
    </div>
    <h3 className="text-2xl font-black text-slate-900">Ma'lumot topilmadi</h3>
    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
      Qidiruv bo'yicha hech qanday buyurtma topilmadi. Iltimos, boshqa so'z
      bilan urinib ko'ring.
    </p>
  </motion.div>
);

export default Tarifs;

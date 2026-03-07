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
                    {formatNumber(totalQuantity)} dona jami
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
         border border-slate-200/60 rounded-[24px] p-6 
        hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1.5 bg-white`}
    >
      {/* Visual Status Side-Bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 ${statusCfg.color} opacity-80`}
      />

      <div>
        {/* ID & Status Badge */}
        <div className="flex justify-between items-center mb-5">
          <span className="text-[11px] tracking-widest text-slate-400 uppercase">
            ID: #{order.id}
          </span>
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm shrink-0 ${statusCfg.color}`}
          >
            {statusCfg.text}
          </div>
        </div>

        {/* Title & Model */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors leading-tight mb-2">
            {order.name}
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${statusCfg.color} bg-opacity-10`}
            >
              <Package className={`h-4 w-4 ${statusCfg.textColor}`} />
            </div>
            <span className="text-sm font-bold text-slate-500 truncate italic">
              {order?.order_model?.model?.name}
            </span>
          </div>
        </div>

        {/* Season Display */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`p-2 rounded-xl ${
              order?.season_type === "winter"
                ? "bg-blue-50 border border-blue-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            {order?.season_type === "winter" ? (
              <Snowflake className="h-5 w-5 text-blue-600" />
            ) : (
              <Sun className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">
              {order?.season_year}
            </span>
            <span
              className={`text-xs font-medium ${
                order?.season_type === "winter"
                  ? "text-blue-600"
                  : "text-amber-600"
              }`}
            >
              {order?.season_type === "winter" ? "Qish" : "Bahor"}
            </span>
          </div>
        </div>

        {/* Data Tiles */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/60 ring-1 ring-white/40 shadow-[0_1px_0_rgba(255,255,255,0.6),0_8px_20px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-tighter">
              Soni
            </p>
            <p className="text-base font-black text-slate-900">
              {formatNumber(order.quantity)}{" "}
              <span className="text-xs font-normal text-slate-400">ta</span>
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/60 ring-1 ring-white/40 shadow-[0_1px_0_rgba(255,255,255,0.6),0_8px_20px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-tighter">
              Submodel
            </p>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Layers
                className={`h-3.5 w-3.5 shrink-0 ${statusCfg.textColor}`}
              />
              <p className="text-sm font-bold text-slate-900 truncate">
                {submodels[0]?.submodel?.name || "-"}
              </p>
              {submodels.length > 1 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md ${statusCfg.color} bg-opacity-20 ${statusCfg.textColor} text-[10px] font-bold`}
                >
                  +{submodels.length - 1}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-200/40">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className="h-4 w-4 shrink-0 opacity-40" />
          <p className="text-xs truncate font-medium">
            {order.comment || "Izoh yo'q"}
          </p>
        </div>

        <div
          className={`ml-4 h-10 w-10 rounded-2xl flex items-center justify-center transition-all 
          bg-white shadow-sm border border-slate-100
          group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white`}
        >
          <ChevronRight className="h-5 w-5" />
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

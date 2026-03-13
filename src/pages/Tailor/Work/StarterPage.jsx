import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet, Package2, ChevronRight } from "lucide-react";
import { statuses } from "@/lib/status";
import formatNumber from "@/utils/formatNumber";
import { useNavigate } from "react-router-dom";

const StarterPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/tailor/starter");
        setData(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Ma'lumotlarni olib bo'lmadi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const orders = data?.data || [];
  const summaryByOrder = data?.summary_by_order || [];

  const orderEarningsMap = useMemo(() => {
    return summaryByOrder.reduce((acc, item) => {
      acc[item?.order_id] = item?.today_earned || 0;
      return acc;
    }, {});
  }, [summaryByOrder]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const earnedA = orderEarningsMap[a?.order_id] || 0;
      const earnedB = orderEarningsMap[b?.order_id] || 0;
      return earnedB - earnedA; // Sort by highest earned first
    });
  }, [orders, orderEarningsMap]);

  const totalEarnedToday = data?.summary?.total_earned_today || 0;

  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3 px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="animate-spin" size={28} />
        </div>
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div
          className="relative overflow-hidden rounded-xl p-4
bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900
text-white shadow-lg border border-white/10"
        >
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-7 rounded-sm bg-yellow-400"></div>

                <span className="text-[10px] font-semibold tracking-[0.22em] text-white/80">
                  VIZZANO
                </span>
              </div>

              {/* earnings */}
              <div className="mb-4">
                <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">
                  Bugungi daromad
                </p>

                <h1 className="text-2xl font-semibold leading-none tracking-tight">
                  {formatNumber(totalEarnedToday)}
                  <span className="ml-1 text-sm text-white/60">so'm</span>
                </h1>
              </div>

              {/* owner */}
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">
                  KARTA EGASI
                </p>

                <p className="text-xs font-medium text-white/90">
                  {localStorage.getItem("name") || "ISMSIZ"}
                </p>
              </div>
            </div>

            {/* wallet icon */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg
    bg-white/10 backdrop-blur-md border border-white/10"
            >
              <Wallet size={18} className="text-white/80" />
            </div>
          </div>
        </div>

        {/* List header */}
        <div className="mb-3 flex items-center justify-between px-1 mt-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Buyurtmalar ro'yxati
          </h2>
          <span className="text-xs text-slate-500">
            {sortedOrders.length} ta
          </span>
        </div>

        {/* Empty state */}
        {sortedOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Package2 className="text-slate-500" size={24} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Hozircha ma'lumot yo'q
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Bugungi buyurtmalar bu yerda ko'rinadi
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOrders.map((order, index) => {
              const status = statuses[order?.order_status];
              const earned = orderEarningsMap[order?.order_id] || 0;

              return (
                <div
                  onClick={() =>
                    navigate(`/tailor/order-calculate/${order?.order_id}`)
                  }
                  key={`${order?.order_id || index}-${index}`}
                  className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <Package2 size={18} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {order?.order_name || "Buyurtma"}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {order?.order_submodel?.name || "Submodel yo'q"}{" "}
                            <span className="font-bold">
                              {order?.order_quantity}
                            </span>{" "}
                            dona
                          </p>
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-300"
                    />
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Bugungi daromad</p>
                      <p className="mt-1 text-base font-bold text-emerald-600">
                        {formatNumber(earned)} so'm
                      </p>
                    </div>

                    <div
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white ${
                        status?.color || "bg-slate-500"
                      }`}
                    >
                      {status?.text || "Noma'lum"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StarterPage;

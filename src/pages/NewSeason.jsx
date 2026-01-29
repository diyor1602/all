import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Wallet,
  CalendarDays,
  Sparkles,
  Pizza,
  Swords,
  Trophy,
  SunSnow,
  Package, // Yangi ikonka
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

// --- Helper: Custom Uzbek Day Formatter ---
const getUzbekDay = (dateString) => {
  const days = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Juma", "Shan"];
  const date = new Date(dateString);
  return days[date.getDay()];
};

// --- Helper: Animated Counter ---
const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) return;
    let timer = setInterval(() => {
      start += Math.ceil((end - start) / 10);
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setDisplayValue(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return new Intl.NumberFormat("ru-RU").format(displayValue);
};

const NewSeason = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("history"); // 'history' yoki 'models'
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/calculateSeason", {
        params: { month: selectedMonth },
      });
      setData(res.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const currentDate = new Date(selectedMonth + "-01");
    currentDate.setMonth(currentDate.getMonth() + direction);
    const newMonth = currentDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
    localStorage.setItem("newSeasonSelectedMonth", newMonth);
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  const getAllDaysInMonth = (monthString) => {
    const [year, month] = monthString.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const allDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      allDays.push({
        date: dateStr,
        minutes: 0,
        amount: 0,
        per_minute_sum: data?.item?.per_minute_sum || 0,
      });
    }
    return allDays;
  };

  const getCompleteDaysList = () => {
    if (!data?.item?.days) return [];
    const allDays = getAllDaysInMonth(selectedMonth);
    const apiDays = data.item.days;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apiDaysMap = new Map();
    apiDays.forEach((day) => apiDaysMap.set(day.date, day));

    return allDays
      .filter((day) => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate <= today;
      })
      .map((day) => apiDaysMap.get(day.date) || day);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-20 backdrop-blur-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="relative mx-1">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
              />
              <div className="px-3 py-1 bg-slate-100 rounded-md text-sm font-bold text-slate-700 min-w-[90px] text-center">
                {selectedMonth}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto pt-6 px-4 space-y-5">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* --- Premium Money Card --- */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-7 text-white">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 opacity-90">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-wide">
                      Jami Mablag'
                    </span>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1 mt-2 mb-6">
                  <h2 className="text-4xl font-extrabold tracking-tight">
                    <AnimatedCounter value={data?.item?.total_amount} />
                  </h2>
                  <span className="text-xl font-medium text-emerald-100/80">
                    so'm
                  </span>
                </div>
                <div className="text-sm font-medium text-emerald-100/80">
                  {formatNumber(data?.item?.total_qty, 0)} dona tikildi
                </div>
              </div>
            </div>

            {/* --- Forecast Card --- */}
            <div className="rounded-2xl bg-white border border-emerald-100 shadow-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Prognoz Mavsum
                  </h3>
                </div>
                <SunSnow className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-2xl font-extrabold text-emerald-700">
                  {formatNumber(data?.item?.possible_amount, 0)}{" "}
                  <span className="text-sm">so'm</span>
                </p>
              </div>
            </div>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Clock />}
                title="Bajarildi"
                value={data?.item?.total_minutes}
                unit="daq"
                color="blue"
              />
              <StatCard
                icon={<Pizza />}
                title="Tarif"
                value={data?.item?.per_minute_sum}
                unit="so'm"
                color="orange"
              />
            </div>

            {/* --- TABS SECTION --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Tab Switcher */}
              <div className="flex p-1.5 bg-slate-100/50 m-4 rounded-2xl">
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "history"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Kunlik
                </button>
                <button
                  onClick={() => setActiveTab("models")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "models"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Modellar
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {activeTab === "history" ? (
                  /* --- Kunlik Tarix Ro'yxati --- */
                  getCompleteDaysList()
                    ?.sort((a, b) => new Date(b?.date) - new Date(a?.date))
                    ?.map((day, i) => (
                      <div
                        key={i}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border-2 ${day.amount > 0 ? "bg-white border-emerald-100" : "bg-slate-50 border-slate-200"}`}
                          >
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {getUzbekDay(day?.date)}
                            </span>
                            <span
                              className={`text-base font-bold ${day.amount > 0 ? "text-slate-800" : "text-slate-400"}`}
                            >
                              {day?.date?.split("-")[2]}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-bold ${day.amount > 0 ? "text-slate-700" : "text-slate-400"}`}
                            >
                              {day.amount > 0
                                ? `${formatNumber(day?.minutes, 0)} daqiqa`
                                : "Ishlanmagan"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {day.amount > 0
                                ? `${day?.per_minute_sum} so'm dan`
                                : "Daromad yo'q"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold text-base ${day.amount > 0 ? "text-emerald-600" : "text-slate-300"}`}
                          >
                            {day.amount > 0
                              ? `+${formatNumber(day?.amount, 0)}`
                              : "0 so'm"}
                          </span>
                        </div>
                      </div>
                    ))
                ) : /* --- Modellari bo'yicha (ORDERS) --- */
                data?.item?.orders?.length > 0 ? (
                  data.item.orders
                    .sort((a, b) => a.order_name.localeCompare(b.order_name))
                    .map((order, i) => (
                      <div
                        key={i}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                            <Package className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">
                              {order.order_name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatNumber(order.total_qty, 0)} dona •{" "}
                              {formatNumber(order.total_minutes, 0)} daq
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="font-bold text-emerald-600 text-base">
                            {formatNumber(order.total_amount, 0)}
                          </span>
                          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            so'm
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    Ma'lumot topilmadi
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Yordamchi komponentlar
const StatCard = ({ icon, title, value, unit, color }) => {
  const colors = {
    blue: "from-blue-50 to-indigo-100 border-blue-200 text-blue-600 bg-blue-500",
    orange:
      "from-orange-50 to-amber-100 border-orange-200 text-orange-600 bg-orange-500",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} p-4 rounded-2xl shadow-sm border flex flex-col justify-between`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white shadow-lg ${colors[color].split(" ").pop()}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium">{title}</p>
        <p className="text-lg font-bold text-slate-900">
          {formatNumber(value, 0)}{" "}
          <span className="text-xs font-normal opacity-70">{unit}</span>
        </p>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-48 bg-slate-200 rounded-[2rem] w-full"></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="h-28 bg-slate-200 rounded-2xl"></div>
      <div className="h-28 bg-slate-200 rounded-2xl"></div>
    </div>
    <div className="h-64 bg-slate-200 rounded-3xl w-full"></div>
  </div>
);

export default NewSeason;

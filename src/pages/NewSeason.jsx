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
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

// --- Helper: Custom Uzbek Day Formatter ---
const getUzbekDay = (dateString) => {
  const days = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Juma", "Shan"];
  const date = new Date(dateString);
  return days[date.getDay()];
};

// --- Helper: Animated Counter for Money Feeling ---
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

  const getProgress = (current, total) => {
    if (!total) return 0;
    return Math.min((current / total) * 100, 100);
  };

  // Helper function to generate all days in a month
  const getAllDaysInMonth = (monthString) => {
    const [year, month] = monthString.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate(); // Get last day of month

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

  // Merge API data with all days of the month
  const getCompleteDaysList = () => {
    if (!data?.item?.days) return [];

    const allDays = getAllDaysInMonth(selectedMonth);
    const apiDays = data.item.days;

    // Get today's date and set to start of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a map of API days by date for easy lookup
    const apiDaysMap = new Map();
    apiDays.forEach((day) => {
      apiDaysMap.set(day.date, day);
    });

    // Merge API data with all days, but filter out future days
    return allDays
      .filter((day) => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate <= today; // Only show today or past days
      })
      .map((day) => {
        const apiDay = apiDaysMap.get(day.date);
        return apiDay || day; // Use API data if available, otherwise use default empty day
      });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-20 backdrop-blur-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center">
          {/* Date Picker Control */}
          <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="relative mx-1">
              {/* FIXED: Standard HTML input to ensure touch events work reliably */}
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
              className="h-8 w-8 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto pt-6 space-y-5">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* --- Premium Money Card --- */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/20 transform transition-transform hover:scale-[1.01] duration-300">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800"></div>

              {/* Decorative "Shine" Circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>

              <div className="relative z-10 p-7 text-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 opacity-90">
                    <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                      <Wallet className="w-4 h-4 text-emerald-50" />
                    </div>
                    <span className="text-sm font-medium tracking-wide">
                      Jami Mablag'
                    </span>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>

                {/* Big Money Display */}
                <div className="flex items-baseline gap-1 mt-2 mb-6">
                  <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
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

            {/* --- Season Forecast Card (FIXED) --- */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-emerald-100 shadow-lg">
              {/* Soft gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Prognoz</p>
                      <h3 className="text-sm font-bold text-slate-800">
                        Mavsum Davomida
                      </h3>
                    </div>
                  </div>
                  <SunSnow className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Main Forecast Value */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-emerald-700 mb-1 font-medium">
                    Kutilayotgan Daromad
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {formatNumber(data?.item?.possible_amount, 0)}{" "}
                    <span className="text-sm font-medium">so'm</span>
                  </p>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Swords className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-slate-500 font-medium">
                        Jami Soni
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {formatNumber(data?.item?.possible_qty, 0)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        dona
                      </span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-orange-600" />
                      <p className="text-xs text-slate-500 font-medium">
                        O‘rtacha Narx
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {formatNumber(
                        data?.item?.possible_amount / data?.item?.possible_qty,
                        0,
                      )}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        so'm
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-2xl shadow-sm border border-blue-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-3 text-white shadow-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Bajarildi</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Intl.NumberFormat("ru-RU").format(
                      data?.item?.total_minutes,
                    )}{" "}
                    <span className="text-xs font-normal text-blue-600">
                      daq
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-4 rounded-2xl shadow-sm border border-orange-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center mb-3 text-white shadow-lg">
                  <Pizza className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">Tarif</p>
                  <p className="text-lg font-bold text-orange-900">
                    {new Intl.NumberFormat("ru-RU").format(
                      data?.item?.per_minute_sum,
                    )}{" "}
                    <span className="text-xs font-normal text-orange-600">
                      so'm
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* --- Transaction List --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-slate-400" />
                  Kunlik Tarix
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {getCompleteDaysList()
                  ?.sort((a, b) => new Date(b?.date) - new Date(a?.date))
                  ?.map((day, i) => (
                    <div
                      key={i}
                      className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Date Box */}
                        <div
                          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border-2 shadow-sm ${
                            day.amount > 0
                              ? "bg-white border-emerald-100"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {getUzbekDay(day?.date)}
                          </span>
                          <span
                            className={`text-base font-bold leading-none mt-0.5 ${
                              day.amount > 0
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {day?.date?.split("-")[2]}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-bold flex items-center gap-1 ${
                              day.amount > 0
                                ? "text-slate-700"
                                : "text-slate-400"
                            }`}
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

                      {/* Amount */}
                      <div className="flex flex-col items-end">
                        {day.amount > 0 ? (
                          <>
                            <span className="font-bold text-emerald-600 text-base">
                              +
                              {new Intl.NumberFormat("ru-RU").format(
                                day?.amount,
                              )}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600/70 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
                              <span>💎 Barakali</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-300 text-base">
                              0 so'm
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md mt-1">
                              <span>🌙 Tinch kun</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
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

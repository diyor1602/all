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
  Target,
  Sparkles,
  Zap,
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

    let totalMilSecDur = 1000;

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-30 backdrop-blur-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">Mavsum</span>
          </div>

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
                      Jami Ishlandi
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

                {/* Progress Bar with "Glow" */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-emerald-100/90">
                    <span>
                      Maqsad: {formatNumber(data?.item?.possible_amount, 0)}
                    </span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-white">
                      {getProgress(
                        data?.item?.total_amount,
                        data?.item?.possible_amount,
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm p-[2px]">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-[0_0_10px_rgba(253,224,71,0.5)] transition-all duration-1000 ease-out"
                      style={{
                        width: `${getProgress(data?.item?.total_amount, data?.item?.possible_amount)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    Ish vaqti
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {new Intl.NumberFormat("ru-RU").format(
                      data?.item?.total_minutes,
                    )}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      daq
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3 text-orange-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Tarif</p>
                  <p className="text-lg font-bold text-slate-900">
                    {new Intl.NumberFormat("ru-RU").format(
                      data?.item?.per_minute_sum,
                    )}{" "}
                    <span className="text-xs font-normal text-slate-400">
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
                {data?.item?.days
                  ?.sort((a, b) => new Date(b?.date) - new Date(a?.date))
                  ?.map((day, i) => (
                    <div
                      key={i}
                      className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Date Box */}
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {getUzbekDay(day?.date)}
                          </span>
                          <span className="text-base font-bold text-slate-800 leading-none mt-0.5">
                            {day?.date?.split("-")[2]}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            {formatNumber(day?.minutes, 0)} daqiqa
                          </span>
                          <span className="text-xs text-slate-400">
                            {day?.per_minute_sum} so'm dan
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-emerald-600 text-base">
                          +{new Intl.NumberFormat("ru-RU").format(day?.amount)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600/70 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
                          <Zap className="w-3 h-3" />
                          <span>Muvaffaqiyatli</span>
                        </div>
                      </div>
                    </div>
                  ))}

                {(!data?.item?.days || data?.item?.days.length === 0) && (
                  <div className="py-10 text-center text-slate-400">
                    <p>Bu oyda hali ma'lumot yo'q</p>
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

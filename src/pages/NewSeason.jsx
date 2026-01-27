import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Wallet,
  CalendarDays,
  Target,
  MoreHorizontal,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

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

  // Helper for progress percentage
  const getProgress = (current, total) => {
    if (!total) return 0;
    return Math.min((current / total) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">
              Mavsum
            </span>
          </div>

          <div className="flex items-center bg-gray-100/80 p-1 rounded-full border border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </Button>

            <div className="relative group mx-1">
              {/* Hidden native input, overlaid with custom text */}
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
              />
              <span className="text-sm font-semibold text-gray-700 px-2 py-1 block min-w-[90px] text-center pointer-events-none">
                {selectedMonth}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-6 space-y-6">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* --- Hero Card: Balance --- */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>

              <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-medium mb-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Topilgan summa
                </p>
                <h2 className="text-4xl font-bold tracking-tight mb-4">
                  {formatNumber(data?.item?.total_amount, 0)}
                  <span className="text-2xl text-indigo-200 font-normal ml-2">
                    so'm
                  </span>
                </h2>

                {/* Progress Bar inside Hero */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-indigo-100/80">
                    <span>
                      Maqsad: {formatNumber(data?.item?.possible_amount, 0)}
                    </span>
                    <span>
                      {getProgress(
                        data?.item?.total_amount,
                        data?.item?.possible_amount,
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${getProgress(data?.item?.total_amount, data?.item?.possible_amount)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Secondary Stats Grid --- */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Clock}
                label="Ish vaqti"
                value={`${formatNumber(data?.item?.total_minutes, 0)} daq`}
                subtext={`Jami: ${formatNumber(data?.item?.possible_minutes, 0)}`}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <StatCard
                icon={Target}
                label="Tarif"
                value={`${formatNumber(data?.item?.per_minute_sum, 0)} so'm`}
                subtext="Har daqiqa uchun"
                color="text-orange-600"
                bg="bg-orange-50"
              />
            </div>

            {/* --- History List (Unified for Mobile & Desktop) --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                  Kunlik hisobot
                </h3>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  {data?.item?.days?.length || 0} kun
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {data?.item?.days?.map((day, i) => (
                  <div
                    key={i}
                    className="group p-4 hover:bg-gray-50/80 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {/* Date Box */}
                      <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-colors">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          {new Date(day?.date).toLocaleDateString("uz-UZ", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {day?.date?.split("-")[2]}
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium text-gray-700">
                            {day?.minutes} daqiqa
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Tarif: {day?.per_minute_sum} s/d
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        +{formatNumber(day?.amount, 0)}
                      </p>
                      <p className="text-xs text-gray-400 uppercase font-medium">
                        so'm
                      </p>
                    </div>
                  </div>
                ))}

                {(!data?.item?.days || data?.item?.days.length === 0) && (
                  <div className="p-8 text-center text-gray-400">
                    <MoreHorizontal className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Ma'lumot topilmadi</p>
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

// --- Sub Components ---

const StatCard = ({ icon: Icon, label, value, subtext, color, bg }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
    <div
      className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}
    >
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-1">{subtext}</p>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-48 bg-gray-200 rounded-3xl w-full"></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="h-32 bg-gray-200 rounded-2xl"></div>
      <div className="h-32 bg-gray-200 rounded-2xl"></div>
    </div>
    <div className="h-64 bg-gray-200 rounded-3xl w-full"></div>
  </div>
);

export default NewSeason;

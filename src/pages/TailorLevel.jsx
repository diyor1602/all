import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  History,
  Wallet,
  Award,
  Check,
  X,
  TrendingUp,
  Info,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const levelTheme = {
  bronze: {
    label: "Bronza",
    color: "text-amber-700",
    bg: "bg-orange-200",
    border: "border-orange-200",
    icon: "🥉",
    accent: "bg-orange-500",
    description: "+3% qo'shib beriladi",
    more_details:
      "Siz bu darajada bo'lgan vaqtingizdagi bajargan ishlariz uchun har biriga +3% qo'shib beriladi",
  },
  silver: {
    label: "Kumush",
    color: "text-slate-600",
    bg: "bg-slate-200",
    border: "border-slate-300",
    icon: "🥈",
    accent: "bg-slate-400",
    description: "+5% qo'shib beriladi",
    more_details:
      "Siz bu darajada bo'lgan vaqtingizdagi bajargan ishlariz uchun har biriga +5% qo'shib beriladi",
  },
  gold: {
    label: "Oltin",
    color: "text-yellow-700",
    bg: "bg-yellow-200",
    border: "border-yellow-300",
    icon: "🥇",
    accent: "bg-yellow-500",
    description: "+8% qo'shib beriladi",
    more_details:
      "Siz bu darajada bo'lgan vaqtingizdagi bajargan ishlariz uchun har biriga +8% qo'shib beriladi",
  },
  empty: {
    label: "Boshlang'ich",
    color: "text-green-700",
    bg: "bg-green-200",
    border: "border-green-200",
    icon: "🌱",
    accent: "bg-green-300",
  },
};

const TailorLevel = () => {
  const { toast } = useToast();
  const [data, setData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("levelSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(true);

  const currentLevel = data.employee?.current_level;
  const theme = levelTheme[currentLevel] || levelTheme.empty;
  const history = data.data?.employee_level_histories || [];
  const bonusHistory = data.data?.employee_money_logs || [];
  const [activeTab, setActiveTab] = useState("levels");
  const [showDetails, setShowDetails] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/myLevel", {
        params: { month: selectedMonth },
      });
      setData(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  const navigateMonth = (step) => {
    const date = new Date(selectedMonth + "-01");
    date.setMonth(date.getMonth() + step);
    const newMonth = date.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
    localStorage.setItem("levelSelectedMonth", newMonth);
  };

  return (
    <div className="max-w-md mx-auto mt-6 space-y-6 bg-[#F8FAFC] min-h-screen pb-24">
      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(-1)}
          className="rounded-xl"
          disabled={loading}
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Button>
        <span className="font-bold text-gray-800 capitalize">
          {loading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            new Date(selectedMonth).toLocaleString("ru-RU", {
              month: "long",
              year: "numeric",
            })
          )}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(1)}
          className="rounded-xl"
          disabled={loading}
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </Button>
      </div>

      {/* Main Achievement Card */}
      {loading ? (
        <div className="relative overflow-hidden rounded-[2rem] p-8 border-b-4 shadow-xl bg-gradient-to-b bg-gray-100 border-gray-200">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse mb-4" />
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-10 w-28 mb-2" />
            <Skeleton className="h-4 w-20 mb-4" />
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 w-full shadow-inner border border-white">
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                <Wallet className="w-4 h-4" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-24 mx-auto" />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`relative overflow-hidden rounded-[2rem] p-8 border-b-4 shadow-xl transition-all duration-500 bg-gradient-to-b ${theme.bg} ${theme.border}`}
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="text-7xl mb-4 drop-shadow-md">{theme.icon}</div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
              Sizning joriy darajangiz
            </p>
            <h2 className={`text-4xl font-black mb-2 ${theme.color}`}>
              {theme.label}
            </h2>
            {theme.description && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 underline decoration-dotted underline-offset-2"
                >
                  {theme.description}
                  <Info className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}

            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 w-full shadow-inner border border-white mt-5">
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Bonuslar
                </span>
              </div>
              <p className="text-3xl font-black text-gray-800">
                {data.summary?.money_sum
                  ? `+ ${formatNumber(data.summary.money_sum, 0)} so'm`
                  : "0 so'm"}
              </p>
            </div>
          </div>
          {/* Subtle Decorative Element */}
          <div
            className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 ${theme.accent}`}
          />

          {/* Details Modal/Tooltip */}
          {showDetails && theme.more_details && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[2rem] z-20">
              <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm shadow-xl border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full ${theme.bg} flex items-center justify-center`}
                    >
                      <span className="text-lg">{theme.icon}</span>
                    </div>
                    <h4 className="font-bold text-gray-800">
                      {theme.label} darajasi
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {theme.more_details}
                </p>
                <button
                  onClick={() => setShowDetails(false)}
                  className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl transition-colors"
                >
                  Tushunarli
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="space-y-4">
          {/* Next Level Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-600">Keyingi bosqich</h3>
            <div className="flex items-center gap-2">
              {loading ? (
                <>
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="h-5 w-16" />
                </>
              ) : (
                <>
                  <div className="text-xl">
                    {levelTheme[data?.progress?.next_level]?.icon || "🎯"}
                  </div>
                  <div className="text-lg">
                    {levelTheme[data?.progress?.next_level]?.label || "—"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">
                Progress
              </span>
              <span className="text-sm font-bold text-gray-800">
                {data?.progress?.percent || 0}%
              </span>
            </div>
            <Progress
              value={data?.progress?.percent || 0}
              className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-blue-600"
            />
          </div>

          {/* Todo Item */}
          {data?.progress?.todo && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-medium text-amber-800">
                {data.progress.todo}
              </p>
            </div>
          )}

          {/* Status Indicators */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border p-4 bg-gray-50 border-gray-200">
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="text-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-4 bg-gray-50 border-gray-200">
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="text-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`rounded-xl border p-4 transition-colors duration-200 ${
                  data?.progress?.qc?.ok
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      data?.progress?.qc?.ok ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {data?.progress?.qc?.ok ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <X className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm font-semibold ${
                        data?.progress?.qc?.ok
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      Sifat bo'yicha
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 transition-colors duration-200 ${
                  data?.progress?.attendance?.ok
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      data?.progress?.attendance?.ok
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {data?.progress?.attendance?.ok ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <X className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm font-semibold ${
                        data?.progress?.attendance?.ok
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      Davomat bo'yicha
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Section with Tabs */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex items-center justify-center gap-2 px-1">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Tarix
          </h3>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab("levels")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === "levels"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Award className="w-4 h-4" />
            Darajalar
          </button>
          <button
            onClick={() => setActiveTab("bonuses")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === "bonuses"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Bonuslar
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-3">
          {activeTab === "levels" ? (
            // Levels History Tab
            <>
              {loading ? (
                // Loading skeletons for history items
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="w-2 h-2 rounded-full" />
                  </div>
                ))
              ) : history.length > 0 ? (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95"
                  >
                    <div className="text-3xl grayscale-[0.5] group-hover:grayscale-0">
                      {levelTheme[item.level]?.icon || "🌱"}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 leading-tight">
                        {levelTheme[item.level]?.label || item.level}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {item.start_date?.split("-").reverse().join(".")} —{" "}
                        {item.end_date?.split("-").reverse().join(".") ||
                          "Hozirgacha"}
                      </p>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${levelTheme[item.level]?.accent || "bg-gray-200"}`}
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <Award className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm italic font-medium">
                    Darajalar tarixi hali mavjud emas
                  </p>
                </div>
              )}
            </>
          ) : (
            // Bonuses History Tab
            <>
              {loading ? (
                // Loading skeletons for bonus items
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                ))
              ) : bonusHistory.length > 0 ? (
                bonusHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 leading-tight text-sm">
                        {item.reason === "LEVEL_BONUS_SILVER"
                          ? "Kumush darajasi bonusi"
                          : item.reason === "LEVEL_BONUS_GOLD"
                            ? "Oltin darajasi bonusi"
                            : item.reason === "LEVEL_BONUS_BRONZE"
                              ? "Bronza darajasi bonusi"
                              : "Bonus"}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {item.date?.split("-").reverse().join(".")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        + {formatNumber(item.amount, 0)} so'm
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <TrendingUp className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm italic font-medium">
                    Bonuslar tarixi hali mavjud emas
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TailorLevel;

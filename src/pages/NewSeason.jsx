import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlarmClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
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

  const stats = [
    {
      label: "Daqiqasiga",
      value: `${formatNumber(data?.item?.per_minute_sum, 0)} so'm`,
      icon: Target,
      color: "from-orange-500 to-orange-600",
    },
    {
      label: "Jami vaqt",
      value: `${formatNumber(data?.item?.total_minutes, 0)} daqiqa`,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Topilgan",
      value: `${formatNumber(data?.item?.total_amount, 0)} so'm`,
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Kutilmoqda",
      value: `${formatNumber(data?.item?.possible_amount, 0)} so'm`,
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Mobile-Friendly Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="hidden sm:inline">Mavsum Statistikasi</span>
            <span className="sm:hidden">Statistika</span>
          </h1>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Input
              type="month"
              value={selectedMonth}
              className="bg-transparent border-none focus-visible:ring-0 text-sm font-medium shadow-none"
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="shrink-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="animate-pulse">Yuklanmoqda...</p>
          </div>
        ) : (
          <>
            {/* Progress Section - Better Visual Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgressCard
                title="Vaqt Progressi"
                current={data?.item?.total_minutes}
                total={data?.item?.possible_minutes}
                unit="daq"
                color="bg-blue-600"
              />
              <ProgressCard
                title="Mablag' Progressi"
                current={data?.item?.total_amount}
                total={data?.item?.possible_amount}
                unit="so'm"
                color="bg-emerald-600"
              />
            </div>

            {/* Quick Stats Grid - More Compact on Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-white shadow-sm`}
                >
                  <stat.icon className="w-5 h-5 opacity-80 mb-2" />
                  <p className="text-xs font-medium opacity-90 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold truncate">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Daily List - Responsive Table Replacement */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <AlarmClock className="w-5 h-5 text-slate-400" />
                  Kunlik Hisobot
                </h2>
              </div>

              {/* Mobile View: Card List */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {data?.item?.days?.map((day, i) => (
                  <div
                    key={i}
                    className="p-4 active:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-700">
                        {day?.date?.split("-").reverse().join(".")}
                      </span>
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg text-xs">
                        +{formatNumber(day?.amount, 0)} s
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {day?.minutes} daqiqa
                      </div>
                      <div className="text-slate-400">
                        {day?.per_minute_sum} s/dak
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Proper Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Sana</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Summa
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Vaqt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.item?.days?.map((day, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {day?.date}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                          {formatNumber(day?.amount, 0)} so'm
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600">
                          {formatNumber(day?.minutes, 0)} daqiqa
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Sub-component for clean progress bars
const ProgressCard = ({ title, current, total, unit, color }) => {
  const percent = Math.min((current / total) * 100 || 0, 100).toFixed(1);
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-end mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
          <p className="text-lg font-bold text-slate-900">
            {formatNumber(current, 0)}{" "}
            <span className="text-sm font-normal text-slate-400">
              / {formatNumber(total, 0)} {unit}
            </span>
          </p>
        </div>
        <span className={`text-sm font-bold px-2 py-1 rounded-md bg-slate-100`}>
          {percent}%
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-700 ease-in-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default NewSeason;

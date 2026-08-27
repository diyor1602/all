import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import formatNumber from "@/utils/formatNumber";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  RefreshCcw,
  Wallet,
  TrendingUp,
  Building2,
  Truck,
  Utensils,
  FileText,
  PieChart,
  ChevronDown,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Overall3 = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(["2026-07"]);
  const [selectedPreset, setSelectedPreset] = useState("custom");
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());

  // Generate available months (last 120 months = 10 years for preset functionality)
  const availableMonths = Array.from({ length: 120 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7), // YYYY-MM format
      label: date.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      }),
    };
  }).reverse();

  // Generate years for custom selection (10 years back and 2 years forward)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 13 },
    (_, i) => currentYear - 10 + i,
  );

  // Generate months for custom selection
  const monthsList = [
    { value: 0, label: "Январь" },
    { value: 1, label: "Февраль" },
    { value: 2, label: "Март" },
    { value: 3, label: "Апрель" },
    { value: 4, label: "Май" },
    { value: 5, label: "Июнь" },
    { value: 6, label: "Июль" },
    { value: 7, label: "Август" },
    { value: 8, label: "Сентябрь" },
    { value: 9, label: "Октябрь" },
    { value: 10, label: "Ноябрь" },
    { value: 11, label: "Декабрь" },
  ];

  const addCustomMonth = () => {
    const monthValue = `${customYear}-${String(customMonth + 1).padStart(2, "0")}`;
    if (!selectedMonths.includes(monthValue)) {
      setSelectedMonths([...selectedMonths, monthValue]);
      setSelectedPreset("custom");
    }
  };

  // Preset options
  const presetOptions = [
    { value: "1", label: "Oxirgi 1 oy", months: 1 },
    { value: "3", label: "Oxirgi 3 oy", months: 3 },
    { value: "6", label: "Oxirgi 6 oy", months: 6 },
    { value: "12", label: "Oxirgi 12 oy", months: 12 },
    { value: "custom", label: "Tanlash", months: 0 },
  ];

  const handlePresetChange = (value) => {
    setSelectedPreset(value);
    if (value !== "custom") {
      const monthsCount = parseInt(value);
      const selected = availableMonths
        .slice(-monthsCount)
        .map((month) => month.value);
      setSelectedMonths(selected);
    }
  };

  const getMonthLabel = (monthValue) => {
    const [year, month] = monthValue.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    });
  };

  const handleMonthToggle = (monthValue) => {
    setSelectedMonths((prev) =>
      prev.includes(monthValue)
        ? prev.filter((m) => m !== monthValue)
        : [...prev, monthValue],
    );
    setSelectedPreset("custom");
  };

  const clearSelection = () => {
    setSelectedMonths([]);
    setSelectedPreset("custom");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.post("/ceo/expenseBreakdownReport", {
        type: "monthly",
        selectedMonth: selectedMonths,
      });
      setData(response.data);
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
    fetchData();
  }, [selectedMonths]);

  const categoryIcons = {
    tikuv: Building2,
    kroy: Wallet,
    ombor: FileText,
    boshqa_bolimlar: Building2,
    transport: Truck,
    oziq_ovqat: Utensils,
    soliq: PieChart,
    boshqa_harajatlar: Wallet,
  };

  const categoryColors = {
    tikuv: "text-blue-600 bg-blue-50 border-blue-200",
    kroy: "text-emerald-600 bg-emerald-50 border-emerald-200",
    ombor: "text-amber-600 bg-amber-50 border-amber-200",
    boshqa_bolimlar: "text-purple-600 bg-purple-50 border-purple-200",
    transport: "text-orange-600 bg-orange-50 border-orange-200",
    oziq_ovqat: "text-rose-600 bg-rose-50 border-rose-200",
    soliq: "text-indigo-600 bg-indigo-50 border-indigo-200",
    boshqa_harajatlar: "text-slate-600 bg-slate-50 border-slate-200",
  };

  const categoryLabels = {
    tikuv: "Tikuv",
    kroy: "Kroy",
    ombor: "Ombor",
    boshqa_bolimlar: "Boshqa bo'limlar",
    transport: "Transport",
    oziq_ovqat: "Oziq-ovqat",
    soliq: "Soliq",
    boshqa_harajatlar: "Boshqa xarajatlar",
  };

  const ExpenseCard = ({ category, value, percentage, total }) => {
    const Icon = categoryIcons[category] || Wallet;
    const colorClass =
      categoryColors[category] || "text-slate-600 bg-slate-50 border-slate-200";
    const label = categoryLabels[category] || category;

    return (
      <div className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${colorClass}`}>
              <Icon size={18} />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {label}
            </span>
          </div>
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
            {percentage}%
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold text-slate-900">
            {formatNumber(value)} UZS
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-[#f8fafc] min-h-screen font-sans p-6">
      {/* HEADER & FILTERS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Xarajatlar Tahlili
          </h1>
          <p className="text-slate-500 text-xs">
            Oylik xarajatlarning bo'linishi va foizlari
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white shadow-sm border p-4 md:p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Davr:</span>
          </div>

          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Tanlang" />
            </SelectTrigger>
            <SelectContent>
              {presetOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-xs"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPreset === "custom" && (
            <>
              <Separator
                orientation="vertical"
                className="h-8 hidden md:block"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={customYear.toString()}
                  onValueChange={(value) => setCustomYear(parseInt(value))}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue placeholder="Yil" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem
                        key={year}
                        value={year.toString()}
                        className="text-xs"
                      >
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={customMonth.toString()}
                  onValueChange={(value) => setCustomMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Oy" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsList.map((month) => (
                      <SelectItem
                        key={month.value}
                        value={month.value.toString()}
                        className="text-xs"
                      >
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={addCustomMonth}
                  disabled={selectedMonths.includes(
                    `${customYear}-${String(customMonth + 1).padStart(2, "0")}`,
                  )}
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  Qo'shish
                </Button>
              </div>
            </>
          )}

          {selectedMonths.length > 0 && (
            <>
              <Separator
                orientation="vertical"
                className="h-8 hidden md:block"
              />
              <div className="flex flex-wrap gap-2 items-center">
                {selectedMonths.map((monthValue) => {
                  return (
                    <Badge
                      key={monthValue}
                      variant="secondary"
                      className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer"
                      onClick={() => handleMonthToggle(monthValue)}
                    >
                      {getMonthLabel(monthValue)}
                      <X size={12} className="ml-1" />
                    </Badge>
                  );
                })}
                {selectedMonths.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    <X size={12} className="mr-1" />
                    Tozalash
                  </Button>
                )}
              </div>
            </>
          )}

          <Separator orientation="vertical" className="h-8 hidden md:block" />
          <Button
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 px-3 text-xs"
          >
            <RefreshCcw
              size={14}
              className={`${loading ? "animate-spin" : ""} mr-1`}
            />
            {loading ? "Yuklanmoqda..." : "Yangilash"}
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">
            Ma'lumotlar yuklanmoqda...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* TOTAL EXPENSES CARD */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider mb-1">
                    Davr: {data.period?.start_date} - {data.period?.end_date}
                  </p>
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">
                    Jami Xarajatlar
                  </p>
                </div>
                <Wallet className="text-indigo-200" size={28} />
              </div>
              <h2 className="text-2xl font-black mt-3">
                {formatNumber(data.data?.somda?.jami_xarajat)}{" "}
                <span className="text-base font-normal opacity-80">UZS</span>
              </h2>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                  {selectedMonths.length} oy tanlangan
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* EXPENSE BREAKDOWN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.data?.somda || {})
              .filter(([key]) => key !== "jami_xarajat")
              .sort(([keyA], [keyB]) => {
                const percentageA = data.data?.foizda?.[keyA] || 0;
                const percentageB = data.data?.foizda?.[keyB] || 0;
                return percentageB - percentageA;
              })
              .map(([key, value]) => {
                const percentage = data.data?.foizda?.[key] || 0;
                return (
                  <ExpenseCard
                    key={key}
                    category={key}
                    value={value}
                    percentage={percentage}
                    total={data.data?.somda?.jami_xarajat}
                  />
                );
              })}
          </div>

          {/* SUMMARY TABLE */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Xarajatlar Jadvali</CardTitle>
              <CardDescription className="text-xs">
                Bo'limlar bo'yicha xarajatlar tafsiloti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left text-xs font-semibold text-slate-600 p-3">
                        Bo'lim
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 p-3">
                        Xarajat (UZS)
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 p-3">
                        Foiz (%)
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 p-3">
                        Jadval
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.data?.somda || {})
                      .filter(([key]) => key !== "jami_xarajat")
                      .sort(([keyA], [keyB]) => {
                        const percentageA = data.data?.foizda?.[keyA] || 0;
                        const percentageB = data.data?.foizda?.[keyB] || 0;
                        return percentageB - percentageA;
                      })
                      .map(([key, value]) => {
                        const percentage = data.data?.foizda?.[key] || 0;
                        const label = categoryLabels[key] || key;
                        return (
                          <tr
                            key={key}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="text-sm font-medium text-slate-700 p-3">
                              {label}
                            </td>
                            <td className="text-sm text-right text-slate-900 font-semibold p-3">
                              {formatNumber(value)}
                            </td>
                            <td className="text-sm text-right text-slate-600 p-3">
                              {percentage}%
                            </td>
                            <td className="p-3">
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-indigo-500 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                      <td className="text-sm text-slate-900 p-3">Jami</td>
                      <td className="text-sm text-right text-indigo-600 p-3">
                        {formatNumber(data.data?.somda?.jami_xarajat)}
                      </td>
                      <td className="text-sm text-right text-slate-900 p-3">
                        {data.data?.foizda?.jami_xarajat}%
                      </td>
                      <td className="p-3">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-slate-500 font-medium text-sm">Ma'lumotlar yo'q</p>
        </div>
      )}
    </div>
  );
};

export default Overall3;

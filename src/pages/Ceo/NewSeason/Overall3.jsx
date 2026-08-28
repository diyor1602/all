import { useState, useEffect, Fragment } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
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
  X,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import getDollarRate from "@/hooks/getDollarRate";

const Overall3 = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dollarRate, setDollarRate] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(() => {
    const saved = localStorage.getItem("overall3SelectedMonths");
    return saved ? JSON.parse(saved) : ["2026-07"];
  });
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const saved = localStorage.getItem("overall3SelectedPreset");
    return saved || "custom";
  });
  const [customYear, setCustomYear] = useState(() => {
    const saved = localStorage.getItem("overall3CustomYear");
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  const [customMonth, setCustomMonth] = useState(() => {
    const saved = localStorage.getItem("overall3CustomMonth");
    return saved ? parseInt(saved) : new Date().getMonth();
  });

  const [expandedSections, setExpandedSections] = useState({
    boshqa_bolimlar: false,
    boshqa_harajatlar: false,
  });

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
      const newSelection = [...selectedMonths, monthValue];
      setSelectedMonths(newSelection);
      localStorage.setItem(
        "overall3SelectedMonths",
        JSON.stringify(newSelection),
      );
      setSelectedPreset("custom");
      localStorage.setItem("overall3SelectedPreset", "custom");
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
    localStorage.setItem("overall3SelectedPreset", value);
    if (value !== "custom") {
      const monthsCount = parseInt(value);
      const selected = availableMonths
        .slice(-monthsCount)
        .map((month) => month.value);
      setSelectedMonths(selected);
      localStorage.setItem("overall3SelectedMonths", JSON.stringify(selected));
    } else {
      localStorage.setItem(
        "overall3SelectedMonths",
        JSON.stringify(selectedMonths),
      );
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
    setSelectedMonths((prev) => {
      const newSelection = prev.includes(monthValue)
        ? prev.filter((m) => m !== monthValue)
        : [...prev, monthValue];
      localStorage.setItem(
        "overall3SelectedMonths",
        JSON.stringify(newSelection),
      );
      return newSelection;
    });
    setSelectedPreset("custom");
    localStorage.setItem("overall3SelectedPreset", "custom");
  };

  const clearSelection = () => {
    setSelectedMonths([]);
    setSelectedPreset("custom");
    localStorage.setItem("overall3SelectedMonths", JSON.stringify([]));
    localStorage.setItem("overall3SelectedPreset", "custom");
  };

  const toggleSection = (category) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
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

  const applyDollarRate = async () => {
    const rate = await getDollarRate();
    setDollarRate(rate);
  };

  useEffect(() => {
    applyDollarRate();
  }, []);

  // Calculate derived values
  const calculatedValues =
    data?.data && dollarRate
      ? {
          revenueUZS: data.data.jami_daromad_usd * dollarRate,
          expensesUZS: data.data.jami_xarajat,
          profitUZS:
            data.data.jami_daromad_usd * dollarRate - data.data.jami_xarajat,
          profitUSD:
            data.data.jami_daromad_usd - data.data.jami_xarajat / dollarRate,
          profitMargin:
            data.data.jami_daromad_usd > 0
              ? ((data.data.jami_daromad_usd * dollarRate -
                  data.data.jami_xarajat) /
                  (data.data.jami_daromad_usd * dollarRate)) *
                100
              : 0,
        }
      : null;

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

  const ExpenseCard = ({
    category,
    value,
    percentage,
    total,
    dollarRate,
    isExpandable,
    expandedItems,
    onToggle,
  }) => {
    const Icon = categoryIcons[category] || Wallet;
    const colorClass =
      categoryColors[category] || "text-slate-600 bg-slate-50 border-slate-200";
    const label = categoryLabels[category] || category;
    const valueUSD = dollarRate ? value / dollarRate : null;
    const isExpanded = expandedSections[category] || false;

    return (
      <div className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow h-fit">
        <div
          className={`flex items-center justify-between mb-3 ${isExpandable ? "cursor-pointer" : ""}`}
          onClick={() => isExpandable && onToggle(category)}
        >
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${colorClass}`}>
              <Icon size={18} />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {label}
            </span>
            {isExpandable &&
              (isExpanded ? (
                <ChevronUp size={16} className="text-slate-400" />
              ) : (
                <ChevronDown size={16} className="text-slate-400" />
              ))}
          </div>
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
            {percentage}%
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold text-slate-900">
            {formatNumber(value)} UZS
          </p>
          <p className="text-xs text-slate-500">
            {valueUSD !== null ? formatNumber(valueUSD) : "..."} USD
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {isExpandable &&
          isExpanded &&
          expandedItems &&
          expandedItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-600 p-2">
                      Nomi
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 p-2">
                      Summa (UZS)
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 p-2">
                      Summa (USD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expandedItems.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="text-xs font-medium text-slate-700 p-2">
                        {item.nomi}
                      </td>
                      <td className="text-xs text-right text-slate-900 font-semibold p-2">
                        {formatNumber(item.summa)}
                      </td>
                      <td className="text-xs text-right text-slate-600 p-2">
                        {dollarRate
                          ? formatNumber(item.summa / dollarRate)
                          : "..."}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="text-xs text-slate-900 p-2">Jami</td>
                    <td className="text-xs text-right text-indigo-600 p-2">
                      {formatNumber(
                        expandedItems.reduce(
                          (sum, item) => sum + item.summa,
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-xs text-right text-slate-600 p-2">
                      {dollarRate
                        ? formatNumber(
                            expandedItems.reduce(
                              (sum, item) => sum + item.summa,
                              0,
                            ) / dollarRate,
                          )
                        : "..."}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
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
                  onValueChange={(value) => {
                    setCustomYear(parseInt(value));
                    localStorage.setItem("overall3CustomYear", value);
                  }}
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
                  onValueChange={(value) => {
                    setCustomMonth(parseInt(value));
                    localStorage.setItem("overall3CustomMonth", value);
                  }}
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
      {loading || !dollarRate ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">
            {!dollarRate ? "Kurs yuklanmoqda..." : "Ma'lumotlar yuklanmoqda..."}
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* REVENUE CARD */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Davr: {data.period?.start_date} - {data.period?.end_date}
                    </p>
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">
                      Jami Daromad
                    </p>
                  </div>
                  <TrendingUp className="text-emerald-200" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {formatNumber(data.data?.jami_daromad_usd)}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {calculatedValues
                    ? formatNumber(calculatedValues.revenueUZS)
                    : "..."}{" "}
                  UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    {data.data?.buyurtmalar_soni} buyurtma
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    {data.data?.tikilgan_soni} dona tikilgan
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Kurs: {formatNumber(dollarRate)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* EXPENSES CARD */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white ">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-rose-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Davr: {data.period?.start_date} - {data.period?.end_date}
                    </p>
                    <p className="text-rose-100 text-sm font-medium uppercase tracking-wider">
                      Jami Xarajatlar
                    </p>
                  </div>
                  <Wallet className="text-rose-200" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {dollarRate
                    ? formatNumber(data.data?.jami_xarajat / dollarRate)
                    : "..."}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-rose-100 text-sm mt-1">
                  {formatNumber(data.data?.jami_xarajat)} UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    {selectedMonths.length} oy tanlangan
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* PROFIT CARD */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Davr: {data.period?.start_date} - {data.period?.end_date}
                    </p>
                    <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">
                      Sof Foyda
                    </p>
                  </div>
                  <CircleDollarSign className="text-indigo-200" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {calculatedValues
                    ? formatNumber(calculatedValues.profitUSD)
                    : "..."}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {calculatedValues
                    ? formatNumber(calculatedValues.profitUZS)
                    : "..."}{" "}
                  UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Rentabellik:{" "}
                    {calculatedValues
                      ? formatNumber(calculatedValues.profitMargin)
                      : "..."}
                    %
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

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
                const isExpandable =
                  key === "boshqa_bolimlar" || key === "boshqa_harajatlar";
                const expandedItems = isExpandable
                  ? data.data?.tafsilotlar?.[key]
                  : null;

                return (
                  <ExpenseCard
                    key={key}
                    category={key}
                    value={value}
                    percentage={percentage}
                    total={data.data?.somda?.jami_xarajat}
                    dollarRate={dollarRate}
                    isExpandable={isExpandable}
                    expandedItems={expandedItems}
                    onToggle={toggleSection}
                  />
                );
              })}
          </div>

          {/* KEY PERFORMANCE INDICATORS */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Ko'rsatkichlar</CardTitle>
              <CardDescription className="text-xs">
                Asosiy ishlab chiqarish ko'rsatkichlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.data?.korsatkichlar && (
                  <>
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        Bir mahsulot narxi
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(
                          data.data.korsatkichlar.bir_mahsulot_narxi_som,
                        )}{" "}
                        UZS
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        O'rtacha tikuvchi soni
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(
                          data.data.korsatkichlar.ortacha_tikuvchi_soni,
                        )}{" "}
                        kishi
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        O'rtacha ishchi soni (umumiy)
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(
                          data.data.korsatkichlar.ortacha_ishchi_soni_umumiy,
                        )}{" "}
                        kishi
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        Bir xodimga (davr uchun)
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(
                          data.data.korsatkichlar.bir_xodimga_davr_uchun_som,
                        )}{" "}
                        UZS
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        Bir xodimga (kunlik)
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(
                          data.data.korsatkichlar.bir_xodimga_kunlik_som,
                        )}{" "}
                        UZS
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        Transport (bir xodimga davr uchun)
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(
                          data.data.korsatkichlar
                            .transport_bir_xodimga_davr_uchun_som,
                        )}{" "}
                        UZS
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        Transport (bir xodimga kunlik)
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(
                          data.data.korsatkichlar
                            .transport_bir_xodimga_kunlik_som,
                        )}{" "}
                        UZS
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* DETAILED BREAKDOWN */}

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
                        Xarajat (USD)
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
                        const valueUSD = dollarRate ? value / dollarRate : null;
                        const isExpandable =
                          key === "boshqa_bolimlar" ||
                          key === "boshqa_harajatlar";
                        const isExpanded = expandedSections[key] || false;
                        const expandedItems = isExpandable
                          ? data.data?.tafsilotlar?.[key]
                          : null;

                        return (
                          <Fragment key={key}>
                            <tr
                              className={`border-b border-slate-100 ${isExpandable ? "cursor-pointer hover:bg-slate-50" : ""}`}
                              onClick={() => isExpandable && toggleSection(key)}
                            >
                              <td className="text-sm font-medium text-slate-700 p-3">
                                <div className="flex items-center gap-2">
                                  {label}
                                  {isExpandable &&
                                    (isExpanded ? (
                                      <ChevronUp
                                        size={14}
                                        className="text-slate-400"
                                      />
                                    ) : (
                                      <ChevronDown
                                        size={14}
                                        className="text-slate-400"
                                      />
                                    ))}
                                </div>
                              </td>
                              <td className="text-sm text-right text-slate-900 font-semibold p-3">
                                {formatNumber(value)}
                              </td>
                              <td className="text-sm text-right text-slate-600 p-3">
                                {valueUSD !== null
                                  ? formatNumber(valueUSD)
                                  : "..."}
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

                            {isExpandable &&
                              isExpanded &&
                              expandedItems &&
                              expandedItems.length > 0 && (
                                <tr key={`${key}-expanded`}>
                                  <td colSpan={5} className="p-0">
                                    <div className="bg-slate-50 p-3 border-b border-slate-200">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b border-slate-200">
                                            <th className="text-left text-xs font-semibold text-slate-600 p-2">
                                              Nomi
                                            </th>
                                            <th className="text-right text-xs font-semibold text-slate-600 p-2">
                                              Summa (UZS)
                                            </th>
                                            <th className="text-right text-xs font-semibold text-slate-600 p-2">
                                              Summa (USD)
                                            </th>
                                            <th className="text-right text-xs font-semibold text-slate-600 p-2">
                                              Foiz (%)
                                            </th>
                                            <th className="text-right text-xs font-semibold text-slate-600 p-2">
                                              Jadval
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {expandedItems.map((item, index) => {
                                            const itemPercentage =
                                              (item.summa / value) * 100;
                                            return (
                                              <tr
                                                key={index}
                                                className="border-b border-slate-100 hover:bg-slate-100"
                                              >
                                                <td className="text-xs font-medium text-slate-700 p-2 pl-4">
                                                  {item.nomi}
                                                </td>
                                                <td className="text-xs text-right text-slate-900 font-semibold p-2">
                                                  {formatNumber(item.summa)}
                                                </td>
                                                <td className="text-xs text-right text-slate-600 p-2">
                                                  {dollarRate
                                                    ? formatNumber(
                                                        item.summa / dollarRate,
                                                      )
                                                    : "..."}
                                                </td>
                                                <td className="text-xs text-right text-slate-600 p-2">
                                                  {itemPercentage.toFixed(1)}%
                                                </td>
                                                <td className="p-2">
                                                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                    <div
                                                      className="bg-indigo-400 h-1.5 rounded-full"
                                                      style={{
                                                        width: `${itemPercentage}%`,
                                                      }}
                                                    />
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                        <tfoot>
                                          <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                                            <td className="text-xs text-slate-900 p-2 pl-4">
                                              Jami
                                            </td>
                                            <td className="text-xs text-right text-indigo-600 p-2">
                                              {formatNumber(
                                                expandedItems.reduce(
                                                  (sum, item) =>
                                                    sum + item.summa,
                                                  0,
                                                ),
                                              )}
                                            </td>
                                            <td className="text-xs text-right text-slate-600 p-2">
                                              {dollarRate
                                                ? formatNumber(
                                                    expandedItems.reduce(
                                                      (sum, item) =>
                                                        sum + item.summa,
                                                      0,
                                                    ) / dollarRate,
                                                  )
                                                : "..."}
                                            </td>
                                            <td className="text-xs text-right text-slate-900 p-2">
                                              100%
                                            </td>
                                            <td className="p-2">
                                              <div className="w-full bg-slate-300 rounded-full h-1.5">
                                                <div
                                                  className="bg-indigo-500 h-1.5 rounded-full"
                                                  style={{ width: "100%" }}
                                                />
                                              </div>
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </Fragment>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                      <td className="text-sm text-slate-900 p-3">Jami</td>
                      <td className="text-sm text-right text-indigo-600 p-3">
                        {formatNumber(data.data?.somda?.jami_xarajat)}
                      </td>
                      <td className="text-sm text-right text-slate-600 p-3">
                        {dollarRate
                          ? formatNumber(
                              data.data?.somda?.jami_xarajat / dollarRate,
                            )
                          : "..."}
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

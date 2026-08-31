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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calculator,
  RefreshCcw,
  Wallet,
  Users,
  DollarSign,
  Package,
  Clock,
  CalendarRange,
  Info,
  AlertTriangle,
  Gauge,
  TriangleAlert,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthly_expence_types } from "@/lib/monthlyExpenceTypes";
import { cn } from "@/lib/utils";

const seasonTypes = [
  { value: "summer", label: "Bahor" },
  { value: "winter", label: "Qish" },
];

const getSeasonLabel = (year, type) => {
  const typeLabel = seasonTypes.find((s) => s.value === type)?.label || type;
  return `${year} ${typeLabel} mavsum`;
};

const COST_BREAKDOWN_META = {
  rasxod: { label: "Rasxod (mato/material)", color: "bg-indigo-500" },
  season_salary: { label: "Mavsumiy ish haqi", color: "bg-emerald-500" },
  attendance: { label: "Davomat", color: "bg-amber-500" },
  transport: { label: "Transport", color: "bg-sky-500" },
  monthly_expense: { label: "Oylik xarajatlar", color: "bg-rose-500" },
};

const Overall4 = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [referenceYear, setReferenceYear] = useState(() => {
    return localStorage.getItem("overall4ReferenceYear") || "2026";
  });
  const [referenceType, setReferenceType] = useState(() => {
    return localStorage.getItem("overall4ReferenceType") || "winter";
  });
  const [targetYear, setTargetYear] = useState(() => {
    return localStorage.getItem("overall4TargetYear") || "2027";
  });
  const [targetType, setTargetType] = useState(() => {
    return localStorage.getItem("overall4TargetType") || "summer";
  });
  const [avgWorkerCount, setAvgWorkerCount] = useState(() => {
    return localStorage.getItem("overall4AvgWorkerCount") || "300";
  });
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(() => {
    return localStorage.getItem("overall4WorkDaysPerMonth") || "20";
  });

  const handleReferenceYearChange = (value) => {
    setReferenceYear(value);
    localStorage.setItem("overall4ReferenceYear", value);
  };
  const handleReferenceTypeChange = (value) => {
    setReferenceType(value);
    localStorage.setItem("overall4ReferenceType", value);
  };
  const handleTargetYearChange = (value) => {
    setTargetYear(value);
    localStorage.setItem("overall4TargetYear", value);
  };
  const handleTargetTypeChange = (value) => {
    setTargetType(value);
    localStorage.setItem("overall4TargetType", value);
  };
  const handleAvgWorkerCountChange = (value) => {
    setAvgWorkerCount(value);
    localStorage.setItem("overall4AvgWorkerCount", value);
  };
  const handleWorkDaysPerMonthChange = (value) => {
    setWorkDaysPerMonth(value);
    localStorage.setItem("overall4WorkDaysPerMonth", value);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/seasonForecast", {
        params: {
          reference_season_year: referenceYear,
          reference_season_type: referenceType,
          season_year: targetYear,
          season_type: targetType,
          avg_worker_count: avgWorkerCount,
          work_days_per_month: workDaysPerMonth,
        },
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
  }, []);

  const dollarRate = data?.dollar_rate || null;

  return (
    <div className="space-y-6">
      {/* HEADER & FILTERS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 bg-white shadow-sm border p-4 md:p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Bazaviy mavsum:
            </span>
          </div>
          <Input
            type="number"
            value={referenceYear}
            onChange={(e) => handleReferenceYearChange(e.target.value)}
            className="w-20 h-9 text-xs"
            min="2000"
            max="2100"
          />
          <Select
            value={referenceType}
            onValueChange={handleReferenceTypeChange}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Mavsum" />
            </SelectTrigger>
            <SelectContent>
              {seasonTypes.map((season) => (
                <SelectItem
                  key={season.value}
                  value={season.value}
                  className="text-xs"
                >
                  {season.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">
              Nishon mavsum:
            </span>
          </div>
          <Input
            type="number"
            value={targetYear}
            onChange={(e) => handleTargetYearChange(e.target.value)}
            className="w-20 h-9 text-xs"
            min="2000"
            max="2100"
          />
          <Select value={targetType} onValueChange={handleTargetTypeChange}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Mavsum" />
            </SelectTrigger>
            <SelectContent>
              {seasonTypes.map((season) => (
                <SelectItem
                  key={season.value}
                  value={season.value}
                  className="text-xs"
                >
                  {season.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">
              Ishchi soni:
            </span>
            <Input
              type="number"
              value={avgWorkerCount}
              onChange={(e) => handleAvgWorkerCountChange(e.target.value)}
              className="w-20 h-9 text-xs"
              min="1"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">
              Ish kuni/oy:
            </span>
            <Input
              type="number"
              value={workDaysPerMonth}
              onChange={(e) => handleWorkDaysPerMonthChange(e.target.value)}
              className="w-16 h-9 text-xs"
              min="1"
              max="31"
            />
          </div>

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
            {loading ? "Hisoblanmoqda..." : "Hisoblash"}
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">
            Prognoz hisoblanmoqda...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* NOTE */}
          {data.eslatma && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
              <AlertTriangle
                className="text-amber-500 shrink-0 mt-0.5"
                size={18}
              />
              <p className="text-sm text-amber-800">{data.eslatma}</p>
            </div>
          )}

          {/* SEASON OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Bazaviy mavsum</CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-slate-100 text-slate-700"
                  >
                    {getSeasonLabel(
                      data.reference_season?.season_year,
                      data.reference_season?.season_type,
                    )}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {data.reference_season?.start_date} -{" "}
                  {data.reference_season?.end_date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Tikuvchilar soni
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatNumber(
                        data.reference_season?.avg_sewing_worker_count,
                      )}{" "}
                      kishi
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Jami xodimlar soni
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatNumber(
                        data.reference_season?.avg_total_employee_count,
                      )}{" "}
                      kishi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Nishon mavsum</CardTitle>
                  <Badge className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                    {getSeasonLabel(
                      data.target_season?.season_year,
                      data.target_season?.season_type,
                    )}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {formatNumber(data.kirish?.avg_worker_count)} kishi ·{" "}
                  {formatNumber(data.kirish?.work_days_per_month)} ish kuni/oy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Taxminiy jami xodimlar
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatNumber(data.avg_total_employee_count_estimate)}{" "}
                      kishi
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Dollar kursi</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatNumber(data.dollar_rate)} so'm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* REVENUE CARD */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Prognoz miqdor: {formatNumber(data.target_total_quantity)}{" "}
                      dona
                    </p>
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">
                      Prognoz Tushum
                    </p>
                  </div>
                  <DollarSign className="text-emerald-200" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {formatNumber(data.forecast_revenue_usd)}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {formatNumber(data.forecast_revenue_uzs)} UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Xarajatlar: {formatNumber(data.forecast_total_cost)} UZS (
                    {(
                      (data.forecast_total_cost / data.forecast_revenue_uzs) *
                      100
                    ).toFixed(1)}
                    %)
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Foyda: {formatNumber(data.forecast_profit)} UZS (
                    {(
                      (data.forecast_profit / data.forecast_revenue_uzs) *
                      100
                    ).toFixed(1)}
                    %)
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* COST CARD */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-rose-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Soliqsiz:{" "}
                      {formatNumber(data.forecast_total_cost_without_tax)} UZS
                    </p>
                    <p className="text-rose-100 text-sm font-medium uppercase tracking-wider">
                      Prognoz Jami Xarajat
                    </p>
                  </div>
                  <Wallet className="text-rose-200" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {dollarRate
                    ? formatNumber(data.forecast_total_cost / dollarRate)
                    : "..."}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-rose-100 text-sm mt-1">
                  {formatNumber(data.forecast_total_cost)} UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Soliq: {formatNumber(data.forecast_tax_total)} UZS
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    {dollarRate
                      ? formatNumber(data.forecast_tax_total / dollarRate)
                      : "..."}{" "}
                    USD
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* PROFIT CARD */}
            <Card
              className={`border-none shadow-sm bg-gradient-to-br ${
                data.forecast_profit >= 0
                  ? "from-indigo-500 to-purple-600"
                  : "from-orange-500 to-red-600"
              } text-white`}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">
                      Nishon:{" "}
                      {getSeasonLabel(
                        data.target_season?.season_year,
                        data.target_season?.season_type,
                      )}
                    </p>
                    <p className="text-white/80 text-sm font-medium uppercase tracking-wider">
                      Prognoz Sof Foyda
                    </p>
                  </div>
                  <DollarSign className="text-white/80" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {dollarRate
                    ? formatNumber(data.forecast_profit / dollarRate)
                    : "..."}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {formatNumber(data.forecast_profit)} UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge
                    className={`${
                      data.forecast_profit >= 0
                        ? "bg-emerald-500/30 hover:bg-emerald-500/40"
                        : "bg-rose-500/30 hover:bg-rose-500/40"
                    } border-none text-white text-xs`}
                  >
                    {data.forecast_profit >= 0 ? "Foyda" : "Zarar"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PRODUCTION METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="text-indigo-600" size={18} />
                  <p className="text-xs text-slate-500">Prognoz miqdor</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.target_total_quantity)} dona
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-amber-600" size={18} />
                  <p className="text-xs text-slate-500">Kerakli ish kunlari</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.required_work_days)} kun
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="text-emerald-600" size={18} />
                  <p className="text-xs text-slate-500">Kunlik chiqadi</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(
                    data.required_work_days > 0
                      ? data.target_total_quantity / data.required_work_days
                      : 0,
                  )}{" "}
                  dona/kun
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarRange className="text-sky-600" size={18} />
                  <p className="text-xs text-slate-500">Taqvim kunlari</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.estimated_calendar_days)} kun
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarRange className="text-purple-600" size={18} />
                  <p className="text-xs text-slate-500">Taqvim oylari</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.estimated_calendar_months)} oy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* UNIT COST METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-amber-600" size={18} />
                  <p className="text-xs text-slate-500">
                    Bir dona narxi (soliqsiz)
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.forecast_cost_per_unit_without_tax)} UZS
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {dollarRate
                    ? formatNumber(
                        data.forecast_cost_per_unit_without_tax / dollarRate,
                      )
                    : "..."}{" "}
                  USD
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-slate-500" size={18} />
                  <p className="text-xs text-slate-500">Bir dona soliq</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.forecast_tax_per_unit)} UZS
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {dollarRate
                    ? formatNumber(data.forecast_tax_per_unit / dollarRate)
                    : "..."}{" "}
                  USD
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-rose-600" size={18} />
                  <p className="text-xs text-slate-500">
                    Bir dona narxi (soliq bilan)
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.forecast_cost_per_unit_with_tax)} UZS
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {dollarRate
                    ? formatNumber(
                        data.forecast_cost_per_unit_with_tax / dollarRate,
                      )
                    : "..."}{" "}
                  USD
                </p>
              </CardContent>
            </Card>
          </div>

          {/* EMPLOYEE COST BREAKDOWN */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">
                Xodim Bo'yicha Prognoz Xarajatlar
              </CardTitle>
              <CardDescription className="text-xs">
                Bir xodimga tushadigan kunlik va oylik prognoz xarajatlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">
                    Kunlik xarajat (soliqsiz)
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(
                      data.forecast_cost_per_employee_per_day_without_tax,
                    )}{" "}
                    UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.forecast_cost_per_employee_per_day_without_tax /
                            dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">
                    Oylik xarajat (soliqsiz)
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(
                      data.forecast_cost_per_employee_per_month_without_tax,
                    )}{" "}
                    UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.forecast_cost_per_employee_per_month_without_tax /
                            dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">Kunlik soliq</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(data.forecast_tax_per_employee_per_day)} UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.forecast_tax_per_employee_per_day / dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">Oylik soliq</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(data.forecast_tax_per_employee_per_month)} UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.forecast_tax_per_employee_per_month / dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">
                    Kunlik xarajat (soliq bilan)
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(data.forecast_cost_per_employee_per_day)} UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.forecast_cost_per_employee_per_day / dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">
                    Oylik xarajat (soliq bilan)
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(data.forecast_cost_per_employee_per_month)}{" "}
                    UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.forecast_cost_per_employee_per_month /
                            dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COST BREAKDOWN BY CATEGORY */}
          {data.cost_breakdown && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">
                  Xarajat Turlari Bo'yicha Taqsimot
                </CardTitle>
                <CardDescription className="text-xs">
                  Prognoz jami xarajatning tarkibi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.cost_breakdown).map(([key, value]) => {
                    const meta = COST_BREAKDOWN_META[key] || {
                      label: key,
                      color: "bg-slate-400",
                    };
                    const percent =
                      data.forecast_total_cost > 0
                        ? (value / data.forecast_total_cost) * 100
                        : 0;

                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {meta.label}
                          </span>
                          <span className="text-sm text-slate-600">
                            {formatNumber(value)} UZS ({percent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${meta.color} rounded-full`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FORECASTED ORDERS */}
          {data.orders?.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Prognoz Buyurtmalar</CardTitle>
                <CardDescription className="text-xs">
                  {data.orders.length} ta buyurtma bo'yicha prognoz taqsimot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto w-full">
                  <Table className="border border-slate-200 w-full whitespace-nowrap text-xs">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="border border-slate-200">
                          Id
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          Nomi
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          Model
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          Miqdor
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          Prognoz tushum
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          Prognoz xarajat
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          1 tasi xarajat
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          Chok
                        </TableHead>
                        <TableHead className="border border-slate-200">
                          Prognoz foyda
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((order) => {
                        const chokPercent =
                          order.forecast_total_cost > 0
                            ? ((order.cost_breakdown?.rasxod || 0) /
                                order.forecast_total_cost) *
                              100
                            : 0;

                        return (
                          <TableRow
                            key={order.id}
                            className={cn(
                              order.forecast_profit > 0
                                ? "bg-green-100 hover:bg-green-200"
                                : "bg-red-100 hover:bg-red-200",
                            )}
                          >
                            <TableCell className="font-medium border border-slate-200 text-center">
                              {order.id}
                            </TableCell>
                            <TableCell className="border border-slate-200">
                              {order.name}
                            </TableCell>
                            <TableCell className="border border-slate-200">
                              {order.model_name}
                            </TableCell>
                            <TableCell className="border border-slate-200">
                              <div className="font-mono">
                                {formatNumber(order.quantity)} ta
                              </div>
                              <div className="text-slate-400">
                                {formatNumber(order.minute)} daq/dona
                              </div>
                            </TableCell>
                            <TableCell className="border border-slate-200">
                              <div className="font-mono">
                                {formatNumber(order.forecast_revenue_uzs)} so'm
                              </div>
                              <div className="font-mono text-slate-500">
                                {formatNumber(order.forecast_revenue_usd)} $
                              </div>
                            </TableCell>
                            <TableCell className="border border-slate-200">
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="font-mono">
                                      {formatNumber(order.forecast_total_cost)}{" "}
                                      so'm
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      {Object.entries(
                                        order.cost_breakdown || {},
                                      ).map(([key, value]) => {
                                        const meta = COST_BREAKDOWN_META[
                                          key
                                        ] || { label: key };
                                        return (
                                          <div
                                            key={key}
                                            className="w-full flex justify-between gap-2"
                                          >
                                            <div>{meta.label}:</div>
                                            <div>
                                              {formatNumber(value)} so'm
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="font-mono border border-slate-200">
                              {formatNumber(order.forecast_cost_per_unit)} so'm
                            </TableCell>
                            <TableCell className="font-mono border border-slate-200">
                              <div className="flex items-center gap-2">
                                {chokPercent > 30 && (
                                  <TriangleAlert
                                    size={16}
                                    className="text-red-500"
                                  />
                                )}
                                {chokPercent.toFixed(1)} %
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={cn(
                                  "font-bold font-mono",
                                  order.forecast_profit > 0
                                    ? "text-green-600"
                                    : "text-red-600",
                                )}
                              >
                                {formatNumber(order.forecast_profit)} so'm
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* MONTHLY EXPENSES BREAKDOWN */}
          {data.monthly_expense_breakdown?.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">
                  Oylik Xarajatlar Prognozi
                </CardTitle>
                <CardDescription className="text-xs">
                  {data.monthly_expense_breakdown.length} ta xarajat moddasi
                  bo'yicha proyeksiya
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto border border-slate-200 rounded-lg">
                  <table className="w-full min-w-[640px] text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                      <tr className="border-b border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-600 p-3">
                          Xarajat turi
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-600 p-3">
                          Turi
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-600 p-3">
                          Asl summa
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-600 p-3">
                          Prognoz summa
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.monthly_expense_breakdown.map((expense) => (
                        <tr
                          key={expense.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="text-sm font-medium text-slate-700 p-3">
                            {expense.name}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="secondary"
                              className="text-xs bg-slate-100 text-slate-600"
                            >
                              {monthly_expence_types[expense.type] ||
                                expense.type}
                            </Badge>
                          </td>
                          <td className="text-sm text-right text-slate-600 p-3">
                            {formatNumber(expense.reference_amount)} UZS
                          </td>
                          <td className="text-sm text-right text-slate-900 font-semibold p-3">
                            {formatNumber(expense.forecasted_amount)} UZS
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="sticky bottom-0 z-10 bg-slate-50 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                      <tr className="border-t-2 border-slate-300 font-bold">
                        <td className="text-sm text-slate-900 p-3" colSpan={2}>
                          Jami
                        </td>
                        <td className="text-sm text-right text-slate-600 p-3">
                          {formatNumber(
                            data.monthly_expense_breakdown.reduce(
                              (sum, e) => sum + (e.reference_amount || 0),
                              0,
                            ),
                          )}{" "}
                          UZS
                        </td>
                        <td className="text-sm text-right text-indigo-600 p-3">
                          {formatNumber(
                            data.monthly_expense_breakdown.reduce(
                              (sum, e) => sum + (e.forecasted_amount || 0),
                              0,
                            ),
                          )}{" "}
                          UZS
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Info className="text-slate-300" size={32} />
          <p className="text-slate-500 font-medium text-sm">Ma'lumotlar yo'q</p>
        </div>
      )}
    </div>
  );
};

export default Overall4;

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
  Users,
  DollarSign,
  Package,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import getDollarRate from "@/hooks/getDollarRate";
import {
  monthly_expence_types,
  monthly_expence_currency,
} from "@/lib/monthlyExpenceTypes";
import { statuses } from "@/lib/status";

const Overall3 = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dollarRate, setDollarRate] = useState(null);
  const [filterType, setFilterType] = useState(() => {
    const saved = localStorage.getItem("overall3FilterType");
    return saved || "date";
  });

  // Date range filter
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem("overall3StartDate");
    return saved || new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem("overall3EndDate");
    return saved || new Date().toISOString().split("T")[0];
  });

  // Season filter
  const [selectedSeason, setSelectedSeason] = useState(() => {
    const saved = localStorage.getItem("overall3SelectedSeason");
    return saved ? JSON.parse(saved) : { year: 2026, type: "summer" };
  });
  const [customYear, setCustomYear] = useState(() => {
    const saved = localStorage.getItem("overall3CustomYear");
    return saved || new Date().getFullYear().toString();
  });
  const [customSeasonType, setCustomSeasonType] = useState(() => {
    const saved = localStorage.getItem("overall3CustomSeasonType");
    return saved || "summer";
  });

  const seasonTypes = [
    { value: "summer", label: "Bahor" },
    { value: "winter", label: "Qish" },
  ];

  const handleFilterTypeChange = (value) => {
    setFilterType(value);
    localStorage.setItem("overall3FilterType", value);
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);
    localStorage.setItem("overall3StartDate", value);
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    localStorage.setItem("overall3EndDate", value);
  };

  const handleCustomYearChange = (value) => {
    setCustomYear(value);
    localStorage.setItem("overall3CustomYear", value);
  };

  const handleCustomSeasonTypeChange = (value) => {
    setCustomSeasonType(value);
    localStorage.setItem("overall3CustomSeasonType", value);
  };

  const applySeasonFilter = () => {
    const seasonValue = { year: parseInt(customYear), type: customSeasonType };
    setSelectedSeason(seasonValue);
    localStorage.setItem("overall3SelectedSeason", JSON.stringify(seasonValue));
  };

  const getSeasonLabel = (season) => {
    const seasonTypeLabel = season.type === "summer" ? "Bahor" : "Qish";
    return `${season.year} ${seasonTypeLabel} mavsum`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let response;

      if (filterType === "date") {
        response = await api.get("/monthlyBalance", {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        });
      } else {
        response = await api.get("/monthlyBalance", {
          params: {
            season_year: selectedSeason.year,
            season_type: selectedSeason.type,
          },
        });
      }

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

  const applyDollarRate = async () => {
    const rate = await getDollarRate();
    setDollarRate(rate);
  };

  useEffect(() => {
    applyDollarRate();
  }, []);

  useEffect(() => {
    if (filterType === "date") {
      fetchData();
    }
  }, [filterType, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* HEADER & FILTERS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 bg-white shadow-sm border p-4 md:p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filter:</span>
          </div>

          <Select value={filterType} onValueChange={handleFilterTypeChange}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date" className="text-xs">
                Sana oraliq
              </SelectItem>
              <SelectItem value="season" className="text-xs">
                Mavsum
              </SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          {filterType === "date" ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-36 h-9 text-xs"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-36 h-9 text-xs"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Yil"
                value={customYear}
                onChange={(e) => handleCustomYearChange(e.target.value)}
                className="w-24 h-9 text-xs"
                min="2000"
                max="2100"
              />
              <Select
                value={customSeasonType}
                onValueChange={handleCustomSeasonTypeChange}
              >
                <SelectTrigger className="w-32 h-8 text-xs">
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
              <Button
                size="sm"
                onClick={() => {
                  applySeasonFilter();
                  fetchData();
                }}
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                Tanlash
              </Button>

              {selectedSeason && (
                <>
                  <Separator
                    orientation="vertical"
                    className="h-8 hidden md:block"
                  />
                  <Badge
                    variant="secondary"
                    className="text-xs bg-indigo-100 text-indigo-700"
                  >
                    {getSeasonLabel(selectedSeason)}
                  </Badge>
                </>
              )}
            </div>
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
                      Davr: {data.start_date} - {data.end_date}
                    </p>
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">
                      Tushum
                    </p>
                  </div>
                  <DollarSign className="text-emerald-200" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {dollarRate
                    ? formatNumber((data.total_cost + data.profit) / dollarRate)
                    : "..."}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {formatNumber(data.total_cost + data.profit)} UZS
                </p>
                <div className="mt-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Tushum: 100%
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Xarajatlar: {formatNumber(data.total_cost)} UZS (
                    {(
                      (data.total_cost /
                        (data.total_cost + Math.abs(data.profit))) *
                      100
                    ).toFixed(1)}
                    %)
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Foyda: {formatNumber(data.profit)} UZS (
                    {(
                      (Math.abs(data.profit) /
                        (data.total_cost + Math.abs(data.profit))) *
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
                      Davr: {data.start_date} - {data.end_date}
                    </p>
                    <p className="text-rose-100 text-sm font-medium uppercase tracking-wider">
                      Jami Xarajatlar
                    </p>
                  </div>
                  <Wallet className="text-rose-200" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {dollarRate
                    ? formatNumber(data.total_cost / dollarRate)
                    : "..."}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-rose-100 text-sm mt-1">
                  {formatNumber(data.total_cost)} UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    Soliq: {formatNumber(data.tax_total)} UZS
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                    {dollarRate
                      ? formatNumber(data.tax_total / dollarRate)
                      : "..."}{" "}
                    USD
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* PROFIT CARD */}
            <Card
              className={`border-none shadow-sm bg-gradient-to-br ${
                data.profit >= 0
                  ? "from-indigo-500 to-purple-600"
                  : "from-orange-500 to-red-600"
              } text-white`}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">
                      Davr: {data.start_date} - {data.end_date}
                    </p>
                    <p className="text-white/80 text-sm font-medium uppercase tracking-wider">
                      Sof Foyda
                    </p>
                  </div>
                  <DollarSign className="text-white/80" size={28} />
                </div>
                <h2 className="text-2xl font-black mt-3">
                  {dollarRate ? formatNumber(data.profit / dollarRate) : "..."}{" "}
                  <span className="text-base font-normal opacity-80">USD</span>
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {formatNumber(data.profit)} UZS
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge
                    className={`${
                      data.profit >= 0
                        ? "bg-emerald-500/30 hover:bg-emerald-500/40"
                        : "bg-rose-500/30 hover:bg-rose-500/40"
                    } border-none text-white text-xs`}
                  >
                    {data.profit >= 0 ? "Foyda" : "Zarar"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-indigo-600" size={18} />
                  <p className="text-xs text-slate-500">O'rtacha ishchi soni</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.avg_employee_count)} kishi
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="text-orange-600" size={18} />
                  <p className="text-xs text-slate-500">
                    Bugungi tikilgan buyurtmalar
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.today_total_sewed_orders)} ta
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-amber-600" size={18} />
                  <p className="text-xs text-slate-500">
                    Bir dona narxi (soliqsiz)
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(data.cost_per_unit_without_tax)} UZS
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {dollarRate
                    ? formatNumber(data.cost_per_unit_without_tax / dollarRate)
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
                  {formatNumber(data.cost_per_unit_with_tax)} UZS
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {dollarRate
                    ? formatNumber(data.cost_per_unit_with_tax / dollarRate)
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
                Xodim Bo'yicha Xarajatlar
              </CardTitle>
              <CardDescription className="text-xs">
                Bir xodimga tushadigan kunlik va oylik xarajatlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">
                    Kunlik xarajat (soliqsiz)
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(data.cost_per_employee_per_day_without_tax)}{" "}
                    UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.cost_per_employee_per_day_without_tax /
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
                    {formatNumber(data.cost_per_employee_per_month_without_tax)}{" "}
                    UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.cost_per_employee_per_month_without_tax /
                            dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">Kunlik soliq</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(data.tax_per_employee_per_day)} UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(data.tax_per_employee_per_day / dollarRate)
                      : "..."}{" "}
                    USD
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <p className="text-xs text-slate-500 mb-1">Oylik soliq</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNumber(data.tax_per_employee_per_month)} UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.tax_per_employee_per_month / dollarRate,
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
                    {formatNumber(data.cost_per_employee_per_day)} UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.cost_per_employee_per_day / dollarRate,
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
                    {formatNumber(data.cost_per_employee_per_month)} UZS
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dollarRate
                      ? formatNumber(
                          data.cost_per_employee_per_month / dollarRate,
                        )
                      : "..."}{" "}
                    USD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TODAY SEWED ORDERS */}
          {data.today_sewed_orders?.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">
                  Tikilgan Buyurtmalar
                </CardTitle>
                <CardDescription className="text-xs">
                  Ttikilgan {data.today_sewed_orders.length} ta buyurtma
                  bo'yicha tafsilotlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                      <tr className="border-b border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-600 p-3">
                          Model
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-600 p-3">
                          Holati
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-600 p-3">
                          Tikilgan / Jami
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-600 p-3">
                          Tushum
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-600 p-3">
                          Tan narxi
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-600 p-3">
                          Chok puli
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-600 p-3">
                          Dona narxi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.today_sewed_orders.map((order) => {
                        const status = statuses[order.status] || {
                          secondaryBg: "bg-slate-50",
                          textColor: "text-slate-500",
                          text: order.status,
                        };

                        return (
                          <tr
                            key={order.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="p-3">
                              <p className="text-sm font-medium text-slate-700">
                                {order.model_name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {order.submodel_name} · {order.name}
                              </p>
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.secondaryBg} ${status.textColor}`}
                              >
                                {status.text}
                              </span>
                            </td>
                            <td className="text-sm text-right text-slate-600 p-3">
                              {formatNumber(order.sewed_quantity)} /{" "}
                              {formatNumber(order.quantity)}
                            </td>
                            <td className="text-right p-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatNumber(order.todayRevenue_uzs)} UZS
                              </p>
                              <p className="text-xs text-slate-500">
                                {dollarRate
                                  ? formatNumber(order.todayRevenue_usd)
                                  : "..."}{" "}
                                USD
                              </p>
                            </td>
                            <td className="text-right p-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatNumber(order.total_cost)} UZS
                              </p>
                              <p className="text-xs text-slate-500">
                                {dollarRate
                                  ? formatNumber(order.total_cost / dollarRate)
                                  : "..."}{" "}
                                USD
                              </p>
                            </td>
                            <td className="text-right p-3">
                              {(() => {
                                const chokPuli = order.cost_breakdown?.rasxod || 0;
                                const chokPercent =
                                  order.total_cost > 0
                                    ? (chokPuli / order.total_cost) * 100
                                    : 0;
                                return (
                                  <>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {formatNumber(chokPuli)} UZS
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {chokPercent.toFixed(1)}%
                                    </p>
                                  </>
                                );
                              })()}
                            </td>
                            <td className="text-right p-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatNumber(order.cost_per_unit)} UZS
                              </p>
                              <p className="text-xs text-slate-500">
                                {dollarRate
                                  ? formatNumber(
                                      order.cost_per_unit / dollarRate,
                                    )
                                  : "..."}{" "}
                                USD
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot className="sticky bottom-0 z-10 bg-slate-50 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                      <tr className="border-t-2 border-slate-300 font-bold">
                        <td className="text-sm text-slate-900 p-3" colSpan={2}>
                          Jami ({formatNumber(data.today_total_sewed_orders)}{" "}
                          ta)
                        </td>
                        <td className="text-sm text-right text-slate-600 p-3">
                          {formatNumber(
                            data.today_sewed_orders.reduce(
                              (sum, o) => sum + (o.sewed_quantity || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="text-sm text-right text-indigo-600 p-3">
                          {formatNumber(
                            data.today_sewed_orders.reduce(
                              (sum, o) => sum + (o.todayRevenue_uzs || 0),
                              0,
                            ),
                          )}{" "}
                          UZS
                        </td>
                        <td className="text-sm text-right text-rose-600 p-3">
                          {formatNumber(
                            data.today_sewed_orders.reduce(
                              (sum, o) => sum + (o.total_cost || 0),
                              0,
                            ),
                          )}{" "}
                          UZS
                        </td>
                        <td className="text-sm text-right text-amber-600 p-3">
                          {(() => {
                            const totalChokPuli = data.today_sewed_orders.reduce(
                              (sum, o) => sum + (o.cost_breakdown?.rasxod || 0),
                              0,
                            );
                            const totalCost = data.today_sewed_orders.reduce(
                              (sum, o) => sum + (o.total_cost || 0),
                              0,
                            );
                            const totalChokPercent =
                              totalCost > 0
                                ? (totalChokPuli / totalCost) * 100
                                : 0;
                            return (
                              <>
                                {formatNumber(totalChokPuli)} UZS (
                                {totalChokPercent.toFixed(1)}%)
                              </>
                            );
                          })()}
                        </td>
                        <td className="p-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* MONTHLY EXPENSES BREAKDOWN */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">
                Oylik Xarajatlar Tafsiloti
              </CardTitle>
              <CardDescription className="text-xs">
                Oylik xarajatlar bo'linishi (davr bo'yicha)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-600 p-3">
                        Xarajat turi
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 p-3">
                        Oy
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 p-3">
                        Asl summa
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 p-3">
                        Hisoblangan
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 p-3">
                        Hisoblangan (USD)
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.monthly_expenses?.map((expense, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="text-sm font-medium text-slate-700 p-3">
                          {expense.name}
                        </td>
                        <td className="text-sm text-right text-slate-600 p-3">
                          {new Date(expense.month).toLocaleDateString("ru-RU", {
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="text-sm text-right text-slate-900 font-semibold p-3">
                          {formatNumber(expense.amount)}{" "}
                          {monthly_expence_currency[expense.type] || "UZS"}
                        </td>
                        <td className="text-sm text-right text-slate-900 font-semibold p-3">
                          {formatNumber(expense.amount)}{" "}
                          {monthly_expence_currency[expense.type] || "UZS"}
                        </td>
                        <td className="text-sm text-right text-slate-600 p-3">
                          {dollarRate
                            ? formatNumber(
                                (expense.calculated_today || expense.amount) /
                                  dollarRate,
                              )
                            : "..."}{" "}
                          USD
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="sticky bottom-0 z-10 bg-slate-50 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                    <tr className="border-t-2 border-slate-300 font-bold">
                      <td className="text-sm text-slate-900 p-3">Jami</td>
                      <td className="text-sm text-right text-slate-600 p-3">
                        -
                      </td>
                      <td className="text-sm text-right text-slate-600 p-3">
                        -
                      </td>
                      <td className="text-sm text-right text-indigo-600 p-3">
                        {formatNumber(data.today_monthly_expense)} UZS
                      </td>
                      <td className="text-sm text-right text-slate-600 p-3">
                        {dollarRate
                          ? formatNumber(
                              data.today_monthly_expense / dollarRate,
                            )
                          : "..."}{" "}
                        USD
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

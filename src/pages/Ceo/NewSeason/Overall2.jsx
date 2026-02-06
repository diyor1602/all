import { useEffect, useState, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Wallet,
  Truck,
  Users,
  Calendar,
  RefreshCcw,
  CircleDollarSign,
} from "lucide-react";

const Overall2 = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // States with initializers to avoid hydration/sync issues
  const [dollarRate, setDollarRate] = useState(
    () => localStorage.getItem("newSeasonDollarRate") || 12269,
  );
  const [tempDollarRate, setTempDollarRate] = useState(dollarRate);
  const [selectedYear, setSelectedYear] = useState(
    () =>
      localStorage.getItem("newSeasonSelectedYear") || new Date().getFullYear(),
  );
  const [selectedType, setSelectedType] = useState(
    () => localStorage.getItem("newSeasonSelectedType") || "winter",
  );

  const applyDollarRate = () => {
    setDollarRate(tempDollarRate);
    localStorage.setItem("newSeasonDollarRate", tempDollarRate);
    getData();
  };

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ceo/calculateSeasonWithCostsBySeason", {
        params: {
          season_year: selectedYear,
          season_type: selectedType,
          dollar_rate: dollarRate,
        },
      });
      setData(res.data);
      // Persist choices
      localStorage.setItem("newSeasonDollarRate", dollarRate);
      localStorage.setItem("newSeasonSelectedYear", selectedYear);
      localStorage.setItem("newSeasonSelectedType", selectedType);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedYear, selectedType]);

  const finance = data?.finance || {};
  const orders = data?.orders || [];

  // Calculate sums for footer
  const { netProfit, profitMargin, expenseRatio } = useMemo(() => {
    const rev = finance.revenue_uzs || 0;
    const cost = finance.total_until_finish_uzs || 0;
    const net = rev - cost;
    return {
      netProfit: net,
      profitMargin: rev > 0 ? ((net / rev) * 100).toFixed(1) : 0,
      expenseRatio: rev > 0 ? ((cost / rev) * 100).toFixed(1) : 0,
    };
  }, [finance]);

  const sums = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const allocations = order.allocations_until_finish_uzs || {};
        const totalExpenses = order.total_until_finish_uzs_allocated || 0;
        const profit = order.revenue_uzs - totalExpenses;

        acc.quantity += order.quantity || 0;
        acc.revenue_uzs += order.revenue_uzs || 0;
        acc.sewing_budget += order.sewing_budget_allocated_uzs_direct || 0;
        acc.employee_expenses += allocations.employee_sum_allocated || 0;
        acc.transport += allocations.transport || 0;
        acc.monthly_expenses += allocations.monthly_expenses || 0;
        acc.total_expenses += totalExpenses;
        acc.profit += profit;

        return acc;
      },
      {
        quantity: 0,
        revenue_uzs: 0,
        sewing_budget: 0,
        employee_expenses: 0,
        transport: 0,
        monthly_expenses: 0,
        total_expenses: 0,
        profit: 0,
      },
    );
  }, [orders]);

  const MetricItem = ({
    label,
    value,
    icon: Icon,
    colorClass = "text-slate-600",
  }) => (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md bg-white border ${colorClass}`}>
          <Icon size={14} />
        </div>
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-xs font-bold text-slate-900">
        {formatNumber(value)}
      </span>
    </div>
  );

  return (
    <div className="space-y-8 bg-[#f8fafc] min-h-screen font-sans">
      {/* HEADER & FILTERS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Mavsumiy Tahlil</h1>
          <p className="text-slate-500 text-xs">
            Moliyaviy ko'rsatkichlar va buyurtmalar nazorati
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white shadow-sm border p-4 md:p-0">
          <div className="flex bg-slate-100 p-1">
            <button
              onClick={() => setSelectedType("winter")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedType === "winter" ? "bg-white shadow-sm text-blue-600" : "text-slate-500"}`}
            >
              ❄️ Qishgi
            </button>
            <button
              onClick={() => setSelectedType("summer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedType === "summer" ? "bg-white shadow-sm text-orange-600" : "text-slate-500"}`}
            >
              ☀️ Bahorgi
            </button>
          </div>
          <Separator orientation="vertical" className="h-8 hidden md:block" />
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-20 h-8 border-none bg-transparent font-bold text-sm focus-visible:ring-0"
            />
          </div>
          <Button
            size="sm"
            onClick={getData}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 px-3 text-xs rounded-none"
          >
            <RefreshCcw
              size={14}
              className={`${loading ? "animate-spin" : ""}`}
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
            Ma'lumotlar hisoblanmoqda...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: PRIMARY STATS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">
                      Umumiy Tushum
                    </p>
                    <TrendingUp className="text-emerald-200" size={24} />
                  </div>
                  <h2 className="text-xl font-black mt-2">
                    {formatNumber(finance.revenue_uzs)}{" "}
                    <span className="text-sm font-normal opacity-80">UZS</span>
                  </h2>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs">
                      Kurs: {formatNumber(dollarRate)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                      Sof Foyda (Kutilayotgan)
                    </p>
                    <CircleDollarSign className="text-indigo-500" size={24} />
                  </div>
                  <h2 className="text-xl font-black mt-2 text-slate-900">
                    {formatNumber(netProfit)}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      UZS
                    </span>
                  </h2>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Rentabellik: {profitMargin}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ORDERS TABLE */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Buyurtmalar Ro'yxati
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Mavsum bo'yicha buyurtmalar tahlili
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-300">
                  <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-300">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="text-xs font-semibold border-r border-slate-200 px-2 py-2">
                          Nomi
                        </TableHead>
                        <TableHead className="text-xs font-semibold border-r border-slate-200 px-2 py-2">
                          Miqdor
                        </TableHead>
                        <TableHead className="text-xs font-semibold border-r border-slate-200 px-2 py-2">
                          Narx ($)
                        </TableHead>
                        <TableHead className="text-xs font-semibold border-r border-slate-200 px-2 py-2">
                          Tushum (UZS)
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right border-r border-slate-200 px-2 py-2">
                          Tikuv Budjeti
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right border-r border-slate-200 px-2 py-2">
                          Ishchi Xarajat
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right border-r border-slate-200 px-2 py-2">
                          Transport
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right border-r border-slate-200 px-2 py-2">
                          Oylik Xarajat
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right border-r border-slate-200 px-2 py-2">
                          Jami Xarajat
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right border-r border-slate-200 px-2 py-2">
                          Foyda
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right px-2 py-2">
                          Foyda %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, idx) => {
                        const allocations =
                          order.allocations_until_finish_uzs || {};
                        const totalExpenses =
                          order.total_until_finish_uzs_allocated || 0;
                        const profit = order.revenue_uzs - totalExpenses;

                        return (
                          <TableRow
                            key={idx}
                            className="border-b border-slate-200"
                          >
                            <TableCell className="font-bold text-slate-700 text-xs border-r border-slate-200 px-2 py-2">
                              #{order.order_name} {order.submodels[0]}
                            </TableCell>
                            <TableCell className="text-xs border-r border-slate-200 px-2 py-2">
                              {formatNumber(order.quantity)} dona
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs border-r border-slate-200 px-2 py-2">
                              ${order.price_usd?.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600 text-xs border-r border-slate-200 px-2 py-2">
                              {formatNumber(order.revenue_uzs)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-xs border-r border-slate-200 px-2 py-2">
                              {formatNumber(
                                order.sewing_budget_allocated_uzs_direct,
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-blue-600 text-xs border-r border-slate-200 px-2 py-2">
                              {formatNumber(
                                allocations.employee_sum_allocated || 0,
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-orange-600 text-xs border-r border-slate-200 px-2 py-2">
                              {formatNumber(allocations.transport || 0)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-purple-600 text-xs border-r border-slate-200 px-2 py-2">
                              {formatNumber(allocations.monthly_expenses || 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-rose-600 text-xs border-r border-slate-200 px-2 py-2">
                              {formatNumber(totalExpenses)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold text-xs border-r border-slate-200 px-2 py-2 ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {formatNumber(profit)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold text-xs px-2 py-2 ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {order.revenue_uzs > 0
                                ? ((profit / order.revenue_uzs) * 100).toFixed(
                                    1,
                                  )
                                : "0.0"}
                              %
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter className="bg-slate-100/50 font-bold">
                      <TableRow className="border-t-2 border-slate-300">
                        <TableCell className="text-xs font-bold text-slate-900 border-r border-slate-200 px-2 py-2">
                          Jami
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 border-r border-slate-200 px-2 py-2">
                          {formatNumber(sums.quantity)} dona
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 border-r border-slate-200 px-2 py-2">
                          -
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-600 border-r border-slate-200 px-2 py-2">
                          {formatNumber(sums.revenue_uzs)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-right border-r border-slate-200 px-2 py-2">
                          {formatNumber(sums.sewing_budget)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-blue-600 text-right border-r border-slate-200 px-2 py-2">
                          {formatNumber(sums.employee_expenses)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-orange-600 text-right border-r border-slate-200 px-2 py-2">
                          {formatNumber(sums.transport)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-purple-600 text-right border-r border-slate-200 px-2 py-2">
                          {formatNumber(sums.monthly_expenses)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-rose-600 text-right border-r border-slate-200 px-2 py-2">
                          {formatNumber(sums.total_expenses)}
                        </TableCell>
                        <TableCell
                          className={`text-xs font-bold text-right border-r border-slate-200 px-2 py-2 ${sums.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {formatNumber(sums.profit)}
                        </TableCell>
                        <TableCell
                          className={`text-xs font-bold text-right px-2 py-2 ${sums.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {sums.revenue_uzs > 0
                            ? ((sums.profit / sums.revenue_uzs) * 100).toFixed(
                                1,
                              )
                            : "0.0"}
                          %
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: COST BREAKDOWN */}
          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200 sticky top-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="text-rose-500" size={18} />
                  Xarajatlar Tafsiloti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <MetricItem
                    label="Ish haqi (Tikuv)"
                    value={finance.sewing_budget_allocated_uzs}
                    icon={Users}
                    colorClass="text-blue-500"
                  />
                  <MetricItem
                    label="Ustidan yozilgan"
                    value={finance.monthly_daily_payment_total_until_finish_uzs}
                    icon={Users}
                    colorClass="text-emerald-500"
                  />
                  <MetricItem
                    label="Transport (Jami)"
                    value={finance.transport_total_until_finish_uzs}
                    icon={Truck}
                    colorClass="text-orange-500"
                  />
                  <MetricItem
                    label="Oylik Xarajatlar"
                    value={finance.monthly_expenses_total_until_finish_uzs}
                    icon={Calendar}
                    colorClass="text-purple-500"
                  />
                  <MetricItem
                    label="AUP Oylik"
                    value={
                      finance.employee_sum_allocated_total_until_finish_uzs
                    }
                    icon={Users}
                    colorClass="text-emerald-500"
                  />
                  <MetricItem
                    label="Bir Dona Xarajati"
                    value={data?.cost_per_order || 0}
                    icon={CircleDollarSign}
                    colorClass="text-indigo-500"
                  />
                </div>

                <Separator className="my-3" />

                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">
                        Jami Xarajat
                      </p>
                      <p className="text-lg font-black text-rose-900 leading-tight">
                        {formatNumber(finance.total_until_finish_uzs)}
                      </p>
                      <p className="text-[9px] text-rose-600 font-medium">
                        UZS
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs px-2 py-1">
                      {expenseRatio}%
                    </Badge>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Valyuta Kursi ($)
                  </p>
                  <div className="flex gap-2">
                    <Input
                      className="h-5 text-[10px] font-bold px-2 py-1 bg-white border-slate-200"
                      value={tempDollarRate}
                      onChange={(e) => setTempDollarRate(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={applyDollarRate}
                      className="h-5 px-2 text-xs bg-indigo-600 hover:bg-indigo-700"
                    >
                      Qo'llash
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overall2;

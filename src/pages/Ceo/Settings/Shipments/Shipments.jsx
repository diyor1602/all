import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Truck,
  Package,
  Calculator,
  TrendingUp,
  Wallet,
  DollarSign,
  TrendingDown,
  Clock,
  AlertCircle,
  ChevronDown,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import getDollarRate from "@/hooks/getDollarRate";
import ModelImages from "@/components/ModelImages";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ── Constants ──────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
];

// Gradient strings for KPI tiles — written as full static strings for Tailwind JIT
const METRIC_GRADIENTS = {
  green: "from-green-500 to-emerald-600",
  red: "from-red-500 to-rose-600",
  emerald: "from-emerald-400 to-teal-600",
  blue: "from-blue-500 to-indigo-600",
  amber: "from-amber-400 to-orange-500",
  indigo: "from-indigo-500 to-violet-600",
};

// One accent palette per truck — cycles if there are more than 8 trucks
const TRUCK_PALETTES = [
  {
    border: "border-l-blue-500",
    headerBg: "from-blue-50 to-sky-50",
    dot: "bg-blue-500",
  },
  {
    border: "border-l-violet-500",
    headerBg: "from-violet-50 to-purple-50",
    dot: "bg-violet-500",
  },
  {
    border: "border-l-emerald-500",
    headerBg: "from-emerald-50 to-teal-50",
    dot: "bg-emerald-500",
  },
  {
    border: "border-l-amber-500",
    headerBg: "from-amber-50 to-yellow-50",
    dot: "bg-amber-500",
  },
  {
    border: "border-l-rose-500",
    headerBg: "from-rose-50 to-pink-50",
    dot: "bg-rose-500",
  },
  {
    border: "border-l-cyan-500",
    headerBg: "from-cyan-50 to-sky-50",
    dot: "bg-cyan-500",
  },
  {
    border: "border-l-orange-500",
    headerBg: "from-orange-50 to-amber-50",
    dot: "bg-orange-500",
  },
  {
    border: "border-l-indigo-500",
    headerBg: "from-indigo-50 to-blue-50",
    dot: "bg-indigo-500",
  },
];

const COST_LABELS = {
  bonus: "Bonus",
  remainder: "Tikuv uchun",
  allocatedTransport: "Transport",
  allocatedAup: "AUP",
  allocatedIsNotAup: "AUP bo'lmagan",
  daily_payments: "Kunlik to'lovlar",
  warehouse_salary: "Ombor maoshi",
  assistant_salary: "Yordamchi maoshi",
  cutting_salary: "Kesish maoshi",
  master_salary: "Usta maoshi",
  allocatedMonthlyExpense: "Oylik xarajatlar",
  incomePercentageExpense: "Daromad foizi xarajatlari",
  amortizationExpense: "Amortizatsiya xarajatlari",
};

// ── Pure helpers ───────────────────────────────────────────────────────────────

const preparePieChartData = (costsBreakdown) =>
  Object.entries(costsBreakdown)
    .filter(([key, value]) => value > 0 && COST_LABELS[key])
    .map(([key, value]) => ({ name: COST_LABELS[key], value, key }))
    .sort((a, b) => b.value - a.value);

// ── Presentational components ──────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-gray-800">{payload[0].name}</p>
      <p className="text-sm text-gray-500 mt-0.5">
        {formatNumber(payload[0].value)} UZS
      </p>
    </div>
  );
};

/** Gradient KPI tile — white text on a vivid gradient background */
const MetricTile = ({ icon: Icon, title, value, subtext, color = "blue" }) => {
  const grad = METRIC_GRADIENTS[color] ?? METRIC_GRADIENTS.blue;
  return (
    <div
      className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white relative overflow-hidden shadow-md hover:shadow-lg transition-shadow`}
    >
      {/* decorative circles */}
      <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute right-4 -bottom-6 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {title}
          </p>
          <h3 className="text-xl font-black mt-1.5 leading-snug break-words">
            {value}
          </h3>
          {subtext && <p className="text-xs text-white/65 mt-1">{subtext}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-white/20 flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

const RowItem = ({ label, value, subValue, isTotal }) => (
  <div
    className={`flex justify-between items-center py-2.5 ${isTotal ? "pt-3 border-t border-gray-200" : "border-b border-gray-100"}`}
  >
    <span
      className={`text-sm ${isTotal ? "font-bold text-gray-900" : "text-gray-500"}`}
    >
      {label}
    </span>
    <div className="text-right">
      <span
        className={`text-sm font-semibold ${isTotal ? "text-primary" : "text-gray-900"}`}
      >
        {value}
      </span>
      {subValue && (
        <div className="text-[10px] text-gray-400 mt-0.5">{subValue}</div>
      )}
    </div>
  </div>
);

const CostsPieChart = ({ data: chartData }) => {
  if (!chartData.length) return null;
  const total = chartData.reduce((sum, e) => sum + e.value, 0);
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-gray-100">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
        Xarajatlar Taqsimoti
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={85}
            dataKey="value"
          >
            {chartData.map((_, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={PIE_COLORS[idx % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-1.5">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
              />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="font-medium text-gray-900 tabular-nums">
                {formatNumber(item.value)} UZS
              </span>
              <span className="text-gray-400 tabular-nums w-10 text-right">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
        <div className="pt-2 mt-1 border-t border-gray-200 flex justify-between text-xs font-bold">
          <span className="text-gray-700">Jami:</span>
          <span className="text-primary tabular-nums">
            {formatNumber(total)} UZS
          </span>
        </div>
      </div>
    </div>
  );
};

/** Single order card inside a truck — shows full financial breakdown */
const OrderCard = ({ order }) => {
  const isLoss = order.profit_label === "loss" || Number(order.profit_uzs) < 0;
  const profitUzs = Number(order.profit_uzs) || 0;
  const marginPct = Number(order.margin_pct) || 0;
  const pieData = preparePieChartData(order.costs_breakdown || {});
  const months = order.production_months ?? [];

  return (
    <div
      className={`border rounded-xl overflow-hidden ${isLoss ? "border-red-200" : "border-gray-100"}`}
    >
      {/* Order header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${isLoss ? "bg-red-50" : "bg-gray-50"}`}
      >
        <ModelImages modelCode={order.model_name} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {order.order_name}
          </p>
          <p className="text-xs text-gray-400">{order.model_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoss && (
            <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-2 hover:bg-red-100">
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
              Zarar
            </Badge>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              Yuborilgan
            </p>
            <p className="font-semibold text-gray-800 text-sm tabular-nums">
              {formatNumber(order.shipped_qty)} dona
            </p>
          </div>
        </div>
      </div>

      {/* 4-column metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
        <div className="bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            Tushum
          </p>
          <p className="text-sm font-bold text-gray-900 tabular-nums mt-0.5">
            {formatNumber(order.revenue_uzs)}
          </p>
          <p className="text-[10px] text-gray-400">UZS</p>
        </div>
        <div className="bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Xarajat
          </p>
          <p className="text-sm font-bold text-gray-900 tabular-nums mt-0.5">
            {formatNumber(order.allocated_cost_uzs)}
          </p>
          <p className="text-[10px] text-gray-400">UZS</p>
        </div>
        <div
          className={`px-3 py-2.5 ${isLoss ? "bg-red-50" : "bg-emerald-50"}`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-wide ${isLoss ? "text-red-600" : "text-emerald-600"}`}
          >
            {isLoss ? "Zarar" : "Foyda"}
          </p>
          <p
            className={`text-sm font-bold tabular-nums mt-0.5 ${isLoss ? "text-red-700" : "text-emerald-700"}`}
          >
            {isLoss ? "−" : "+"}
            {formatNumber(Math.abs(profitUzs))}
          </p>
          <p
            className={`text-[10px] ${isLoss ? "text-red-400" : "text-emerald-400"}`}
          >
            UZS
          </p>
        </div>
        <div className={`px-3 py-2.5 ${isLoss ? "bg-red-50/60" : "bg-white"}`}>
          <p
            className={`text-[10px] font-bold uppercase tracking-wide ${isLoss ? "text-red-500" : "text-blue-500"}`}
          >
            Margin
          </p>
          <p
            className={`text-sm font-bold tabular-nums mt-0.5 ${isLoss ? "text-red-700" : "text-blue-700"}`}
          >
            {marginPct > 0 ? "+" : ""}
            {marginPct.toFixed(2)}%
          </p>
          <div
            className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${isLoss ? "text-red-400" : "text-blue-400"}`}
          >
            {isLoss ? (
              <ArrowDownRight className="w-2.5 h-2.5" />
            ) : (
              <ArrowUpRight className="w-2.5 h-2.5" />
            )}
            {order.ship_ratio_of_order_percent}% yuborilgan
          </div>
        </div>
      </div>

      {/* Info bar — price, exchange rate, production months */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 bg-white border-t border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <DollarSign className="w-3 h-3 text-gray-400" />
          <span className="tabular-nums font-medium">
            ${formatNumber(order.price_usd)}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400 tabular-nums">
            {formatNumber(order.exchange_rate)} UZS/USD
          </span>
        </div>
        {months.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3 h-3 text-gray-400" />
            {months.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(Number(y), Number(mo) - 1).toLocaleString(
                "ru-RU",
                {
                  month: "short",
                  year: "2-digit",
                },
              );
              return (
                <span
                  key={m}
                  className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Costs pie chart */}
      {pieData.length > 0 && (
        <div className="p-3 border-t border-gray-100">
          <CostsPieChart data={pieData} />
        </div>
      )}
    </div>
  );
};

/**
 * Collapsible truck card.
 * Uses the CSS grid-rows trick for a smooth height transition without JS measurement.
 */
const TruckCard = ({ truck, index, isOpen, onToggle }) => {
  const palette = TRUCK_PALETTES[index % TRUCK_PALETTES.length];
  const truckProfit = (truck.orders ?? []).reduce(
    (sum, o) => sum + (Number(o.profit_uzs) || 0),
    0,
  );
  const truckIsLoss = truckProfit < 0;

  return (
    <div
      className={`rounded-xl overflow-hidden border border-gray-200 border-l-4 ${palette.border} shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* ── Clickable header ── */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full bg-gradient-to-r ${palette.headerBg} px-5 py-4 flex items-center justify-between gap-3 text-left`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${palette.dot}`}
          />
          <span className="font-mono font-bold text-lg tracking-wide text-gray-800">
            {truck.number}
          </span>
          <Badge
            variant={truck.status === "shipped" ? "default" : "outline"}
            className={
              truck.status === "shipped"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                : "bg-orange-50 text-orange-800 border-orange-200"
            }
          >
            {truck.status === "shipped" ? "Yuborilgan" : "Kutilmoqda"}
          </Badge>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Stats visible on sm+ */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase font-bold text-gray-400">
              Miqdor
            </p>
            <p className="text-sm font-bold text-gray-800 tabular-nums">
              {formatNumber(truck.shipped_qty)} dona
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase font-bold text-emerald-600">
              Tushum
            </p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">
              {formatNumber(truck.revenue_uzs)} UZS
            </p>
          </div>
          {/* Truck-level profit/loss badge */}
          <div
            className={`hidden sm:flex flex-col items-end px-3 py-1.5 rounded-lg ${truckIsLoss ? "bg-red-100" : "bg-emerald-100"}`}
          >
            <p
              className={`text-[10px] uppercase font-bold ${truckIsLoss ? "text-red-600" : "text-emerald-600"}`}
            >
              {truckIsLoss ? "Zarar" : "Foyda"}
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${truckIsLoss ? "text-red-700" : "text-emerald-700"}`}
            >
              {truckIsLoss ? "−" : "+"}
              {formatNumber(Math.abs(truckProfit))}
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* ── Accordion body (CSS grid-rows trick for smooth animation) ── */}
      <div
        className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="p-5 space-y-4 bg-white">
            {/* Mobile summary (hidden on sm+) */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                  Miqdor
                </p>
                <p className="font-semibold text-gray-900 text-sm tabular-nums">
                  {formatNumber(truck.shipped_qty)} dona
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">
                  Tushum
                </p>
                <p className="font-semibold text-emerald-700 text-sm tabular-nums">
                  {formatNumber(truck.revenue_uzs)}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${truckIsLoss ? "bg-red-50" : "bg-emerald-50"}`}
              >
                <p
                  className={`text-[10px] uppercase font-bold mb-1 ${truckIsLoss ? "text-red-600" : "text-emerald-600"}`}
                >
                  {truckIsLoss ? "Zarar" : "Foyda"}
                </p>
                <p
                  className={`font-semibold text-sm tabular-nums ${truckIsLoss ? "text-red-700" : "text-emerald-700"}`}
                >
                  {truckIsLoss ? "−" : "+"}
                  {formatNumber(Math.abs(truckProfit))}
                </p>
              </div>
            </div>

            <Separator />

            {/* Orders list */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Buyurtmalar{" "}
                <span className="text-gray-300 normal-case font-normal">
                  ({truck.orders?.length ?? 0} ta)
                </span>
              </p>
              <div className="space-y-4">
                {truck.orders?.map((order, i) => (
                  <OrderCard key={i} order={order} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Shipments = () => {
  const { toast } = useToast();

  const [data, setData] = useState({
    trucks: [],
    costs_breakdown: {},
    monthly_company_summary: {},
    summary: {},
    unshipped_orders: [],
    unshipped_orders_summary: {},
  });
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("shipmentsSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  // First truck open by default
  const [openTrucks, setOpenTrucks] = useState(new Set([0]));

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("monthly/trucks", {
        params: { month: selectedMonth, dollar_rate: await getDollarRate() },
      });
      setData(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  const toggleTruck = (index) => {
    setOpenTrucks((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // Derived values with safe fallbacks
  const cb = data?.costs_breakdown ?? {};
  const mcs = data?.monthly_company_summary ?? {};

  const totalSalary =
    (Number(cb.attendance_salary_total) || 0) +
    (Number(cb.money_logs_total) || 0) +
    (Number(cb.season_salary_total) || 0) +
    (Number(cb.tarification_total) || 0);

  const grandTotalUzs = Number(cb.factory_grand_total_uzs) || 0;
  const totalEarnedUzs = Number(mcs.total_earned_uzs) || 0;
  const outputQty = Number(mcs.total_output_quantity) || 0;
  const unitCost = outputQty > 0 ? grandTotalUzs / outputQty : 0;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-primary animate-spin" size={48} />
        <p className="text-muted-foreground animate-pulse">
          Ma'lumotlar yuklanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Hisobot
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Oylik jo'natmalar va moliyaviy tahlil
          </p>
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            localStorage.setItem("shipmentsSelectedMonth", e.target.value);
            setSelectedMonth(e.target.value);
          }}
          className="bg-white w-fit shadow-sm"
        />
      </header>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
          Asosiy Ko'rsatkichlar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricTile
            title="Umumiy Tushum"
            value={`${formatNumber(totalEarnedUzs)} UZS`}
            icon={DollarSign}
            color="green"
          />
          <MetricTile
            title="Umumiy Xarajat"
            value={`${formatNumber(grandTotalUzs)} UZS`}
            icon={TrendingDown}
            color="red"
          />
          <MetricTile
            title="Sof Foyda"
            value={`${formatNumber(totalEarnedUzs - grandTotalUzs)} UZS`}
            icon={TrendingUp}
            color="blue"
          />
          <MetricTile
            title="Fura Tushumi"
            value={`${formatNumber(data?.summary?.total_revenue_uzs)} UZS`}
            icon={Wallet}
            color="emerald"
          />
          <MetricTile
            title="Yuborilgan Yuk"
            value={`${formatNumber(data?.summary?.total_shipped_qty)} dona`}
            subtext={`Ishlab chiqarilgan: ${formatNumber(outputQty)} dona`}
            icon={Package}
            color="amber"
          />
          <MetricTile
            title="Fura Soni"
            value={`${data?.trucks?.length ?? 0} ta`}
            icon={Truck}
            color="indigo"
          />
        </div>
      </section>

      {/* ── Costs Breakdown ────────────────────────────────────────────────── */}
      <section>
        <Card className="shadow-sm overflow-hidden">
          {/* Colored card header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              <Calculator className="w-4 h-4 text-slate-300" />
              <h2 className="font-bold text-base">Xarajatlar Tafsiloti</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zavodning umumiy xarajatlari taqsimoti
            </p>
          </div>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50/60 rounded-xl p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-3">
                Ish Haqi va Maosh
              </h4>
              <RowItem
                label="Jami Maosh"
                value={`${formatNumber(totalSalary)} UZS`}
              />
              <RowItem
                label="Transport uchun"
                value={`${formatNumber(cb.transport_attendance)} UZS`}
              />
              <RowItem
                label="Xodimlar Soni"
                value={`${formatNumber(cb.transport_employees_count)} kishi`}
                subValue={`${formatNumber(cb.transport_per_employee)} / kishi`}
              />
            </div>
            <div className="bg-purple-50/60 rounded-xl p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-600 mb-3">
                Operatsion Xarajatlar
              </h4>
              <RowItem
                label="Amortizatsiya"
                value={`${formatNumber(cb.amortization_total)} UZS`}
              />
              <RowItem
                label="Oylik Xarajatlar"
                value={`${formatNumber(cb.monthly_expenses)} UZS`}
              />
              <RowItem
                label="Birlik Tannarxi"
                value={unitCost > 0 ? `${formatNumber(unitCost)} UZS` : "—"}
                subValue="1 mahsulotga"
              />
            </div>
            <div className="md:col-span-2 bg-gradient-to-r from-slate-100 to-slate-50 p-4 rounded-xl border border-slate-200">
              <RowItem
                label="Jami Zavod Xarajatlari"
                value={`${formatNumber(grandTotalUzs)} UZS`}
                isTotal
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Trucks (collapsible accordion) ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Yuk Mashinalari</h2>
          <Badge className="ml-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0 font-semibold">
            {data?.trucks?.length ?? 0} ta
          </Badge>
        </div>

        {!data?.trucks?.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center text-gray-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="font-medium">Bu oy uchun fura ma'lumotlari yo'q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.trucks.map((truck, index) => (
              <TruckCard
                key={index}
                truck={truck}
                index={index}
                isOpen={openTrucks.has(index)}
                onToggle={() => toggleTruck(index)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Unshipped Orders ───────────────────────────────────────────────── */}
      <section>
        <Card className="shadow-sm overflow-hidden">
          {/* Orange card header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-orange-100" />
              <h2 className="font-bold text-base">Yuborilmagan Buyurtmalar</h2>
            </div>
            <p className="text-xs text-orange-100 mt-0.5">
              Hali jo'natilmagan buyurtmalar ro'yxati
            </p>
          </div>

          <CardContent className="p-6">
            {/* Summary tiles */}
            {!!Object.keys(data?.unshipped_orders_summary ?? {}).length && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                  <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    Buyurtmalar
                  </p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">
                    {formatNumber(data.unshipped_orders_summary.orders_count)}
                  </p>
                  <p className="text-xs text-orange-400 mt-0.5">ta</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    Ishlab Chiqarilgan
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatNumber(
                      data.unshipped_orders_summary.total_produced_qty,
                    )}
                  </p>
                  <p className="text-xs text-blue-400 mt-0.5">
                    /{" "}
                    {formatNumber(
                      data.unshipped_orders_summary.total_planned_qty,
                    )}{" "}
                    reja
                  </p>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider">
                    Qiymat (USD)
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    $
                    {formatNumber(
                      data.unshipped_orders_summary.total_value_usd,
                    )}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                  <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                    Qiymat (UZS)
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-1 break-words leading-tight">
                    {formatNumber(
                      data.unshipped_orders_summary.total_value_uzs,
                    )}
                  </p>
                  <p className="text-xs text-purple-400 mt-0.5">UZS</p>
                </div>
              </div>
            )}

            {data?.unshipped_orders?.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-medium text-gray-600">
                    Yuborilishi kutilayotgan buyurtmalar
                  </p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Buyurtma
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Model
                        </th>
                        <th className="text-center py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Holat
                        </th>
                        <th className="text-center py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Bajarilishi
                        </th>
                        <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Narx (USD)
                        </th>
                        <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Qiymat (UZS)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.unshipped_orders.map((order) => {
                        const progress =
                          order.planned_qty > 0
                            ? Math.min(
                                (order.produced_qty / order.planned_qty) * 100,
                                100,
                              )
                            : 0;
                        return (
                          <tr
                            key={order.order_id}
                            className="hover:bg-orange-50/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-semibold text-gray-900">
                                {order.order_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                #{order.order_id}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <ModelImages modelCode={order.model_name} />
                                <span className="text-gray-700">
                                  {order.model_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={
                                  order.order_status === "checking"
                                    ? "default"
                                    : "outline"
                                }
                                className={
                                  order.order_status === "checking"
                                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                                    : "bg-orange-50 text-orange-800 border-orange-200"
                                }
                              >
                                {order.order_status === "checking"
                                  ? "Tekshirilmoqda"
                                  : "Tikilgan"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 min-w-[140px]">
                              <div className="flex items-center justify-center gap-1 mb-1.5 tabular-nums">
                                <span className="font-semibold text-gray-900">
                                  {formatNumber(order.produced_qty)}
                                </span>
                                <span className="text-gray-300">/</span>
                                <span className="text-gray-500">
                                  {formatNumber(order.planned_qty)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    progress >= 100
                                      ? "bg-green-500"
                                      : progress >= 60
                                        ? "bg-blue-500"
                                        : "bg-orange-400"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              {order.produced_qty < order.planned_qty && (
                                <p className="text-[10px] text-orange-500 mt-1 text-center">
                                  {formatNumber(
                                    order.planned_qty - order.produced_qty,
                                  )}{" "}
                                  qolgan
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-800 tabular-nums">
                              ${formatNumber(order.price_usd)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-emerald-600 tabular-nums">
                              {formatNumber(order.value_uzs)} UZS
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-7 h-7 text-orange-300" />
                </div>
                <p className="text-gray-500 font-medium">
                  Yuborilmagan buyurtmalar yo'q
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Barcha buyurtmalar jo'natilgan
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Shipments;

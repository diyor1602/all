import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  TrendingUp,
  DollarSign,
  Package,
  Wallet,
  Users,
  BarChart3,
  ArrowUpRight,
  Truck,
  Scissors,
} from "lucide-react";
import ModelImages from "@/components/ModelImages";
import { statuses } from "@/lib/status";

const fmt = (n) =>
  Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 0 });

const fmtUsd = (n) =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

const toUsd = (uzs, rate) => (rate ? uzs / rate : 0);

// Cards that show dual currency
const CARDS = (d) => [
  {
    label: "Xizmat",
    primary: fmtUsd(d.today_revenue_usd),
    secondary: fmt(d.today_revenue_uzs) + " so'm",
    icon: DollarSign,
    from: "#6366f1",
    to: "#818cf8",
    light: "#eef2ff",
    text: "#4338ca",
  },
  {
    label: "Foyda",
    primary: fmtUsd(toUsd(d.profit, d.dollar_rate)),
    secondary: (() => {
      const profitPercentage =
        d.today_revenue_uzs > 0 ? (d.profit / d.today_revenue_uzs) * 100 : 0;
      return `${fmt(d.profit)} so'm (${profitPercentage.toFixed(1)}%)`;
    })(),
    icon: TrendingUp,
    from: "#10b981",
    to: "#34d399",
    light: "#ecfdf5",
    text: "#065f46",
  },
  {
    label: "Umumiy xarajat",
    primary: fmtUsd(toUsd(d.total_cost, d.dollar_rate)),
    secondary: fmt(d.total_cost) + " so'm",
    icon: Wallet,
    from: "#f59e0b",
    to: "#fbbf24",
    light: "#fffbeb",
    text: "#92400e",
  },
];

const CARDS2 = (d) => [
  {
    label: "Dollar kursi",
    primary: fmt(d.dollar_rate) + " so'm",
    secondary: null,
    icon: DollarSign,
    from: "#8b5cf6",
    to: "#a78bfa",
    light: "#f5f3ff",
    text: "#5b21b6",
  },
  {
    label: "Tikilgan buyurtmalar",
    primary: fmt(d.today_total_sewed_orders) + " ta",
    secondary: null,
    icon: Package,
    from: "#f97316",
    to: "#fb923c",
    light: "#fff7ed",
    text: "#9a3412",
  },
];

const MetricCard = ({
  label,
  primary,
  secondary,
  icon: Icon,
  from,
  to,
  light,
  text,
}) => (
  <div
    className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3"
    style={{ background: light, border: `1.5px solid ${from}22` }}
  >
    <div className="flex items-start justify-between">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <Icon size={20} color="white" strokeWidth={2} />
      </div>
      <ArrowUpRight
        size={16}
        style={{ color: from }}
        className="mt-1 opacity-60"
      />
    </div>
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-1"
        style={{ color: text, opacity: 0.6 }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-extrabold leading-tight"
        style={{ color: text }}
      >
        {primary}
      </p>
      {secondary && (
        <p
          className="text-sm mt-1 font-semibold"
          style={{ color: text, opacity: 0.5 }}
        >
          {secondary}
        </p>
      )}
    </div>
    <div
      className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    />
  </div>
);

const SalaryBand = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-4 bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: color + "18" }}
    >
      <Icon size={18} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0 flex flex-col">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-base font-bold text-gray-800 break-words">{value}</p>
    </div>
  </div>
);

const TYPE_LABELS = {
  monthly: "Oylik",
  amortization: "Amortizatsiya",
  income_percentage: "Foiz",
};

const TYPE_COLORS = {
  monthly: { bg: "#eff6ff", text: "#1d4ed8" },
  amortization: { bg: "#f5f3ff", text: "#7c3aed" },
  income_percentage: { bg: "#fff7ed", text: "#c2410c" },
};

const OrderCard = ({ order, dollarRate }) => {
  const status = statuses[order.status] || {
    secondaryBg: "bg-gray-50",
    textColor: "text-gray-500",
    text: order.status,
  };
  const progress = Math.min(
    100,
    Math.round((order.sewed_quantity / order.quantity) * 100),
  );

  const progressColor =
    progress >= 80
      ? "linear-gradient(90deg,#10b981,#34d399)"
      : progress >= 40
        ? "linear-gradient(90deg,#6366f1,#818cf8)"
        : "linear-gradient(90deg,#f59e0b,#fbbf24)";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">
            <ModelImages modelCode={order.model_name} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {order.model_name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {order.submodel_name} · {order.name}
            </p>
            {order.price && (
              <p className="text-xs font-semibold text-green-600 mt-1">
                {fmtUsd(order.price)}
              </p>
            )}
            {order.summa && (
              <div className="mt-1">
                <p className="text-xs font-semibold text-blue-600">
                  Jami: {fmtUsd(toUsd(order.summa, dollarRate))}
                </p>
                {order.price && (
                  <p className="text-xs font-semibold text-blue-500">
                    {((order.summa / (order.price * dollarRate)) * 100).toFixed(
                      1,
                    )}
                    %
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${status.secondaryBg} ${status.textColor}`}
        >
          {status.text}
        </span>
      </div>

      {/* revenue */}
      <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">
            Bugungi xizmat
          </p>
          <p className="text-lg font-extrabold text-indigo-700">
            {fmtUsd(order.todayRevenue_usd)}
          </p>
          <p className="text-xs font-medium text-indigo-300 mt-0.5">
            {fmt(order.todayRevenue_uzs)} so'm
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">
            Bugungi xarajat
          </p>
          <p className="text-lg font-extrabold text-amber-600">
            {fmtUsd(toUsd(order.total_cost, dollarRate))}
          </p>
          <p className="text-xs font-medium text-amber-300 mt-0.5">
            {fmt(order.total_cost)} so'm
          </p>
        </div>
      </div>

      {/* progress */}
      <div className="border-t border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400 font-medium">Bajarilish</p>
          <p className="text-xs font-bold text-gray-700">
            {fmt(order.sewed_quantity)} / {fmt(order.quantity)} ta
            <span className="ml-1 font-normal text-gray-400">
              ({progress}%)
            </span>
          </p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: progress + "%", background: progressColor }}
          />
        </div>
      </div>

      {/* xizmat-xarajat */}
      <div className="border-t border-gray-100 px-5 py-4">
        {(() => {
          const profit = order.todayRevenue_uzs - order.total_cost;
          const profitPercentage =
            order.todayRevenue_uzs > 0
              ? (profit / order.todayRevenue_uzs) * 100
              : 0;
          const isPositive = profit >= 0;
          const costPerUnit =
            order.sewed_quantity > 0
              ? order.total_cost / order.sewed_quantity
              : 0;

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                  Xizmat-Xarajat
                </p>
                <div className="text-right">
                  <p
                    className={`text-lg font-extrabold ${isPositive ? "text-green-600" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : ""}
                    {fmtUsd(toUsd(profit, dollarRate))}
                  </p>
                  <p
                    className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
                  >
                    {isPositive ? "+" : ""}
                    {fmt(profit)} so'm ({profitPercentage.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                  Xarajat / dona
                </p>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-amber-600">
                    {fmtUsd(toUsd(costPerUnit, dollarRate))}
                  </p>
                  <p className="text-xs font-medium text-amber-300">
                    {fmt(costPerUnit)} so'm
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* cost breakdown */}
      <div className="border-t border-gray-100 px-5 py-4 space-y-2.5">
        {[
          { k: "Tikuv (rasxod)", v: order.cost_breakdown.rasxod },
          { k: "Maosh", v: order.cost_breakdown.season_salary },
          { k: "Transport", v: order.cost_breakdown.transport },
          { k: "Oylik xarajat", v: order.cost_breakdown.monthly_expense },
        ].map(({ k, v }) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{k}</span>
            <span className="text-xs font-bold text-gray-700">
              {fmtUsd(toUsd(v, dollarRate))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Daily = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = localStorage.getItem("selectedDate");
    return savedDate || new Date().toISOString().split("T")[0];
  });
  const [activeTab, setActiveTab] = useState("expenses");
  const [ordersView, setOrdersView] = useState("cards");

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dailyBalance", {
        params: { date: selectedDate },
      });
      setData(res.data);
    } catch {
      toast({ title: "Xatolik", description: "Ma'lumotlarni olib bo'lmadi" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedDate]);

  return (
    <div className="min-h-screen" style={{ background: "#f1f5f9" }}>
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          boxShadow: "0 4px 24px #0002",
        }}
      >
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Kunlik Hisobot
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Moliyaviy ko'rsatkichlar
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            localStorage.setItem("selectedDate", e.target.value);
          }}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold border-0 outline-none focus:ring-2 focus:ring-indigo-400"
          style={{
            background: "#ffffff14",
            color: "white",
            colorScheme: "dark",
          }}
        />
      </div>

      <div className="px-6 py-8 pb-16 space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">
                Yuklanmoqda...
              </p>
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Primary metrics */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Asosiy ko'rsatkichlar
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {CARDS(data).map((c) => (
                  <MetricCard key={c.label} {...c} />
                ))}
              </div>
            </section>

            {/* Secondary metrics */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Ishlab chiqarish
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CARDS2(data).map((c) => (
                  <MetricCard key={c.label} {...c} />
                ))}
              </div>
            </section>

            {/* Cost bands */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Xarajatlar
              </p>
              {(() => {
                const totalSalary =
                  data.total_attendance_salary +
                  data.today_season_salary +
                  data.rasxod;
                const totalCost = data.total_cost || 1; // Avoid division by zero

                const monthlyExpensePercentage =
                  totalCost > 0
                    ? (data.today_monthly_expense / totalCost) * 100
                    : 0;
                const salaryPercentage =
                  totalCost > 0 ? (totalSalary / totalCost) * 100 : 0;
                const transportPercentage =
                  totalCost > 0
                    ? (data.total_transport_salary / totalCost) * 100
                    : 0;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SalaryBand
                      label="Oylik xarajatlar (bugun)"
                      value={`${fmtUsd(toUsd(data.today_monthly_expense, data.dollar_rate))} · ${fmt(data.today_monthly_expense)} so'm (${monthlyExpensePercentage.toFixed(1)}%)`}
                      icon={BarChart3}
                      color="#6366f1"
                    />
                    <SalaryBand
                      label="Maosh"
                      value={`${fmtUsd(toUsd(totalSalary, data.dollar_rate))} · ${fmt(totalSalary)} so'm (${salaryPercentage.toFixed(1)}%)`}
                      icon={Users}
                      color="#10b981"
                    />
                    <SalaryBand
                      label="Transport maoshi"
                      value={`${fmtUsd(toUsd(data.total_transport_salary, data.dollar_rate))} · ${fmt(data.total_transport_salary)} so'm (${transportPercentage.toFixed(1)}%)`}
                      icon={Truck}
                      color="#f59e0b"
                    />
                  </div>
                );
              })()}
            </section>

            {/* Monthly expenses */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Oylik xarajatlar
              </p>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab("expenses")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === "expenses"
                        ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Oylik xarajatlar
                  </button>
                  <button
                    onClick={() => setActiveTab("breakdown")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === "breakdown"
                        ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Kunlik bo'linma
                  </button>
                </div>

                {/* Tab content */}
                <div className="grid grid-cols-1 divide-y divide-gray-50">
                  {activeTab === "expenses" &&
                    data.monthly_expenses?.map((exp, i) => {
                      const colors = TYPE_COLORS[exp.type] || {
                        bg: "#f8fafc",
                        text: "#475569",
                      };
                      const isPercent = exp.type === "income_percentage";
                      const isAmort = exp.type === "amortization";
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                background: colors.bg,
                                color: colors.text,
                              }}
                            >
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {exp.name}
                              </p>
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  background: colors.bg,
                                  color: colors.text,
                                }}
                              >
                                {TYPE_LABELS[exp.type] || exp.type}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-gray-800 text-right">
                            {isPercent ? (
                              Number(exp.amount) + "%"
                            ) : isAmort ? (
                              Number(exp.amount)
                            ) : (
                              <span>
                                {fmtUsd(
                                  toUsd(Number(exp.amount), data.dollar_rate),
                                )}
                                <span className="block text-xs font-medium text-gray-400">
                                  {fmt(exp.amount)} so'm
                                </span>
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}

                  {activeTab === "breakdown" &&
                    data.monthly_expense_breakdown?.map((exp, i) => {
                      const colors = TYPE_COLORS[exp.type] || {
                        bg: "#f8fafc",
                        text: "#475569",
                      };
                      const isPercent = exp.type === "income_percentage";
                      const isAmort = exp.type === "amortization";
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                background: colors.bg,
                                color: colors.text,
                              }}
                            >
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {exp.name}
                              </p>
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  background: colors.bg,
                                  color: colors.text,
                                }}
                              >
                                {TYPE_LABELS[exp.type] || exp.type}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-gray-800 text-right">
                            {isPercent ? (
                              <span>
                                {fmtUsd(
                                  toUsd(
                                    Number(exp.calculated_today),
                                    data.dollar_rate,
                                  ),
                                )}
                                <span className="block text-xs font-medium text-gray-400">
                                  {fmt(exp.calculated_today)} so'm (
                                  {exp.original_amount}%)
                                </span>
                              </span>
                            ) : isAmort ? (
                              <span>
                                {fmtUsd(
                                  toUsd(
                                    Number(exp.calculated_today),
                                    data.dollar_rate,
                                  ),
                                )}
                                <span className="block text-xs font-medium text-gray-400">
                                  {fmt(exp.calculated_today)} so'm
                                </span>
                              </span>
                            ) : (
                              <span>
                                {fmtUsd(
                                  toUsd(
                                    Number(exp.calculated_today),
                                    data.dollar_rate,
                                  ),
                                )}
                                <span className="block text-xs font-medium text-gray-400">
                                  {fmt(exp.calculated_today)} so'm
                                </span>
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>

            {/* Today sewed orders */}
            {data.today_sewed_orders?.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Scissors size={14} className="text-slate-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Bugungi buyurtmalar ({data.today_sewed_orders.length} ta)
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setOrdersView("cards")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        ordersView === "cards"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Kartalar
                    </button>
                    <button
                      onClick={() => setOrdersView("table")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        ordersView === "table"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Jadval
                    </button>
                  </div>
                </div>

                {ordersView === "cards" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.today_sewed_orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        dollarRate={data.dollar_rate}
                      />
                    ))}
                  </div>
                )}

                {ordersView === "table" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Model
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Holati
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Xizmat
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Xarajat
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Xarajat / dona
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Bajarilish
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Xizmat-Xarajat
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Jami
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Narxi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.today_sewed_orders.map((order) => {
                            const status = statuses[order.status] || {
                              secondaryBg: "bg-gray-50",
                              textColor: "text-gray-500",
                              text: order.status,
                            };
                            const progress = Math.min(
                              100,
                              Math.round(
                                (order.sewed_quantity / order.quantity) * 100,
                              ),
                            );

                            return (
                              <tr
                                key={order.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <div className="shrink-0">
                                      <ModelImages
                                        modelCode={order.model_name}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {order.model_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {order.submodel_name} · {order.name}
                                      </p>
                                      {order.price && (
                                        <p className="text-xs font-semibold text-green-600 mt-1">
                                          {fmtUsd(order.price)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.secondaryBg} ${status.textColor}`}
                                  >
                                    {status.text}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div>
                                    <p className="text-sm font-bold text-indigo-700">
                                      {fmtUsd(order.todayRevenue_usd)}
                                    </p>
                                    <p className="text-xs text-indigo-300">
                                      {fmt(order.todayRevenue_uzs)} so'm
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div>
                                    <p className="text-sm font-bold text-amber-600">
                                      {fmtUsd(
                                        toUsd(
                                          order.total_cost,
                                          data.dollar_rate,
                                        ),
                                      )}
                                    </p>
                                    <p className="text-xs text-amber-300">
                                      {fmt(order.total_cost)} so'm
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {(() => {
                                    const costPerUnit =
                                      order.sewed_quantity > 0
                                        ? order.total_cost /
                                          order.sewed_quantity
                                        : 0;
                                    return (
                                      <div>
                                        <p className="text-sm font-bold text-amber-600">
                                          {fmtUsd(
                                            toUsd(
                                              costPerUnit,
                                              data.dollar_rate,
                                            ),
                                          )}
                                        </p>
                                        <p className="text-xs text-amber-300">
                                          {fmt(costPerUnit)} so'm
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="text-right">
                                      <p className="text-xs font-bold text-gray-700">
                                        {fmt(order.sewed_quantity)} /{" "}
                                        {fmt(order.quantity)}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        ({progress}%)
                                      </p>
                                    </div>
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: progress + "%" }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {(() => {
                                    const profit =
                                      order.todayRevenue_uzs - order.total_cost;
                                    const profitPercentage =
                                      order.todayRevenue_uzs > 0
                                        ? (profit / order.todayRevenue_uzs) *
                                          100
                                        : 0;
                                    const isPositive = profit >= 0;

                                    return (
                                      <div>
                                        <p
                                          className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}
                                        >
                                          {fmtUsd(
                                            toUsd(profit, data.dollar_rate),
                                          )}
                                        </p>
                                        <p
                                          className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}
                                        >
                                          {fmt(profit)} so'm
                                        </p>
                                        <p
                                          className={`text-xs font-semibold mt-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
                                        >
                                          {isPositive ? "+" : ""}
                                          {profitPercentage.toFixed(1)}%
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {order.summa && (
                                    <div>
                                      <p className="text-sm font-bold text-blue-600">
                                        {fmtUsd(
                                          toUsd(order.summa, data.dollar_rate),
                                        )}
                                      </p>
                                      <p className="text-xs text-blue-300">
                                        {fmt(order.summa)} so'm
                                      </p>
                                      {order.price && (
                                        <p className="text-xs font-semibold text-blue-500 mt-1">
                                          {(
                                            (order.summa /
                                              (order.price *
                                                data.dollar_rate)) *
                                            100
                                          ).toFixed(1)}
                                          %
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="space-y-1">
                                    {[
                                      {
                                        k: "Tikuv",
                                        v: order.cost_breakdown.rasxod,
                                      },
                                      {
                                        k: "Maosh",
                                        v:
                                          order.cost_breakdown.season_salary +
                                          order.cost_breakdown.attendance,
                                      },
                                      {
                                        k: "Transport",
                                        v: order.cost_breakdown.transport,
                                      },
                                      {
                                        k: "Kunlik xarajat",
                                        v: order.cost_breakdown.monthly_expense,
                                      },
                                    ].map(({ k, v }) => {
                                      const percentage =
                                        order.total_cost > 0
                                          ? (v / order.total_cost) * 100
                                          : 0;
                                      return (
                                        <div
                                          key={k}
                                          className="flex justify-between items-center gap-2"
                                        >
                                          <span className="text-xs text-gray-500">
                                            {k}:
                                          </span>
                                          <div className="text-right">
                                            <span className="text-xs font-bold text-gray-700">
                                              {fmtUsd(
                                                toUsd(v, data.dollar_rate),
                                              )}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-1">
                                              ({percentage.toFixed(1)}%)
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Daily;

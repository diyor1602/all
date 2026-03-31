import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  Package,
  Activity,
  Loader2,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const Overall = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);
  const [dollarRate, setDollarRate] = useState(12211);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ceo/calculateSeasonWithCosts`, {
        params: { month: selectedMonth, dollar_rate: dollarRate },
      });
      setData(response.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotni yuklab bo'lmadi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  const navigateMonth = (direction) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const newDate = new Date(year, direction === "prev" ? month - 2 : month, 1);

    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, "0");
    const newMonthString = `${y}-${m}`;

    setSelectedMonth(newMonthString);
    localStorage.setItem("newSeasonSelectedMonth", newMonthString);
  };

  const totalRevenue = Number(data?.costs?.total_earned_uzs) || 0;
  const totalExpenses = Number(data?.costs?.total_fixed_cost_uzs) || 0;

  const profitMargin = totalRevenue
    ? ((Number(data?.costs?.net_profit_uzs || 0) / totalRevenue) * 100).toFixed(
        1,
      )
    : 0;

  const revenuePercentage = totalRevenue ? 100 : 0;
  const expensesPercentage = totalRevenue
    ? ((totalExpenses / totalRevenue) * 100).toFixed(1)
    : 0;

  const newSeasonTotal =
    (Number(data?.costs?.sewing_salary_total) || 0) +
    (Number(data?.costs?.assistant_salary) || 0) +
    (Number(data?.costs?.cutting_salary_total) || 0);

  const additionalSalary =
    (Number(data?.costs?.monthly_salary) || 0) +
    (Number(data?.costs?.monthly_piecework) || 0) +
    (Number(data?.costs?.monthly_daily_payment) || 0);

  const getExpensePercentage = (value) => {
    const numericValue = Number(value) || 0;
    if (!totalExpenses || !numericValue) return 0;
    return ((numericValue / totalExpenses) * 100).toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-white min-h-screen text-slate-900 relative">
      <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Moliyaviy Hisobot
            </h1>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              localStorage.setItem("newSeasonSelectedMonth", e.target.value);
            }}
            className="border-none shadow-none bg-transparent font-medium text-sm focus-visible:ring-0 w-fit cursor-pointer"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBlock
          loading={loading}
          label="Tushum"
          value={totalRevenue}
          percentage={revenuePercentage}
          icon={<Activity className="text-blue-500" />}
          dollarRate={dollarRate}
        />

        <StatBlock
          loading={loading}
          label="Xarajat"
          value={totalExpenses}
          percentage={expensesPercentage}
          icon={<Wallet className="text-rose-500" />}
          dollarRate={dollarRate}
        />

        {loading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : (
          <div className="p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/30">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Sof Foyda
              </span>
            </div>

            <div className="text-2xl font-bold text-emerald-700">
              {formatNumber(data?.costs?.net_profit_uzs, 0)}{" "}
              <span className="text-xs font-normal">UZS</span>
            </div>

            {data?.costs?.net_profit_uzs && (
              <div className="text-sm font-medium text-emerald-600">
                ≈ {formatNumber(data?.costs?.net_profit_uzs / dollarRate, 2)} $
              </div>
            )}

            <div className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-100 w-fit px-2 py-0.5 rounded">
              Rentabellik: {profitMargin}%
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-1">
          Xarajatlar tafsiloti
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailCard
            loading={loading}
            label="Tikuv uchun"
            value={data?.costs?.tarification}
            percentage={getExpensePercentage(data?.costs?.tarification)}
          />

          <DetailCard
            loading={loading}
            label="Soatbay"
            value={
              (Number(data?.costs?.aup) || 0) +
              (Number(data?.costs?.is_not_aup) || 0)
            }
            percentage={getExpensePercentage(
              (Number(data?.costs?.aup) || 0) +
                (Number(data?.costs?.is_not_aup) || 0),
            )}
          />

          <DetailCard
            loading={loading}
            label="Ombor"
            value={data?.costs?.warehouse_salary}
            percentage={getExpensePercentage(data?.costs?.warehouse_salary)}
          />

          <DetailCard
            loading={loading}
            label="Ustidan yozilgan"
            value={additionalSalary}
            percentage={getExpensePercentage(additionalSalary)}
          />

          <DetailCard
            loading={loading}
            label="Yangi mavsum"
            value={newSeasonTotal}
            percentage={getExpensePercentage(newSeasonTotal)}
          />

          <DetailCard
            loading={loading}
            label="Transport"
            value={data?.costs?.transport_attendance}
            percentage={getExpensePercentage(data?.costs?.transport_attendance)}
          />

          <DetailCard
            loading={loading}
            label="Oylik o'zgarmas"
            value={data?.costs?.monthly_expenses}
            percentage={getExpensePercentage(data?.costs?.monthly_expenses)}
          />
        </div>
      </div>

      <div
        className={`flex items-center justify-between bg-slate-900 text-white p-5 rounded-xl transition-opacity ${
          loading ? "opacity-50" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium opacity-80">
            Jami chiqqan mahsulotlar
          </span>
        </div>

        <span className="text-xl font-bold">
          {loading
            ? "..."
            : formatNumber(data?.costs?.total_output_quantity, 0)}{" "}
          <span className="text-xs font-light">dona</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-900">
              O'rtacha xodimlar soni
            </span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            {loading
              ? "..."
              : formatNumber(data?.costs?.average_employee_count)}
            <span className="text-xs font-normal text-blue-700 ml-1">
              kishi
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-emerald-900">
              1 kishi uchun transport
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-900">
            {loading
              ? "..."
              : formatNumber(data?.costs?.transport_per_employee)}
            <span className="text-xs font-normal text-emerald-700 ml-1">
              UZS
            </span>
          </div>
          {!loading && data?.costs?.transport_per_employee && (
            <div className="text-sm font-medium text-emerald-700">
              ≈{" "}
              {formatNumber(
                data?.costs?.transport_per_employee / dollarRate,
                2,
              )}{" "}
              $
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-purple-900">
              1 dona mahsulot
            </span>
          </div>
          <div className="text-xl font-bold text-purple-900">
            {loading
              ? "..."
              : formatNumber(data?.costs?.cost_per_unit_overall_uzs, 0)}
            <span className="text-xs font-normal text-purple-700 ml-1">
              UZS
            </span>
          </div>
          {!loading && data?.costs?.cost_per_unit_overall_uzs && (
            <div className="text-sm font-medium text-purple-700">
              ≈{" "}
              {formatNumber(
                data?.costs?.cost_per_unit_overall_uzs / dollarRate,
                2,
              )}{" "}
              $
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 ${className}`} />
);

const StatBlock = ({ label, value, percentage, icon, loading, dollarRate }) => (
  <div className="p-4 rounded-xl border bg-white shadow-sm h-28 flex flex-col justify-center">
    {loading ? (
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    ) : (
      <>
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>

        <div className="text-2xl font-bold text-slate-800">
          {formatNumber(value, 0)}{" "}
          <span className="text-xs font-normal text-slate-400">UZS</span>
        </div>

        {value && (
          <div className="text-xs font-medium text-slate-500">
            ≈ {formatNumber(value / dollarRate, 2)} $
          </div>
        )}

        {percentage !== undefined && (
          <div className="text-xs font-medium text-slate-500">
            {percentage}%
          </div>
        )}
      </>
    )}
  </div>
);

const DetailCard = ({ label, value, percentage, loading }) => (
  <div className="flex justify-between items-center p-4 rounded-lg border border-slate-100 bg-slate-50/50 h-14">
    <span className="text-sm text-slate-600">{label}</span>

    {loading ? (
      <Skeleton className="h-4 w-24" />
    ) : (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-800 text-sm">
          {formatNumber(value, 0)}
        </span>
        <span className="text-xs text-slate-500 font-medium">
          ({percentage}%)
        </span>
      </div>
    )}
  </div>
);

export default Overall;

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import ModelImages from "@/components/ModelImages";

const Overall = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);
  const [dollarRate, setDollarRate] = useState(12141);

  const [orders, setOrders] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [showMonthlyExpenses, setShowMonthlyExpenses] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);

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

  const getOrders = async () => {
    try {
      const res = await api.get("ceo/monthlySelectedOrders", {
        params: {
          month: selectedMonth,
        },
      });
      setOrders(res?.data?.selected);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotni yuklab bo'lmadi",
      });
    }
  };

  const getMonthlyExpenses = async () => {
    setExpensesLoading(true);
    try {
      const res = await api.get("/ceo/monthlyExpense", {
        params: {
          month: selectedMonth,
        },
      });
      setMonthlyExpenses(res?.data?.expenses || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Oylik harajatlarni yuklab bo'lmadi",
      });
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    getData();
    getOrders();
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
        0,
      )
    : 0;

  const revenuePercentage = totalRevenue ? 100 : 0;
  const expensesPercentage = totalRevenue
    ? ((totalExpenses / totalRevenue) * 100).toFixed(0)
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
    return ((numericValue / totalExpenses) * 100).toFixed(0);
  };

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen text-slate-900 relative">
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
            onClick={() => {
              setShowMonthlyExpenses(true);
              getMonthlyExpenses();
            }}
            clickable={true}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-amber-900">
              1 dona mahsulot foyda
            </span>
          </div>
          <div className="text-xl font-bold text-amber-900">
            {loading
              ? "..."
              : data?.costs?.total_output_quantity &&
                  data?.costs?.net_profit_uzs
                ? formatNumber(
                    data?.costs?.net_profit_uzs /
                      data?.costs?.total_output_quantity,
                    0,
                  )
                : "0"}
            <span className="text-xs font-normal text-amber-700 ml-1">UZS</span>
          </div>
          {!loading &&
            data?.costs?.total_output_quantity &&
            data?.costs?.net_profit_uzs && (
              <div className="text-sm font-medium text-amber-700">
                ≈{" "}
                {formatNumber(
                  data?.costs?.net_profit_uzs /
                    data?.costs?.total_output_quantity /
                    dollarRate,
                  2,
                )}{" "}
                $
              </div>
            )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-xl">
            <div className="mb-4">
              <h3 className="text-sm uppercase tracking-widest text-slate-400 font-semibold">
                Xodim bo‘yicha xarajat
              </h3>
              <p className="text-lg font-semibold">
                1 kishiga to‘g‘ri keladigan xarajatlar
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-xl bg-white/10" />
                <Skeleton className="h-24 rounded-xl bg-white/10" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Oylik */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-slate-400 mb-1">
                    1 kishiga oylik xarajat
                  </p>

                  <div className="text-2xl font-bold">
                    {formatNumber(
                      (Number(data?.costs?.total_fixed_cost_uzs) || 0) /
                        (Number(data?.costs?.average_employee_count) || 1),
                      0,
                    )}{" "}
                    <span className="text-xs text-slate-400">UZS</span>
                  </div>

                  <div className="text-sm text-emerald-400 font-medium">
                    ≈{" "}
                    {formatNumber(
                      (Number(data?.costs?.total_fixed_cost_uzs) || 0) /
                        (Number(data?.costs?.average_employee_count) || 1) /
                        dollarRate,
                      2,
                    )}{" "}
                    $
                  </div>

                  <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[80%] h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
                  </div>
                </div>

                {/* Kunlik */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-slate-400 mb-1">
                    1 kishiga kunlik xarajat
                  </p>

                  <div className="text-2xl font-bold">
                    {formatNumber(
                      (Number(data?.costs?.total_fixed_cost_uzs) || 0) /
                        (Number(data?.costs?.average_employee_count) || 1) /
                        25,
                      0,
                    )}{" "}
                    <span className="text-xs text-slate-400">UZS</span>
                  </div>

                  <div className="text-sm text-amber-400 font-medium">
                    ≈{" "}
                    {formatNumber(
                      (Number(data?.costs?.total_fixed_cost_uzs) || 0) /
                        (Number(data?.costs?.average_employee_count) || 1) /
                        25 /
                        dollarRate,
                      2,
                    )}{" "}
                    $
                  </div>

                  <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[55%] h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-1">
          Buyurtmalar tafsiloti
        </h3>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Nomi
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Miqdori
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tikilgan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Narx ($)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Jami ($)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Xarajat/dona
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Foyda/Zarar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders?.map((order, i) => {
                  const costPerUnit =
                    data?.costs?.cost_per_unit_overall_uzs || 0;
                  const orderPriceUZS = order?.order?.price * dollarRate;
                  const profitPerUnit = orderPriceUZS - costPerUnit;
                  const totalProfit =
                    profitPerUnit * order?.order?.done_quantity;

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-center text-slate-500">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ModelImages
                          modelCode={order?.order?.order_model?.model?.name}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium">
                            {order?.order?.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {
                              order?.order?.order_model?.submodels[0]?.submodel
                                ?.name
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">
                        {formatNumber(order?.order?.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">
                        {formatNumber(order?.order?.done_quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        <div className="flex flex-col gap-1">
                          <div>{formatNumber(order?.order?.price, 2)} $</div>
                          <div className="text-xs text-slate-500">
                            {formatNumber(order?.order?.price * dollarRate, 0)}{" "}
                            UZS
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                        <div className="flex flex-col gap-1">
                          <div>
                            {formatNumber(
                              order?.order?.price * order?.order?.quantity,
                              2,
                            )}{" "}
                            $
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatNumber(
                              order?.order?.price *
                                order?.order?.quantity *
                                dollarRate,
                              0,
                            )}{" "}
                            UZS
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">
                        {formatNumber(costPerUnit / dollarRate, 2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`font-medium ${
                              profitPerUnit > 0
                                ? "text-emerald-600"
                                : profitPerUnit < 0
                                  ? "text-red-600"
                                  : "text-slate-500"
                            }`}
                          >
                            {profitPerUnit > 0 ? "+" : ""}
                            {formatNumber(profitPerUnit / dollarRate, 2)} $
                          </span>
                          <span
                            className={`text-xs ${
                              totalProfit > 0
                                ? "text-emerald-600"
                                : totalProfit < 0
                                  ? "text-red-600"
                                  : "text-slate-500"
                            }`}
                          >
                            {totalProfit > 0 ? "+" : ""}
                            {formatNumber(totalProfit / dollarRate, 0)} $ jami
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Expenses Dialog */}
      <Dialog open={showMonthlyExpenses} onOpenChange={setShowMonthlyExpenses}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                Oylik o'zgarmas harajatlar
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {expensesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : monthlyExpenses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Ma'lumotlar topilmadi
              </div>
            ) : (
              monthlyExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {expense.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {expense.type === "monthly" && "Oylik"}
                      {expense.type === "amortization" && "Amortizatsiya"}
                      {expense.type === "income_percentage" && "Daromad foizi"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      {expense.type === "income_percentage"
                        ? `${expense.amount}%`
                        : expense.type === "amortization"
                          ? `${expense.amount}$`
                          : `${formatNumber(expense.amount, 0)} UZS`}
                    </div>
                    {expense.type !== "income_percentage" &&
                      expense.type !== "amortization" && (
                        <div className="text-xs text-slate-500">
                          ≈ {formatNumber(expense.amount / dollarRate, 2)} $
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>

          {!expensesLoading && monthlyExpenses.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Jami:</span>
                <div className="text-right">
                  <div className="font-bold text-lg text-slate-900">
                    {formatNumber(
                      monthlyExpenses
                        .filter((e) => e.type === "monthly")
                        .reduce((sum, e) => sum + e.amount, 0),
                      0,
                    )}{" "}
                    UZS
                  </div>
                  <div className="text-xs text-slate-500">
                    ≈{" "}
                    {formatNumber(
                      monthlyExpenses
                        .filter((e) => e.type === "monthly")
                        .reduce((sum, e) => sum + e.amount, 0) / dollarRate,
                      2,
                    )}{" "}
                    $
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

const DetailCard = ({
  label,
  value,
  percentage,
  loading,
  onClick,
  clickable,
}) => (
  <div
    className={`flex justify-between items-center p-4 rounded-lg border border-slate-100 bg-slate-50/50 h-14 ${
      clickable && !loading
        ? "cursor-pointer hover:bg-slate-100 transition-colors"
        : ""
    }`}
    onClick={onClick}
  >
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
        {clickable && (
          <span className="text-xs text-blue-600 font-medium">→</span>
        )}
      </div>
    )}
  </div>
);

export default Overall;

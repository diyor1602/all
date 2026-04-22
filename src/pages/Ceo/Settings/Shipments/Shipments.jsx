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
  ArrowUpRight,
  DollarSign,
  TrendingDown,
  Clock,
  AlertCircle,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import getDollarRate from "@/hooks/getDollarRate";
import ModelImages from "@/components/ModelImages";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const Shipments = () => {
  const { toast } = useToast();

  const COLORS = [
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

  const preparePieChartData = (costsBreakdown) => {
    const data = [];

    const costLabels = {
      bonus: "Bonus",
      remainder: "Qolgan",
      tarification: "Tariflashtirish",
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

    Object.entries(costsBreakdown).forEach(([key, value]) => {
      if (value > 0 && costLabels[key]) {
        data.push({
          name: costLabels[key],
          value: value,
          key: key,
        });
      }
    });

    return data.sort((a, b) => b.value - a.value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {formatNumber(payload[0].value)} UZS
          </p>
        </div>
      );
    }
    return null;
  };

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

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("monthly/trucks", {
        params: { month: selectedMonth, dollar_rate: await getDollarRate() },
      });
      setData(res.data);
    } catch (error) {
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

  const calculateTotalSalary = () => {
    return formatNumber(
      Number(data?.costs_breakdown?.attendance_salary_total) +
        Number(data?.costs_breakdown?.money_logs_total) +
        Number(data?.costs_breakdown?.season_salary_total) +
        Number(data?.costs_breakdown?.tarification_total),
    );
  };

  const MetricTile = ({
    icon: Icon,
    title,
    value,
    subtext,
    trend,
    colorClass,
  }) => (
    <Card className="overflow-hidden border-none shadow-md bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RowItem = ({ label, value, subValue, isTotal }) => (
    <div
      className={`flex justify-between items-center py-2.5 ${isTotal ? "pt-4 border-t" : "border-b border-gray-50"}`}
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
          <div className="text-[10px] text-gray-400 leading-none">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );

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
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Hisobot
          </h1>
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            localStorage.setItem("shipmentsSelectedMonth", e.target.value);
            setSelectedMonth(e.target.value);
          }}
          className="bg-white w-fit"
        />
      </header>

      {/* Top Level KPIs */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricTile
          title="Umumiy tushum"
          value={`${formatNumber(data?.monthly_company_summary?.total_earned_uzs)} UZS`}
          icon={DollarSign}
          colorClass="bg-green-500"
        />

        <MetricTile
          title="Umumiy xarajat"
          value={`${formatNumber(data?.costs_breakdown?.factory_grand_total_uzs)} UZS`}
          icon={TrendingDown}
          colorClass="bg-red-500"
        />

        <MetricTile
          title="Fura Tushum"
          value={`${formatNumber(data?.summary?.total_revenue_uzs)} UZS`}
          icon={Wallet}
          colorClass="bg-emerald-500"
        />

        <MetricTile
          title="Sof Foyda"
          value={`${formatNumber(
            data?.monthly_company_summary?.total_earned_uzs -
              data?.costs_breakdown?.factory_grand_total_uzs,
          )} UZS`}
          icon={TrendingUp}
          colorClass="bg-blue-500"
        />

        <MetricTile
          title="Yuborilgan Yuk"
          value={`${formatNumber(data?.summary?.total_shipped_qty)} dona`}
          subtext={`Chiqqan son: ${formatNumber(
            data?.monthly_company_summary?.total_output_quantity,
          )} dona`}
          icon={Package}
          colorClass="bg-amber-500"
        />

        <MetricTile
          title="Yuk Mashinalari"
          value={data?.trucks?.length}
          icon={Truck}
          colorClass="bg-indigo-500"
        />
      </div>

      <div className="space-y-12">
        {/* Detailed Costs - Left Column */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-400" />
              Xarajatlar Tafsiloti
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Ish haqi va Maosh
              </h4>
              <RowItem label="Maosh" value={`${calculateTotalSalary()} UZS`} />
              <RowItem
                label="Transport uchun"
                value={`${formatNumber(data?.costs_breakdown?.transport_attendance)} UZS`}
              />
              <RowItem
                label="Xodimlar"
                value={`${formatNumber(data?.costs_breakdown?.transport_employees_count)} kishi`}
                subValue={`${formatNumber(data?.costs_breakdown?.transport_per_employee)} / kishi`}
              />
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Operatsion
              </h4>
              <RowItem
                label="Amortizatsiya"
                value={`${formatNumber(data?.costs_breakdown?.amortization_total)}`}
              />
              <RowItem
                label="Oylik xarajatlar"
                value={`${formatNumber(data?.costs_breakdown?.monthly_expenses)}`}
              />
              <RowItem
                label="Bitta mahsulot tannarxi"
                value={`${formatNumber(data?.costs_breakdown?.factory_grand_total_uzs / data?.monthly_company_summary?.total_output_quantity)} UZS`}
              />
            </div>
            <div className="md:col-span-2 mt-4 bg-slate-50 p-4 rounded-xl">
              <RowItem
                label="Jami Zavod Xarajatlari"
                value={`${formatNumber(data?.costs_breakdown?.factory_grand_total_uzs)} UZS`}
                isTotal
              />
            </div>
          </CardContent>
        </Card>

        {/* Trucks Section - Full Width */}
        <div className="lg:col-span-12">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold">Yuk Mashinalari Ro'yxati</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.trucks?.map((truck, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">
                      {truck.number}
                    </span>
                    <Badge
                      variant={
                        truck.status === "shipped" ? "default" : "outline"
                      }
                      className={
                        truck.status === "shipped"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : ""
                      }
                    >
                      {truck.status === "shipped" ? "Yuborilgan" : "Kutilmoqda"}
                    </Badge>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">
                        Miqdor
                      </p>
                      <p className="font-semibold">
                        {formatNumber(truck.shipped_qty)} dona
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">
                        Tushum
                      </p>
                      <p className="font-semibold text-emerald-600">
                        {formatNumber(truck.revenue_uzs)}
                      </p>
                    </div>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Buyurtmalar
                    </p>
                    {truck.orders?.map((order, i) => {
                      const pieChartData = preparePieChartData(
                        order.costs_breakdown || {},
                      );
                      return (
                        <div key={i} className="space-y-3">
                          <div className="flex items-center gap-4 text-sm bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">
                              {order.order_name}
                            </span>
                            <ModelImages modelCode={order?.model_name} />
                            <span className="font-medium ml-auto">
                              {order.shipped_qty} dona
                            </span>
                          </div>
                          {pieChartData.length > 0 && (
                            <div className="bg-white p-4 rounded border border-gray-100">
                              <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                Xarajatlar Tafsiloti
                              </p>
                              <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                  <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="40%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {pieChartData.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="mt-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-600 uppercase">
                                  Xarajatlar Tafsiloti:
                                </p>
                                <div className="space-y-2">
                                  {pieChartData.map((item, index) => {
                                    const total = pieChartData.reduce(
                                      (sum, entry) => sum + entry.value,
                                      0,
                                    );
                                    const percentage = (
                                      (item.value / total) *
                                      100
                                    ).toFixed(1);
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-3 h-3 rounded-sm flex-shrink-0"
                                            style={{
                                              backgroundColor:
                                                COLORS[index % COLORS.length],
                                            }}
                                          />
                                          <span className="text-gray-700">
                                            {item.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-medium text-gray-900">
                                            {formatNumber(item.value)} UZS
                                          </span>
                                          <span className="text-gray-500 font-medium">
                                            {percentage}%
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-gray-900">
                                      Jami Xarajatlar:
                                    </span>
                                    <span className="text-primary">
                                      {formatNumber(
                                        pieChartData.reduce(
                                          (sum, entry) => sum + entry.value,
                                          0,
                                        ),
                                      )}{" "}
                                      UZS
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Unshipped Orders Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Yuborilmagan Buyurtmalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Metrics */}
            {data?.unshipped_orders_summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">
                    Buyurtmalar Soni
                  </p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">
                    {formatNumber(data.unshipped_orders_summary.orders_count)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Ishlab Chiqarilgan
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatNumber(
                      data.unshipped_orders_summary.total_produced_qty,
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    /{" "}
                    {formatNumber(
                      data.unshipped_orders_summary.total_planned_qty,
                    )}{" "}
                    reja
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wider">
                    Qiymat (USD)
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    $
                    {formatNumber(
                      data.unshipped_orders_summary.total_value_usd,
                    )}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">
                    Qiymat (UZS)
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {formatNumber(
                      data.unshipped_orders_summary.total_value_uzs,
                    )}{" "}
                    UZS
                  </p>
                </div>
              </div>
            )}

            {/* Orders List */}
            {data?.unshipped_orders?.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-medium text-gray-600">
                    Yuborilishi kutilayotgan buyurtmalar ro'yxati
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Buyurtma
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Model
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                          Holati
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                          Reja/Chiqqan
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">
                          Narx (USD)
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">
                          Qiymat (UZS)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.unshipped_orders.map((order, index) => (
                        <tr
                          key={order.order_id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {order.order_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                #{order.order_id}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">
                                {order.model_name}
                              </span>
                              <ModelImages modelCode={order.model_name} />
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
                                  ? "bg-blue-500 hover:bg-blue-600"
                                  : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                              }
                            >
                              {order.order_status === "checking"
                                ? "Tekshirilmoqda"
                                : "Tikilgan"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-medium text-gray-900">
                                {formatNumber(order.produced_qty)}
                              </span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-600">
                                {formatNumber(order.planned_qty)}
                              </span>
                            </div>
                            {order.produced_qty < order.planned_qty && (
                              <div className="text-xs text-orange-600 mt-1">
                                {formatNumber(
                                  order.planned_qty - order.produced_qty,
                                )}{" "}
                                qolgan
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            ${formatNumber(order.price_usd)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-green-600">
                            {formatNumber(order.value_uzs)} UZS
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Yuborilmagan buyurtmalar yo'q</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Shipments;

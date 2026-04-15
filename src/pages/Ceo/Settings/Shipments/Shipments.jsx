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
  Factory,
  Briefcase,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import getDollarRate from "@/hooks/getDollarRate";

const Shipments = () => {
  const { toast } = useToast();
  const [data, setData] = useState({
    trucks: [],
    costs_breakdown: {},
    monthly_company_summary: {},
    summary: {},
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Umumiy Tushum"
          value={`${formatNumber(data?.summary?.total_revenue_uzs)} UZS`}
          icon={Wallet}
          colorClass="bg-emerald-500"
        />
        <MetricTile
          title="Sof Foyda"
          value={`${formatNumber(data?.monthly_company_summary?.total_earned_uzs - data?.costs_breakdown?.factory_grand_total_uzs)} UZS`}
          icon={TrendingUp}
          colorClass="bg-blue-500"
        />
        <MetricTile
          title="Yuborilgan Yuk"
          value={`${formatNumber(data?.summary?.total_shipped_qty)} dona`}
          subtext={`Eksport ulushi: ${data?.summary?.export_ratio_percent?.toFixed(1)}%`}
          icon={Package}
          colorClass="bg-orange-500"
        />
        <MetricTile
          title="Yuk Mashinalari"
          value={data?.trucks?.length}
          subtext="Faol reyslar soni"
          icon={Truck}
          colorClass="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Detailed Costs - Left Column */}
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-400" />
              Xarajatlar Tafsiloti
            </CardTitle>
            <CardDescription>Oylik barcha operatsion chiqimlar</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Ish haqi va Maosh
              </h4>
              <RowItem
                label="Davomat maoshi"
                value={`${formatNumber(data?.costs_breakdown?.attendance_salary_total)}`}
              />
              <RowItem
                label="Mavsumiy maosh"
                value={`${formatNumber(data?.costs_breakdown?.season_salary_total)}`}
              />
              <RowItem
                label="Zavod oylik maoshi"
                value={`${formatNumber(data?.costs_breakdown?.factory_monthly_salary_uzs)}`}
              />
              <RowItem
                label="Transport xodimlari"
                value={`${formatNumber(data?.costs_breakdown?.transport_employees_count)} kishi`}
                subValue={`${formatNumber(data?.costs_breakdown?.transport_per_employee)} / kishi`}
              />
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Operatsion
              </h4>
              <RowItem
                label="Pul yozuvlari"
                value={`${formatNumber(data?.costs_breakdown?.money_logs_total)}`}
              />
              <RowItem
                label="Tarifikatsiya"
                value={`${formatNumber(data?.costs_breakdown?.tarification_total)}`}
              />
              <RowItem
                label="Amortizatsiya"
                value={`${formatNumber(data?.costs_breakdown?.amortization_total)}`}
              />
              <RowItem
                label="Oylik xarajatlar"
                value={`${formatNumber(data?.costs_breakdown?.monthly_expenses)}`}
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

        {/* Company & Factory Summary - Right Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <Factory className="w-5 h-5 text-purple-500" /> Zavod Xulosasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <RowItem
                label="Chiqim miqdori"
                value={`${formatNumber(data?.monthly_company_summary?.total_output_quantity)} dona`}
              />
              <RowItem
                label="Bitta mahsulot tannarxi"
                value={`${formatNumber(data?.costs_breakdown?.factory_grand_total_uzs / data?.monthly_company_summary?.total_output_quantity)} UZS`}
              />
              <RowItem
                label="Jami tushum"
                value={`${formatNumber(data?.monthly_company_summary?.total_earned_uzs)} UZS`}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" /> Kompaniya Umumiy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <RowItem
                label="Ishlab chiqarildi"
                value={`${formatNumber(data?.summary?.total_produced_qty)} dona`}
              />
              <RowItem
                label="Qo'shimcha xarajatlar"
                value={`${formatNumber(data?.summary?.company_total_extra_cost_uzs)} UZS`}
              />
              <RowItem
                label="Umumiy xarajatlar"
                value={`${formatNumber(data?.summary?.company_total_fixed_cost_uzs)} UZS`}
                isTotal
              />
            </CardContent>
          </Card>
        </div>

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
                    {truck.orders?.map((order, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                      >
                        <span className="text-gray-600">
                          {order.order_name}
                        </span>
                        <span className="font-medium">
                          {order.shipped_qty} dona
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipments;

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2, Truck, DollarSign, Package, Calculator } from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        params: {
          month: selectedMonth,
        },
      });

      const responseData = res.data;
      setData(responseData);
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

  const StatCard = ({ icon: Icon, title, value, color = "blue" }) => (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Yuk tashish ma'lumotlari
            </h1>
          </div>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              localStorage.setItem("shipmentsSelectedMonth", e.target.value);
              setSelectedMonth(e.target.value);
            }}
            className="bg-white w-fit shadow-sm border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Narxlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Davomat uchun</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.attendance_salary_total)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Mavsumiy maosh</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.season_salary_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Pul yozuvlar</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.money_logs_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Tarifikatsiya</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.tarification_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Transport davomat</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.transport_attendance)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Transport xodimlari soni</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.transport_employees_count)}{" "}
                kishi
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Bir xodimga to'lov</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.transport_per_employee)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Oylik xarajatlar</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.monthly_expenses)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Daromad foizi</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.income_percentage_total)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Amortizatsiya</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.amortization_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Zavod oylik maoshi</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(
                  data?.costs_breakdown?.factory_monthly_salary_uzs,
                )}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">
                Zavod qo'shimcha xarajatlari
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.factory_extra_costs_uzs)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Zavod jami xarajatlari</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.factory_grand_total_uzs)}{" "}
                so'm
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Factory Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <span>Zavod ma'lumotlari</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Jami chiqim miqdori</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(
                  data?.monthly_company_summary?.total_output_quantity,
                )}{" "}
                dona
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Jami tushum</span>
              <span className="font-semibold text-green-600">
                {formatNumber(data?.monthly_company_summary?.total_earned_uzs)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Toza foyda</span>
              <span className="font-semibold text-blue-600">
                {formatNumber(data?.monthly_company_summary?.net_profit_uzs)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Bitta mahsulotga xarajat</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(
                  data?.monthly_company_summary?.cost_per_unit_overall_uzs,
                )}{" "}
                so'm
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Company Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span>Kompaniya ma'lumotlari</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Jami tushum</span>
              <span className="font-semibold text-green-600">
                {formatNumber(data?.summary?.total_revenue_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Eksport xarajatlari</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.total_exported_cost_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Eksport foydasi</span>
              <span className="font-semibold text-blue-600">
                {formatNumber(data?.summary?.total_export_profit_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Yuborilgan mahsulotlar</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.total_shipped_qty)} dona
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">
                Ishlab chiqarilgan mahsulotlar
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.total_produced_qty)} dona
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Eksport foizi</span>
              <span className="font-semibold text-gray-900">
                {data?.summary?.export_ratio_percent?.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Kompaniya maoshi</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.company_total_salary_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Qo'shimcha xarajatlar</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.company_total_extra_cost_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Umumiy xarajatlar</span>
              <span className="font-semibold text-red-600">
                {formatNumber(data?.summary?.company_total_fixed_cost_uzs)} so'm
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Trucks List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Yuk mashinalari</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.trucks?.map((truck, index) => (
                <div
                  key={index}
                  className="mb-6 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {truck.number}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        truck.status === "shipped"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {truck.status === "shipped" ? "Yuborilgan" : "Kutilmoqda"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      icon={Package}
                      title="Yuklar soni"
                      value={`${truck.shipped_qty} dona`}
                      color="blue"
                    />
                    <StatCard
                      icon={DollarSign}
                      title="Tushum"
                      value={`${formatNumber(truck.revenue_uzs)} so'm`}
                      color="green"
                    />
                    <StatCard
                      icon={Calculator}
                      title="Xarajatlar"
                      value={`${formatNumber(truck.allocated_cost_uzs)} so'm`}
                      color="red"
                    />
                    <StatCard
                      icon={Calculator}
                      title="Foyda"
                      value={`${formatNumber(truck.profit_uzs)} so'm`}
                      color="purple"
                    />
                  </div>
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">
                      Buyurtmalar
                    </h4>
                    <div className="space-y-2">
                      {truck.orders?.map((order, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-600">
                            {order.order_name}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {order.shipped_qty} dona
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Shipments;

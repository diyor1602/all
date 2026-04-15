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
    summary: {},
    costs_breakdown: {},
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

      // Handle the new response structure
      const responseData = res.data;

      // If response is an array of trucks, process it
      if (Array.isArray(responseData)) {
        const trucks = responseData;

        // Calculate summary from all trucks
        const summary = {
          total_revenue_uzs: trucks.reduce(
            (sum, truck) => sum + (truck.revenue_uzs || 0),
            0,
          ),
          total_fixed_cost_uzs: trucks.reduce(
            (sum, truck) => sum + (truck.allocated_cost_uzs || 0),
            0,
          ),
          company_net_profit_uzs: trucks.reduce(
            (sum, truck) => sum + (truck.profit_uzs || 0),
            0,
          ),
          company_total_fixed_cost_uzs: trucks.reduce(
            (sum, truck) => sum + (truck.allocated_cost_uzs || 0),
            0,
          ),
          total_shipped_qty: trucks.reduce(
            (sum, truck) => sum + (truck.shipped_qty || 0),
            0,
          ),
          company_total_output_qty: trucks.reduce(
            (sum, truck) => sum + (truck.shipped_qty || 0),
            0,
          ),
          export_ratio_percent: 100, // This would need to be calculated based on production data
          company_cost_per_unit_uzs:
            trucks.reduce(
              (sum, truck) => sum + (truck.allocated_cost_uzs || 0),
              0,
            ) /
            trucks.reduce((sum, truck) => sum + (truck.shipped_qty || 0), 1),
        };

        // Extract costs breakdown from first truck's employees or calculate
        const costs_breakdown = {
          assistant_salary_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.assistant_salary || 0),
                0,
              ) || 0),
            0,
          ),
          attendance_salary_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.attendance_salary || 0),
                0,
              ) || 0),
            0,
          ),
          cutting_salary_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.cutting_salary || 0),
                0,
              ) || 0),
            0,
          ),
          money_logs_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.money_logs || 0),
                0,
              ) || 0),
            0,
          ),
          sewing_salary_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.sewing_salary || 0),
                0,
              ) || 0),
            0,
          ),
          tarification_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.tarification || 0),
                0,
              ) || 0),
            0,
          ),
          transport_attendance_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.attendance_salary || 0),
                0,
              ) || 0),
            0,
          ),
          warehouse_salary_total: trucks.reduce(
            (sum, truck) =>
              sum +
              (truck.employees?.reduce(
                (empSum, emp) => empSum + (emp.warehouse_salary || 0),
                0,
              ) || 0),
            0,
          ),
          monthly_expenses_total: 0, // This would need to be provided by the API
          grand_total: trucks.reduce(
            (sum, truck) => sum + (truck.allocated_cost_uzs || 0),
            0,
          ),
        };

        setData({
          trucks,
          summary,
          costs_breakdown,
          employees: trucks.flatMap((truck) => truck.employees || []),
        });
      } else {
        // Handle old structure or other formats
        setData(responseData);
      }
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
              <span className="text-gray-600">Yordamchilar</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.assistant_salary_total)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Davomat uchun</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.attendance_salary_total)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Kroy uchun</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.cutting_salary_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Bonus</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.money_logs_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Yangi mavsum</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.sewing_salary_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Tarifikatsiyalar</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.tarification_total)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Transport 1 kishi</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(
                  data?.costs_breakdown?.transport_attendance_total,
                )}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Ombor</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.warehouse_salary_total)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">O'zgarmas xarajatlar</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.costs_breakdown?.monthly_expenses_total)}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold text-lg border-t-2 border-gray-200">
              <span className="text-gray-900">Jami</span>
              <span className="text-blue-600">
                {formatNumber(data?.costs_breakdown?.grand_total)} so'm
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <span>Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Tushum</span>
              <span className="font-semibold text-green-600">
                {formatNumber(data?.summary?.total_revenue_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Umumiy maosh</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.total_fixed_cost_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Foyda</span>
              <span className="font-semibold text-blue-600">
                {formatNumber(data?.summary?.company_net_profit_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Chiqimlar</span>
              <span className="font-semibold text-red-600">
                {formatNumber(data?.summary?.company_total_fixed_cost_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Sotilgan mahsulotlar soni</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.total_shipped_qty)} dona
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">
                Ishlab chiqarilgan mahsulotlar soni
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.company_total_output_qty)} dona
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Chiqarish foizi</span>
              <span className="font-semibold text-gray-900">
                {data?.summary?.export_ratio_percent?.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Bitta mahsulotga xarajat</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.company_cost_per_unit_uzs)} so'm
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

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Ishchilar ro'yxati</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-900">
                      No
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-900">
                      Ism
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-900">
                      Jami daromad
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-900">
                      Davomat maoshi
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-900">
                      Tikuv maoshi
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-900">
                      Tarifikatsiya
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.employees
                    ?.sort((a, b) => a.name.localeCompare(b.name))
                    .map((employee, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3 text-gray-900">{index + 1}</td>
                        <td className="p-3 text-gray-900">{employee?.name}</td>
                        <td className="p-3 text-right text-gray-900">
                          {formatNumber(employee?.total_earned)} so'm
                        </td>
                        <td className="p-3 text-right text-gray-900">
                          {formatNumber(employee?.attendance_salary)} so'm
                        </td>
                        <td className="p-3 text-right text-gray-900">
                          {formatNumber(employee?.sewing_salary)} so'm
                        </td>
                        <td className="p-3 text-right text-gray-900">
                          {formatNumber(employee?.tarification)} so'm
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Shipments;

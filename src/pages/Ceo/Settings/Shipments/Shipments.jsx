import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Truck,
  TrendingUp,
  DollarSign,
  Package,
  Calculator,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Shipments = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
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
                {formatNumber(data?.costs_breakdown?.transport_allocated_total)}{" "}
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
                {formatNumber(
                  data?.costs_breakdown?.monthly_expense_allocated_total,
                )}{" "}
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
                {formatNumber(data?.summary?.actual_total_cost_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Farqi</span>
              <span
                className={`font-semibold ${data?.summary?.excess_cost_uzs > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {formatNumber(data?.summary?.excess_cost_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Furadagi oylik</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.fair_share_cost_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">GAP</span>
              <span className="font-semibold text-blue-600">
                {formatNumber(data?.summary?.gap_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Transport</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.transport_total_uzs)} so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Foiz</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.proportion_percent)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Ishlab chiqarilgan</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.total_produced_qty)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Jo'nab ketgan</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(data?.summary?.total_shipped_qty)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Trucks Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span>Furalar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.trucks?.map((truck, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Fura #{truck?.number}
                  </h4>
                  <span className="text-sm text-gray-600">
                    Kurs: {truck?.exchange_rate}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Miqdor:</span>
                    <span className="font-medium">
                      {formatNumber(truck?.shipped_qty)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Foiz:</span>
                    <span className="font-medium">
                      {formatNumber(truck?.proportion_percent)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tushum:</span>
                    <span className="font-medium text-green-600">
                      {formatNumber(truck?.revenue_uzs)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GAP:</span>
                    <span className="font-medium text-blue-600">
                      {formatNumber(truck?.gap_uzs)}
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-600">Fair Share:</span>
                    <span className="font-medium">
                      {formatNumber(truck?.fair_share_cost_uzs)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Shipments;

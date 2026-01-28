import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  Package,
  Activity,
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

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ceo/calculateSeasonWithCosts`, {
        params: { month: selectedMonth, dollar_rate: 12000 },
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
    let newDate = new Date(year, direction === "prev" ? month - 2 : month, 1);
    const newMonthString = newDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonthString);
    localStorage.setItem("newSeasonSelectedMonth", newMonthString);
  };

  const profitMargin = data?.costs?.total_earned_uzs
    ? ((data.costs.net_profit_uzs / data.costs.total_earned_uzs) * 100).toFixed(
        1,
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-white min-h-screen text-slate-900">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row justify-between items-baseline border-b pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Moliyaviy Hisobot
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {selectedMonth} holatiga ko'ra
          </p>
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
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none shadow-none bg-transparent font-medium text-sm focus-visible:ring-0 w-36"
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

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBlock
          label="Tushum"
          value={data?.costs?.total_earned_uzs}
          icon={<Activity className="text-blue-500" />}
        />
        <StatBlock
          label="Xarajat"
          value={data?.costs?.total_fixed_cost_uzs}
          icon={<Wallet className="text-rose-500" />}
        />
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
          <div className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-100 w-fit px-2 py-0.5 rounded">
            Rentabellik: {profitMargin}%
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-1">
          Xarajatlar tafsiloti
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailCard
            label="Tikuv limiti"
            value={data?.costs?.rasxod_limit_uzs}
          />
          <DetailCard
            label="Ish haqi (Mavsum)"
            value={data?.costs?.sewing_salary_total}
          />
          <DetailCard
            label="Transport"
            value={data?.costs?.transport_attendance}
          />
          <DetailCard
            label="Oylik o'zgarmas"
            value={data?.costs?.monthly_expenses}
          />
        </div>
      </div>

      {/* Production Footnote */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium opacity-80">
            Jami chiqqan mahsulotlar
          </span>
        </div>
        <span className="text-xl font-bold">
          {formatNumber(data?.costs?.total_output_quantity, 0)}{" "}
          <span className="text-xs font-light">dona</span>
        </span>
      </div>
    </div>
  );
};

// Reusable Small Components for Simplicity
const StatBlock = ({ label, value, icon }) => (
  <div className="p-4 rounded-xl border bg-white shadow-sm">
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
  </div>
);

const DetailCard = ({ label, value }) => (
  <div className="flex justify-between items-center p-4 rounded-lg border border-slate-100 bg-slate-50/50">
    <span className="text-sm text-slate-600">{label}</span>
    <span className="font-semibold text-slate-800 text-sm">
      {formatNumber(value, 0)}
    </span>
  </div>
);

export default Overall;

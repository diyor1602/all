import { useEffect, useState, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import formatNumber from "@/utils/formatNumber";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Wallet,
  Truck,
  Users,
  Calendar,
  RefreshCcw,
  CircleDollarSign,
} from "lucide-react";

const Overall2 = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // States with initializers to avoid hydration/sync issues
  const [dollarRate, setDollarRate] = useState(
    () => localStorage.getItem("newSeasonDollarRate") || 12269,
  );
  const [selectedYear, setSelectedYear] = useState(
    () =>
      localStorage.getItem("newSeasonSelectedYear") || new Date().getFullYear(),
  );
  const [selectedType, setSelectedType] = useState(
    () => localStorage.getItem("newSeasonSelectedType") || "winter",
  );

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ceo/calculateSeasonWithCostsBySeason", {
        params: {
          season_year: selectedYear,
          season_type: selectedType,
          dollar_rate: dollarRate,
        },
      });
      setData(res.data);
      // Persist choices
      localStorage.setItem("newSeasonDollarRate", dollarRate);
      localStorage.setItem("newSeasonSelectedYear", selectedYear);
      localStorage.setItem("newSeasonSelectedType", selectedType);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedYear, selectedType]);

  const finance = data?.finance || {};
  const orders = data?.orders || [];

  // Derived Values
  const { netProfit, profitMargin, expenseRatio } = useMemo(() => {
    const rev = finance.revenue_uzs || 0;
    const cost = finance.total_until_finish_uzs || 0;
    const net = rev - cost;
    return {
      netProfit: net,
      profitMargin: rev > 0 ? ((net / rev) * 100).toFixed(1) : 0,
      expenseRatio: rev > 0 ? ((cost / rev) * 100).toFixed(1) : 0,
    };
  }, [finance]);

  const MetricItem = ({
    label,
    value,
    icon: Icon,
    colorClass = "text-slate-600",
  }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md bg-white border ${colorClass}`}>
          <Icon size={16} />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900">
        {formatNumber(value)} UZS
      </span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#f8fafc] min-h-screen font-sans">
      {/* HEADER & FILTERS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mavsumiy Tahlil</h1>
          <p className="text-slate-500 text-sm">
            Moliyaviy ko'rsatkichlar va buyurtmalar nazorati
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedType("winter")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedType === "winter" ? "bg-white shadow-sm text-blue-600" : "text-slate-500"}`}
            >
              ❄️ Qishki
            </button>
            <button
              onClick={() => setSelectedType("summer")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedType === "summer" ? "bg-white shadow-sm text-orange-600" : "text-slate-500"}`}
            >
              ☀️ Yozgi
            </button>
          </div>
          <Separator orientation="vertical" className="h-8 hidden md:block" />
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-24 h-9 border-none bg-transparent font-bold focus-visible:ring-0"
            />
          </div>
          <Button
            size="sm"
            onClick={getData}
            disabled={loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCcw
              size={16}
              className={`mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Yangilash
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">
            Ma'lumotlar hisoblanmoqda...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: PRIMARY STATS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">
                      Umumiy Tushum
                    </p>
                    <TrendingUp className="text-emerald-200" size={24} />
                  </div>
                  <h2 className="text-3xl font-black mt-2">
                    {formatNumber(finance.revenue_uzs)}{" "}
                    <span className="text-lg font-normal opacity-80">UZS</span>
                  </h2>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge className="bg-white/20 hover:bg-white/30 border-none text-white">
                      Kurs: {formatNumber(dollarRate)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                      Sof Foyda (Kutilayotgan)
                    </p>
                    <CircleDollarSign className="text-indigo-500" size={24} />
                  </div>
                  <h2 className="text-3xl font-black mt-2 text-slate-900">
                    {formatNumber(netProfit)}{" "}
                    <span className="text-lg font-normal text-slate-400">
                      UZS
                    </span>
                  </h2>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      Rentabellik: {profitMargin}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ORDERS TABLE */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Buyurtmalar Ro'yxati
                  </CardTitle>
                  <CardDescription>
                    Mavsum bo'yicha buyurtmalar tahlili
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Hajm</TableHead>
                        <TableHead>Narx ($)</TableHead>
                        <TableHead>Tushum (UZS)</TableHead>
                        <TableHead className="text-right">
                          Tikuv Budjeti
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold text-slate-700">
                            #{order.order_id}
                          </TableCell>
                          <TableCell>
                            {formatNumber(order.quantity)} dona
                          </TableCell>
                          <TableCell className="text-slate-500">
                            ${order.price_usd?.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600">
                            {formatNumber(order.revenue_uzs)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(order.sewing_budget_allocated_uzs)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: COST BREAKDOWN */}
          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="text-rose-500" size={20} />
                  Xarajatlar Tafsiloti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <MetricItem
                    label="Ish haqi (Tikuv)"
                    value={finance.sewing_budget_allocated_uzs}
                    icon={Users}
                    colorClass="text-blue-500"
                  />
                  <MetricItem
                    label="Ustidan yozilgan"
                    value={finance.monthly_daily_payment_total_until_finish_uzs}
                    icon={Users}
                    colorClass="text-emerald-500"
                  />
                  <MetricItem
                    label="Transport (Jami)"
                    value={finance.transport_total_until_finish_uzs}
                    icon={Truck}
                    colorClass="text-orange-500"
                  />
                  <MetricItem
                    label="Oylik Xarajatlar"
                    value={finance.monthly_expenses_total_until_finish_uzs}
                    icon={Calendar}
                    colorClass="text-purple-500"
                  />
                  <MetricItem
                    label="AUP Oylik"
                    value={
                      finance.employee_sum_allocated_total_until_finish_uzs
                    }
                    icon={Users}
                    colorClass="text-emerald-500"
                  />
                </div>

                <Separator />

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-xs font-bold text-rose-600 uppercase">
                        Jami Xarajat
                      </p>
                      <p className="text-xl font-black text-rose-900">
                        {formatNumber(finance.total_until_finish_uzs)} UZS
                      </p>
                    </div>
                    <Badge variant="destructive" className="w-fit">
                      {expenseRatio}% ulush
                    </Badge>
                  </div>
                </div>

                <div className=" gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Valyuta Kursi ($)
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        className="h-7 text-xs font-bold p-2 bg-white"
                        value={dollarRate}
                        onChange={(e) => setDollarRate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overall2;

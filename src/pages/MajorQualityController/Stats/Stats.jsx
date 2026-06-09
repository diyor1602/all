import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PackageX, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    localStorage.getItem("startDate") || new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    localStorage.getItem("endDate") || new Date().toISOString().split("T")[0],
  );
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get("/majorQualityController/statistics", {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        });
        setStats(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Statistika ma'lumotlari yuklanmadi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate]);

  const withoutTruck = stats?.without_truck || [];

  const totalBrak = withoutTruck.reduce((sum, item) => sum + (item.brak_count || 0), 0);
  const totalQty = withoutTruck.reduce((sum, item) => sum + (item.total_qty || 0), 0);
  const totalModels = withoutTruck.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Sifat nazorati statistikasi
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Brak mahsulotlar hisoboti (yuksiz)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                localStorage.setItem("startDate", e.target.value);
              }}
              className="text-sm bg-white"
              max={endDate}
            />
            <div className="flex items-center justify-center text-slate-500">-</div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                localStorage.setItem("endDate", e.target.value);
              }}
              className="text-sm bg-white"
              min={startDate}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <PackageX className="h-4 w-4" />
                Jami modellar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-slate-900">{totalModels}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <PackageX className="h-4 w-4" />
                Jami miqdor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{totalQty}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Jami brak
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600">{totalBrak}</div>
            </CardContent>
          </Card>
        </div>

        {/* Without Truck Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Yuksiz mahsulotlar</span>
              <Badge variant="outline">{totalModels} ta model</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : withoutTruck.length === 0 ? (
              <div className="text-center py-12 px-4">
                <PackageX className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Ma'lumot topilmadi
                </h3>
                <p className="text-slate-600 text-sm">
                  Tanlangan sana oralig'ida ma'lumot mavjud emas
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">
                        Model nomi
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">
                        Jami miqdor
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">
                        Brak soni
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">
                        Foiz
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {withoutTruck
                      .slice()
                      .sort((a, b) => b.brak_count - a.brak_count)
                      .map((item, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.model_name}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {item.total_qty}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-red-600">
                              {item.brak_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300"
                                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-slate-700 w-10 text-right">
                                {item.percentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;

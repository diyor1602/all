import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import formatNumber from "@/utils/formatNumber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, BarChart3 } from "lucide-react";

const CoefStat = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("selectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("technologist/sewing-groups-analysis", {
        params: { month: selectedMonth },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="max-w-7xl mx-auto shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              <CardTitle className="text-2xl">
                Tikuv Guruhlari Tahlili
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  localStorage.setItem("selectedMonth", e.target.value);
                }}
                className="w-fit bg-transparent border-0 text-white placeholder:text-white/70 focus-visible:ring-0 p-0 h-auto"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow className="border-b-2 border-slate-200">
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      Guruh
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      Davomat <br /> (kun)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      Tikilgan maxsulot <br /> (dona)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      Tikilgan vaqt <br /> (daqiqa)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      Model vaqti <br /> (daqiqa)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      Vaqt farqi <br /> (daqiqa)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      1 kunlik farq <br /> (daqiqa)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 border-r border-slate-200 text-center">
                      Koeffitsienti <br /> (foiz)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">
                      Kishi boshiga <br /> (dona)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data
                    ?.sort((a, b) => a.group_name.localeCompare(b.group_name))
                    ?.map((item, index) => (
                      <TableRow
                        key={index}
                        className={`hover:bg-blue-50/50 transition-colors border-b border-slate-200 ${
                          (item.total_produced_minutes * 100) /
                            item.expected_minutes <
                          100
                            ? "bg-red-200 hover:bg-red-300"
                            : ""
                        }`}
                      >
                        <TableCell className="font-medium text-slate-900 border-r border-slate-200">
                          {item.group_name}
                        </TableCell>
                        <TableCell className="text-slate-700 border-r border-slate-200">
                          {formatNumber(item.total_present_days)}
                        </TableCell>
                        <TableCell className="text-slate-700 border-r border-slate-200">
                          {formatNumber(item.total_quantity)}
                        </TableCell>
                        <TableCell className="text-slate-700 border-r border-slate-200">
                          {formatNumber(item.total_produced_minutes, 0)}
                        </TableCell>
                        <TableCell className="text-slate-700 border-r border-slate-200">
                          {formatNumber(item.expected_minutes, 0)}
                        </TableCell>
                        <TableCell className="text-slate-700 border-r border-slate-200">
                          {formatNumber(
                            item.total_produced_minutes - item.expected_minutes,
                            0,
                          )}
                        </TableCell>
                        <TableCell className="text-slate-700 border-r border-slate-200">
                          {formatNumber(
                            (item.total_produced_minutes -
                              item.expected_minutes) /
                              item.total_present_days,
                            0,
                          )}
                        </TableCell>
                        <TableCell className="text-slate-700 border-r border-slate-200">
                          {formatNumber(
                            (item.total_produced_minutes * 100) /
                              item.expected_minutes,
                          )}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {formatNumber(item.avg_production_per_person_day)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
                <TableFooter className="bg-slate-100 font-semibold">
                  <TableRow className="border-t-2 border-slate-300">
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      Jami
                    </TableCell>
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      {formatNumber(
                        data?.reduce(
                          (sum, item) => sum + item.total_present_days,
                          0,
                        ),
                      )}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      {formatNumber(
                        data?.reduce(
                          (sum, item) => sum + item.total_quantity,
                          0,
                        ),
                      )}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      {formatNumber(
                        data?.reduce(
                          (sum, item) => sum + item.total_produced_minutes,
                          0,
                        ),
                        0,
                      )}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      {formatNumber(
                        data?.reduce(
                          (sum, item) => sum + item.expected_minutes,
                          0,
                        ),
                        0,
                      )}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      {formatNumber(
                        data?.reduce(
                          (sum, item) =>
                            sum +
                            (item.total_produced_minutes -
                              item.expected_minutes),
                          0,
                        ),
                        0,
                      )}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      {formatNumber(
                        data?.reduce(
                          (sum, item) =>
                            sum +
                            (item.total_produced_minutes -
                              item.expected_minutes),
                          0,
                        ) /
                          data?.reduce(
                            (sum, item) => sum + item.total_present_days,
                            0,
                          ),
                        0,
                      )}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 text-slate-900">
                      {formatNumber(
                        (data?.reduce(
                          (sum, item) => sum + item.total_produced_minutes,
                          0,
                        ) *
                          100) /
                          data?.reduce(
                            (sum, item) => sum + item.expected_minutes,
                            0,
                          ),
                      )}
                    </TableCell>
                    <TableCell className="text-slate-900">
                      {formatNumber(
                        data?.reduce(
                          (sum, item) =>
                            sum + item.avg_production_per_person_day,
                          0,
                        ) / data?.length,
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoefStat;

import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Edit2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DepartmentView = () => {
  const { toast } = useToast();

  const { id } = useParams();

  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ceo/calculateSeason", {
        params: {
          department_id: id,
          month: selectedMonth,
        },
      });
      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [id, selectedMonth]);

  const handleSubmit = async () => {
    try {
      await api.post("/ceo/employeeSums", {
        month: selectedMonth,
        employee_id: selectedEmployee?.employee?.id,
        sum: editingValue,
      });
      getData();
      setEditDialogOpen(false);
      setEditingValue(null);
      setSelectedEmployee(null);
      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar saqlandi",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlar saqlanmadi",
      });
    } finally {
      setSending(false);
    }
  };

  const navigateMonth = (direction) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newYear, newMonth;

    if (direction === "prev") {
      newMonth = month === 1 ? 12 : month - 1;
      newYear = month === 1 ? year - 1 : year;
    } else {
      newMonth = month === 12 ? 1 : month + 1;
      newYear = month === 12 ? year + 1 : year;
    }

    const newMonthString = `${newYear}-${newMonth.toString().padStart(2, "0")}`;
    setSelectedMonth(newMonthString);
    localStorage.setItem("newSeasonSelectedMonth", newMonthString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="space-y-6">
        {/* Header Section */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">
                  Bo'lim ma'lumotlari
                </h1>
                <p className="text-sm text-slate-500">
                  Xodimlarning oylik ma'lumotlari
                </p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="h-8 w-8 p-0 hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    localStorage.setItem(
                      "newSeasonSelectedMonth",
                      e.target.value,
                    );
                  }}
                  className="w-auto h-8 border-0 bg-transparent text-sm"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="h-8 w-8 p-0 hover:bg-slate-200 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employees Table */}
        {!loading && (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Xodim
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Daqiqa uchun
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items
                      ?.sort((a, b) =>
                        a?.employee?.name?.localeCompare(b?.employee?.name),
                      )
                      ?.map((item) => (
                        <tr
                          key={item?.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setEditingValue(item?.per_minute_sum);
                            setEditDialogOpen(true);
                            setSelectedEmployee(item);
                          }}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {item?.employee?.img && (
                                <img
                                  src={item?.employee?.img}
                                  alt={item?.employee?.name}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                                />
                              )}

                              <span className="font-medium text-slate-900">
                                {item?.employee?.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-semibold text-slate-900">
                                {item?.per_minute_sum || 0} so'm
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {data?.items?.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    Xodimlar topilmadi
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Ma'lumot tahrirlash
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedEmployee && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <img
                    src={
                      selectedEmployee?.employee?.img ||
                      "/api/placeholder/40/40"
                    }
                    alt={selectedEmployee?.employee?.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      {selectedEmployee?.employee?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ID: {selectedEmployee?.employee?.id}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Daqiqa uchun to'lov
                </label>
                <Input
                  type="number"
                  value={editingValue || ""}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingValue(null);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={sending || !editingValue}
                  className="flex-1"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DepartmentView;

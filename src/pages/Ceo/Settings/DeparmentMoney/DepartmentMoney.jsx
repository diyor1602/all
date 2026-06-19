import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Clock,
  TrendingUp,
  Award,
  AlertCircle,
  Wallet,
  UserX,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const DepartmentMoney = () => {
  const { toast } = useToast();

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(
    localStorage.getItem("deptMoneyDepartment") || null,
  );
  const [startDate, setStartDate] = useState(
    localStorage.getItem("startDate") || new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    localStorage.getItem("endDate") || new Date().toISOString().split("T")[0],
  );
  const [departments, setDepartments] = useState([]);
  const [imgEmployee, setImgEmployee] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("departments");
      setDepartments(response.data.flatMap((item) => item.departments));
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    if (!selectedDepartment) return;
    try {
      setLoading(true);
      const response = await api.get("ceo/department-budgets/analytics", {
        params: {
          department_id: selectedDepartment,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setData(response.data);
    } catch {
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
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDepartment, startDate, endDate]);

  const stats = [
    {
      label: "Davomat uchun",
      value: data.salary_summary?.attendance_salary_uzs || 0,
      icon: Clock,
      bg: "bg-blue-50",
      border: "border-blue-100",
      iconColor: "text-blue-500",
      valueColor: "text-blue-700",
    },
    {
      label: "Yangi mavsum uchun",
      value: data.salary_summary?.minute_salary_uzs || 0,
      icon: TrendingUp,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      iconColor: "text-emerald-500",
      valueColor: "text-emerald-700",
    },
    {
      label: "Tarifikatsiya",
      value: data.salary_summary?.tarification_uzs || 0,
      icon: Award,
      bg: "bg-violet-50",
      border: "border-violet-100",
      iconColor: "text-violet-500",
      valueColor: "text-violet-700",
    },
    {
      label: "Jarima va bonuslar",
      value: data.salary_summary?.money_logs_uzs || 0,
      icon: AlertCircle,
      bg: "bg-amber-50",
      border: "border-amber-100",
      iconColor: "text-amber-500",
      valueColor: "text-amber-700",
    },
  ];

  const employees = Array.isArray(data.employees) ? data.employees : [];

  return (
    <div className="space-y-3">
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-[13px] font-semibold text-gray-700">
                Bo'lim byudjeti tahlili
              </CardTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedDepartment ?? ""}
                onValueChange={(val) => {
                  setSelectedDepartment(val);
                  localStorage.setItem("deptMoneyDepartment", val);
                }}
              >
                <SelectTrigger className="w-fit text-[12px] border-gray-200 bg-white text-gray-700">
                  <SelectValue placeholder="Bo'limni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department, index) => (
                    <SelectItem key={index} value={String(department.id)}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    localStorage.setItem("startDate", e.target.value);
                  }}
                  className="w-fit"
                />
                <span className="text-gray-300 text-xs">–</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    localStorage.setItem("endDate", e.target.value);
                  }}
                  className="w-fit"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {!selectedDepartment ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <Building2 className="w-9 h-9 text-gray-200" />
                <p className="text-[13px] font-medium text-gray-500">
                  Bo'lim tanlanmagan
                </p>
                <p className="text-[11px] text-gray-400">
                  Yuqoridagi ro'yxatdan bo'limni tanlang
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Summary tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${stat.bg} ${stat.border}`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${stat.iconColor}`} />
                        <span className="text-[11px] text-gray-500 leading-tight">
                          {stat.label}
                        </span>
                      </div>
                      <div className={`text-[13px] font-semibold ${stat.valueColor}`}>
                        {formatNumber(stat.value)}
                        <span className="text-[11px] font-normal text-gray-400 ml-1">
                          so'm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total row */}
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[12px] text-gray-400">Jami summa</span>
                </div>
                <div className="text-[15px] font-bold text-white">
                  {formatNumber(data.salary_summary?.total_earned_uzs || 0)}
                  <span className="text-[12px] font-normal text-gray-400 ml-1">
                    so'm
                  </span>
                </div>
              </div>

              {/* Employees table */}
              {employees.length > 0 && (
                <div className="rounded-lg border border-gray-100 overflow-hidden mt-1">
                  <table className="w-full border-separate border-spacing-0 text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="border-b border-gray-100 px-3 py-2 text-left font-medium w-8">
                          #
                        </th>
                        <th className="border-b border-gray-100 px-3 py-2 text-left font-medium">
                          Xodim
                        </th>
                        <th className="border-b border-gray-100 px-3 py-2 text-center font-medium">
                          Kunlar
                        </th>
                        <th className="border-b border-gray-100 px-3 py-2 text-right font-medium">
                          Davomat
                        </th>
                        <th className="border-b border-gray-100 px-3 py-2 text-right font-medium">
                          Mavsum
                        </th>
                        <th className="border-b border-gray-100 px-3 py-2 text-right font-medium">
                          Tarif
                        </th>
                        <th className="border-b border-gray-100 px-3 py-2 text-right font-medium">
                          Jarima/Bonus
                        </th>
                        <th className="border-b border-gray-100 px-3 py-2 text-right font-medium">
                          Jami
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, index) => (
                        <tr
                          key={emp.employee_id}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          } hover:bg-gray-50 transition-colors`}
                        >
                          <td className="border-b border-gray-50 px-3 py-2 text-gray-400">
                            {index + 1}
                          </td>
                          <td className="border-b border-gray-50 px-3 py-2">
                            <div className="flex items-center gap-2">
                              {emp.img ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImgEmployee(emp);
                                    setImgDialogOpen(true);
                                  }}
                                  className="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200 hover:ring-gray-400 transition-all"
                                >
                                  <img
                                    src={emp.img}
                                    alt={emp.name}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ) : (
                                <div className="h-7 w-7 shrink-0 rounded-full bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center">
                                  <UserX className="w-3.5 h-3.5 text-gray-300" />
                                </div>
                              )}
                              <div>
                                <div className="text-[11px] font-medium text-gray-800 leading-tight">
                                  {emp.name}
                                </div>
                                {emp.status === "kicked" && (
                                  <span className="text-[10px] text-red-400">
                                    Ishdan ketgan
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border-b border-gray-50 px-3 py-2 text-center text-gray-600">
                            {emp.active_days_count}
                          </td>
                          <td className="border-b border-gray-50 px-3 py-2 text-right text-gray-600">
                            {emp.attendance_salary_uzs
                              ? formatNumber(emp.attendance_salary_uzs)
                              : "—"}
                          </td>
                          <td className="border-b border-gray-50 px-3 py-2 text-right text-gray-600">
                            {emp.minute_salary_uzs
                              ? formatNumber(emp.minute_salary_uzs)
                              : "—"}
                          </td>
                          <td className="border-b border-gray-50 px-3 py-2 text-right text-gray-600">
                            {emp.tarification_uzs
                              ? formatNumber(emp.tarification_uzs)
                              : "—"}
                          </td>
                          <td className="border-b border-gray-50 px-3 py-2 text-right text-gray-600">
                            {emp.money_logs_uzs
                              ? formatNumber(emp.money_logs_uzs)
                              : "—"}
                          </td>
                          <td className="border-b border-gray-50 px-3 py-2 text-right font-semibold text-gray-800">
                            {formatNumber(emp.total_earned_uzs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td
                          colSpan={2}
                          className="border-t border-gray-100 px-3 py-2 text-[11px] font-semibold text-gray-600"
                        >
                          Jami
                        </td>
                        <td className="border-t border-gray-100 px-3 py-2 text-center text-[11px] font-semibold text-gray-700">
                          {employees.reduce((sum, e) => sum + (e.active_days_count || 0), 0)}
                        </td>
                        <td className="border-t border-gray-100 px-3 py-2 text-right text-[11px] font-semibold text-gray-700">
                          {formatNumber(employees.reduce((sum, e) => sum + (e.attendance_salary_uzs || 0), 0)) }
                        </td>
                        <td className="border-t border-gray-100 px-3 py-2 text-right text-[11px] font-semibold text-gray-700">
                          {formatNumber(employees.reduce((sum, e) => sum + (e.minute_salary_uzs || 0), 0))}
                        </td>
                        <td className="border-t border-gray-100 px-3 py-2 text-right text-[11px] font-semibold text-gray-700">
                          {formatNumber(employees.reduce((sum, e) => sum + (e.tarification_uzs || 0), 0))}
                        </td>
                        <td className="border-t border-gray-100 px-3 py-2 text-right text-[11px] font-semibold text-gray-700">
                          {formatNumber(employees.reduce((sum, e) => sum + (e.money_logs_uzs || 0), 0))}
                        </td>
                        <td className="border-t border-gray-100 px-3 py-2 text-right text-[11px] font-semibold text-gray-800">
                          {formatNumber(employees.reduce((sum, e) => sum + (e.total_earned_uzs || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold text-gray-800 leading-tight">
              {imgEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            {imgEmployee?.img ? (
              <img
                src={imgEmployee.img}
                alt={imgEmployee.name}
                className="w-full object-contain max-h-[420px]"
              />
            ) : (
              <div className="flex h-48 items-center justify-center text-[12px] text-gray-400">
                Rasm mavjud emas
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentMoney;

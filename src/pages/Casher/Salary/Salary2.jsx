"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HandCoins,
  CreditCard,
  MessageSquare,
  Calendar,
  Building2,
  Users,
  Loader2,
  DollarSign,
  TrendingUp,
  User,
  Plus,
} from "lucide-react";

const formatNumber = (num) => {
  return Number.parseFloat(num)?.toLocaleString("ru-RU");
};

const Salary2 = () => {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState("");
  const [salary, setSalary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rawDepartmentData, setRawDepartmentData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Payment states
  const [paymentLoading, setPaymentLoading] = useState({});
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    employee: null,
    type: null,
    maxAmount: 0,
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    comment: "",
  });

  const [filters, setFilters] = useState({
    department_id: "",
    group_id: "",
    start_date: "",
    end_date: "",
  });

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const initializeFilters = () => {
    const savedFilters = localStorage.getItem("salary2-filters");
    let parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};

    if (!parsedFilters.start_date || !parsedFilters.end_date) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const value = `${year}-${month}`;

      const firstDay = `${value}-01`;
      const lastDayDate = new Date(year, Number.parseInt(month), 0);
      const lastDay = formatDateLocal(lastDayDate);

      parsedFilters = {
        department_id: parsedFilters.department_id || "",
        group_id: parsedFilters.group_id || "",
        start_date: firstDay,
        end_date: lastDay,
      };

      setSelectedMonth(value);
    } else {
      setSelectedMonth(parsedFilters.start_date.substring(0, 7));
    }

    setFilters(parsedFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(parsedFilters));
    return parsedFilters;
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/casher/departments");
      const rawData = response.data || [];
      setRawDepartmentData(rawData);

      const flatDepartments =
        rawData.flatMap((item) => item?.departments) || [];
      setDepartments(flatDepartments);

      return { rawData, flatDepartments };
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
      return { rawData: [], flatDepartments: [] };
    }
  };

  const loadGroupsForDepartment = (departmentId, rawData) => {
    const selectedDepartmentGroups = [];

    rawData.forEach((mainDept) => {
      const department = mainDept.departments?.find(
        (dept) => dept.id.toString() === departmentId
      );
      if (department && department.groups) {
        selectedDepartmentGroups.push(...department.groups);
      }
    });

    setGroups(selectedDepartmentGroups);
    return selectedDepartmentGroups;
  };

  const fetchSalaryData = async (filtersToUse) => {
    if (
      !filtersToUse.department_id ||
      !filtersToUse.start_date ||
      !filtersToUse.end_date
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/casher/groups", {
        params: { ...filtersToUse, type: "simple" },
      });
      setSalary(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate payment totals from the new format
  const calculatePaymentTotals = (paidAmounts) => {
    if (!paidAmounts) return { advanceTotal: 0, salaryTotal: 0 };

    const advanceTotal = (paidAmounts.advance || []).reduce(
      (sum, payment) => sum + Number.parseFloat(payment.amount || 0),
      0
    );
    const salaryTotal = (paidAmounts.salary || []).reduce(
      (sum, payment) => sum + Number.parseFloat(payment.amount || 0),
      0
    );

    return { advanceTotal, salaryTotal };
  };

  // Calculate maximum payable amount
  const calculateMaxAmount = (employee, paymentType) => {
    const totalEarned = Number.parseFloat(employee?.earning?.total_earned || 0);
    const { advanceTotal, salaryTotal } = calculatePaymentTotals(
      employee?.paid_amounts
    );

    if (paymentType === "advance") {
      return Math.max(0, totalEarned - salaryTotal);
    } else {
      return Math.max(0, totalEarned - advanceTotal);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const initialFilters = initializeFilters();
      const { rawData, flatDepartments } = await fetchDepartments();

      let finalFilters = { ...initialFilters };

      if (!initialFilters.department_id && flatDepartments.length > 0) {
        const firstDepartmentId = flatDepartments[0].id.toString();
        const groups = loadGroupsForDepartment(firstDepartmentId, rawData);

        finalFilters = {
          ...initialFilters,
          department_id: firstDepartmentId,
          group_id: groups.length === 1 ? groups[0].id.toString() : "",
        };
      } else if (initialFilters.department_id) {
        const groups = loadGroupsForDepartment(
          initialFilters.department_id,
          rawData
        );

        if (groups.length === 1 && !initialFilters.group_id) {
          finalFilters = {
            ...initialFilters,
            group_id: groups[0].id.toString(),
          };
        }
      }

      if (JSON.stringify(finalFilters) !== JSON.stringify(initialFilters)) {
        setFilters(finalFilters);
        localStorage.setItem("salary2-filters", JSON.stringify(finalFilters));
      }

      await fetchSalaryData(finalFilters);
      setIsInitialized(true);
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    const employees = salary.flatMap((s) => s.employees || []);
    setEmployees(employees);
  }, [salary]);

  useEffect(() => {
    if (isInitialized) {
      fetchSalaryData(filters);
    }
  }, [filters, isInitialized]);

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
  };

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setSelectedMonth(value);

    const [year, month] = value.split("-");
    const firstDay = `${value}-01`;
    const lastDayDate = new Date(
      Number.parseInt(year),
      Number.parseInt(month),
      0
    );
    const lastDay = formatDateLocal(lastDayDate);

    const newFilters = {
      ...filters,
      start_date: firstDay,
      end_date: lastDay,
    };

    updateFilters(newFilters);
  };

  const handleDepartmentChange = (departmentId) => {
    const groups = loadGroupsForDepartment(departmentId, rawDepartmentData);

    const newFilters = {
      ...filters,
      department_id: departmentId,
      group_id: groups.length === 1 ? groups[0].id.toString() : "",
    };

    updateFilters(newFilters);
  };

  const handleGroupChange = (groupId) => {
    const newFilters = {
      ...filters,
      group_id: groupId,
    };

    updateFilters(newFilters);
  };

  const openPaymentDialog = (employee, type) => {
    const maxAmount = calculateMaxAmount(employee, type);

    setPaymentDialog({
      open: true,
      employee,
      type,
      maxAmount,
    });
    setPaymentForm({
      amount: "",
      comment: "",
    });
  };

  const closePaymentDialog = () => {
    setPaymentDialog({
      open: false,
      employee: null,
      type: null,
      maxAmount: 0,
    });
    setPaymentForm({
      amount: "",
      comment: "",
    });
  };

  const handlePayment = async () => {
    const { employee, type, maxAmount } = paymentDialog;
    const { amount, comment } = paymentForm;

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Xatolik",
        description: "Miqdorni kiriting",
        variant: "destructive",
      });
      return;
    }

    if (Number.parseFloat(amount) > maxAmount) {
      toast({
        title: "Xatolik",
        description: `Maksimal miqdor: ${formatNumber(maxAmount)}`,
        variant: "destructive",
      });
      return;
    }

    const loadingKey = `${employee.id}_${type}`;

    try {
      setPaymentLoading((prev) => ({ ...prev, [loadingKey]: true }));

      const response = await api.post("/casher/salaries", {
        employee_id: employee.id,
        type: type,
        amount: Number.parseFloat(amount),
        month: selectedMonth,
        comment: comment || "",
      });

      toast({
        title: "Muvaffaqiyatli",
        description: `${type === "advance" ? "Avans" : "Oylik"} to'landi`,
        variant: "default",
      });

      // Refresh data
      await fetchSalaryData(filters);
      closePaymentDialog();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lov amalga oshmadi",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const getSelectedDepartmentName = () => {
    const dept = departments.find(
      (d) => d.id.toString() === filters.department_id
    );
    return dept?.name || "Bo'lim";
  };

  const getSelectedGroupName = () => {
    const group = groups.find((g) => g.id.toString() === filters.group_id);
    return group?.name || "Guruh";
  };

  const totalStats = employees.reduce(
    (acc, emp) => {
      acc.totalBalance += Number.parseFloat(emp?.balance || 0);
      acc.totalEarned += Number.parseFloat(emp?.earning?.total_earned || 0);
      acc.totalPaid += Number.parseFloat(emp?.total_paid || 0);
      return acc;
    },
    { totalBalance: 0, totalEarned: 0, totalPaid: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Oylik va Avans Boshqaruvi
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Filtrlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="bg-white border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <Select
                  onValueChange={handleDepartmentChange}
                  value={filters.department_id}
                >
                  <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-blue-500 min-w-[200px]">
                    <SelectValue placeholder="Bo'lim tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem
                        key={department.id}
                        value={department.id.toString()}
                      >
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Select
                  onValueChange={handleGroupChange}
                  value={filters.group_id}
                  disabled={!filters.department_id || groups.length === 0}
                >
                  <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-blue-500 min-w-[200px]">
                    <SelectValue placeholder="Guruh tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {employees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Jami Balans</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(totalStats.totalBalance)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Jami Topgan</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(totalStats.totalEarned)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Jami To'langan</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(totalStats.totalPaid)}
                    </p>
                  </div>
                  <HandCoins className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Employee Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Xodimlar ro'yxati
              {filters.department_id && (
                <Badge variant="secondary" className="ml-2">
                  {getSelectedDepartmentName()}
                  {filters.group_id && ` - ${getSelectedGroupName()}`}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="border border-gray-200 p-3 text-left font-semibold">
                      №
                    </th>
                    <th className="border border-gray-200 p-3 text-left font-semibold">
                      Xodim
                    </th>
                    <th className="border border-gray-200 p-3 text-center font-semibold">
                      Balansi
                    </th>
                    <th className="border border-gray-200 p-3 text-center font-semibold">
                      Topgan puli
                    </th>
                    <th className="border border-gray-200 p-3 text-center font-semibold">
                      To'langan pul
                    </th>
                    <th className="border border-gray-200 p-3 text-center font-semibold">
                      Avans
                    </th>
                    <th className="border border-gray-200 p-3 text-center font-semibold">
                      Oylik
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={cn("", loading && "cursor-not-allowed opacity-50")}
                >
                  {employees
                    ?.sort((a, b) => a.name.localeCompare(b.name))
                    .map((employee, index) => {
                      const { advanceTotal, salaryTotal } =
                        calculatePaymentTotals(employee?.paid_amounts);
                      const maxAdvance = calculateMaxAmount(
                        employee,
                        "advance"
                      );
                      const maxSalary = calculateMaxAmount(employee, "salary");

                      return (
                        <tr
                          key={employee.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="border border-gray-200 p-3 text-center font-medium">
                            {index + 1}
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="font-medium text-gray-900">
                              {employee?.name}
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <Badge
                              variant={
                                Number.parseFloat(employee?.balance) > 0
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {formatNumber(employee?.balance)}
                            </Badge>
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <span className="text-green-600 font-medium">
                              {formatNumber(employee?.earning?.total_earned)}
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <span className="text-green-600 font-medium">
                              {/* calculate it */}
                              {formatNumber(employee?.total_paid)}
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <div className="w-full flex items-center justify-center">
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  openPaymentDialog(employee, "advance")
                                }
                                disabled={
                                  maxAdvance <= 0 ||
                                  paymentLoading[`${employee.id}_advance`]
                                }
                                className="h-auto p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex flex-col items-center gap-1"
                              >
                                {paymentLoading[`${employee.id}_advance`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  formatNumber(advanceTotal)
                                )}
                              </Button>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <div className="flex items-center justify-center gap-2 w-full">
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  openPaymentDialog(employee, "salary")
                                }
                                disabled={
                                  maxSalary <= 0 ||
                                  paymentLoading[`${employee.id}_salary`]
                                }
                                className="h-auto p-2 text-green-600 hover:text-green-700 hover:bg-green-50 flex flex-col items-center gap-1"
                              >
                                {paymentLoading[`${employee.id}_salary`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  formatNumber(salaryTotal)
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {employees.length === 0 && !loading && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Xodimlar topilmadi</p>
                  <p className="text-gray-400">
                    Filtrlarni o'zgartirib ko'ring
                  </p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-500">Ma'lumotlar yuklanmoqda...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={paymentDialog.open} onOpenChange={closePaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {paymentDialog.type === "advance" ? (
                  <HandCoins className="h-5 w-5 text-orange-500" />
                ) : (
                  <CreditCard className="h-5 w-5 text-green-500" />
                )}
                {paymentDialog.type === "advance" ? "Avans" : "Oylik"} to'lash
              </DialogTitle>
              <DialogDescription>
                <strong>{paymentDialog.employee?.name}</strong> uchun{" "}
                {paymentDialog.type === "advance" ? "avans" : "oylik"} to'lash
                <br />
                <span className="text-sm text-gray-600">
                  Maksimal miqdor:{" "}
                  <strong>{formatNumber(paymentDialog.maxAmount)}</strong>
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Miqdor (Max: {formatNumber(paymentDialog.maxAmount)})
                </label>
                <Input
                  type="number"
                  placeholder="Miqdorni kiriting"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="border-2 focus:border-blue-500"
                  max={paymentDialog.maxAmount}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Izoh (ixtiyoriy)
                </label>
                <Textarea
                  placeholder="Izoh yozing..."
                  value={paymentForm.comment}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="border-2 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closePaymentDialog}>
                Bekor qilish
              </Button>
              <Button
                onClick={handlePayment}
                disabled={
                  !paymentForm.amount ||
                  paymentLoading[
                    `${paymentDialog.employee?.id}_${paymentDialog.type}`
                  ]
                }
                className={cn(
                  "min-w-[100px]",
                  paymentDialog.type === "advance"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-green-500 hover:bg-green-600"
                )}
              >
                {paymentLoading[
                  `${paymentDialog.employee?.id}_${paymentDialog.type}`
                ] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {paymentDialog.type === "advance" ? (
                      <HandCoins className="h-4 w-4 mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    To'lash
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Salary2;

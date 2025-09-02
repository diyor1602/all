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
import { Separator } from "@/components/ui/separator";
import {
  HandCoins,
  CreditCard,
  MessageSquare,
  Users,
  Loader2,
  DollarSign,
  TrendingUp,
  User,
  Plus,
  History,
  Clock,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import payment_types from "@/lib/paymentTypes";

const formatNumber = (num) => {
  return Number.parseFloat(num)?.toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const SalaryPage = () => {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState("");
  const [salary, setSalary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rawDepartmentData, setRawDepartmentData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
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
    type: "aup",
  });
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/casher/orders");
        setOrders(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Bunday ma'lumot topilmadi",
          variant: "destructive",
        });
      }
    };
    fetchOrders();
  }, []);

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const params = {
        department_id: filters.department_id,
        group_id: filters.group_id,
        start_date: filters.start_date,
        end_date: filters.end_date,
        order_ids: selectedOrders,
      };

      // Make sure your backend endpoint generates Excel instead of PDF
      const response = await api.post(`/casher/pdf/employees`, params, {
        responseType: "blob", // still needed for binary files
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(response.data);
      link.download = `Xodimlar oylik-${selectedMonth}.xlsx`; // Excel extension
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Yuklab olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
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

    // if type is empty, set it to "aup"
    if (!parsedFilters.type) {
      parsedFilters.type = "aup";
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
      const response = await api.post("/casher/groups", {
        ...filtersToUse,
        type: filtersToUse.type === "all" ? "" : filtersToUse.type,
        order_ids: [...selectedOrders],
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

  useEffect(() => {
    fetchSalaryData(filters);
  }, [selectedOrders]);

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

  // Fixed maximum amount calculation - allows redistributing existing payments
  const calculateMaxAmount = (employee, paymentType) => {
    const totalEarned = Number.parseFloat(employee?.total_earned || 0);
    const { advanceTotal, salaryTotal } = calculatePaymentTotals(
      employee?.paid_amounts
    );

    // The maximum should be the total earned amount minus the OTHER type of payment
    // This allows redistributing between advance and salary
    if (paymentType === "advance") {
      // For advance: total_earned - current_salary_payments
      return Math.max(0, totalEarned - salaryTotal);
    } else {
      // For salary: total_earned - current_advance_payments
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

  const handleTypeChange = (type) => {
    const newFilters = {
      ...filters,
      type,
    };

    updateFilters(newFilters);
  };

  const openPaymentDialog = (employee, type) => {
    const maxAmount = calculateMaxAmount(employee, type);
    const { advanceTotal, salaryTotal } = calculatePaymentTotals(
      employee?.paid_amounts
    );

    // Get current amount for this payment type
    const currentAmount = type === "advance" ? advanceTotal : salaryTotal;

    // Get the most recent comment for this payment type (if any)
    const paymentHistory = getPaymentHistory(employee, type);
    const mostRecentComment =
      paymentHistory.length > 0
        ? paymentHistory[paymentHistory.length - 1].comment || ""
        : "";

    setPaymentDialog({
      open: true,
      employee,
      type,
      maxAmount,
    });
    setPaymentForm({
      amount: currentAmount.toString(),
      comment: mostRecentComment,
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

    if (!amount || Number.parseFloat(amount) < 0) {
      toast({
        title: "Diqqat",
        description: "Miqdorni kiriting",
        variant: "destructive",
      });
      return;
    }

    if (Number.parseFloat(amount) > maxAmount) {
      toast({
        title: "Diqqat",
        description: `Maksimal miqdor: ${formatNumber(maxAmount)}`,
        variant: "destructive",
      });
      return;
    }

    const loadingKey = `${employee.id}_${type}`;

    try {
      setPaymentLoading((prev) => ({ ...prev, [loadingKey]: true }));

      await api.post("/casher/salaries", {
        employee_id: employee.id,
        type,
        amount,
        comment,
        month: selectedMonth,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: `${type === "advance" ? "Avans" : "Oylik"} to'landi`,
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1500,
      });

      // Refresh data
      await fetchSalaryData(filters);
      closePaymentDialog();
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error?.response?.data?.message || "To'lov amalga oshmadi",
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
      acc.totalEarned += Number.parseFloat(emp?.total_earned || 0);
      acc.totalPaid += Number.parseFloat(emp?.total_paid || 0);
      return acc;
    },
    { totalEarned: 0, totalPaid: 0 }
  );

  // Get payment history for the current type
  const getPaymentHistory = (employee, type) => {
    if (!employee?.paid_amounts || !employee.paid_amounts[type]) {
      return [];
    }
    return employee.paid_amounts[type] || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="bg-white w-fit"
        />

        <Select
          onValueChange={handleDepartmentChange}
          value={filters.department_id}
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Bo'lim tanlang" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id.toString()}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={handleGroupChange}
          value={filters.group_id}
          disabled={!filters.department_id || groups.length === 0}
        >
          <SelectTrigger className="bg-white w-fit">
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

        <Select onValueChange={handleTypeChange} value={filters.type}>
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Turini tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="aup">AUP</SelectItem>
            <SelectItem value="simple">Oddiy</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Xodim qidirish"
          className="bg-white w-fit"
        />
      </div>

      {/* {orders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {orders
            .sort((a, b) => a.id - b.id)
            .map((order) => (
              <Button
                variant={
                  selectedOrders?.includes(order.id) ? "default" : "outline"
                }
                key={order.id}
                onClick={() =>
                  setSelectedOrders((prev) =>
                    prev.includes(order.id)
                      ? prev.filter((id) => id !== order.id)
                      : [...prev, order.id]
                  )
                }
              >
                {order.id}
              </Button>
            ))}
        </div>
      )} */}

      {employees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Jami Xodimlar</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(employees.length)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-white" />
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
          <CardTitle className="text-lg flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Xodimlar ro'yxati
            </div>
            {filters.department_id && (
              <Badge variant="secondary" className="ml-2">
                {getSelectedDepartmentName()}
                {filters.group_id && ` - ${getSelectedGroupName()}`}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={downloading}
              onClick={handleDownload}
            >
              {downloading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    №
                  </th>
                  <th className="border border-gray-200 p-1 text-left font-semibold">
                    Xodim
                  </th>
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    To'lov turi
                  </th>
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    To'lov miqdori
                  </th>
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    Kelgan kunlari
                  </th>
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    Topgan puli
                  </th>
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    To'langan pul
                  </th>
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    Avans
                  </th>
                  <th className="border border-gray-200 p-1 text-center font-semibold">
                    Oylik
                  </th>
                </tr>
              </thead>
              <tbody
                className={cn("", loading && "cursor-not-allowed opacity-50")}
              >
                {employees
                  ?.sort((a, b) => a.name.localeCompare(b.name))
                  .filter((employee) =>
                    employee.name
                      .toLowerCase()
                      .includes(searchText.toLowerCase())
                  )
                  .map((employee, index) => {
                    const { advanceTotal, salaryTotal } =
                      calculatePaymentTotals(employee?.paid_amounts);

                    return (
                      <tr
                        key={employee.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="border border-gray-200 p-1 text-center font-medium">
                          {index + 1}
                        </td>
                        <td className="border border-gray-200 p-1">
                          <div className="font-medium text-gray-900">
                            {employee?.name}
                          </div>
                        </td>
                        <td className="border border-gray-200 p-1 text-center">
                          {payment_types[employee?.payment_type]}
                        </td>
                        <td className="border border-gray-200 p-1 text-center">
                          {formatNumber(employee?.salary)}
                        </td>
                        <td className="border border-gray-200 p-1 text-center">
                          {employee?.attendance_days}
                        </td>
                        <td className="border border-gray-200 p-1 text-center">
                          <Link
                            to={`/casher/salary/${employee.id}`}
                            target="_blank"
                            className="text-green-600 font-medium"
                          >
                            {formatNumber(employee?.total_earned)}
                          </Link>
                        </td>
                        <td className="border border-gray-200 p-1 text-center">
                          <span className="text-green-600 font-medium">
                            {formatNumber(employee?.total_paid)}
                          </span>
                        </td>
                        <td className="border border-gray-200 p-1 text-center">
                          <div className="w-full flex items-center justify-center">
                            <Button
                              variant="ghost"
                              onClick={() =>
                                openPaymentDialog(employee, "advance")
                              }
                              disabled={
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
                        <td className="border border-gray-200 p-1 text-center">
                          <div className="flex items-center justify-center gap-2 w-full">
                            <Button
                              variant="ghost"
                              onClick={() =>
                                openPaymentDialog(employee, "salary")
                              }
                              disabled={paymentLoading[`${employee.id}_salary`]}
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
                <p className="text-gray-400">Filtrlarni o'zgartirib ko'ring</p>
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

      {/* Enhanced Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={closePaymentDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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
              {paymentDialog.type === "advance" ? "avans" : "oylik"} miqdorini
              o'zgartirish
              <br />
              <span className="text-sm text-gray-600">
                Maksimal miqdor:{" "}
                <strong>{formatNumber(paymentDialog.maxAmount)}</strong>
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment History */}
            {paymentDialog.employee && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">
                    {paymentDialog.type === "advance" ? "Avans" : "Oylik"}{" "}
                    tarixi
                  </h4>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {getPaymentHistory(paymentDialog.employee, paymentDialog.type)
                    .length > 0 ? (
                    <div className="divide-y">
                      {getPaymentHistory(
                        paymentDialog.employee,
                        paymentDialog.type
                      ).map((payment, index) => (
                        <div key={index} className="p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="font-medium">
                                {formatNumber(payment.amount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatDate(payment.date)}
                            </div>
                          </div>
                          {payment.comment && (
                            <div className="mt-1 text-sm text-gray-600 flex items-start gap-2">
                              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{payment.comment}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Hali{" "}
                      {paymentDialog.type === "advance" ? "avans" : "oylik"}{" "}
                      to'lanmagan
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* New Payment Form */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                To'lovni o'zgartirish
              </h4>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Miqdor: {formatNumber(paymentForm.amount)}
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
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePaymentDialog}>
              Bekor qilish
            </Button>
            <Button
              onClick={handlePayment}
              type="button"
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
  );
};

export default SalaryPage;

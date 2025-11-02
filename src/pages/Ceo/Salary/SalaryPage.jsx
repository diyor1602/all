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
import { Separator } from "@/components/ui/separator";
import {
  HandCoins,
  CreditCard,
  MessageSquare,
  Loader2,
  DollarSign,
  User,
  Plus,
  History,
  Clock,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";

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
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    employee: null,
    type: null,
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
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [monthlyDialogOpen, setMonthlyDialogOpen] = useState(false);
  const [pieceworkDialogOpen, setPieceworkDialogOpen] = useState(false);
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [additionalComment, setAdditionalComment] = useState("");
  const [sending, setSending] = useState(false);

  const handleAdditionalDialog = (employee, type) => {
    setSelectedEmployee(employee);
    setAdditionalAmount(
      type === "monthly"
        ? String(employee.monthly_salary?.amount || "")
        : String(employee.monthly_piecework?.amount || "")
    );
    setAdditionalComment(
      type === "monthly"
        ? String(employee.monthly_salary?.comment || "")
        : String(employee.monthly_piecework?.comment || "")
    );
    type === "monthly"
      ? setMonthlyDialogOpen(true)
      : setPieceworkDialogOpen(true);
  };

  const handleSaveAdditionalMonthlySalary = async () => {
    if (additionalAmount < 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, ijobiy miqdor kiriting",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    setSending(true);
    try {
      await api.post("ceo/employeeMonthlySalary", {
        amount: additionalAmount,
        employee_id: selectedEmployee.id,
        comment: additionalComment,
        month: `${selectedMonth}-01`,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Oylik maosh muvaffaqiyatli yangilandi",
        duration: 1500,
      });
      setMonthlyDialogOpen(false);
      setAdditionalAmount(0);
      fetchSalaryData(filters);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Maoshni yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSending(false);
    }
  };

  const handleEditAdditionalMonthlySalary = async (id) => {
    if (additionalAmount < 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, ijobiy miqdor kiriting",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    setSending(true);
    try {
      await api.patch(`ceo/employeeMonthlySalary/${id}`, {
        amount: additionalAmount,
        employee_id: selectedEmployee.id,
        comment: additionalComment,
        month: `${selectedMonth}-01`,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Oylik maosh muvaffaqiyatli yangilandi",
        duration: 1500,
      });
      setMonthlyDialogOpen(false);
      setAdditionalAmount(0);
      fetchSalaryData(filters);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Maoshni yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSending(false);
    }
  };

  const handleSaveAdditionalPieceWork = async () => {
    if (additionalAmount < 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, ijobiy miqdor kiriting",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    setSending(true);
    try {
      await api.post("ceo/employeeMonthlyPiecework", {
        amount: additionalAmount,
        employee_id: selectedEmployee.id,
        comment: additionalComment,
        month: `${selectedMonth}-01`,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Oylik maosh muvaffaqiyatli yangilandi",
        duration: 1500,
      });
      setPieceworkDialogOpen(false);
      setAdditionalAmount(0);
      fetchSalaryData(filters);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Maoshni yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSending(false);
    }
  };

  const handleEditAdditionalPieceWork = async (id) => {
    if (additionalAmount < 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, ijobiy miqdor kiriting",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    setSending(true);
    try {
      await api.patch(`ceo/employeeMonthlyPiecework/${id}`, {
        amount: additionalAmount,
        employee_id: selectedEmployee.id,
        comment: additionalComment,
        month: `${selectedMonth}-01`,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Oylik maosh muvaffaqiyatli yangilandi",
        duration: 1500,
      });
      setPieceworkDialogOpen(false);
      setAdditionalAmount(0);
      fetchSalaryData(filters);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Maoshni yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSending(false);
    }
  };

  // Filter employees based on search text
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchText.toLowerCase())
  );

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
        department_id:
          filters.department_id === "all" ? "" : filters.department_id,
        group_id: filters.group_id === "all" ? "" : filters.group_id,
        month: filters.start_date.substring(0, 7),
        type: filters.type === "all" ? "" : filters.type,
      };

      // Make sure your backend endpoint generates Excel instead of PDF
      const response = await api.post(`/ceo/groups2/excel`, params, {
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
      const response = await api.get("/ceo/departments");
      const rawData = response.data || [];
      setRawDepartmentData(rawData);

      const flatDepartments =
        rawData.flatMap((item) => item?.departments) || [];

      setDepartments([{ id: "all", name: "Barchasi" }, ...flatDepartments]);

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
    const department = rawData
      .flatMap((mainDept) => mainDept.departments || [])
      .find((dept) => dept.id.toString() === departmentId);

    const groups = department
      ? [{ id: "all", name: "Barchasi" }, ...(department.groups || [])]
      : [{ id: "all", name: "Barchasi" }];

    setGroups(groups);
    return groups;
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
      const response = await api.post("/ceo/groups2", {
        type: filtersToUse.type === "all" ? "" : filtersToUse.type,
        department_id:
          filtersToUse.department_id === "all"
            ? ""
            : filtersToUse.department_id,
        group_id: filtersToUse.group_id === "all" ? "" : filtersToUse.group_id,
        month: filtersToUse.start_date.substring(0, 7),
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

  // Fixed maximum amount calculation - allows redistributing existing payments
  const calculateMaxAmount = (employee, paymentType) => {
    const totalEarned =
      Number.parseFloat(employee?.tarification_salary || 0) +
      Number.parseFloat(employee?.attendance_salary || 0);
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
    });
    setPaymentForm({
      amount: "",
      comment: "",
    });
  };

  const handlePayment = async () => {
    const { employee, type } = paymentDialog;
    const { amount, comment } = paymentForm;

    if (Number.parseFloat(amount) < 0 || !comment) {
      toast({
        title: "Diqqat",
        description: "Izohni kiriting",
        variant: "destructive",
      });
      return;
    }

    const loadingKey = `${employee.id}_${type}`;

    try {
      setPaymentLoading((prev) => ({ ...prev, [loadingKey]: true }));

      await api.post("/ceo/salaries", {
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
          className={`
            ${
              selectedMonth ==
              new Date().toISOString().split("-")[0] +
                "-" +
                new Date().toISOString().split("-")[1]
                ? "bg-purple-500"
                : "bg-rose-500"
            }
            w-fit text-white`}
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
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          disabled={downloading}
          onClick={handleDownload}
        >
          {downloading ? <Loader2 className="animate-spin" /> : <Download />}
        </Button>
      </div>

      {/* Employee Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse whitespace-nowrap text-xs bg-white">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="border border-gray-200 p-1 text-center font-semibold">
                №
              </th>
              <th className="border border-gray-200 p-1 text-left font-semibold">
                Xodim
              </th>
              <th className="border border-gray-200 p-1 text-center font-semibold">
                Ish kunlari
              </th>
              <th className="border border-gray-200 p-1 text-center font-semibold whitespace-normal">
                Ish haqi <br /> (oylik)
              </th>
              <th className="border border-gray-200 p-1 text-center font-semibold whitespace-normal">
                Ish haqi <br /> (ishbay)
              </th>
              <th className="border border-gray-200 p-1 text-center font-semibold">
                Topgan pul
              </th>
              <th className="border border-gray-200 p-1 text-center font-semibold">
                Avans
              </th>

              <th className="border border-gray-200 p-1 text-center font-semibold">
                Qoldiq
              </th>
            </tr>
          </thead>
          <tbody className={cn("", loading && "cursor-not-allowed opacity-50")}>
            {filteredEmployees
              ?.sort((a, b) => {
                const selectedDepartmentName =
                  departments
                    .find((d) => d.id.toString() === filters.department_id)
                    ?.name?.toLowerCase() || "";

                const containsTikuv =
                  selectedDepartmentName.includes("tikuv") ||
                  selectedDepartmentName.includes("тикув");

                const aHighlight = a.group === "N/A" && containsTikuv;
                const bHighlight = b.group === "N/A" && containsTikuv;

                if (aHighlight && !bHighlight) return -1;
                if (!aHighlight && bHighlight) return 1;

                return a.name.localeCompare(b.name);
              })
              .map((employee, index) => {
                const { advanceTotal, salaryTotal } = calculatePaymentTotals(
                  employee?.paid_amounts
                );

                const selectedDepartmentName =
                  departments
                    .find((d) => d.id.toString() === filters.department_id)
                    ?.name?.toLowerCase() || "";

                const containsTikuv =
                  selectedDepartmentName.includes("tikuv") ||
                  selectedDepartmentName.includes("тикув");

                const highlight = employee.group === "N/A" && containsTikuv;
                return (
                  <tr
                    key={employee.id}
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      highlight && "bg-red-200 hover:bg-red-100"
                    )}
                  >
                    <td className="border border-gray-200 p-1 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-200 p-1">
                      <Link
                        to={`/ceo/salary/${employee.id}`}
                        className="text-gray-900"
                      >
                        {employee?.name}
                      </Link>
                    </td>
                    <td className="border border-gray-200 p-1 text-center">
                      {employee?.attendance_days}
                    </td>
                    <td
                      className="border border-gray-200 p-1 text-center cursor-pointer"
                      onClick={() =>
                        handleAdditionalDialog(employee, "monthly")
                      }
                    >
                      <div
                        className={`cursor-pointer ${
                          employee?.monthly_salary?.amount ==
                          employee?.attendance_salary
                            ? "bg-green-400"
                            : employee?.monthly_salary?.amount >= 0
                            ? "bg-orange-400"
                            : ""
                        }`}
                      >
                        {formatNumber(
                          employee?.monthly_salary?.amount >= 0
                            ? employee?.monthly_salary?.amount
                            : employee?.attendance_salary
                        )}
                      </div>
                    </td>
                    <td
                      className="border border-gray-200 p-1 text-center"
                      onClick={() =>
                        handleAdditionalDialog(employee, "piecework")
                      }
                    >
                      <div
                        className={`cursor-pointer ${
                          employee?.monthly_piecework?.amount ==
                          employee?.tarification_salary
                            ? "bg-green-400"
                            : employee?.monthly_piecework?.amount >= 0
                            ? "bg-orange-400"
                            : ""
                        }`}
                      >
                        {formatNumber(
                          employee?.monthly_piecework?.amount >= 0
                            ? employee?.monthly_piecework?.amount
                            : employee?.tarification_salary
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 p-1 text-center">
                      {formatNumber(
                        parseFloat(
                          employee?.monthly_salary?.amount >= 0
                            ? employee?.monthly_salary?.amount
                            : employee?.attendance_salary
                        ) +
                          parseFloat(
                            employee?.monthly_piecework?.amount >= 0
                              ? employee?.monthly_piecework?.amount
                              : employee?.tarification_salary
                          )
                      )}
                    </td>
                    <td className="border border-gray-200 p-1 text-center">
                      <div className="w-full flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPaymentDialog(employee, "advance")}
                          disabled={paymentLoading[`${employee.id}_advance`]}
                          className="h-auto text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex flex-col items-center gap-1 text-xs font-normal"
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
                      {formatNumber(
                        parseFloat(
                          employee?.monthly_salary?.amount >= 0
                            ? employee?.monthly_salary?.amount
                            : employee?.attendance_salary
                        ) +
                          parseFloat(
                            employee?.monthly_piecework?.amount >= 0
                              ? employee?.monthly_piecework?.amount
                              : employee?.tarification_salary
                          ) -
                          parseFloat(employee?.total_paid)
                      )}
                    </td>
                  </tr>
                );
              })}

            {/* Jami (Total) Row */}
            {filteredEmployees.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td className="border border-gray-200 p-1 text-center">Jami</td>
                <td className="border border-gray-200 p-1">
                  {filteredEmployees.length} ta xodim
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {filteredEmployees.reduce(
                    (sum, emp) => sum + (Number(emp?.attendance_days) || 0),
                    0
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce(
                      (sum, emp) =>
                        sum +
                        (Number(
                          emp?.monthly_salary?.amount >= 0
                            ? emp?.monthly_salary?.amount
                            : emp?.attendance_salary
                        ) || 0),
                      0
                    )
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce(
                      (sum, emp) =>
                        sum +
                        (Number(
                          emp?.monthly_piecework?.amount >= 0
                            ? emp?.monthly_piecework?.amount
                            : emp?.tarification_salary
                        ) || 0),
                      0
                    )
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce(
                      (sum, emp) =>
                        sum +
                        ((Number(
                          emp?.monthly_salary?.amount >= 0
                            ? emp?.monthly_salary?.amount
                            : emp?.attendance_salary
                        ) || 0) +
                          (Number(
                            emp?.monthly_piecework?.amount >= 0
                              ? emp?.monthly_piecework?.amount
                              : emp?.tarification_salary
                          ) || 0)),
                      0
                    )
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce((sum, emp) => {
                      const { advanceTotal } = calculatePaymentTotals(
                        emp?.paid_amounts || {}
                      );
                      return sum + advanceTotal;
                    }, 0)
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce((sum, emp) => {
                      const totalEarned =
                        (Number(
                          emp?.monthly_salary?.amount >= 0
                            ? emp?.monthly_salary?.amount
                            : emp?.attendance_salary
                        ) || 0) +
                        (Number(
                          emp?.monthly_piecework?.amount >= 0
                            ? emp?.monthly_piecework?.amount
                            : emp?.tarification_salary
                        ) || 0);
                      const totalPaid = Number(emp?.total_paid || 0);
                      return sum + (totalEarned - totalPaid);
                    }, 0)
                  )}
                </td>
              </tr>
            )}
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

      {/* Additional Payment Dialog */}
      <Dialog
        open={monthlyDialogOpen}
        onOpenChange={() => setMonthlyDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Ish haqi (oylik)
            </DialogTitle>
            <DialogDescription>
              <strong>{selectedEmployee?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div>
            {selectedEmployee?.monthly_salary ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">
                  Yangi miqdor:{" "}
                  <span className="font-medium">
                    {formatNumber(selectedEmployee.monthly_salary?.amount)} so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Asl miqdor:{" "}
                  <span className="font-medium">
                    {formatNumber(selectedEmployee.attendance_salary)} so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Farqi:{" "}
                  <span
                    className={`font-medium ${
                      selectedEmployee.monthly_salary?.amount -
                        selectedEmployee.attendance_salary >=
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatNumber(
                      selectedEmployee.monthly_salary?.amount -
                        selectedEmployee.attendance_salary
                    )}{" "}
                    so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Izoh:{" "}
                  <span className="font-medium">
                    {selectedEmployee.monthly_salary?.comment || "-"}
                  </span>
                </p>
                <Label htmlFor="additional-amount">
                  Yangi miqdorni kiriting: ({" "}
                  {additionalAmount && formatNumber(additionalAmount)} so'm)
                </Label>
                <Input
                  id="additional-amount"
                  value={additionalAmount}
                  onChange={(e) => setAdditionalAmount(e.target.value)}
                />
                <div>
                  <Label htmlFor="additional-comment">Izoh (ixtiyoriy):</Label>
                  <Input
                    id="additional-comment"
                    type="text"
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMonthlyDialogOpen(false);
                      setAdditionalAmount("");
                      setAdditionalComment("");
                    }}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={() =>
                      handleEditAdditionalMonthlySalary(
                        selectedEmployee?.monthly_salary?.id
                      )
                    }
                    disabled={!additionalAmount || sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="animate-spin" />
                        O'zgartirilmoqda
                      </>
                    ) : (
                      "O'zgartirish"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <span className="text-gray-600 text-sm">Asl miqdor:</span>{" "}
                  {formatNumber(selectedEmployee?.attendance_salary)} so'm
                </div>
                <Label htmlFor="additional-amount">
                  Yangi miqdorni kiriting: ({" "}
                  {additionalAmount && formatNumber(additionalAmount)} so'm)
                </Label>
                <Input
                  id="additional-amount"
                  value={additionalAmount}
                  onChange={(e) => setAdditionalAmount(e.target.value)}
                />
                <div>
                  <Label htmlFor="additional-comment">Izoh (ixtiyoriy):</Label>
                  <Input
                    id="additional-comment"
                    type="text"
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMonthlyDialogOpen(false);
                      setAdditionalAmount("");
                      setAdditionalComment("");
                    }}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={handleSaveAdditionalMonthlySalary}
                    disabled={!additionalAmount || sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Saqlanmoqda{" "}
                      </>
                    ) : (
                      "Saqlash"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pieceworkDialogOpen}
        onOpenChange={() => setPieceworkDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Ish haqi (ishbay)
            </DialogTitle>
            <DialogDescription>
              <strong>{selectedEmployee?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div>
            {selectedEmployee?.monthly_piecework ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">
                  Yangi miqdor:{" "}
                  <span className="font-medium">
                    {formatNumber(selectedEmployee.monthly_piecework?.amount)}{" "}
                    so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Asl miqdor:{" "}
                  <span className="font-medium">
                    {formatNumber(selectedEmployee.tarification_salary)} so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Farqi:{" "}
                  <span
                    className={`font-medium ${
                      selectedEmployee.monthly_piecework?.amount -
                        selectedEmployee.tarification_salary >=
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatNumber(
                      selectedEmployee.monthly_piecework?.amount -
                        selectedEmployee.tarification_salary
                    )}{" "}
                    so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Izoh:{" "}
                  <span className="font-medium">
                    {selectedEmployee.monthly_piecework?.comment || "-"}
                  </span>
                </p>
                <Label htmlFor="additional-amount">
                  Yangi miqdorni kiriting: ({" "}
                  {additionalAmount && formatNumber(additionalAmount)} so'm)
                </Label>
                <Input
                  id="additional-amount"
                  value={additionalAmount}
                  onChange={(e) => setAdditionalAmount(e.target.value)}
                />
                <div>
                  <Label htmlFor="additional-comment">Izoh (ixtiyoriy):</Label>
                  <Input
                    id="additional-comment"
                    type="text"
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPieceworkDialogOpen(false);
                      setAdditionalAmount("");
                      setAdditionalComment("");
                    }}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={() =>
                      handleEditAdditionalPieceWork(
                        selectedEmployee?.monthly_piecework?.id
                      )
                    }
                    disabled={!additionalAmount || sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="animate-spin" />
                        O'zgartirilmoqda...
                      </>
                    ) : (
                      "O'zgartirish"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <span className="text-gray-600 text-sm">Asl miqdor:</span>{" "}
                  {formatNumber(selectedEmployee?.tarification_salary)} so'm
                </div>
                <Label htmlFor="additional-amount">
                  Yangi miqdorni kiriting: ({" "}
                  {additionalAmount && formatNumber(additionalAmount)} so'm)
                </Label>
                <Input
                  id="additional-amount"
                  value={additionalAmount}
                  onChange={(e) => setAdditionalAmount(e.target.value)}
                />
                <div>
                  <Label htmlFor="additional-comment">Izoh (ixtiyoriy):</Label>
                  <Input
                    id="additional-comment"
                    type="text"
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPieceworkDialogOpen(false);
                      setAdditionalAmount("");
                      setAdditionalComment("");
                    }}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={handleSaveAdditionalPieceWork}
                    disabled={!additionalAmount || sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      "Saqlash"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryPage;

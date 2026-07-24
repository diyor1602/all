import { useState, useEffect, useMemo } from "react";
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
  SlidersHorizontal,
  X,
  Edit2,
  PlusCircle,
  CheckCircle,
  Trash2,
  Magnet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import ExcelAdding from "./ExcelAdding";

const formatNumber = (num) =>
  Number.parseFloat(num)?.toLocaleString("ru-RU", { maximumFractionDigits: 0 });

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const calculateNewSeasonSalary = (emp) =>
  [
    emp?.cutting_salary_minute,
    emp?.master_salary_current,
    emp?.sewing_output_salary,
    emp?.warehouse_salary_minute,
    emp?.assistant_salary,
  ].reduce((sum, val) => sum + Number(val || 0), 0);

const getEmployeeTotalEarned = (emp) => {
  const newSeason = calculateNewSeasonSalary(emp);
  return (
    parseFloat(
      emp?.monthly_salary?.amount >= 0
        ? emp?.monthly_salary?.amount
        : emp?.attendance_salary || 0,
    ) +
    parseFloat(
      emp?.monthly_piecework?.amount >= 0
        ? emp?.monthly_piecework?.amount
        : emp?.tarification_salary || 0,
    ) +
    parseFloat(
      emp?.monthly_daily_payment?.amount >= 0
        ? emp?.monthly_daily_payment?.amount
        : newSeason,
    )
  );
};

const SALARY_TYPE_CONFIG = {
  monthly: {
    apiPost: "ceo/employeeMonthlySalary",
    apiPatch: (id) => `ceo/employeeMonthlySalary/${id}`,
    getRecord: (emp) => emp?.monthly_salary,
    getBase: (emp) => emp?.attendance_salary,
    title: "Ish haqi (oylik)",
  },
  piecework: {
    apiPost: "ceo/employeeMonthlyPiecework",
    apiPatch: (id) => `ceo/employeeMonthlyPiecework/${id}`,
    getRecord: (emp) => emp?.monthly_piecework,
    getBase: (emp) => emp?.tarification_salary,
    title: "Ish haqi (ishbay)",
  },
  newSeason: {
    apiPost: "ceo/employeeMonthlyDailyPayment",
    apiPatch: (id) => `ceo/employeeMonthlyDailyPayment/${id}`,
    getRecord: (emp) => emp?.monthly_daily_payment,
    getBase: (emp) => calculateNewSeasonSalary(emp),
    title: "Yangi mavsum",
  },
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
  const [paymentForm, setPaymentForm] = useState({ amount: "", comment: "" });

  // Currency and sources state
  const [currencies, setCurrencies] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    department_id: "",
    group_id: "",
    start_date: "",
    end_date: "",
    type: "",
  });
  const [searchText, setSearchText] = useState(
    localStorage.getItem("salarySearchText") || "",
  );

  // Advanced client-side filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("salary2-advanced-filters");
      return saved
        ? JSON.parse(saved)
        : {
            minPerDay: "",
            maxPerDay: "",
            minTotal: "",
            maxTotal: "",
            minDays: "",
            maxDays: "",
            paymentStatus: "all",
            showDailyColumn: true,
          };
    } catch {
      return {
        minPerDay: "",
        maxPerDay: "",
        minTotal: "",
        maxTotal: "",
        minDays: "",
        maxDays: "",
        paymentStatus: "all",
        showDailyColumn: true,
      };
    }
  });

  // Unified additional salary dialog
  const [additionalDialogType, setAdditionalDialogType] = useState(null); // "monthly"|"piecework"|"newSeason"|null
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [additionalComment, setAdditionalComment] = useState("");
  const [sending, setSending] = useState(false);

  const handleAdditionalDialog = (employee, type) => {
    const config = SALARY_TYPE_CONFIG[type];
    const record = config.getRecord(employee);
    setSelectedEmployee(employee);
    setAdditionalAmount(String(record?.amount ?? ""));
    setAdditionalComment(String(record?.comment ?? ""));
    setAdditionalDialogType(type);
  };

  const closeAdditionalDialog = () => {
    setAdditionalDialogType(null);
    setAdditionalAmount("");
    setAdditionalComment("");
  };

  const handleSaveAdditional = async () => {
    if (Number(additionalAmount) < 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, ijobiy miqdor kiriting",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    const config = SALARY_TYPE_CONFIG[additionalDialogType];
    setSending(true);
    try {
      await api.post(config.apiPost, {
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
      closeAdditionalDialog();
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

  const handleEditAdditional = async (id) => {
    if (Number(additionalAmount) < 0) {
      toast({
        title: "Diqqat",
        description: "Iltimos, ijobiy miqdor kiriting",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    const config = SALARY_TYPE_CONFIG[additionalDialogType];
    setSending(true);
    try {
      await api.patch(config.apiPatch(id), {
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
      closeAdditionalDialog();
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

  const calculatePaymentTotals = (paidAmounts) => {
    if (!paidAmounts) return { advanceTotal: 0, salaryTotal: 0 };
    const advanceTotal = (paidAmounts.advance || []).reduce(
      (sum, p) => sum + Number.parseFloat(p.amount || 0),
      0,
    );
    const salaryTotal = (paidAmounts.salary || []).reduce(
      (sum, p) => sum + Number.parseFloat(p.amount || 0),
      0,
    );
    return { advanceTotal, salaryTotal };
  };

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
      const response = await api.post(`/ceo/groups2/excel`, params, {
        responseType: "blob",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(response.data);
      link.download = `Xodimlar oylik-${selectedMonth}.xlsx`;
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
      const lastDay = formatDateLocal(
        new Date(year, Number.parseInt(month), 0),
      );
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

    if (!parsedFilters.type) parsedFilters.type = "all";

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
        description:
          error?.response?.data?.message || "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
      return { rawData: [], flatDepartments: [] };
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await api.get("/ceo/currencies");
      setCurrencies(response.data);
      const soM = response.data.find(
        (currency) => currency.name.toLowerCase() === "so'm",
      );
      if (soM) {
        setSelectedCurrency(soM.id);
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Valyutalarni olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const getAvailableSources = async () => {
    if (!selectedCurrency) return;
    try {
      const res = await api.get("/ceo/cashbox/available-sources", {
        params: { currency_id: selectedCurrency },
      });
      setAvailableSources(res.data);
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kirim ma'lumotlarini olib bo'lmadi",
      });
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
    )
      return;
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
        description:
          error?.response?.data?.message || "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          rawData,
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
    setEmployees(salary.flatMap((s) => s.employees || []));
  }, [salary]);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    getAvailableSources();
    setSelectedSources([]);
  }, [selectedCurrency]);

  const toggleSourceSelection = (source) => {
    const exists = selectedSources.find((s) => s.id === source.id);
    if (exists) {
      setSelectedSources(selectedSources.filter((s) => s.id !== source.id));
    } else {
      setSelectedSources([
        ...selectedSources,
        { ...source, allocatedAmount: "" },
      ]);
    }
  };

  const handleAllocatedAmountChange = (sourceId, value) => {
    const source = selectedSources.find((s) => s.id === sourceId);
    if (!source) return;

    const numericValue = parseFloat(value) || 0;
    if (numericValue > source.remaining_amount) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: `Kiritilgan summa qoldiqdan (${formatNumber(source.remaining_amount)}) oshmasligi kerak!`,
        duration: 2500,
      });
      return;
    }

    setSelectedSources(
      selectedSources.map((s) =>
        s.id === sourceId ? { ...s, allocatedAmount: value } : s,
      ),
    );
  };

  const totalSelectedAmount = selectedSources.reduce(
    (sum, s) => sum + (parseFloat(s.allocatedAmount) || 0),
    0,
  );

  useEffect(() => {
    if (isInitialized) fetchSalaryData(filters);
  }, [filters, isInitialized]);

  useEffect(() => {
    localStorage.setItem(
      "salary2-advanced-filters",
      JSON.stringify(advancedFilters),
    );
  }, [advancedFilters]);

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
  };

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setSelectedMonth(value);
    const [year, month] = value.split("-");
    const firstDay = `${value}-01`;
    const lastDay = formatDateLocal(
      new Date(Number.parseInt(year), Number.parseInt(month), 0),
    );
    updateFilters({ ...filters, start_date: firstDay, end_date: lastDay });
  };

  const handleDepartmentChange = (departmentId) => {
    const groups = loadGroupsForDepartment(departmentId, rawDepartmentData);
    updateFilters({
      ...filters,
      department_id: departmentId,
      group_id: groups.length === 1 ? groups[0].id.toString() : "",
    });
  };

  const handleGroupChange = (groupId) =>
    updateFilters({ ...filters, group_id: groupId });
  const handleTypeChange = (type) => updateFilters({ ...filters, type });

  const openPaymentDialog = (employee, type) => {
    setPaymentDialog({ open: true, employee, type });
    setPaymentForm({ amount: "", comment: "" });
  };

  const closePaymentDialog = () => {
    setPaymentDialog({ open: false, employee: null, type: null });
    setPaymentForm({ amount: "", comment: "" });
    setSelectedSources([]);
  };

  const handlePayment = async () => {
    const { employee, type } = paymentDialog;
    const { amount, comment } = paymentForm;

    if (amount == 0) {
      toast({
        title: "Diqqat",
        description: "To'lov miqdorini kiriting",
        variant: "destructive",
      });
      return;
    }

    if (Number.parseFloat(amount) < 0 && !comment) {
      toast({
        title: "Diqqat",
        description: "Izohni kiriting",
        variant: "destructive",
      });
      return;
    }

    const mainAmount = parseFloat(amount) || 0;

    // Only validate source allocation if sources are selected
    if (selectedSources.length > 0 && mainAmount !== totalSelectedAmount) {
      toast({
        variant: "destructive",
        title: "Tafovut aniqlandi!",
        description: `To'lov miqdori (${formatNumber(mainAmount)}) tanlangan manbalar yig'indisiga (${formatNumber(totalSelectedAmount)}) teng bo'lishi shart.`,
        duration: 4000,
      });
      return;
    }

    // Map source structure as required by the backend API schema (only if sources selected)
    const formattedSources =
      selectedSources.length > 0
        ? selectedSources.map((s) => ({
            income_transaction_id: s.id,
            amount: parseFloat(s.allocatedAmount),
          }))
        : undefined;

    const loadingKey = `${employee.id}_${type}`;
    try {
      setPaymentLoading((prev) => ({ ...prev, [loadingKey]: true }));
      await api.post("/ceo/salaries", {
        employee_id: employee.id,
        type,
        amount,
        comment,
        month: selectedMonth,
        ...(formattedSources && { sources: formattedSources }),
      });
      toast({
        title: "Muvaffaqiyatli",
        description: `${type === "advance" ? "Avans" : "Oylik"} to'landi`,
        style: { backgroundColor: "green", color: "white" },
        duration: 1500,
      });
      await fetchSalaryData(filters);
      await getAvailableSources();
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

  const getPaymentHistory = (employee, type) =>
    employee?.paid_amounts?.[type] || [];

  // Derived: selected department name for tikuv check
  const selectedDepartmentName = useMemo(
    () =>
      departments
        .find((d) => d.id.toString() === filters.department_id)
        ?.name?.toLowerCase() || "",
    [departments, filters.department_id],
  );
  const containsTikuv =
    selectedDepartmentName.includes("tikuv") ||
    selectedDepartmentName.includes("тикув");

  // All client-side filtering
  const filteredEmployees = useMemo(() => {
    const {
      minPerDay,
      maxPerDay,
      minTotal,
      maxTotal,
      minDays,
      maxDays,
      paymentStatus,
    } = advancedFilters;
    return employees
      .filter((emp) =>
        emp.name.toLowerCase().includes(searchText.toLowerCase()),
      )
      .filter((emp) => {
        const total = getEmployeeTotalEarned(emp);
        const days = emp?.attendance_days || 0;
        const perDay = days > 0 ? total / days : 0;
        const remaining = total - Number(emp?.total_paid || 0);
        if (minPerDay && perDay < Number(minPerDay)) return false;
        if (maxPerDay && perDay > Number(maxPerDay)) return false;
        if (minTotal && total < Number(minTotal)) return false;
        if (maxTotal && total > Number(maxTotal)) return false;
        if (minDays && days < Number(minDays)) return false;
        if (maxDays && days > Number(maxDays)) return false;
        if (paymentStatus === "paid" && remaining > 0) return false;
        if (paymentStatus === "unpaid" && remaining <= 0) return false;
        return true;
      })
      .sort((a, b) => {
        const aHighlight = a.group === "N/A" && containsTikuv;
        const bHighlight = b.group === "N/A" && containsTikuv;
        if (aHighlight && !bHighlight) return -1;
        if (!aHighlight && bHighlight) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [employees, searchText, advancedFilters, containsTikuv]);

  const hasAdvancedFiltersActive =
    advancedFilters.minPerDay ||
    advancedFilters.maxPerDay ||
    advancedFilters.minTotal ||
    advancedFilters.maxTotal ||
    advancedFilters.minDays ||
    advancedFilters.maxDays ||
    advancedFilters.paymentStatus !== "all" ||
    advancedFilters.showDailyColumn === false;

  const resetAdvancedFilters = () =>
    setAdvancedFilters({
      minPerDay: "",
      maxPerDay: "",
      minTotal: "",
      maxTotal: "",
      minDays: "",
      maxDays: "",
      paymentStatus: "all",
      showDailyColumn: true,
    });

  // Active additional dialog config
  const activeConfig = additionalDialogType
    ? SALARY_TYPE_CONFIG[additionalDialogType]
    : null;
  const activeRecord =
    activeConfig && selectedEmployee
      ? activeConfig.getRecord(selectedEmployee)
      : null;
  const activeBase =
    activeConfig && selectedEmployee
      ? activeConfig.getBase(selectedEmployee)
      : 0;

  return (
    <div className="space-y-4">
      {/* Primary filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className={cn(
            "w-fit text-white",
            selectedMonth ===
              `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
              ? "bg-purple-500"
              : "bg-rose-500",
          )}
        />

        <Select
          onValueChange={handleDepartmentChange}
          value={filters.department_id}
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Bo'lim tanlang" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>
                {d.name}
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
              .map((g) => (
                <SelectItem key={g.id} value={g.id.toString()}>
                  {g.name}
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
          onChange={(e) => {
            setSearchText(e.target.value);
            localStorage.setItem("salarySearchText", e.target.value);
          }}
          placeholder="Xodim qidirish"
          className="bg-white w-fit"
        />

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            hasAdvancedFiltersActive && "border-blue-500 text-blue-600",
          )}
          onClick={() => setShowAdvancedFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrlar
          {hasAdvancedFiltersActive && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
              !
            </span>
          )}
        </Button>

        <ExcelAdding />
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

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-800">
              Qo'shimcha filtrlar
            </h3>
            {hasAdvancedFiltersActive && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 h-auto py-1 gap-1"
                onClick={resetAdvancedFilters}
              >
                <X className="h-3 w-3" /> Tozalash
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-blue-700">
                Min kunlik daromad (so'm)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={advancedFilters.minPerDay}
                onChange={(e) =>
                  setAdvancedFilters((p) => ({
                    ...p,
                    minPerDay: e.target.value,
                  }))
                }
                className="bg-white h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-blue-700">
                Max kunlik daromad (so'm)
              </Label>
              <Input
                type="number"
                placeholder="∞"
                value={advancedFilters.maxPerDay}
                onChange={(e) =>
                  setAdvancedFilters((p) => ({
                    ...p,
                    maxPerDay: e.target.value,
                  }))
                }
                className="bg-white h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-blue-700">
                Min oylik jami (so'm)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={advancedFilters.minTotal}
                onChange={(e) =>
                  setAdvancedFilters((p) => ({
                    ...p,
                    minTotal: e.target.value,
                  }))
                }
                className="bg-white h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-blue-700">
                Max oylik jami (so'm)
              </Label>
              <Input
                type="number"
                placeholder="∞"
                value={advancedFilters.maxTotal}
                onChange={(e) =>
                  setAdvancedFilters((p) => ({
                    ...p,
                    maxTotal: e.target.value,
                  }))
                }
                className="bg-white h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-blue-700">Min ish kunlari</Label>
              <Input
                type="number"
                placeholder="0"
                value={advancedFilters.minDays}
                onChange={(e) =>
                  setAdvancedFilters((p) => ({
                    ...p,
                    minDays: e.target.value,
                  }))
                }
                className="bg-white h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-blue-700">Max ish kunlari</Label>
              <Input
                type="number"
                placeholder="∞"
                value={advancedFilters.maxDays}
                onChange={(e) =>
                  setAdvancedFilters((p) => ({
                    ...p,
                    maxDays: e.target.value,
                  }))
                }
                className="bg-white h-8 text-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs text-blue-700 block mb-1">
              To'lov holati
            </Label>
            <div className="flex gap-2">
              {[
                { value: "all", label: "Barchasi" },
                { value: "unpaid", label: "Qoldig'i bor" },
                { value: "paid", label: "To'liq to'langan" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setAdvancedFilters((p) => ({
                      ...p,
                      paymentStatus: opt.value,
                    }))
                  }
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-colors",
                    advancedFilters.paymentStatus === opt.value
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-300",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs text-blue-700 block mb-1">Ustunlar</Label>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setAdvancedFilters((p) => ({
                    ...p,
                    showDailyColumn: !p.showDailyColumn,
                  }))
                }
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-colors",
                  advancedFilters.showDailyColumn
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-300",
                )}
              >
                Kunlik ustuni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results summary when advanced filters are active */}
      {hasAdvancedFiltersActive && (
        <p className="text-sm text-blue-600">
          Filtr natijalari: <strong>{filteredEmployees.length}</strong> ta xodim
          / jami {employees.length} ta
        </p>
      )}

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
              {advancedFilters.showDailyColumn && (
                <th className="border border-gray-200 p-1 text-center font-semibold">
                  Kunlik
                </th>
              )}
              <th className="border border-gray-200 p-1 text-center font-semibold">
                Yangi mavsum
              </th>
              <th className="border border-gray-200 p-1 text-center font-semibold whitespace-normal">
                Ish haqi (oylik)
              </th>
              <th className="border border-gray-200 p-1 text-center font-semibold whitespace-normal">
                Ish haqi (ishbay)
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
            {filteredEmployees.map((employee, index) => {
              const { advanceTotal } = calculatePaymentTotals(
                employee?.paid_amounts,
              );
              const newSeason = calculateNewSeasonSalary(employee);
              const totalEarned = getEmployeeTotalEarned(employee);
              const days = employee?.attendance_days || 0;
              const perDay = days > 0 ? totalEarned / days : 0;
              const highlight = employee.group === "N/A" && containsTikuv;
              const isLowEarner = perDay > 0 && perDay <= 100000;

              return (
                <tr
                  key={employee.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    highlight && "bg-red-200 hover:bg-red-100",
                    isLowEarner && "bg-yellow-200 hover:bg-yellow-100",
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
                    {days}
                  </td>
                  {advancedFilters.showDailyColumn && (
                    <td className="border border-gray-200 p-1 text-center text-gray-500">
                      {days > 0 ? formatNumber(Math.round(perDay)) : "-"}
                    </td>
                  )}
                  <td
                    className="border border-gray-200 p-1 text-center cursor-pointer"
                    onClick={() =>
                      handleAdditionalDialog(employee, "newSeason")
                    }
                  >
                    <div
                      className={cn(
                        "cursor-pointer",
                        employee?.monthly_daily_payment?.amount == newSeason
                          ? "bg-green-400"
                          : employee?.monthly_daily_payment?.amount >= 0
                            ? "bg-orange-400"
                            : "",
                      )}
                    >
                      {formatNumber(
                        employee?.monthly_daily_payment?.amount >= 0
                          ? employee?.monthly_daily_payment?.amount
                          : newSeason,
                      )}
                    </div>
                  </td>
                  <td
                    className="border border-gray-200 p-1 text-center cursor-pointer"
                    onClick={() => handleAdditionalDialog(employee, "monthly")}
                  >
                    <div
                      className={cn(
                        "cursor-pointer",
                        employee?.monthly_salary?.amount ==
                          employee?.attendance_salary
                          ? "bg-green-400"
                          : employee?.monthly_salary?.amount >= 0
                            ? "bg-orange-400"
                            : "",
                      )}
                    >
                      {formatNumber(
                        employee?.monthly_salary?.amount >= 0
                          ? employee?.monthly_salary?.amount
                          : employee?.attendance_salary,
                      )}
                    </div>
                  </td>
                  <td
                    className="border border-gray-200 p-1 text-center cursor-pointer"
                    onClick={() =>
                      handleAdditionalDialog(employee, "piecework")
                    }
                  >
                    <div
                      className={cn(
                        "cursor-pointer",
                        employee?.monthly_piecework?.amount ==
                          employee?.tarification_salary
                          ? "bg-green-400"
                          : employee?.monthly_piecework?.amount >= 0
                            ? "bg-orange-400"
                            : "",
                      )}
                    >
                      {formatNumber(
                        employee?.monthly_piecework?.amount >= 0
                          ? employee?.monthly_piecework?.amount
                          : employee?.tarification_salary,
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-200 p-1 text-center">
                    {formatNumber(totalEarned)}
                  </td>
                  <td className="border border-gray-200 p-1 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPaymentDialog(employee, "advance")}
                      disabled={paymentLoading[`${employee.id}_advance`]}
                      className="h-auto text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex flex-col items-center gap-1 text-xs font-normal mx-auto"
                    >
                      {paymentLoading[`${employee.id}_advance`] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        formatNumber(advanceTotal)
                      )}
                    </Button>
                  </td>
                  <td className="border border-gray-200 p-1 text-center">
                    {formatNumber(
                      totalEarned - parseFloat(employee?.total_paid || 0),
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredEmployees.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td className="border border-gray-200 p-1 text-center">Jami</td>
                <td className="border border-gray-200 p-1">
                  {filteredEmployees.length} ta xodim
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {filteredEmployees.reduce(
                    (sum, emp) => sum + (Number(emp?.attendance_days) || 0),
                    0,
                  )}
                </td>
                {advancedFilters.showDailyColumn && (
                  <td className="border border-gray-200 p-1 text-center">—</td>
                )}
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce(
                      (sum, emp) =>
                        sum +
                        (emp?.monthly_daily_payment?.amount >= 0
                          ? emp?.monthly_daily_payment?.amount
                          : Number(calculateNewSeasonSalary(emp)) || 0),
                      0,
                    ),
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
                            : emp?.attendance_salary,
                        ) || 0),
                      0,
                    ),
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
                            : emp?.tarification_salary,
                        ) || 0),
                      0,
                    ),
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce(
                      (sum, emp) => sum + getEmployeeTotalEarned(emp),
                      0,
                    ),
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce((sum, emp) => {
                      const { advanceTotal } = calculatePaymentTotals(
                        emp?.paid_amounts || {},
                      );
                      return sum + advanceTotal;
                    }, 0),
                  )}
                </td>
                <td className="border border-gray-200 p-1 text-center">
                  {formatNumber(
                    filteredEmployees.reduce(
                      (sum, emp) =>
                        sum +
                        (getEmployeeTotalEarned(emp) -
                          Number(emp?.total_paid || 0)),
                      0,
                    ),
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

      {/* Payment Dialog */}
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
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
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
                        paymentDialog.type,
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
                            <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                              <MessageSquare className="h-3 w-3 flex-shrink-0" />
                              <span>{payment.comment}</span>
                            </div>
                          )}
                          {payment.income_sources &&
                            payment.income_sources.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {payment.income_sources.map((source, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-gray-600 flex items-center gap-2"
                                  >
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <div className="flex-1 items-center">
                                      {source.income_transaction_source && (
                                        <span>
                                          Manba:{" "}
                                          {source.income_transaction_source}
                                        </span>
                                      )}
                                      {source.income_transaction_amount > 0 && (
                                        <span className="ml-2">
                                          (
                                          {formatNumber(
                                            source.income_transaction_amount,
                                          )}
                                          )
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePayment();
                    }
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePayment();
                    }
                  }}
                  className="border-2 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tanlangan Kirim Manbalari
                </label>
                <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-gray-50 h-10">
                  <div className="text-sm font-medium truncate max-w-[180px]">
                    {selectedSources.length > 0
                      ? `${selectedSources.length} ta manba (${formatNumber(totalSelectedAmount)})`
                      : "Tanlanmagan"}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    type="button"
                    onClick={() => setSourceDialogOpen(true)}
                  >
                    {selectedSources.length > 0 ? (
                      <Edit2 className="w-4 h-4" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
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
                  : "bg-green-500 hover:bg-green-600",
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

      {/* Source Selection Dialog */}
      <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Manbalarni tanlash va taqsimlash
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4 bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
            <div>
              Umumiy To'lov Miqdori:{" "}
              <strong className="text-blue-700">
                {formatNumber(paymentForm.amount || 0)}
              </strong>
            </div>
            <div>
              Taqsimlandi:{" "}
              <strong
                className={
                  totalSelectedAmount === parseFloat(paymentForm.amount)
                    ? "text-green-600"
                    : "text-amber-600"
                }
              >
                {formatNumber(totalSelectedAmount)}
              </strong>
            </div>
          </div>

          <div>
            <Input
              type="text"
              placeholder="Izoh, maqsad yoki summa bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto pr-1 flex flex-col gap-3 flex-1 min-h-[250px] max-h-[50vh]">
            {availableSources?.sources
              ?.filter(
                (source) =>
                  source?.comment
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  source?.purpose
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  source?.remaining_amount?.toString().includes(searchTerm) ||
                  source?.amount?.toString().includes(searchTerm),
              )
              ?.map((source) => {
                const targetSelection = selectedSources.find(
                  (s) => s.id === source.id,
                );
                const isSelected = !!targetSelection;

                return (
                  <div
                    key={source.id}
                    className={`border rounded-xl p-4 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-sm"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {source?.purpose || "Maqsad ko'rsatilmagan"}
                          </span>
                          {isSelected && (
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Tanlandi
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {source?.comment || "Izohsiz"}
                        </p>
                        <div className="flex gap-4 text-xs font-medium pt-1">
                          <span className="text-gray-600">
                            Jami: {formatNumber(source?.amount)}
                          </span>
                          <span className="text-emerald-600">
                            Qoldiq: {formatNumber(source?.remaining_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isSelected && (
                          <div className="flex flex-col gap-1 w-32">
                            <Label className="text-[11px] text-gray-500">
                              Kiritilayotgan summa
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                size="sm"
                                className="h-8 py-1 text-sm bg-white"
                                placeholder="Miqdor"
                                value={targetSelection.allocatedAmount}
                                onChange={(e) =>
                                  handleAllocatedAmountChange(
                                    source.id,
                                    e.target.value,
                                  )
                                }
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  const remainingNeeded =
                                    parseFloat(paymentForm.amount) -
                                    totalSelectedAmount;
                                  const amountToFill = Math.min(
                                    remainingNeeded,
                                    source.remaining_amount,
                                  );
                                  handleAllocatedAmountChange(
                                    source.id,
                                    amountToFill,
                                  );
                                }}
                                title="Qoldiqni avtomatik to'ldirish"
                              >
                                <Magnet className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "destructive" : "outline"}
                          className="h-8 mt-auto"
                          onClick={() => toggleSourceSelection(source)}
                        >
                          {isSelected ? (
                            <Trash2 className="w-4 h-4" />
                          ) : (
                            "Tanlash"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {availableSources?.sources?.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                Ushbu valyutada ochiq kirim manbalari mavjud emas.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedSources([]);
                setSourceDialogOpen(false);
              }}
            >
              Tozalash
            </Button>
            <Button type="button" onClick={() => setSourceDialogOpen(false)}>
              Tasdiqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Additional Salary Dialog */}
      <Dialog
        open={!!additionalDialogType}
        onOpenChange={closeAdditionalDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeConfig?.title}</DialogTitle>
            <DialogDescription>
              <strong>{selectedEmployee?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {activeRecord ? (
              <>
                <p className="text-sm text-gray-600">
                  Yangi miqdor:{" "}
                  <span className="font-medium">
                    {formatNumber(activeRecord.amount)} so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Asl miqdor:{" "}
                  <span className="font-medium">
                    {formatNumber(activeBase)} so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Farqi:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      activeRecord.amount - activeBase >= 0
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {formatNumber(activeRecord.amount - activeBase)} so'm
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Izoh:{" "}
                  <span className="font-medium">
                    {activeRecord.comment || "-"}
                  </span>
                </p>
              </>
            ) : (
              <div>
                <span className="text-gray-600 text-sm">Asl miqdor:</span>{" "}
                {formatNumber(activeBase)} so'm
              </div>
            )}

            <Label htmlFor="add-amount">
              Yangi miqdorni kiriting: (
              {additionalAmount && formatNumber(additionalAmount)} so'm)
            </Label>
            <Input
              id="add-amount"
              type="number"
              value={additionalAmount}
              onChange={(e) => setAdditionalAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  activeRecord
                    ? handleEditAdditional(activeRecord.id)
                    : handleSaveAdditional();
                }
              }}
            />

            <Label htmlFor="add-comment">Izoh (ixtiyoriy):</Label>
            <Input
              id="add-comment"
              type="text"
              value={additionalComment}
              onChange={(e) => setAdditionalComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  activeRecord
                    ? handleEditAdditional(activeRecord.id)
                    : handleSaveAdditional();
                }
              }}
            />

            <div className="flex items-center gap-2 justify-end mt-4">
              <Button variant="outline" onClick={closeAdditionalDialog}>
                Bekor qilish
              </Button>
              <Button
                disabled={!additionalAmount || sending}
                onClick={() =>
                  activeRecord
                    ? handleEditAdditional(activeRecord.id)
                    : handleSaveAdditional()
                }
              >
                {sending ? (
                  <>
                    <Loader2 className="animate-spin" />{" "}
                    {activeRecord ? "O'zgartirilmoqda" : "Saqlanmoqda"}
                  </>
                ) : activeRecord ? (
                  "O'zgartirish"
                ) : (
                  "Saqlash"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryPage;

import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  AlarmClock,
  ChevronUp,
  ChevronDown,
  Check,
  Search,
  Plus,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import formatNumber from "@/utils/formatNumber";
import { cn } from "@/lib/utils";

const emptyAssignmentForm = {
  employee_id: "",
  department_id: "",
  group_id: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  sum: "",
};

// Accepts "YYYY-MM-DD" or a full ISO timestamp ("YYYY-MM-DDTHH:mm:ss.SSSSSSZ") and displays "DD.MM.YYYY"
const formatDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
};

const StatusBadge = ({ status, className }) => {
  if (!status) return null;
  const isKicked = status === "kicked";
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0",
        isKicked
          ? "bg-red-50 text-red-600 border-red-200"
          : "bg-green-50 text-green-600 border-green-200",
        className,
      )}
    >
      {isKicked ? "Ishdan ketgan" : "Ishlamoqda"}
    </span>
  );
};

const DepartmentView = () => {
  const { toast } = useToast();

  const { id } = useParams();

  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [hideZeroPerMinute, setHideZeroPerMinute] = useState(() => {
    const saved = localStorage.getItem("departmentViewHideZeroPerMinute");
    return saved ? saved === "true" : false;
  });
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = localStorage.getItem("departmentViewSortConfig");
    return saved
      ? JSON.parse(saved)
      : {
          key: "employee",
          direction: "asc",
        };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentsSectionOpen, setAssignmentsSectionOpen] = useState(() => {
    const saved = localStorage.getItem("departmentViewAssignmentsOpen");
    return saved ? saved === "true" : true;
  });

  // Departments/groups (for the assignment form selects)
  const [departmentGroups, setDepartmentGroups] = useState([]);

  // Employees of this department (for the assignment form employee select)
  const [employees, setEmployees] = useState([]);

  // Assignment records (employeeSums): employee_id, department_id, group_id, start_date, end_date, sum
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [employeePickerQuery, setEmployeePickerQuery] = useState("");
  const [employeeFieldLocked, setEmployeeFieldLocked] = useState(false);
  const [lockedEmployeeInfo, setLockedEmployeeInfo] = useState(null);
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("");

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

  const fetchDepartmentGroups = async () => {
    try {
      const response = await api.get("/departments");
      const flat = (response.data || []).flatMap(
        (item) => item?.departments || [],
      );
      setDepartmentGroups(flat);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Bo'limlar ro'yxatini olishda xatolik",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/ceo/employees", {
        params: { department_id: id, status: "working" },
      });
      setEmployees(response.data?.data || response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimlar ro'yxatini olishda xatolik",
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const response = await api.get("/ceo/employeeSums", {
        params: { department_id: id, month: selectedMonth },
      });
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setAssignments(list);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Tayinlashlar ro'yxatini olishda xatolik",
      });
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    getData();
    fetchAssignments();
    fetchEmployees();
  }, [id, selectedMonth]);

  useEffect(() => {
    fetchDepartmentGroups();
  }, [id]);

  const currentDepartment = useMemo(
    () =>
      departmentGroups.find((dept) => String(dept.id) === String(id)) || null,
    [departmentGroups, id],
  );

  const groupsForDepartment = (departmentId) => {
    const dept = departmentGroups.find(
      (d) => String(d.id) === String(departmentId),
    );
    return dept?.groups || [];
  };

  const openAddAssignment = (employee) => {
    setEditingAssignment(null);
    setAssignmentForm({
      ...emptyAssignmentForm,
      employee_id: employee?.id ? String(employee.id) : "",
      department_id: String(id),
      group_id: employee?.group?.id ? String(employee.group.id) : "",
    });
    setEmployeePickerQuery("");
    setEmployeePickerOpen(false);
    setEmployeeFieldLocked(!!employee?.id);
    setLockedEmployeeInfo(
      employee?.id
        ? { id: employee.id, name: employee.name, status: employee.status }
        : null,
    );
    setAssignmentDialogOpen(true);
  };

  const openEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      employee_id: assignment?.employee?.id
        ? String(assignment.employee.id)
        : assignment?.employee_id
          ? String(assignment.employee_id)
          : "",
      department_id: assignment?.department?.id
        ? String(assignment.department.id)
        : assignment?.department_id
          ? String(assignment.department_id)
          : "",
      group_id: assignment?.group?.id
        ? String(assignment.group.id)
        : assignment?.group_id
          ? String(assignment.group_id)
          : "",
      start_date: assignment?.start_date
        ? assignment.start_date.slice(0, 10)
        : "",
      end_date: assignment?.end_date ? assignment.end_date.slice(0, 10) : "",
      sum:
        assignment?.sum === undefined || assignment?.sum === null
          ? ""
          : String(assignment.sum),
    });
    setEmployeePickerQuery("");
    setEmployeePickerOpen(false);
    setEmployeeFieldLocked(true);
    setLockedEmployeeInfo(
      assignment?.employee
        ? {
            id: assignment.employee.id,
            name: assignment.employee.name,
            status: assignment.employee.status,
          }
        : null,
    );
    setAssignmentDialogOpen(true);
  };

  const closeAssignmentDialog = () => {
    setAssignmentDialogOpen(false);
    setEditingAssignment(null);
    setAssignmentForm(emptyAssignmentForm);
    setEmployeePickerQuery("");
    setEmployeePickerOpen(false);
    setEmployeeFieldLocked(false);
    setLockedEmployeeInfo(null);
  };

  const isAssignmentFormValid = () => {
    if (!assignmentForm.employee_id || !assignmentForm.department_id)
      return false;
    if (!assignmentForm.start_date) return false;
    if (
      assignmentForm.end_date &&
      assignmentForm.end_date < assignmentForm.start_date
    )
      return false;
    if (assignmentForm.sum === "" || Number.isNaN(Number(assignmentForm.sum)))
      return false;
    return true;
  };

  const handleAssignmentSubmit = async () => {
    if (!isAssignmentFormValid()) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Barcha majburiy maydonlarni to'g'ri to'ldiring",
      });
      return;
    }

    setSavingAssignment(true);
    try {
      const payload = {
        employee_id: Number(assignmentForm.employee_id),
        department_id: Number(assignmentForm.department_id),
        group_id: assignmentForm.group_id
          ? Number(assignmentForm.group_id)
          : null,
        start_date: assignmentForm.start_date,
        end_date: assignmentForm.end_date || null,
        sum: Number(assignmentForm.sum),
      };

      if (editingAssignment) {
        await api.patch(`/ceo/employeeSums/${editingAssignment.id}`, payload);
      } else {
        await api.post("/ceo/employeeSums", payload);
      }

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar saqlandi",
      });
      closeAssignmentDialog();
      fetchAssignments();
      getData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: err?.response?.data?.message || "Ma'lumotlar saqlanmadi",
      });
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    localStorage.setItem(
      "departmentViewSortConfig",
      JSON.stringify(newSortConfig),
    );
  };

  const getSortedData = () => {
    if (!data?.items) return [];

    const sorted = [...data.items].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "employee":
          aValue = a?.employee?.name || "";
          bValue = b?.employee?.name || "";
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "per_minute_sum":
          aValue = Number(a?.per_minute_sum) || 0;
          bValue = Number(b?.per_minute_sum) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "total_minutes":
          aValue = Number(a?.total_minutes) || 0;
          bValue = Number(b?.total_minutes) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "total_amount":
          aValue = Number(a?.total_amount) || 0;
          bValue = Number(b?.total_amount) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "possible_minutes":
          aValue = Number(a?.possible_minutes) || 0;
          bValue = Number(b?.possible_minutes) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "possible_amount":
          aValue = Number(a?.possible_amount) || 0;
          bValue = Number(b?.possible_amount) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        default:
          return 0;
      }
    });

    return sorted;
  };

  const getDisplayedData = () => {
    const sorted = getSortedData();
    let filtered = sorted;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = sorted.filter((item) =>
        item?.employee?.name?.toLowerCase().includes(query),
      );
    }

    if (groupFilter && groupFilter !== "all") {
      filtered = filtered.filter(
        (item) => item?.employee?.group?.name === groupFilter,
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (item) => (item?.employee?.status || "working") === statusFilter,
      );
    }

    if (hideZeroPerMinute) {
      filtered = filtered.filter(
        (item) => (Number(item?.per_minute_sum) || 0) !== 0,
      );
    }

    return filtered;
  };

  const getUniqueGroups = () => {
    if (!data?.items) return [];
    const groups = new Set();
    data.items.forEach((item) => {
      if (item?.employee?.group?.name) {
        groups.add(item.employee.group.name);
      }
    });
    return Array.from(groups).sort();
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

  const sortedAssignments = useMemo(() => {
    const sorted = [...assignments].sort((a, b) => {
      const aName = a?.employee?.name || "";
      const bName = b?.employee?.name || "";
      return aName.localeCompare(bName);
    });

    const query = assignmentSearchQuery.trim().toLowerCase();
    if (!query) return sorted;

    return sorted.filter((assignment) => {
      const employeeName = assignment?.employee?.name?.toLowerCase() || "";
      const departmentName = assignment?.department?.name?.toLowerCase() || "";
      const groupName = assignment?.group?.name?.toLowerCase() || "";
      return (
        employeeName.includes(query) ||
        departmentName.includes(query) ||
        groupName.includes(query)
      );
    });
  }, [assignments, assignmentSearchQuery]);

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header Section */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {currentDepartment?.name || "Bo'lim ma'lumotlari"}
                </h1>
                <p className="text-xs text-slate-500">
                  Xodimlarning oylik ma'lumotlari
                </p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="h-7 w-7 p-0 hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
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
                  className="w-28 sm:w-auto h-7 text-xs border-0 bg-transparent shadow-none"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="h-7 w-7 p-0 hover:bg-slate-200 transition-colors"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments (employeeSums) CRUD */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader
            className="p-4 sm:p-6 cursor-pointer select-none"
            onClick={() =>
              setAssignmentsSectionOpen((prev) => {
                const next = !prev;
                localStorage.setItem(
                  "departmentViewAssignmentsOpen",
                  String(next),
                );
                return next;
              })
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {assignmentsSectionOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>Tayinlashlar</span>
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                      {assignments.length}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xodimni bo'lim/guruhga qaysi sanadan qaysi sanagacha va
                    qancha daqiqalik stavka bilan biriktirilganini shu yerda
                    boshqaring
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="text-xs h-8 gap-1 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddAssignment(null);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Yangi tayinlash
              </Button>
            </div>
          </CardHeader>
          {assignmentsSectionOpen && (
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="relative w-full sm:w-72 mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Xodim, bo'lim yoki guruh bo'yicha qidirish..."
                  value={assignmentSearchQuery}
                  onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                  className="pl-10 text-xs h-8"
                />
              </div>
              {assignmentsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-200 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-center py-2 px-2 font-semibold text-slate-700 text-xs border border-slate-200">
                          #
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-700 text-xs border border-slate-200">
                          Xodim
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-700 text-xs border border-slate-200">
                          Bo'lim / Guruh
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-slate-700 text-xs border border-slate-200">
                          Boshlanish
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-slate-700 text-xs border border-slate-200">
                          Tugash
                        </th>
                        <th className="text-right py-2 px-2 font-semibold text-slate-700 text-xs border border-slate-200">
                          Daqiqasiga
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-slate-700 text-xs border border-slate-200">
                          Amallar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAssignments.map((assignment, index) => (
                        <tr
                          key={assignment.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-2 px-2 text-center border border-slate-200">
                            <span className="font-medium text-slate-600 text-xs">
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-2 px-2 border border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-900 text-xs">
                                {assignment?.employee?.name || "-"}
                              </span>
                              <StatusBadge
                                status={assignment?.employee?.status}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2 border border-slate-200">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 text-xs">
                                {assignment?.department?.name || "-"}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {assignment?.group?.name || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center border border-slate-200">
                            <span className="text-slate-700 text-xs">
                              {formatDate(assignment?.start_date)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center border border-slate-200">
                            <span className="text-slate-700 text-xs">
                              {assignment?.end_date
                                ? formatDate(assignment.end_date)
                                : "Hozirgacha"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right border border-slate-200">
                            <span className="font-semibold text-slate-900 text-xs">
                              {assignment?.sum} so'm
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center border border-slate-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => openEditAssignment(assignment)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Tahrirlash
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {sortedAssignments.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Tayinlashlar topilmadi
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
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
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Xodim nomi bo'yicha qidirish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-xs h-8"
                    />
                  </div>
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-full sm:w-48 h-8 text-xs">
                      <SelectValue placeholder="Barcha guruhlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha guruhlar</SelectItem>
                      {getUniqueGroups().map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
                      <SelectValue placeholder="Holati" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha holatlar</SelectItem>
                      <SelectItem value="working">Ishlamoqda</SelectItem>
                      <SelectItem value="kicked">Ishdan ketgan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHideZeroPerMinute((prev) => {
                      const next = !prev;
                      localStorage.setItem(
                        "departmentViewHideZeroPerMinute",
                        String(next),
                      );
                      return next;
                    });
                  }}
                  className="text-xs"
                >
                  {hideZeroPerMinute
                    ? "Daqiqa uchun 0 ni ko'rsatish"
                    : "Daqiqa uchun 0 ni yashirish"}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-slate-200 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-center py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs border border-slate-200">
                        #
                      </th>
                      <th
                        className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("employee")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Xodim</span>
                          {sortConfig.key === "employee" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs border border-slate-200">
                        Guruh / Lavozim
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("per_minute_sum")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Daqiqa uchun</span>
                          {sortConfig.key === "per_minute_sum" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("total_minutes")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Jami daqiqa</span>
                          {sortConfig.key === "total_minutes" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("total_amount")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Topdi</span>
                          {sortConfig.key === "total_amount" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("possible_minutes")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Qolgan daqiqalar</span>
                          {sortConfig.key === "possible_minutes" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("possible_amount")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Topa oladi</span>
                          {sortConfig.key === "possible_amount" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th className="text-center py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs border border-slate-200">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDisplayedData().map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2 px-2 text-center border border-slate-200">
                          <span className="font-medium text-slate-600 text-xs">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2 border border-slate-200">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {item?.employee?.img ? (
                              <img
                                src={item?.employee?.img}
                                alt={item?.employee?.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(item?.employee?.img);
                                  setImageDialogOpen(true);
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                              </div>
                            )}

                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-medium text-slate-900 text-xs">
                                {item?.employee?.name}
                              </span>
                              <StatusBadge
                                status={item?.employee?.status}
                                className="w-fit"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 border border-slate-200">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 text-xs">
                              {item?.employee?.group?.name || "-"}
                            </span>
                            <span className="text-slate-600 text-xs">
                              {item?.employee?.position?.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <span className="font-semibold text-slate-900 text-xs">
                            {item?.per_minute_sum || 0} so'm
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.total_minutes, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div
                            className="flex items-center justify-end gap-1 cursor-pointer"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.total_amount, 0)} so'm
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.possible_minutes, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.possible_amount, 0)} so'm
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center border border-slate-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => openAddAssignment(item?.employee)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Tayinlash
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    {getDisplayedData().length > 0 && (
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                        <td className="py-3 px-2 text-center border border-slate-200">
                          <span className="text-slate-900 text-sm">#</span>
                        </td>
                        <td className="py-3 px-2 border border-slate-200">
                          <span className="text-slate-900 text-sm">Jami</span>
                        </td>
                        <td className="py-3 px-2 border border-slate-200" />
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-slate-900 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.per_minute_sum) || 0),
                                0,
                              ),
                            )}{" "}
                            so'm
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-slate-900 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.total_minutes) || 0),
                                0,
                              ),
                              0,
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-green-600 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.total_amount) || 0),
                                0,
                              ),
                              0,
                            )}{" "}
                            so'm
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-slate-900 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.possible_minutes) || 0),
                                0,
                              ),
                              0,
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-green-600 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.possible_amount) || 0),
                                0,
                              ),
                              0,
                            )}{" "}
                            so'm
                          </span>
                        </td>
                        <td className="py-3 px-2 border border-slate-200" />
                      </tr>
                    )}
                  </tbody>
                </table>

                {getDisplayedData().length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    Xodimlar topilmadi
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment Add/Edit Dialog */}
        <Dialog
          open={assignmentDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeAssignmentDialog();
            else setAssignmentDialogOpen(true);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {editingAssignment
                  ? "Tayinlashni tahrirlash"
                  : "Yangi tayinlash"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <label className="text-xs font-medium text-slate-700">
                  Xodim
                </label>
                {employeeFieldLocked ? (
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 h-9">
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {lockedEmployeeInfo?.name || "-"}
                    </span>
                    <StatusBadge status={lockedEmployeeInfo?.status} />
                  </div>
                ) : (
                  <>
                    <div className="relative mt-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <Input
                        type="text"
                        autoComplete="off"
                        placeholder="Xodimni qidiring..."
                        value={
                          employeePickerOpen
                            ? employeePickerQuery
                            : employees.find(
                                (employee) =>
                                  String(employee.id) ===
                                  assignmentForm.employee_id,
                              )?.name || ""
                        }
                        onFocus={() => {
                          setEmployeePickerQuery("");
                          setEmployeePickerOpen(true);
                        }}
                        onChange={(e) => {
                          setEmployeePickerQuery(e.target.value);
                          setEmployeePickerOpen(true);
                        }}
                        onBlur={() => {
                          // Delay so a click on a dropdown option registers before we close it
                          setTimeout(() => setEmployeePickerOpen(false), 150);
                        }}
                        className="pl-8 text-xs h-9"
                      />
                    </div>

                    {employeePickerOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-slate-200 bg-white shadow-md">
                        {employees.filter((employee) =>
                          employee.name
                            ?.toLowerCase()
                            .includes(employeePickerQuery.trim().toLowerCase()),
                        ).length === 0 ? (
                          <div className="py-3 px-3 text-center text-xs text-slate-500">
                            Xodim topilmadi
                          </div>
                        ) : (
                          employees
                            .filter((employee) =>
                              employee.name
                                ?.toLowerCase()
                                .includes(
                                  employeePickerQuery.trim().toLowerCase(),
                                ),
                            )
                            .map((employee) => (
                              <div
                                key={employee.id}
                                onMouseDown={(e) => {
                                  // Fires before the input's onBlur, so the selection isn't lost
                                  e.preventDefault();
                                  setAssignmentForm((prev) => ({
                                    ...prev,
                                    employee_id: String(employee.id),
                                  }));
                                  setEmployeePickerQuery("");
                                  setEmployeePickerOpen(false);
                                }}
                                className={cn(
                                  "flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50",
                                  String(employee.id) ===
                                    assignmentForm.employee_id && "bg-slate-50",
                                )}
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <Check
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0 text-slate-900",
                                      String(employee.id) ===
                                        assignmentForm.employee_id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span className="truncate">
                                    {employee.name}
                                  </span>
                                </span>
                                <StatusBadge status={employee.status} />
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Bo'lim
                  </label>
                  <Select
                    value={assignmentForm.department_id}
                    onValueChange={(value) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        department_id: value,
                        group_id: "",
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1 text-xs h-9">
                      <SelectValue placeholder="Bo'lim" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentGroups.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Guruh
                  </label>
                  <Select
                    value={assignmentForm.group_id}
                    onValueChange={(value) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        group_id: value,
                      }))
                    }
                    disabled={
                      !assignmentForm.department_id ||
                      groupsForDepartment(assignmentForm.department_id)
                        .length === 0
                    }
                  >
                    <SelectTrigger className="mt-1 text-xs h-9">
                      <SelectValue
                        placeholder={
                          assignmentForm.department_id &&
                          groupsForDepartment(assignmentForm.department_id)
                            .length === 0
                            ? "Bu bo'limda guruh yo'q"
                            : "Guruh (ixtiyoriy)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {groupsForDepartment(assignmentForm.department_id).map(
                        (group) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Boshlanish sanasi
                  </label>
                  <Input
                    type="date"
                    value={assignmentForm.start_date}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="mt-1 text-sm h-9"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Tugash sanasi
                  </label>
                  <Input
                    type="date"
                    value={assignmentForm.end_date}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className="mt-1 text-sm h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Summa (daqiqasiga, so'm)
                </label>
                <Input
                  type="number"
                  value={assignmentForm.sum}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      sum: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAssignmentSubmit();
                    }
                  }}
                  className="mt-1 text-sm"
                  placeholder="Summani kiriting"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeAssignmentDialog}
                  className="text-xs"
                >
                  Bekor qilish
                </Button>
                <Button
                  size="sm"
                  onClick={handleAssignmentSubmit}
                  disabled={savingAssignment}
                  className="text-xs"
                >
                  {savingAssignment && (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                  )}
                  Saqlash
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-sm">Xodim rasmi</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Xodim rasmi"
                  className="max-w-full max-h-[60vh] rounded-lg object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-w-[95vw]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                <span>{selectedEmployee?.employee?.name}</span>
                <StatusBadge status={selectedEmployee?.employee?.status} />
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                Kunlik ish haqi ma'lumotlari
              </p>
            </DialogHeader>
            <div className="overflow-auto max-h-[70vh]">
              <div className="min-w-[600px]">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">
                      Kunlar soni
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {selectedEmployee?.days?.length || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      Jami topdi
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {formatNumber(
                        selectedEmployee?.days?.reduce(
                          (sum, day) => sum + (day?.amount || 0),
                          0,
                        ),
                        0,
                      )}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-purple-600 font-medium mb-1">
                      Jami daqiqa
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {formatNumber(
                        selectedEmployee?.days?.reduce(
                          (sum, day) => sum + (day?.minutes || 0),
                          0,
                        ),
                        0,
                      )}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <p className="text-xs text-orange-600 font-medium mb-1">
                      Daqiqasiga
                    </p>
                    <p className="text-lg font-bold text-orange-900">
                      {selectedEmployee?.per_minute_sum || 0} so'm
                    </p>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                          Sana
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">
                          Topdi
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">
                          Daqiqa
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">
                          Daqiqasiga
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee?.days
                        ?.sort((a, b) => {
                          return new Date(a?.date) - new Date(b?.date);
                        })
                        .map((day, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="font-medium text-slate-900 text-sm">
                                  {formatDate(day?.date)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-semibold text-green-600 text-sm">
                                {formatNumber(day?.amount, 0)} so'm
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="font-semibold text-purple-600 text-sm">
                                  {formatNumber(day?.minutes, 0)}
                                </span>
                                <AlarmClock className="w-4 h-4 text-purple-600" />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-semibold text-orange-600 text-sm">
                                {day?.per_minute_sum} so'm
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {selectedEmployee?.days?.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Ma'lumotlar topilmadi
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DepartmentView;

import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Eye,
  Pencil,
  RotateCcw,
  Search,
  ShieldUser,
  UserLock,
  UserRoundCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import payment_types from "@/lib/paymentTypes";

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Employees = () => {
  const { toast } = useToast();

  // States
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState({
    data: [],
    meta: {
      current_page: [1, 1],
      last_page: [1, 1],
      total: [0, 0],
    },
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department_id: "",
    group_id: "",
    status: "working",
    type: "",
    search: "",
    page: 1,
  });

  const [selectValues, setSelectValues] = useState({
    department_id: "all",
    group_id: "all",
    status: "working",
    type: "",
  });

  const [groups, setGroups] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Setup debounced values
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedDepartment = useDebounce(filters.department_id, 300);
  const debouncedGroup = useDebounce(filters.group_id, 300);
  const debouncedStatus = useDebounce(filters.status, 300);
  const debouncedType = useDebounce(filters.type, 300);

  // Roles section
  const [roles, setRoles] = useState([]);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/ceo/roles");
      setRoles(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Rollarni olishda xatolik",
        variant: "destructive",
      });
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/ceo/departments");
      setDepartments(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Departamentlar ro'yxatini olishda xatolik",
        variant: "destructive",
      });
    }
  };

  // Fetch employees with pagination and filters
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add all non-empty filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "") {
          params.append(key, value);
        }
      });

      const res = await api.get(`/ceo/employees?${params.toString()}`);
      setEmployees(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xodimlar ro'yxatini olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle department change
  const handleDepartmentChange = (value) => {
    const department_id = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, department_id, group_id: "", page: 1 }));

    // Update groups based on selected department
    if (value && value !== "all") {
      const selectedDepartment = departments
        .flatMap((main) => main.departments)
        .find((dept) => dept.id.toString() === value);
      setGroups(selectedDepartment?.groups || []);
    } else {
      setGroups([]);
    }

    // Update select value
    setSelectValues((prev) => ({
      ...prev,
      department_id: value,
      group_id: "all",
    }));
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    const newValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [name]: newValue, page: 1 }));

    // Update select value
    setSelectValues((prev) => ({ ...prev, [name]: value }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      department_id: "",
      group_id: "",
      status: "",
      type: "",
      search: "",
      page: 1,
    });
    setSelectValues({
      department_id: "all",
      group_id: "all",
      status: "all",
      type: "all",
    });
    setGroups([]);
    fetchEmployees();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "working":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Ishlamoqda</Badge>
        );
      case "kicked":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            Ishdan bo'shatilgan
          </Badge>
        );
      case "reserv":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Zaxirada</Badge>
        );
      default:
        return <Badge className="bg-gray-400">{status || "Noma'lum"}</Badge>;
    }
  };

  const getLastPage = () => {
    if (!employees.meta?.last_page) return 1;
    return Array.isArray(employees.meta.last_page)
      ? employees.meta.last_page[0]
      : employees.meta.last_page;
  };

  const getTotalCount = () => {
    if (!employees.meta?.total) return 0;
    return Array.isArray(employees.meta.total)
      ? employees.meta.total[0]
      : employees.meta.total;
  };

  useEffect(() => {
    fetchEmployees();
  }, [
    filters.page,
    debouncedSearch,
    debouncedDepartment,
    debouncedGroup,
    debouncedStatus,
    debouncedType,
  ]);

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
  }, []);

  // Handle payment type change with validation rules
  const handlePaymentTypeChange = (paymentType) => {
    const updatedEmployee = {
      ...selectedEmployee,
      payment_type: paymentType,
    };

    // Apply validation rules based on payment type
    if (paymentType === "piece_work") {
      // piece_work: salary and bonus should be 0
      updatedEmployee.salary = 0;
      updatedEmployee.bonus = 0;
    } else if (["hourly", "daily", "monthly"].includes(paymentType)) {
      // hourly, daily, monthly: bonus should be 0, keep existing salary or set to 0
      updatedEmployee.bonus = 0;
      // Keep existing salary or set to 0 if not set
      if (!updatedEmployee.salary) {
        updatedEmployee.salary = 0;
      }
    }
    // For fixed types, keep all values as user input

    setSelectedEmployee(updatedEmployee);
  };

  // Handle edit submit with proper validation
  const handleEditSubmit = async () => {
    if (!selectedEmployee) return;

    setLoadingEdit(true);
    try {
      const payload = {
        payment_type: selectedEmployee.payment_type,
        type: selectedEmployee.type,
        group_id: employees.data.find((emp) => emp.id === selectedEmployee.id)
          .group?.id,
        department_id: employees.data.find(
          (emp) => emp.id === selectedEmployee.id,
        ).department?.id,
        status: employees.data.find((emp) => emp.id === selectedEmployee.id)
          .status,
      };

      // Apply validation rules for API payload
      if (selectedEmployee.payment_type === "piece_work") {
        payload.salary = 0;
        payload.bonus = 0;
      } else if (
        ["hourly", "daily", "monthly"].includes(selectedEmployee.payment_type)
      ) {
        payload.salary = Number.parseFloat(selectedEmployee.salary) || 0;
        payload.bonus = 0;
      } else {
        // Fixed types - send all values
        payload.salary = Number.parseFloat(selectedEmployee.salary) || 0;
        payload.bonus = Number.parseFloat(selectedEmployee.bonus) || 0;
      }

      await api.patch(`/ceo/employees/${selectedEmployee.id}`, payload);

      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim ma'lumotlari o'zgartirildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1500,
      });

      fetchEmployees();
      handleEditClose();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Xodim ma'lumotlari o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee({
      ...employee,
      salary: employee.salary || 0,
      bonus: employee.bonus || 0,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setSelectedEmployee(null);
    setEditDialogOpen(false);
  };

  // Check if salary input should be disabled
  const isSalaryDisabled = () => {
    return selectedEmployee?.payment_type === "piece_work";
  };

  const handleEditType = async (employee) => {
    if (employee.type === "aup") {
      if (
        !window.confirm(
          "Xodim turini AUP dan Oddiyga o'zgartirishni tasdiqlaysizmi?",
        )
      )
        return;
      await api.patch(`/ceo/employees/${employee.id}`, {
        type: "simple",
        group_id: employee.group?.id,
        department_id: employee.department?.id,
        status: employees.data.find((emp) => emp.id === employee.id).status,
      });
    } else {
      if (
        !window.confirm(
          "Xodim turini Oddiydan AUPga o'zgartirishni tasdiqlaysizmi?",
        )
      )
        return;
      await api.patch(`/ceo/employees/${employee.id}`, {
        type: "aup",
        group_id: employee.group?.id,
        department_id: employee.department?.id,
        status: employees.data.find((emp) => emp.id === employee.id).status,
      });
    }
    fetchEmployees();
  };

  const handleEditTypeChange = (type) => {
    setSelectedEmployee({
      ...selectedEmployee,
      type,
    });
  };

  return (
    <div className="space-y-2">
      <Dialog open={editDialogOpen} onOpenChange={handleEditClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To'lov turi o'zgartirish</DialogTitle>
            <DialogDescription>
              To'lov turi o'zgartirish uchun ma'lumotlarni kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Xodim turi</label>
              <Select
                value={selectedEmployee?.type}
                onValueChange={handleEditTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Xodim turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Oddiy</SelectItem>
                  <SelectItem value="aup">AUP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To'lov turi</label>
              <Select
                value={selectedEmployee?.payment_type}
                onValueChange={handlePaymentTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="To'lov turi" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(payment_types).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                To'lov miqdori (
                {parseFloat(selectedEmployee?.salary)?.toLocaleString("ru-RU")})
                {isSalaryDisabled() && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Ishbay uchun avtomatik 0)
                  </span>
                )}
              </label>
              <Input
                type="number"
                placeholder="To'lov miqdori"
                value={selectedEmployee?.salary || ""}
                onChange={(e) =>
                  setSelectedEmployee({
                    ...selectedEmployee,
                    salary: e.target.value,
                  })
                }
                disabled={isSalaryDisabled()}
                className={isSalaryDisabled() ? "bg-gray-100" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditClose}>
              Yopish
            </Button>
            <Button onClick={handleEditSubmit} disabled={loadingEdit}>
              {loadingEdit ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex items-center gap-2 w-full flex-wrap md:flex-nowrap">
        <Select
          value={selectValues.department_id}
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Bo'limni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha bo'limlar</SelectItem>
            {departments.flatMap((main) =>
              main.departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              )),
            )}
          </SelectContent>
        </Select>

        <Select
          value={selectValues.group_id}
          onValueChange={(value) => handleFilterChange("group_id", value)}
          disabled={groups.length === 0}
        >
          <SelectTrigger className="bg-white w-full">
            <SelectValue placeholder="Guruhni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha guruhlar</SelectItem>
            {groups
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          value={selectValues.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Holatni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="working">Ishlamoqda</SelectItem>
            <SelectItem value="kicked">Ishdan bo'shatilgan</SelectItem>
            <SelectItem value="reserv">Zaxirada</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectValues.type}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Turi tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            <SelectItem value="aup">AUP</SelectItem>
            <SelectItem value="simple">Oddiy</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Ism, id yoki username"
            className="pl-8 bg-white w-full"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
        <Button variant="ghost" onClick={resetFilters} className="text-sm">
          <RotateCcw />
        </Button>
      </div>

      <div className="flex justify-between gap-2 mt-2">
        {/* Page info */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 text-center">
            Jami:{" "}
            <span className="text-black font-medium">{getTotalCount()}</span> ta
            xodim
          </div>
        </div>
      </div>

      <Table className="bg-white border p-2 mb-2 whitespace-nowrap text-xs shadow-md">
        <TableHeader>
          <TableRow>
            <TableHead className="border text-center">#</TableHead>
            <TableHead className="border">F.I.O</TableHead>
            <TableHead className="border">Bo'lim</TableHead>
            <TableHead className="border">Lavozimi</TableHead>
            <TableHead className="border">To'lov turi</TableHead>
            <TableHead className="border">Maosh</TableHead>
            <TableHead className="border">Dastur</TableHead>
            <TableHead className="border">Holati</TableHead>
            <TableHead className="border">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-10">
                Ma'lumotlar yuklanmoqda...
              </TableCell>
            </TableRow>
          ) : !employees.data || employees.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-10">
                Xodimlar topilmadi
              </TableCell>
            </TableRow>
          ) : (
            employees.data.map((employee, index) => (
              <TableRow key={employee.id}>
                <TableCell className="border text-center">
                  {index + 1}
                </TableCell>
                <TableCell className="border">
                  <div className="flex items-center gap-2 min-w-[200px] max-w-[250px] text-xs">
                    {employee.img ? (
                      <img
                        src={employee.img}
                        alt="-"
                        className="h-8 w-8 rounded-full object-cover cursor-pointer shrink-0"
                        onClick={() => {
                          setSelectedImage(employee.img);
                          setImageDialogOpen(true);
                        }}
                      />
                    ) : null}
                    <div className="flex flex-col overflow-hidden">
                      {/* Desktop Tooltip */}
                      <div className="block">
                        <div className="truncate flex flex-col">
                          <div>{employee.name}</div>
                          <div>
                            Id:{" "}
                            <span className="font-semibold">{employee.id}</span>{" "}
                            Username: {employee.user?.username}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="border">
                  <div className="flex flex-col text-xs">
                    <div>{employee.department?.name || "-"}</div>
                    <div>{employee.group?.name || "-"}</div>
                  </div>
                </TableCell>
                <TableCell className="border">
                  <div className="text-xs">{employee.position || "-"}</div>
                </TableCell>
                <TableCell className="border">
                  {payment_types[employee.payment_type]}
                </TableCell>
                <TableCell className="border">
                  {Number.parseFloat(employee?.salary || 0)?.toLocaleString(
                    "ru-RU",
                  )}
                </TableCell>
                <TableCell className="border">
                  <div className="flex flex-col">
                    {employee?.user?.roles?.map((role, index) => (
                      <div key={index}>{role?.description}</div>
                    )) || "-"}
                  </div>
                </TableCell>
                <TableCell className="border">
                  {getStatusBadge(employee.status)}
                </TableCell>
                <TableCell className="border">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/ceo/salary/${employee.id}`} target="_blank">
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(employee)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {employee?.type === "aup" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditType(employee)}
                    >
                      <UserRoundCheck className="h-4 w-4 text-orange-500" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditType(employee)}
                    >
                      <UserLock className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Dastur belgilash"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setRoleDialogOpen(true);
                    }}
                  >
                    <ShieldUser className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {!loading && getLastPage() > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                className={
                  filters.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from({ length: getLastPage() }, (_, i) => i + 1).map(
              (page) => {
                // Show first and last page always
                // Show pages around current page
                const showPage =
                  page === 1 ||
                  page === getLastPage() ||
                  Math.abs(page - filters.page) <= 1;

                if (showPage) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === filters.page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (page === 2 && filters.page > 3) ||
                  (page === getLastPage() - 1 &&
                    filters.page < getLastPage() - 2)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <span className="px-3 py-2">...</span>
                    </PaginationItem>
                  );
                }

                return null;
              },
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(Math.min(getLastPage(), filters.page + 1))
                }
                className={
                  filters.page >= getLastPage()
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        image={selectedImage}
      />

      {/* Role Dialog */}
      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        employee={selectedEmployee}
        roles={roles}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};

const ImageDialog = ({ open, onOpenChange, image }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center">
          {image && (
            <img src={image} alt="" className="w-full h-auto max-h-[90vh]" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RoleDialog = ({ open, onOpenChange, employee, roles, onSuccess }) => {
  const { toast } = useToast();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (employee?.user?.roles) {
      setSelectedRoleIds(employee.user.roles.map((r) => r.id));
    }
  }, [employee]);

  const handleToggleRole = (roleId) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSave = async () => {
    if (!employee?.user_id) return;

    setLoading(true);
    try {
      await api.post("ceo/userRoles/sync", {
        user_id: employee.user_id,
        role_ids: selectedRoleIds,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Dasturlar belgilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1500,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Dasturlarni belgilashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles?.filter((role) =>
    role.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldUser className="h-5 w-5" />
            Dastur belgilash
          </DialogTitle>
          <DialogDescription>
            Xodim uchun kirish huquqi bo'ladigan dasturlarni tanlang
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Employee Info Card */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            {employee?.img ? (
              <img
                src={employee.img}
                alt={employee.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-semibold shadow-sm">
                {employee?.name?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {employee?.name}
              </h3>
              <p className="text-sm text-gray-600">
                {employee?.position || "Lavozim ko'rsatilmagan"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  ID: {employee?.id}
                </Badge>
                {employee?.user?.username && (
                  <Badge variant="outline" className="text-xs">
                    @{employee.user.username}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Dastur qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Tanlangan:{" "}
              <span className="font-semibold text-gray-900">
                {selectedRoleIds.length}
              </span>{" "}
              ta
            </span>
            {selectedRoleIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRoleIds([])}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Hammasini bekor qilish
              </Button>
            )}
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {filteredRoles?.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                <ShieldUser className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Dasturlar topilmadi</p>
              </div>
            ) : (
              filteredRoles?.map((role) => {
                const isRoleSelected = selectedRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => handleToggleRole(role.id)}
                    className={`
                      relative p-4 rounded-lg border-2 text-left transition-all duration-200
                      ${
                        isRoleSelected
                          ? "border-blue-500 bg-blue-50 hover:bg-blue-100"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {role.description}
                        </p>
                      </div>
                      <div
                        className={`
                        h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors
                        ${
                          isRoleSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }
                      `}
                      >
                        {isRoleSelected && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Yopish
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || selectedRoleIds.length === 0}
            className="min-w-[100px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saqlanmoqda...
              </span>
            ) : (
              "Saqlash"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Employees;

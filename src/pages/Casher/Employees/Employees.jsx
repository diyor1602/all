"use client";

import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
    type: "aup",
    search: "",
    page: 1,
  });

  // SelectItem qiymatlari uchun useState
  const [selectValues, setSelectValues] = useState({
    department_id: "all",
    group_id: "all",
    status: "working",
    type: "aup",
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

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/casher/departments");
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

      const res = await api.get(`/casher/employees?${params.toString()}`);
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

  // Initial data load
  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  // Fetch employees when page changes
  useEffect(() => {
    fetchEmployees();
  }, [filters.page]);

  // Fetch employees when debounced values change
  useEffect(() => {
    fetchEmployees();
  }, [
    debouncedSearch,
    debouncedDepartment,
    debouncedGroup,
    debouncedStatus,
    debouncedType,
  ]);

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

      await api.patch(`/casher/employees/${selectedEmployee.id}`, payload);

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

  // Check if bonus input should be disabled
  const isBonusDisabled = () => {
    return (
      selectedEmployee?.payment_type === "piece_work" ||
      ["hourly", "daily", "monthly"].includes(selectedEmployee?.payment_type)
    );
  };

  const handleEditType = async (employee) => {
    if (employee.type === "aup") {
      if (
        !window.confirm(
          "Xodim turini AUP dan Oddiyga o'zgartirishni tasdiqlaysizmi?"
        )
      )
        return;
      await api.patch(`/casher/employees/${employee.id}`, { type: "simple" });
    } else {
      if (
        !window.confirm(
          "Xodim turini Oddiydan AUPga o'zgartirishni tasdiqlaysizmi?"
        )
      )
        return;
      await api.patch(`/casher/employees/${employee.id}`, { type: "aup" });
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

            <div className="space-y-2">
              <label className="text-sm font-medium">
                KPI (
                {parseFloat(selectedEmployee?.bonus)?.toLocaleString("ru-RU")})
                {isBonusDisabled() && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Ushbu tur uchun avtomatik 0)
                  </span>
                )}
              </label>
              <Input
                type="number"
                placeholder="KPI"
                value={selectedEmployee?.bonus || ""}
                onChange={(e) =>
                  setSelectedEmployee({
                    ...selectedEmployee,
                    bonus: e.target.value,
                  })
                }
                disabled={isBonusDisabled()}
                className={isBonusDisabled() ? "bg-gray-100" : ""}
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
              ))
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
            <TableHead className="border">KPI</TableHead>
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
                        src={employee.img || "/placeholder.svg"}
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
                  <div className="flex flex-col text-xs">
                    <div>{employee.position || "-"}</div>
                    <div>{employee.user?.role?.description || "-"}</div>
                  </div>
                </TableCell>
                <TableCell className="border">
                  {payment_types[employee.payment_type]}
                </TableCell>
                <TableCell className="border">
                  {Number.parseFloat(employee?.salary || 0)?.toLocaleString(
                    "ru-RU"
                  )}
                </TableCell>
                <TableCell className="border">
                  {Number.parseFloat(employee?.bonus || 0)?.toLocaleString(
                    "ru-RU"
                  )}
                </TableCell>
                <TableCell className="border">
                  {getStatusBadge(employee.status)}
                </TableCell>
                <TableCell className="border">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/casher/salary/${employee.id}`)}
                  >
                    <Eye className="h-4 w-4 text-blue-500" />
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
              }
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
            <img
              src={image || "/placeholder.svg"}
              alt=""
              className="w-full h-auto max-h-[90vh]"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Employees;

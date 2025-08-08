import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
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
  Trash,
  UserPlus,
  Download,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";

const formatPhoneNumber = (phone) => {
  return phone
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
};

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
  const [isExporting, setIsExporting] = useState(false);
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
    search: "",
    page: 1,
    type: "",
  });

  // SelectItem qiymatlari uchun useState
  const [selectValues, setSelectValues] = useState({
    department_id: "all",
    group_id: "all",
    status: "working",
    type: "all",
  });

  const [groups, setGroups] = useState([]);

  // Setup debounced values
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedDepartment = useDebounce(filters.department_id, 300);
  const debouncedGroup = useDebounce(filters.group_id, 300);
  const debouncedStatus = useDebounce(filters.status, 300);
  const debouncedType = useDebounce(filters.type, 300);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/superhr/departments");
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

      const res = await api.get(`/superhr/employees?${params.toString()}`);
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
      type: "all",
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
        return (
          <Badge className="bg-gray-400 hover:bg-gray-500">
            {status || "Noma'lum"}
          </Badge>
        );
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create params without the page parameter
      const params = new URLSearchParams();

      // Add all non-empty filters to params except page
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && key !== "page") {
          params.append(key, value);
        }
      });

      // Make the API call with the response type as blob to handle file download
      const response = await api.get(
        `/superhr/employees/export-excel?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `xodimlar_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xodimlar ro'yxati yuklab olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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

  const handleDelete = async (id) => {
    if (!window.confirm("Xodimni ishdan ketkazishni xohlaysizmi?")) return;
    // ask user to enter a comment
    const comment = prompt("Ketish sababini kiriting:");
    if (!comment) {
      toast({
        title: "Diqqat",
        description: "Sababni kiritish shart",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      await api.patch(`/superhr/employees/${id}`, {
        status: "kicked",
        comment,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim ishdan ketkazildi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 1500,
      });
      fetchEmployees();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xodim ishdan ketkazilmadi",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Xodimni ishga qaytarishni xohlaysizmi?")) return;
    // ask user to enter a comment
    const comment = prompt("Qaytarish sababini kiriting:");
    if (!comment) {
      toast({
        title: "Diqqat",
        description: "Sababni kiritish shart",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      await api.patch(`/superhr/employees/${id}`, {
        status: "working",
        comment,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim ishga qaytdi!",
        style: {
          background: "green",
          color: "white",
        },
        duration: 1500,
      });
      fetchEmployees();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xodim qayta ishlashga o'tkazilmadi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
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
            <SelectValue placeholder="Turini tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha xodimlar</SelectItem>
            <SelectItem value="aup">AUP xodim</SelectItem>
            <SelectItem value="simple">Oddiy xodim</SelectItem>
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
        <Button
          className="text-sm cursor-pointer"
          onClick={() => navigate("/superhr/employees/add")}
        >
          <UserPlus /> Qo'shish
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
        <Button
          className="text-sm bg-green-500 hover:bg-green-600  "
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
        </Button>
      </div>

      <Table className="bg-white border p-2 mb-2 whitespace-nowrap text-xs shadow-md">
        <TableHeader>
          <TableRow>
            <TableHead className="border text-center">#</TableHead>
            <TableHead className="border">F.I.O</TableHead>
            <TableHead className="border">Harakatlar</TableHead>
            <TableHead className="border">Bo'lim</TableHead>
            <TableHead className="border">Lavozimi</TableHead>
            <TableHead className="border">Telefon</TableHead>
            <TableHead className="border">Holati</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10">
                Ma'lumotlar yuklanmoqda...
              </TableCell>
            </TableRow>
          ) : !employees.data || employees.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10">
                Xodimlar topilmadi
              </TableCell>
            </TableRow>
          ) : (
            employees.data.map((employee, index) => (
              <TableRow
                key={employee.id}
                className={
                  employee.attendance_absent_count - employee.holidays_count > 3
                    ? "bg-red-200 hover:bg-red-300"
                    : ""
                }
              >
                <TableCell className="border text-center">
                  {index + 1}
                </TableCell>
                <TableCell className="border">
                  <div className="flex items-center gap-2 min-w-[200px] max-w-[250px] text-xs">
                    {employee.img ? (
                      <img
                        src={employee.img || "/placeholder.svg"}
                        alt="-"
                        className="h-8 w-8 rounded-full object-cover shrink-0"
                        onClick={() => {
                          setSelectedImage(employee.img);
                          setImageDialogOpen(true);
                        }}
                      />
                    ) : null}
                    <div className="flex flex-col overflow-hidden">
                      {/* Desktop Tooltip */}
                      <div className="block">
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div className="truncate cursor-pointer flex flex-col">
                                <div>{employee.name}</div>
                                <div>
                                  Id:{" "}
                                  <span className="font-semibold">
                                    {employee.id}
                                  </span>{" "}
                                  Username: {employee.user.username}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{employee.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right border">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/superhr/employees/view/${employee.id}`}
                      target="_blank"
                    >
                      <Eye
                        size={16}
                        className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-all duration-200 cursor-pointer"
                      />
                    </Link>
                    <Link
                      to={`/superhr/employees/edit/${employee.id}`}
                      target="_blank"
                    >
                      <Pencil
                        size={16}
                        className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-all duration-200 cursor-pointer"
                      />
                    </Link>
                    {employee?.status == "kicked" ? (
                      <UserPlus
                        size={16}
                        className="text-green-500 hover:text-green-600 hover:scale-110 transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          handleRestore(employee.id);
                        }}
                      />
                    ) : (
                      <Trash
                        onClick={() => {
                          handleDelete(employee.id);
                        }}
                        size={16}
                        className="text-red-500 hover:text-red-600 hover:scale-110 transition-all duration-200 cursor-pointer"
                      />
                    )}
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
                  +{formatPhoneNumber(employee.phone)}
                </TableCell>
                <TableCell className="border">
                  {getStatusBadge(employee.status)}
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

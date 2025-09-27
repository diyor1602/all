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
import { Eye, RotateCcw, Search, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const LOCAL_STORAGE_KEY = "salary_filters";

const Employees = () => {
  const { toast } = useToast();

  // States
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [employees, setEmployees] = useState({
    data: [],
    meta: {
      current_page: [1, 1],
      last_page: [1, 1],
      total: [0, 0],
    },
  });
  const [loading, setLoading] = useState(false);

  // Load filters from localStorage or use defaults
  const savedFilters = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {
    status: "",
    type: "",
    payment_type: "",
    search: "",
    page: 1,
  };

  const [filters, setFilters] = useState(savedFilters);

  // SelectItem values
  const [selectValues, setSelectValues] = useState(() => ({
    status: savedFilters.status || "all",
    type: savedFilters.type || "all",
    payment_type: savedFilters.payment_type || "all",
  }));

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [pageNumber, setPageNumber] = useState(savedFilters.page || 1);

  // Setup debounced values
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedStatus = useDebounce(filters.status, 300);
  const debouncedType = useDebounce(filters.type, 300);
  const debouncedPaymentType = useDebounce(filters.payment_type, 300);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // Fetch employees with pagination and filters
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "") {
          params.append(key, value);
        }
      });

      const res = await api.get(`/groupMaster/employees?${params.toString()}`);
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

  const handleFilterChange = (name, value) => {
    const newValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [name]: newValue, page: 1 }));
    setSelectValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    setPageNumber(page);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: "",
      type: "",
      payment_type: "",
      search: "",
      page: 1,
    };
    const defaultSelects = {
      status: "all",
      type: "all",
      payment_type: "all",
    };
    setFilters(defaultFilters);
    setSelectValues(defaultSelects);
    localStorage.removeItem(LOCAL_STORAGE_KEY); // clear storage
    fetchEmployees();
  };

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
    debouncedStatus,
    debouncedType,
    debouncedPaymentType,
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

  return (
    <div className="space-y-2">
      {/* Filters */}
      <div className="flex items-center gap-2 w-full flex-wrap md:flex-nowrap">
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
          value={selectValues.payment_type}
          onValueChange={(value) => handleFilterChange("payment_type", value)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="To'lov turi tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha to'lov turlari</SelectItem>
            <SelectItem value="monthly">Oylik</SelectItem>
            <SelectItem value="hourly">Soatlik</SelectItem>
            <SelectItem value="daily">Kunlik</SelectItem>
            <SelectItem value="piece_work">Ishbay</SelectItem>
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
                  <div className="flex flex-col text-xs">
                    <div>{employee.position || "-"}</div>
                    <div>{employee.user?.role?.description || "-"}</div>
                  </div>
                </TableCell>
                <TableCell className="border">
                  {employee.salary_visible
                    ? payment_types[employee.payment_type]
                    : "-"}
                </TableCell>
                <TableCell className="border">
                  {employee.salary_visible
                    ? Number.parseFloat(employee?.salary || 0)?.toLocaleString(
                        "ru-RU"
                      )
                    : "-"}
                </TableCell>
                <TableCell className="border">
                  {getStatusBadge(employee.status)}
                </TableCell>
                <TableCell className="border">
                  <div className="flex items-center gap-2 justify-center">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/groupMaster/employees/view/${employee.id}`}>
                        <Eye className=" text-blue-500" />
                      </Link>
                    </Button>
                  </div>
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

      {/* Get to the page number */}
      <div className="flex items-center gap-2 justify-center">
        <Input
          type="number"
          value={pageNumber}
          onChange={(e) => setPageNumber(parseInt(e.target.value))}
          className="w-24 text-center bg-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handlePageChange(pageNumber);
            }
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handlePageChange(pageNumber)}
        >
          <Zap size={16} className="text-blue-500" />
        </Button>
      </div>

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
            <img src={image} alt="" className="w-full h-auto max-h-[90vh]" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Employees;

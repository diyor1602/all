"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Calendar,
  User,
  MessageSquare,
  Plus,
  Check,
  Palmtree,
} from "lucide-react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

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

const AddHoliday = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [payload, setPayload] = useState({
    employee_id: "",
    start_date: "",
    end_date: "",
    comment: "",
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchEmployees = useCallback(
    async (search) => {
      if (!search || search.length < 3) {
        setEmployees([]);
        return;
      }

      try {
        setIsSearching(true);
        const response = await api.get("/superhr/employees", {
          params: { search, status: "working" },
        });
        setEmployees(response.data.data || []);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Xodimlar ro'yxati olishda xatolik yuz berdi",
        });
        setEmployees([]);
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchEmployees(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchEmployees]);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setPayload((prev) => ({
      ...prev,
      employee_id: employee.id,
    }));
    setSearchTerm(employee.name);
    setShowResults(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length >= 3) {
      setShowResults(true);
    } else {
      setShowResults(false);
      setEmployees([]);
    }

    // Clear selected employee if search term changes
    if (selectedEmployee && e.target.value !== selectedEmployee.name) {
      setSelectedEmployee(null);
      setPayload((prev) => ({ ...prev, employee_id: "" }));
    }
  };

  const handlePayloadChange = (field, value) => {
    setPayload((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddHoliday = async () => {
    // Validation
    if (!payload.employee_id) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimni tanlang",
      });
      return;
    }

    if (!payload.start_date) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Boshlanish sanasini kiriting",
      });
      return;
    }

    if (!payload.end_date) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Tugash sanasini kiriting",
      });
      return;
    }

    if (new Date(payload.start_date) > new Date(payload.end_date)) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Boshlanish sanasi tugash sanasidan oldin bo'lishi kerak",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/superhr/employeeHolidays", payload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Ta'til qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });

      // Reset form
      setPayload({
        employee_id: "",
        start_date: "",
        end_date: "",
        comment: "",
      });
      setSelectedEmployee(null);
      setSearchTerm("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.response.data.message || "Xatolik",
        description: "Ta'til qo'shishda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    payload.employee_id && payload.start_date && payload.end_date;

  return (
    <div className="max-w-4xl mx-auto w-full lg:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <Palmtree className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ta'til qo'shish
        </h1>
        <p className="text-gray-600">
          Xodim uchun yangi ta'til davri belgilang
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Employee Search Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm relative">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-blue-600" />
              Xodim tanlash
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Xodim ismi bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() =>
                      searchTerm.length >= 3 && setShowResults(true)
                    }
                    className="pl-4 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 w-full"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-gray-400" />
                  )}
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {" "}
                {showResults &&
                  employees.length > 0 &&
                  employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <div className="relative">
                        {employee.img && (
                          <img
                            src={employee.img}
                            alt={employee.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {employee.name} #{employee.id}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {employee.position} • {employee.department?.name}
                          {employee.group?.name
                            ? ` • ${employee.group?.name}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {showResults &&
                employees.length === 0 &&
                searchTerm.length >= 3 &&
                !isSearching && (
                  <Card className="z-[60] w-full mt-2 shadow-xl bg-white">
                    <CardContent className="p-6 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Xodim topilmadi</p>
                      <p className="text-sm">
                        Boshqa nom bilan qidirib ko'ring
                      </p>
                    </CardContent>
                  </Card>
                )}
            </div>

            {selectedEmployee && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">
                    Tanlangan xodim
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {selectedEmployee.img && (
                      <img
                        src={selectedEmployee.img}
                        alt={selectedEmployee.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.name} #{selectedEmployee.id}
                    </p>
                    <p className="text-green-700 font-medium">
                      {selectedEmployee.position}
                    </p>
                    <p className="text-green-600 text-sm">
                      {selectedEmployee.department?.name}{" "}
                      {selectedEmployee.group?.name
                        ? `• ${selectedEmployee.group?.name}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holiday Form Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
              Ta'til ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="start_date"
                  className="text-sm font-medium text-gray-700"
                >
                  Boshlanish sanasi *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={payload.start_date}
                  onChange={(e) =>
                    handlePayloadChange("start_date", e.target.value)
                  }
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="end_date"
                  className="text-sm font-medium text-gray-700"
                >
                  Tugash sanasi *
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={payload.end_date}
                  onChange={(e) =>
                    handlePayloadChange("end_date", e.target.value)
                  }
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  min={
                    payload.start_date || new Date().toISOString().split("T")[0]
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="comment"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Izoh (ixtiyoriy)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Ta'til haqida qo'shimcha ma'lumot kiriting..."
                  value={payload.comment}
                  onChange={(e) =>
                    handlePayloadChange("comment", e.target.value)
                  }
                  className="w-full p-3 sm:p-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-full"
                  rows={4}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 mt-4">
              <Button
                onClick={handleAddHoliday}
                disabled={!isFormValid || loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Qo'shilmoqda...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    Ta'til qo'shish
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      {selectedEmployee && payload.start_date && payload.end_date && (
        <Card className="mb-6 w-full overflow-hidden shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ta'til xulosasi
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-gray-700">Xodim:</span>{" "}
                  {selectedEmployee.name}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Lavozim:</span>{" "}
                  {selectedEmployee.position}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Bo'lim:</span>{" "}
                  {selectedEmployee.department?.name}
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-gray-700">Boshlanish:</span>{" "}
                  {new Date(payload.start_date).toLocaleDateString("uz-UZ")}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Tugash:</span>{" "}
                  {new Date(payload.end_date).toLocaleDateString("uz-UZ")}
                </p>
                <p>
                  <span className="font-medium text-gray-700">
                    Davomiyligi:
                  </span>{" "}
                  {Math.ceil(
                    (new Date(payload.end_date) -
                      new Date(payload.start_date)) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{" "}
                  kun
                </p>
              </div>
            </div>
            {payload.comment && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Izoh:</span>{" "}
                  {payload.comment}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddHoliday;

"use client";

import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Search,
  Plus,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Building2,
  User,
} from "lucide-react";

import api from "@/utils/api";

import { statuses } from "@/lib/status";

function formatDateToYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = new Date().toISOString().split("T")[0];
const firstDayOfMonth = formatDateToYYYYMMDD(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
);

const SalaryDetails = () => {
  const params = useParams();
  const id = params?.id;
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [startDate, setStartDate] = useState(
    localStorage.getItem("salaryStartDate") || firstDayOfMonth
  );
  const [endDate, setEndDate] = useState(
    localStorage.getItem("salaryEndDate") || today
  );
  const [orders, setOrders] = useState(
    localStorage.getItem("salaryOrders")?.split(",") || []
  );

  const [orderSearch, setOrderSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const fetchSalary = useCallback(async () => {
    try {
      const { data } = await api.get("/casher/groups", {
        params: {
          department_id: id,
          start_date: startDate,
          end_date: endDate,
          orders: orders?.join(","),
        },
      });
      setData(data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    }
  }, [id, toast, startDate, endDate, orders]);

  const toggleEmployee = useCallback((empId) => {
    setExpandedEmployees((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  }, []);

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const searchOrders = useCallback(
    async (searchTerm) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await api.get("/casher/orders/", {
          params: { search: searchTerm },
        });
        setSearchResults(data);
        setShowSearchResults(true);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Buyurtmalarni qidirishda xatolik yuz berdi",
          variant: "destructive",
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );

  const handleOrderSelect = useCallback(
    (order) => {
      const isAlreadySelected = selectedOrders.some(
        (selected) => selected.id === order.id
      );

      if (!isAlreadySelected) {
        const newSelectedOrders = [
          ...selectedOrders,
          {
            id: order.id,
            name: order.name,
            model_name: order.order_model?.model?.name,
          },
        ];
        setSelectedOrders(newSelectedOrders);
        setOrders(newSelectedOrders.map((o) => o.id));
      }

      setOrderSearch("");
      setShowSearchResults(false);
    },
    [selectedOrders, setOrders]
  );

  const removeOrder = useCallback(
    (orderId) => {
      const newSelectedOrders = selectedOrders.filter(
        (order) => order.id !== orderId
      );
      setSelectedOrders(newSelectedOrders);
      setOrders(newSelectedOrders.map((o) => o.id));
    },
    [selectedOrders, setOrders]
  );

  useEffect(() => {
    fetchSalary();
  }, [fetchSalary]);

  useEffect(() => {
    localStorage.setItem("salaryStartDate", startDate);
    localStorage.setItem("salaryEndDate", endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (data.length > 0) {
      const initialGroups = {};
      const initialEmployees = {};

      data.forEach((group) => {
        const shouldExpandGroup = data.length === 1;
        initialGroups[group.id] = expandedGroups[group.id] ?? shouldExpandGroup;

        group.employees?.forEach((emp) => {
          const shouldExpandEmployee =
            data.length === 1 && group.employees.length === 1;
          initialEmployees[emp.id] =
            expandedEmployees[emp.id] ?? shouldExpandEmployee;
        });
      });

      setExpandedGroups(initialGroups);
      setExpandedEmployees(initialEmployees);
    }
  }, [data]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const totalBalance = data.reduce(
    (sum, group) => sum + Number.parseFloat(group.total_balance || 0),
    0
  );
  const totalEmployees = data.reduce(
    (sum, group) => sum + (group.employees?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Maosh Tafsilotlari
          </h1>
          <p className="text-slate-600">
            Xodimlar maoshi va ish faoliyati haqida batafsil ma'lumot
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Jami Balans
                  </p>
                  <p className="text-2xl font-bold">
                    {totalBalance.toLocaleString("ru-RU")} so'm
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">
                    Jami Xodimlar
                  </p>
                  <p className="text-2xl font-bold">
                    {totalEmployees} ta xodim
                  </p>
                </div>
                <Users className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Guruhlar
                  </p>
                  <p className="text-2xl font-bold">{data.length} ta</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm relative">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Calendar className="h-5 w-5" />
              Filtrlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Boshlanish sanasi
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Tugash sanasi
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Order Search Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-700">
                Buyurtmalar
              </Label>

              {/* Selected Orders */}
              {selectedOrders.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {selectedOrders.map((order) => (
                    <Badge
                      key={order.id}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <span className="text-sm">
                        {order.name}{" "}
                        {order.model_name && `(${order.model_name})`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-red-100 text-red-500"
                        onClick={() => removeOrder(order.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buyurtma qidirish..."
                    value={orderSearch}
                    onChange={(e) => {
                      setOrderSearch(e.target.value);
                      searchOrders(e.target.value);
                    }}
                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border-slate-200 z-50 max-h-60 overflow-y-auto">
                    <CardContent className="p-0">
                      {searchResults.map((order) => {
                        const isSelected = selectedOrders.some(
                          (selected) => selected.id === order.id
                        );
                        return (
                          <div
                            key={order.id}
                            className={`p-4 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                              isSelected ? "bg-blue-50 text-blue-700" : ""
                            }`}
                            onClick={() =>
                              !isSelected && handleOrderSelect(order)
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {order.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {order.order_model?.model?.name} • Miqdor:{" "}
                                  {order.quantity}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Status: {statuses[order.status]?.text} •
                                  Submodellar:{" "}
                                  {order.order_model?.submodels
                                    ?.map((submodel) => submodel.submodel?.name)
                                    .join(", ")}
                                </div>
                              </div>
                              {isSelected ? (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-700"
                                >
                                  Tanlangan
                                </Badge>
                              ) : (
                                <Plus className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {showSearchResults &&
                  searchResults.length === 0 &&
                  orderSearch.trim() &&
                  !isSearching && (
                    <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border-slate-200 z-50">
                      <CardContent className="p-4">
                        <div className="text-sm text-slate-500 text-center">
                          Hech qanday buyurtma topilmadi
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups */}
        <div className="space-y-6">
          {data
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((group) => (
              <Card
                key={group.id ?? "no-group"}
                className="shadow-lg border-0 bg-white/90 backdrop-blur-sm overflow-hidden"
              >
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors bg-gradient-to-r from-slate-50 to-slate-100"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-slate-800">
                          {group.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <span className="text-lg font-semibold text-emerald-600">
                            {Number.parseFloat(
                              group.total_balance
                            ).toLocaleString("ru-RU")}{" "}
                            so'm
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {group.employees?.length || 0} xodim
                      </Badge>
                      {expandedGroups[group.id] ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedGroups[group.id] && (
                  <CardContent className="p-0">
                    <div className="space-y-4 p-6">
                      {group.employees
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((emp, idx) => {
                          const isExpanded = expandedEmployees[emp.id];
                          const salaries = emp?.earning?.salaries || [];
                          const operations = emp?.earning?.operations || [];

                          return (
                            <Card
                              key={idx}
                              className="border border-slate-200 hover:shadow-md transition-shadow"
                            >
                              <CardHeader
                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleEmployee(emp.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                      <User className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg text-slate-800">
                                        {emp.name}
                                      </CardTitle>
                                      <p className="text-sm text-slate-600">
                                        {emp.position}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className="text-lg font-semibold text-emerald-600">
                                        {Number.parseFloat(
                                          emp.balance
                                        ).toLocaleString("ru-RU")}{" "}
                                        so'm
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Balans
                                      </div>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

                              {isExpanded && (
                                <CardContent className="pt-0">
                                  <Separator className="mb-6" />

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Attendance Section */}
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        <h4 className="font-semibold text-slate-800">
                                          Davomat
                                        </h4>
                                      </div>

                                      {salaries.length > 0 ? (
                                        <div className="space-y-3">
                                          {salaries.map((sal, idx) => (
                                            <Card
                                              key={idx}
                                              className="border border-blue-100 bg-blue-50/50"
                                            >
                                              <CardContent className="p-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Sana
                                                    </p>
                                                    <p className="font-medium">
                                                      {sal.date
                                                        ?.split("-")
                                                        .reverse()
                                                        .join(".")}
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Miqdori
                                                    </p>
                                                    <p className="font-medium text-blue-600">
                                                      {Number.parseFloat(
                                                        sal.amount
                                                      ).toLocaleString(
                                                        "ru-RU"
                                                      )}{" "}
                                                      so'm
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Ishlagan soati
                                                    </p>
                                                    <p className="font-medium">
                                                      {sal.worked_hours} soat
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Vaqti
                                                    </p>
                                                    <p className="font-medium">
                                                      {sal.check_in
                                                        ?.split(" ")[1]
                                                        ?.slice(0, 5)}{" "}
                                                      -{" "}
                                                      {sal.check_out
                                                        ?.split(" ")[1]
                                                        ?.slice(0, 5)}
                                                    </p>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      ) : (
                                        <Card className="border border-red-100 bg-red-50/50">
                                          <CardContent className="p-4 text-center">
                                            <p className="text-red-600 font-medium">
                                              Davomat mavjud emas
                                            </p>
                                          </CardContent>
                                        </Card>
                                      )}
                                    </div>

                                    {/* Operations Section */}
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-emerald-600" />
                                        <h4 className="font-semibold text-slate-800">
                                          Ishlar
                                        </h4>
                                      </div>

                                      {operations.length > 0 ? (
                                        <div className="space-y-3">
                                          {operations.map((op, idx) => (
                                            <Card
                                              key={idx}
                                              className="border border-emerald-100 bg-emerald-50/50"
                                            >
                                              <CardContent className="p-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Sana
                                                    </p>
                                                    <p className="font-medium">
                                                      {op.date
                                                        ?.split("-")
                                                        .reverse()
                                                        .join(".")}
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Summa
                                                    </p>
                                                    <p className="font-medium text-emerald-600">
                                                      {Number.parseFloat(
                                                        op.amount_earned
                                                      ).toLocaleString(
                                                        "ru-RU"
                                                      )}{" "}
                                                      so'm
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Ish kodi
                                                    </p>
                                                    <p className="font-medium">
                                                      {op.tarification?.code}
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-slate-600">
                                                      Miqdori
                                                    </p>
                                                    <p className="font-medium">
                                                      {op.quantity}
                                                    </p>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}

                                          {/* Total */}
                                          <Card className="border border-emerald-200 bg-emerald-100">
                                            <CardContent className="p-4">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold text-emerald-800">
                                                  Jami:
                                                </span>
                                                <span className="text-lg font-bold text-emerald-700">
                                                  {operations
                                                    .reduce(
                                                      (acc, op) =>
                                                        acc +
                                                        Number.parseFloat(
                                                          op.amount_earned
                                                        ),
                                                      0
                                                    )
                                                    .toLocaleString(
                                                      "ru-RU"
                                                    )}{" "}
                                                  so'm
                                                </span>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        </div>
                                      ) : (
                                        <Card className="border border-red-100 bg-red-50/50">
                                          <CardContent className="p-4 text-center">
                                            <p className="text-red-600 font-medium">
                                              Ish mavjud emas
                                            </p>
                                          </CardContent>
                                        </Card>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SalaryDetails;

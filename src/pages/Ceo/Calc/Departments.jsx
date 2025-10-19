import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Shirt,
  Box,
  MousePointerClick,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const keywords = ["tikuv", "тикув"];

const pad2 = (n) => String(n).padStart(2, "0");

const formatNumber = (num) => {
  return Number.parseFloat(num).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const Departments = () => {
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [data, setData] = useState([]);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingOrders, setLoadingOrders] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [dialogData, setDialogData] = useState([]);
  const [dialogSubmodel, setDialogSubmodel] = useState(null);
  const [dialogSubmodelData, setDialogSubmodelData] = useState([]);
  const [extraDaysDialogOpen, setExtraDaysDialogOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("salaryMonth") || new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    localStorage.setItem("salaryMonth", selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/ceo/departments");
        const flatDepartments = response.data.flatMap(
          (item) => item.departments || []
        );

        setDepartments(flatDepartments);

        const selectedDept = flatDepartments?.find((dept) =>
          keywords.some((keyword) =>
            dept.name?.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (selectedDept) {
          setSelectedDepartment(String(selectedDept.id));
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description:
            error.response?.data?.message ||
            "Bo'limlarni olishda xatolik yuz berdi!",
        });
      }
    };

    fetchDepartments();
  }, [toast]);

  const fetchData = async () => {
    try {
      const [year, month] = selectedMonth.split("-");
      const yearNum = parseInt(year, 10);
      const monthIndex = parseInt(month, 10) - 1;

      const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();

      const response = await api.get("/ceo/groupsOrders", {
        params: {
          department_id: selectedDepartment,
          start_date: `${selectedMonth}-01`,
          end_date: `${selectedMonth}-${lastDay}`,
        },
      });

      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Bo'limni olishda xatolik yuz berdi!",
      });
    }
  };

  useEffect(() => {
    if (data?.groups) {
      data.groups.forEach((group) => {
        group.orders.forEach((order) => {
          if (!orderDetails[order.order_id] && !loadingOrders[order.order_id]) {
            // mark as loading
            setLoadingOrders((prev) => ({ ...prev, [order.order_id]: true }));

            // fetch individually
            api
              .get(`/ceo/orderSalary/${order.order_id}`)
              .then((res) => {
                setOrderDetails((prev) => ({
                  ...prev,
                  [order.order_id]: res.data,
                }));
              })
              .catch((err) => {
                toast({
                  variant: "destructive",
                  title: "Xatolik!",
                  description:
                    err.response?.data?.message ||
                    "Bo'limni olishda xatolik yuz berdi!",
                  duration: 1200,
                });
              })
              .finally(() => {
                setLoadingOrders((prev) => ({
                  ...prev,
                  [order.order_id]: false,
                }));
              });
          }
        });
      });
    }
  }, [data]);

  useEffect(() => {
    if (!selectedDepartment) return;
    fetchData();
  }, [selectedDepartment, selectedMonth]);

  const calculateGroupTotals = (orders, orderDetails) => {
    let totalAllocated = 0;
    let totalSpent = 0;

    orders.forEach((o) => {
      const details = orderDetails[o.order_id];
      if (details) {
        totalAllocated += details.total_summa || 0;
        totalSpent +=
          (details.tarification_total || 0) +
          (details.salary_total || 0) -
          (details.fixed_with_tarification_total || 0) +
          (details.extra_days_total || 0);
      }
    });

    const difference = totalSpent - totalAllocated;
    const percentage = totalAllocated ? (totalSpent / totalAllocated) * 100 : 0;

    return { totalAllocated, totalSpent, difference, percentage };
  };

  const calculateOverallTotals = (groups, orderDetails) => {
    let totalAllocated = 0;
    let totalSpent = 0;

    groups.forEach((group) => {
      group.orders.forEach((order) => {
        const details = orderDetails[order.order_id];
        if (details) {
          totalAllocated += details.total_summa || 0;
          totalSpent +=
            (details.tarification_total || 0) +
            (details.salary_total || 0) -
            (details.fixed_with_tarification_total || 0);
        }
      });
    });

    const difference = totalSpent - totalAllocated;
    const percentage = totalAllocated ? (totalSpent / totalAllocated) * 100 : 0;

    return { totalAllocated, totalSpent, difference, percentage };
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Bo'limlar Hisoboti
          </h1>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => setSelectedDepartment(value)}
                >
                  <SelectTrigger className="w-64 bg-white border-gray-200">
                    <SelectValue placeholder="Bo'limni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem
                        key={department.id}
                        value={String(department.id)}
                      >
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {data?.groups && data.groups.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <TrendingUp className="h-7 w-7" />
                Umumiy Ko'rsatkichlar
                <Badge
                  variant="secondary"
                  className="ml-auto bg-white/20 text-white border-white/30"
                >
                  {data.groups.reduce(
                    (total, group) => total + group.orders.length,
                    0
                  )}{" "}
                  ta buyurtma
                </Badge>
              </CardTitle>
              {(() => {
                const { totalAllocated, totalSpent, difference, percentage } =
                  calculateOverallTotals(data.groups, orderDetails);
                const isOverBudget = difference > 0;

                return (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <DollarSign className="h-6 w-6 text-blue-200" />
                      <div>
                        <div className="text-xs text-blue-100">
                          Jami ajratilgan
                        </div>
                        <div className="text-xl font-bold text-white">
                          {formatNumber(totalAllocated)} so'm
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <TrendingUp className="h-6 w-6 text-orange-200" />
                      <div>
                        <div className="text-xs text-blue-100">
                          Jami sarflangan
                        </div>
                        <div className="text-xl font-bold text-white">
                          {formatNumber(totalSpent)} so'm
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <TrendingUp
                        className={`h-6 w-6 ${
                          isOverBudget ? "text-red-200" : "text-emerald-200"
                        }`}
                      />
                      <div>
                        <div className="text-xs text-blue-100">Foizda</div>
                        <div
                          className={`text-xl font-bold ${
                            isOverBudget ? "text-red-100" : "text-emerald-100"
                          }`}
                        >
                          {formatNumber(percentage)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <DollarSign
                        className={`h-6 w-6 ${
                          isOverBudget ? "text-red-200" : "text-green-200"
                        }`}
                      />
                      <div>
                        <div className="text-xs text-blue-100">
                          {isOverBudget ? "Ortiqcha" : "Qolgan"}
                        </div>
                        <div
                          className={`text-xl font-bold ${
                            isOverBudget ? "text-red-100" : "text-green-100"
                          }`}
                        >
                          {formatNumber(Math.abs(difference))} so'm
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardHeader>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {data?.groups
          ?.sort((a, b) => a.group_name.localeCompare(b.group_name))
          .map((item, index) => (
            <Card
              key={index}
              className="border-0 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                  {item.group_name}
                  <Badge variant="secondary" className="ml-auto">
                    {item.orders.length} ta buyurtma
                  </Badge>
                </CardTitle>
                {(() => {
                  const { totalAllocated, totalSpent, difference, percentage } =
                    calculateGroupTotals(item.orders, orderDetails);
                  const isOverBudget = difference > 0;

                  return (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-white/50 rounded">
                        <DollarSign className="h-4 w-4 text-indigo-600" />
                        <div>
                          <div className="text-xs text-gray-600">
                            Jami ajratilgan
                          </div>
                          <div className="font-semibold text-indigo-700">
                            {formatNumber(totalAllocated)} so'm
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-white/50 rounded">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="text-xs text-gray-600">
                            Jami sarflangan
                          </div>
                          <div className="font-semibold text-orange-700">
                            {formatNumber(totalSpent)} so'm
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-2 p-2 bg-white/50 rounded`}
                      >
                        <TrendingUp
                          className={`h-4 w-4 ${
                            isOverBudget ? "text-red-600" : "text-emerald-600"
                          }`}
                        />
                        <div>
                          <div className="text-xs text-gray-600">Foizda</div>
                          <div
                            className={`font-semibold ${
                              isOverBudget ? "text-red-700" : "text-emerald-700"
                            }`}
                          >
                            {formatNumber(percentage)}%
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-2 p-2 bg-white/50 rounded`}
                      >
                        <DollarSign
                          className={`h-4 w-4 ${
                            isOverBudget ? "text-red-600" : "text-green-600"
                          }`}
                        />
                        <div>
                          <div className="text-xs text-gray-600">
                            {isOverBudget ? "Ortiqcha" : "Qolgan"}
                          </div>
                          <div
                            className={`font-semibold ${
                              isOverBudget ? "text-red-700" : "text-green-700"
                            }`}
                          >
                            {formatNumber(Math.abs(difference))} so'm
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {item.orders
                    ?.slice() // copy array to avoid mutating
                    .sort((a, b) => {
                      const startA =
                        orderDetails[a.order_id]?.date_range?.split(" — ")[0] ||
                        "";
                      const startB =
                        orderDetails[b.order_id]?.date_range?.split(" — ")[0] ||
                        "";

                      // Convert to Date for comparison
                      return new Date(startA) - new Date(startB);
                    })
                    .map((order) => (
                      <Card
                        key={order.order_id}
                        className="border border-gray-200 hover:border-blue-200 transition-colors"
                      >
                        <CardHeader className="pb-3 relative">
                          <X
                            className="absolute top-3 right-3 h-5 w-5 text-gray-500 cursor-pointer hover:text-red-600"
                            onClick={() => {
                              setData((prev) => ({
                                ...prev,
                                groups: prev.groups.map((g) =>
                                  g.group_name === item.group_name
                                    ? {
                                        ...g,
                                        orders: g.orders.filter(
                                          (o) => o.order_id !== order.order_id
                                        ),
                                      }
                                    : g
                                ),
                              }));
                            }}
                          />
                          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            {order.order_name} /{" "}
                            <span className="text-gray-500">
                              {order.order_id}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {loadingOrders[order.order_id] ? (
                            <div className="flex items-center gap-2 text-blue-600 py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Ma'lumotlar yuklanmoqda...</span>
                            </div>
                          ) : orderDetails[order.order_id] ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Muddat
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-green-500" />
                                    <span className="text-gray-600">
                                      Boshlangan:
                                    </span>
                                    <span className="font-medium">
                                      {orderDetails[order.order_id].date_range
                                        ?.split(" — ")[0]
                                        ?.split("-")
                                        ?.reverse()
                                        ?.join(".")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-blue-500" />
                                    <span className="text-gray-600">
                                      Yakunlangan:
                                    </span>
                                    <span className="font-medium">
                                      {orderDetails[order.order_id].date_range
                                        ?.split(" — ")[1]
                                        ?.split("-")
                                        ?.reverse()
                                        ?.join(".")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Box className="h-3 w-3 text-orange-500" />
                                    <span className="text-gray-600">
                                      Jami miqdori:
                                    </span>
                                    <span className="font-medium">
                                      {
                                        data?.groups
                                          ?.find(
                                            (g) => g.group_id === item.group_id
                                          )
                                          ?.orders?.find(
                                            (o) => o.order_id === order.order_id
                                          )?.total_sewn
                                      }{" "}
                                      /{" "}
                                      {
                                        data?.groups
                                          ?.find(
                                            (g) => g.group_id === item.group_id
                                          )
                                          ?.orders?.find(
                                            (o) => o.order_id === order.order_id
                                          )?.order_quantity
                                      }
                                    </span>
                                  </div>
                                </div>
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                  <Shirt className="h-4 w-4" />
                                  Submodellar
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">
                                      {order.submodels?.map((submodel, i) => (
                                        <div
                                          key={i}
                                          className="bg-gray-100 px-3 py-1 rounded cursor-pointer hover:bg-gray-200 font-medium flex items-center gap-2"
                                          onClick={() => {
                                            setDialogSubmodelData(submodel);
                                            setDialogSubmodel(true);
                                          }}
                                        >
                                          <MousePointerClick className="h-5 w-5" />
                                          {submodel.submodel_name}
                                        </div>
                                      ))}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Moliyaviy Ko'rsatkichlar
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div
                                    className="flex justify-between items-center p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100"
                                    onClick={() => {
                                      setDialogType(
                                        `Ishchilar topgan summa: ${formatNumber(
                                          orderDetails[order.order_id]
                                            .tarification_total
                                        )} so'm`
                                      );
                                      setDialogOpen(true);
                                      setDialogData(
                                        orderDetails[
                                          order.order_id
                                        ].tarification_employees?.filter(
                                          (employee) => employee.salary > 0
                                        )
                                      );
                                    }}
                                  >
                                    <span className="text-gray-600">
                                      Ishchilar topgan:
                                    </span>
                                    <span className="font-semibold text-green-700">
                                      {formatNumber(
                                        orderDetails[order.order_id]
                                          .tarification_total
                                      )}{" "}
                                      so'm
                                    </span>
                                  </div>
                                  <div
                                    className="flex justify-between items-center p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                                    onClick={() => {
                                      setDialogType(
                                        `Oylikchilar topgan summa: ${formatNumber(
                                          orderDetails[order.order_id]
                                            .salary_total
                                        )} so'm`
                                      );
                                      setDialogOpen(true);
                                      setDialogData(
                                        orderDetails[
                                          order.order_id
                                        ].salary_employees?.filter(
                                          (employee) => employee.salary > 0
                                        )
                                      );
                                    }}
                                  >
                                    <span className="text-gray-600">
                                      Oylikchilar topgan:
                                    </span>
                                    <span className="font-semibold text-blue-700">
                                      {formatNumber(
                                        orderDetails[order.order_id]
                                          .salary_total
                                      )}{" "}
                                      so'm
                                    </span>
                                  </div>
                                  <div
                                    className="flex justify-between items-center p-2 bg-purple-50 rounded cursor-pointer hover:bg-purple-100"
                                    onClick={() => {
                                      setDialogType(
                                        `Universallar bosgan summa: ${formatNumber(
                                          orderDetails[order.order_id]
                                            .fixed_with_tarification_total
                                        )} so'm`
                                      );
                                      setDialogOpen(true);
                                      setDialogData(
                                        orderDetails[
                                          order.order_id
                                        ].fixed_with_tarification_employees?.filter(
                                          (employee) => employee.salary > 0
                                        )
                                      );
                                    }}
                                  >
                                    <span className="text-gray-600">
                                      Universallar bosgan:
                                    </span>
                                    <span className="font-semibold text-purple-700">
                                      {formatNumber(
                                        orderDetails[order.order_id]
                                          .fixed_with_tarification_total
                                      )}{" "}
                                      so'm
                                    </span>
                                  </div>
                                  {orderDetails[order.order_id]
                                    .extra_days_total > 0 && (
                                    <div
                                      className="flex justify-between items-center p-2 bg-red-50 rounded cursor-pointer hover:bg-red-100"
                                      onClick={() => {
                                        setDialogType(
                                          `Qo'shimcha kun kelganlar jami: ${formatNumber(
                                            orderDetails[order.order_id]
                                              .extra_days_total
                                          )} so'm`
                                        );
                                        setExtraDaysDialogOpen(true);
                                        setDialogData(
                                          orderDetails[order.order_id]
                                            .extra_days
                                        );
                                      }}
                                    >
                                      <span className="text-gray-600">
                                        Qo'shimcha kun:
                                      </span>
                                      <span className="font-semibold text-red-700">
                                        {formatNumber(
                                          orderDetails[order.order_id]
                                            .extra_days_total
                                        )}{" "}
                                        so'm
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                      <DollarSign className="h-4 w-4 text-indigo-600" />
                                      <span className="text-sm font-medium text-indigo-800">
                                        Jami ajratilgan summa
                                      </span>
                                    </div>
                                    <div className="text-lg font-bold text-indigo-700">
                                      {formatNumber(
                                        orderDetails[order.order_id].total_summa
                                      )}{" "}
                                      so'm
                                    </div>
                                  </div>
                                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                      <TrendingUp className="h-4 w-4 text-orange-600" />
                                      <span className="text-sm font-medium text-orange-800">
                                        Sarflangan
                                      </span>
                                    </div>
                                    <div className="text-lg font-bold text-orange-700">
                                      {formatNumber(
                                        orderDetails[order.order_id]
                                          .tarification_total +
                                          orderDetails[order.order_id]
                                            .salary_total -
                                          orderDetails[order.order_id]
                                            .fixed_with_tarification_total +
                                          orderDetails[order.order_id]
                                            .extra_days_total
                                      )}{" "}
                                      so'm
                                    </div>
                                  </div>

                                  {(() => {
                                    const percentage =
                                      ((orderDetails[order.order_id]
                                        .tarification_total +
                                        orderDetails[order.order_id]
                                          .salary_total -
                                        orderDetails[order.order_id]
                                          .fixed_with_tarification_total +
                                        orderDetails[order.order_id]
                                          .extra_days_total) /
                                        orderDetails[order.order_id]
                                          .total_summa) *
                                      100;
                                    const isOverBudget = percentage > 100;

                                    return (
                                      <div
                                        className={`text-center p-3 rounded-lg ${
                                          isOverBudget
                                            ? "bg-red-50"
                                            : "bg-emerald-50"
                                        }`}
                                      >
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                          <TrendingUp
                                            className={`h-4 w-4 ${
                                              isOverBudget
                                                ? "text-red-600"
                                                : "text-emerald-600"
                                            }`}
                                          />
                                          <span
                                            className={`text-sm font-medium ${
                                              isOverBudget
                                                ? "text-red-800"
                                                : "text-emerald-800"
                                            }`}
                                          >
                                            Foizda
                                          </span>
                                        </div>
                                        <div
                                          className={`text-lg font-bold ${
                                            isOverBudget
                                              ? "text-red-700"
                                              : "text-emerald-700"
                                          }`}
                                        >
                                          {formatNumber(percentage)}%
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {(() => {
                                    const spent =
                                      orderDetails[order.order_id]
                                        .tarification_total +
                                      orderDetails[order.order_id]
                                        .salary_total -
                                      orderDetails[order.order_id]
                                        .fixed_with_tarification_total +
                                      orderDetails[order.order_id]
                                        .extra_days_total;
                                    const total =
                                      orderDetails[order.order_id].total_summa;
                                    const difference = spent - total;
                                    const isOverBudget = difference > 0;

                                    return (
                                      <div
                                        className={`text-center p-3 rounded-lg ${
                                          isOverBudget
                                            ? "bg-red-50"
                                            : "bg-green-50"
                                        }`}
                                      >
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                          <DollarSign
                                            className={`h-4 w-4 ${
                                              isOverBudget
                                                ? "text-red-600"
                                                : "text-green-600"
                                            }`}
                                          />
                                          <span
                                            className={`text-sm font-medium ${
                                              isOverBudget
                                                ? "text-red-800"
                                                : "text-green-800"
                                            }`}
                                          >
                                            {isOverBudget
                                              ? "Ortiqcha"
                                              : "Qolgan"}
                                          </span>
                                        </div>
                                        <div
                                          className={`text-lg font-bold ${
                                            isOverBudget
                                              ? "text-red-700"
                                              : "text-green-700"
                                          }`}
                                        >
                                          {formatNumber(Math.abs(difference))}{" "}
                                          so'm
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 py-4">
                              <AlertCircle className="h-4 w-4" />
                              <span>Ma'lumot mavjud emas</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {dialogData
                  ?.sort((a, b) => b.salary - a.salary)
                  .map((employee, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">
                        {employee.name}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {Number.parseFloat(employee.salary)?.toLocaleString(
                          "ru-RU",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogSubmodel} onOpenChange={setDialogSubmodel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogSubmodelData.submodel_name}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {dialogSubmodelData?.outputs
                  ?.sort((a, b) => {
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    return dateA - dateB;
                  })
                  ?.map((output, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">
                        {output.created_at
                          ?.split("T")[0]
                          ?.split("-")
                          ?.reverse()
                          ?.join(".")}{" "}
                        {output.created_at?.split("T")[1]?.slice(0, 5)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {Number.parseFloat(output.quantity)?.toLocaleString(
                          "ru-RU",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={extraDaysDialogOpen} onOpenChange={setExtraDaysDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto space-y-6">
            {dialogData?.map((groupObj, idx) => {
              const group = Object.values(groupObj)?.[0]; // unwrap the dynamic key
              return (
                <div key={idx}>
                  <h3 className="font-semibold mb-2">
                    📅 Sana: {group.date?.split("-").reverse().join(".")} | 💰
                    Jami:{" "}
                    {Number.parseFloat(group.total || 0).toLocaleString(
                      "ru-RU",
                      {
                        maximumFractionDigits: 0,
                      }
                    )}
                  </h3>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">
                          Xodim
                        </th>
                        <th className="border border-gray-300 p-2 text-right">
                          Oylik
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.employees
                        ?.sort((a, b) => b.salary - a.salary)
                        ?.filter((employee) => employee.salary > 0)
                        .map((employee) => (
                          <tr key={employee.employee_id}>
                            <td className="border border-gray-300 p-2">
                              {employee.name}
                            </td>
                            <td className="border border-gray-300 p-2 text-right">
                              {Number.parseFloat(
                                employee.salary
                              ).toLocaleString("ru-RU", {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;

"use client";

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

function getMonthBounds() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const first = `${y}-${pad2(m + 1)}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const last = `${y}-${pad2(m + 1)}-${pad2(lastDay)}`;

  return { first, last };
}

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

  const { first: defaultStart, last: defaultEnd } = getMonthBounds();

  const [startDate, setStartDate] = useState(
    localStorage.getItem("salaryStartDate") || defaultStart
  );
  const [endDate, setEndDate] = useState(
    localStorage.getItem("salaryEndDate") || defaultEnd
  );

  useEffect(() => {
    localStorage.setItem("salaryStartDate", startDate);
    localStorage.setItem("salaryEndDate", endDate);
  }, [startDate, endDate]);

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
      const response = await api.get("/ceo/groupsOrders", {
        params: {
          department_id: selectedDepartment,
          start_date: startDate,
          end_date: endDate,
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
                console.error(`Error fetching order ${order.order_id}`, err);
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
  }, [selectedDepartment, startDate, endDate]);

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
          (details.fixed_with_tarification_total || 0);
      }
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
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-fit bg-white border-gray-200"
                />
                <span className="text-gray-400">—</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-fit bg-white border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
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
                                        orderDetails[order.order_id]
                                          .tarification_employees
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
                                        orderDetails[order.order_id]
                                          .salary_employees
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
                                        orderDetails[order.order_id]
                                          .fixed_with_tarification_employees
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
                                            .fixed_with_tarification_total
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
                                          .fixed_with_tarification_total) /
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
                                        .fixed_with_tarification_total;
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
                        {parseFloat(employee.salary)?.toLocaleString("ru-RU", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;

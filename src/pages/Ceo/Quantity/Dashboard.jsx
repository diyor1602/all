import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import DepartmetDialog from "./DepartmetDialog";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

const calculateTotalPrice = (order, dollarRate, future) => {
  const quantity = future ? order?.order?.quantity : order?.produced_quantity;
  return order?.order?.price * dollarRate * quantity;
};

const calculateProfit = (order, dollarRate, future) => {
  return (
    calculateTotalPrice(order, dollarRate, future) -
    calculateTotalExpenses(order, future)
  );
};

const calculateTotalExpenses = (order, future) => {
  return future
    ? order?.planned_costs?.department?.details?.reduce(
        (total, cost) => total + cost?.planned_cost,
        0
      ) +
        order?.planned_costs?.expenses?.details?.reduce(
          (total, cost) => total + cost?.planned_cost,
          0
        )
    : order?.department_real_costs?.reduce(
        (total, cost) => total + cost?.cost,
        0
      ) +
        order?.expenses_real_costs?.reduce(
          (total, cost) => total + cost?.real_cost,
          0
        );
};

const formatNumber = (number) => {
  if (!number) return "0";
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });
};

const Dashboard = () => {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return (
      localStorage.getItem("qSelectedMonth") ||
      new Date().toISOString().slice(0, 7)
    );
  });
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expensesCosts, setExpensesCosts] = useState([]);
  const [departmentsWithBudgets, setDepartmentsWithBudgets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [editDepartmentDialogOpen, setEditDepartmentDialogOpen] =
    useState(false);
  const [selectedDepartmentToEdit, setSelectedDepartmentToEdit] =
    useState(null);
  const [budgetType, setBudgetType] = useState("minute_based"); // percentage_based
  const [budgetQuantity, setBudgetQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    localStorage.getItem("qSearchQuery") || ""
  );
  const [dollarRate, setDollarRate] = useState(
    localStorage.getItem("dollarRate") || 0
  );

  useEffect(() => {
    const fetchDollarRate = async () => {
      try {
        const response = await axios.get(
          "https://cbu.uz/uz/arkhiv-kursov-valyut/json/"
        );
        setDollarRate(response.data?.find((item) => item.Ccy === "USD")?.Rate);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Dollar tashkil etishda xatolik",
          variant: "destructive",
        });
      }
    };
    fetchDollarRate();
  }, []);

  useEffect(() => {
    localStorage.setItem("dollarRate", dollarRate);
  }, [dollarRate]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/ceo/departments");
        setDepartments(response.data?.flatMap((item) => item?.departments));
      } catch (error) {
        toast({
          title: "Xatolik",
          description:
            error.response.data.message || "Ma'lumotlar olishda xatolik",
          variant: "destructive",
        });
      }
    };
    fetchDepartments();
  }, []);

  const handleEditDepartment = (department) => {
    setSelectedDepartmentToEdit(department);
    setBudgetType(department?.budget?.type);
    setBudgetQuantity(department?.budget?.quantity);
    setIsNew(department?.budget?.id ? false : true);
    setEditDepartmentDialogOpen(true);
  };

  const handleEditDepartmentSubmit = async () => {
    if (budgetQuantity < 0) {
      toast({
        title: "Diqqat",
        description: "Budjet miqdori 0 dan kichik bo'lmaydi!",
        variant: "destructive",
      });
      return;
    }
    if (!budgetType) {
      toast({
        title: "Diqqat",
        description: "Budjet turi bo'lishi shart!",
        variant: "destructive",
      });
      return;
    }
    if (budgetType === "percentage_based" && budgetQuantity > 100) {
      toast({
        title: "Diqqat",
        description: "Foiz 100 dan kichik bo'lishi shart",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (isNew) {
        await api.post(`/ceo/departmentBudgets`, {
          type: budgetType,
          quantity: budgetQuantity,
          department_id: selectedDepartmentToEdit?.id,
        });
      } else {
        await api.patch(
          `/ceo/departmentBudgets/${selectedDepartmentToEdit?.budget?.id}`,
          {
            type: budgetType,
            quantity: budgetQuantity,
          }
        );
      }

      toast({
        title: "Muvaffaqiyatli",
        description: "Bo'lim muvaffaqiyatli yangilandi",
      });
      fetchDepartmentsWithBudgets();
      fetchData();
      setEditDepartmentDialogOpen(false);
      setSubmitting(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Bo'lim yangilashda xatolik",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ceo/dailyPayments", {
        params: {
          month: selectedMonth,
        },
      });
      setData(response.data);
      // collect all expense_costs into one array
      const allExpenses = response.data.flatMap(
        (item) => item.expenses_real_costs || []
      );

      // remove duplicates by expense_id
      const uniqueExpenses = Array.from(
        new Map(allExpenses.map((exp) => [exp.id, exp])).values()
      );
      setExpensesCosts(uniqueExpenses);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchDepartmentsWithBudgets = async () => {
    try {
      const response = await api.get("/ceo/departmentsWithBudgets");
      setDepartmentsWithBudgets(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
    fetchDepartmentsWithBudgets();
  }, [selectedMonth]);

  const handleDepartmentDialogOpen = (department, order) => {
    setDepartmentDialogOpen(true);
    setSelectedDepartment(department);
    setSelectedOrder(order);
  };

  return (
    <div>
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          localStorage.setItem("qSelectedMonth", e.target.value);
        }}
        className="w-fit bg-white"
        disabled={loading}
      />
      {/* Orders */}
      <div className="mt-6 flex items-center gap-2">
        <Input
          type="text"
          placeholder="Qidirish"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            localStorage.setItem("qSearchQuery", e.target.value);
          }}
          className="w-full bg-white ml-auto"
          disabled={loading}
        />
      </div>
      <div className="mt-2 w-full overflow-auto">
        <table
          className={`w-full whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs ${
            loading ? "opacity-50" : ""
          }`}
        >
          <thead>
            <tr>
              <th className="py-1 px-2 border border-gray-300">№</th>
              <th className="py-1 px-2 border border-gray-300">Buyurtma</th>
              <th className="py-1 px-2 border border-gray-300">Narxi</th>
              <th className="py-1 px-2 border border-gray-300">Daqiqa</th>
              <th className="py-1 px-2 border border-gray-300">Tikilgan</th>
              {departments?.map((department) => (
                <th
                  key={department.id}
                  className="py-1 px-2 border border-gray-300 whitespace-normal"
                >
                  {department.name}
                </th>
              ))}
              {expensesCosts?.map((cost) => (
                <th
                  key={cost.id}
                  className="py-1 px-2 border border-gray-300 whitespace-normal"
                >
                  {cost.name}
                </th>
              ))}
              <th className="py-1 px-2 border border-gray-300">Jami topildi</th>
              <th className="py-1 px-2 border border-gray-300">Jami xarajat</th>
              <th className="py-1 px-2 border border-gray-300">Rentabillik</th>
              <th className="py-1 px-2 border border-gray-300">Foizda</th>
            </tr>
          </thead>
          <tbody>
            {data
              ?.filter((order) => {
                return (
                  order?.order?.name?.includes(searchQuery) ||
                  order?.order?.order_model?.submodels
                    ?.map((submodel) => submodel?.submodel?.name)
                    .join(", ")
                    .includes(searchQuery) ||
                  order?.order?.order_model?.submodels
                    ?.map(
                      (submodel) =>
                        submodel?.group?.group?.responsible_user?.employee?.name
                    )
                    .join(", ")
                    .includes(searchQuery)
                );
              })
              ?.sort((a, b) => b?.order?.name.localeCompare(a?.order?.name))
              ?.map((order, index) => (
                <tr key={index} className="text-center">
                  <td className="py-1 px-2 border border-gray-300">
                    {index + 1}
                  </td>
                  <td className="py-1 px-2 border border-gray-300 text-left">
                    {order?.order?.name} <br />
                    {order?.order?.order_model?.submodels
                      ?.map((submodel) => submodel?.submodel?.name)
                      .join(", ")}{" "}
                    <br />
                    <div className="text-gray-500">
                      {order?.order?.order_model?.submodels
                        ?.map(
                          (submodel) =>
                            submodel?.group?.group?.responsible_user?.employee
                              ?.name
                        )
                        .join(", ")}
                    </div>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(order?.order?.price)}$
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(order?.model?.minute)}
                  </td>
                  <td className="py-1 px-2 border border-gray-300 relative overflow-hidden">
                    {/* Background fill based on percentage */}
                    <div
                      className="absolute top-0 left-0 h-full bg-green-200 transition-all duration-300"
                      style={{
                        width: `${
                          ((order?.produced_quantity || 0) /
                            (order?.order?.quantity || 1)) *
                          100
                        }%`,
                      }}
                    ></div>

                    {/* Foreground content */}
                    <div className="relative z-10 text-center">
                      {order?.produced_quantity} / {order?.order?.quantity}
                    </div>
                  </td>
                  {departments?.map((department) => {
                    const realCost =
                      order?.department_real_costs?.find(
                        (cost) => cost?.id === department?.id
                      )?.cost || 0;

                    const plannedCost =
                      order?.planned_costs?.department?.details?.find(
                        (cost) => cost?.id === department?.id
                      )?.planned_cost || 1;

                    const percent = Math.min(
                      (realCost / plannedCost) * 100,
                      100
                    ); // prevent overflow

                    return (
                      <td
                        key={department.id}
                        className="relative overflow-hidden border border-gray-300 text-center text-xs py-1 px-2"
                      >
                        {/* background fill */}
                        <div
                          className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                            percent < 50
                              ? "bg-red-200"
                              : percent < 80
                              ? "bg-yellow-200"
                              : "bg-green-200"
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>

                        {/* Foreground content */}
                        <div className="relative z-10 space-y-1 cursor-pointer">
                          {/* Real cost (clickable) */}
                          <div
                            onClick={() =>
                              handleDepartmentDialogOpen(department, order)
                            }
                            className="font-semibold"
                          >
                            {formatNumber(realCost)}
                          </div>

                          {/* Planned cost */}
                          <div className="text-gray-600">
                            {formatNumber(plannedCost)}
                          </div>

                          {/* Percentage */}
                          <div className="text-gray-700 font-medium">
                            {percent.toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  {expensesCosts?.map((expense) => {
                    const realCost =
                      order?.expenses_real_costs?.find(
                        (cost) => cost.id === expense.id
                      )?.real_cost || 0;

                    const plannedCost =
                      order?.planned_costs?.expenses?.details?.find(
                        (cost) => cost.id === expense.id
                      )?.planned_cost || 1;

                    const percent = Math.min(
                      (realCost / plannedCost) * 100,
                      100
                    );

                    return (
                      <td
                        key={expense.id}
                        className="relative overflow-hidden border border-gray-300 text-center text-xs py-1 px-2"
                      >
                        {/* Background fill */}
                        <div
                          className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                            percent < 50
                              ? "bg-red-200"
                              : percent < 80
                              ? "bg-yellow-200"
                              : "bg-green-200"
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>

                        {/* Foreground content */}
                        <div className="relative z-10 space-y-1 cursor-pointer">
                          {/* Real cost */}
                          <div className="font-semibold text-gray-900">
                            {formatNumber(realCost)}
                          </div>

                          {/* Planned cost */}
                          <div className="text-gray-600">
                            {formatNumber(plannedCost)}
                          </div>

                          {/* Percentage */}
                          <div
                            className={`font-medium ${
                              percent < 50
                                ? "text-red-600"
                                : percent < 80
                                ? "text-yellow-700"
                                : "text-green-700"
                            }`}
                          >
                            {percent.toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="relative overflow-hidden border border-gray-300 text-center text-xs py-1 px-2">
                    {(() => {
                      const produced = order?.produced_quantity || 0;
                      const total = order?.order?.quantity || 1;
                      const percent = Math.min((produced / total) * 100, 100);

                      return (
                        <>
                          {/* Background fill */}
                          <div
                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                              percent < 50
                                ? "bg-red-200"
                                : percent < 80
                                ? "bg-yellow-200"
                                : "bg-green-200"
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>

                          {/* Foreground content */}
                          <div className="relative z-10 space-y-1">
                            <div className="font-semibold text-gray-900">
                              {formatNumber(
                                calculateTotalPrice(order, dollarRate, false)
                              )}
                            </div>
                            <div className="text-gray-600">
                              {formatNumber(
                                calculateTotalPrice(order, dollarRate, true)
                              )}
                            </div>
                            <div
                              className={`font-medium ${
                                percent < 50
                                  ? "text-red-600"
                                  : percent < 80
                                  ? "text-yellow-700"
                                  : "text-green-700"
                              }`}
                            >
                              {percent.toFixed(1)}%
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </td>

                  <td className="py-1 px-2 border border-gray-300">
                    <div className="space-y-1">
                      <div className="font-semibold">
                        {formatNumber(calculateTotalExpenses(order, false))}
                      </div>
                      <div className="text-gray-600">
                        {formatNumber(calculateTotalExpenses(order, true))}
                      </div>
                      <div>
                        {formatNumber(
                          (calculateTotalExpenses(order, false) /
                            calculateTotalExpenses(order, true)) *
                            100
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    <div className="space-y-1">
                      <div
                        className={
                          calculateProfit(order, dollarRate, false) > 0
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {formatNumber(
                          calculateProfit(order, dollarRate, false)
                        )}
                      </div>
                      <div
                        className={
                          calculateProfit(order, dollarRate, true) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatNumber(calculateProfit(order, dollarRate, true))}
                      </div>
                    </div>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    <div className="space-y-1">
                      <div
                        className={
                          calculateProfit(order, dollarRate, false) > 0
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {formatNumber(
                          (calculateProfit(order, dollarRate, false) /
                            calculateTotalPrice(order, dollarRate, false)) *
                            100
                        )}
                      </div>
                      <div
                        className={
                          calculateProfit(order, dollarRate, true) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatNumber(
                          (calculateProfit(order, dollarRate, true) /
                            calculateTotalPrice(order, dollarRate, true)) *
                            100
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Departments */}
      <div className="mt-6">Bo'limlar</div>
      <div className="mt-2 w-full overflow-auto">
        <table
          className={`w-full whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs ${
            loading ? "opacity-50" : ""
          }`}
        >
          <thead>
            <tr>
              <th className="py-1 px-2 border border-gray-300">№</th>
              <th className="py-1 px-2 border border-gray-300">Bo'lim</th>
              <th className="py-1 px-2 border border-gray-300">Odam soni</th>
              <th className="py-1 px-2 border border-gray-300 whitespace-normal">
                Belgilangan ulush
              </th>
              <th className="py-1 px-2 border border-gray-300 whitespace-normal">
                Topgan puli
              </th>
              <th className="py-1 px-2 border border-gray-300 whitespace-normal">
                O'rtacha
              </th>
            </tr>
          </thead>
          <tbody>
            {departmentsWithBudgets
              ?.map((department) => {
                const totalEarned = data
                  ?.filter((order) =>
                    order?.department_real_costs?.find(
                      (cost) => cost?.id === department?.id
                    )
                  )
                  ?.reduce(
                    (total, order) =>
                      total +
                      (order?.department_real_costs?.find(
                        (cost) => cost?.id === department?.id
                      )?.cost || 0),
                    0
                  );

                return { ...department, totalEarned };
              })
              ?.sort((a, b) => b.totalEarned - a.totalEarned)
              .map((department, index) => (
                <tr key={index} className="text-center">
                  <td className="py-1 px-2 border border-gray-300">
                    {index + 1}
                  </td>
                  <td className="py-1 px-2 border border-gray-300 text-left">
                    <Link
                      to={`/ceo/quantity/department-details/${department?.id}`}
                    >
                      {department?.name}
                    </Link>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(
                      department?.employees?.filter(
                        (employee) => parseFloat(employee?.percentage) > 0
                      )?.length
                    )}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    <div
                      className="cursor-pointer"
                      onClick={() => handleEditDepartment(department)}
                    >
                      {formatNumber(department?.budget?.quantity)}{" "}
                      {department?.budget?.type === "minute_based"
                        ? "so'm"
                        : "%"}
                    </div>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    <div
                      onClick={() => handleDepartmentDialogOpen(department)}
                      className="cursor-pointer"
                    >
                      {formatNumber(department?.totalEarned)}
                    </div>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(
                      department?.totalEarned /
                        department?.employees?.filter(
                          (employee) => parseFloat(employee?.percentage) > 0
                        )?.length
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {departmentDialogOpen && (
        <DepartmetDialog
          department={selectedDepartment}
          order={selectedOrder}
          open={departmentDialogOpen}
          setOpen={setDepartmentDialogOpen}
        />
      )}

      <Dialog
        open={editDepartmentDialogOpen}
        onOpenChange={setEditDepartmentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDepartmentToEdit?.name}</DialogTitle>
            <DialogDescription>
              Bo'limga berilgan ulushni tahrirlash
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Ulush"
              value={budgetQuantity}
              onChange={(e) => setBudgetQuantity(e.target.value)}
            />
            <Button
              variant={
                budgetType === "percentage_based" ? "default" : "outline"
              }
              onClick={() => setBudgetType("percentage_based")}
            >
              %
            </Button>
            <Button
              variant={budgetType === "minute_based" ? "default" : "outline"}
              onClick={() => setBudgetType("minute_based")}
            >
              so'm
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditDepartmentDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleEditDepartmentSubmit} disabled={submitting}>
              {submitting ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

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
import { Eye, EyeOff, History } from "lucide-react";

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
        0,
      ) +
        order?.planned_costs?.expenses?.details?.reduce(
          (total, cost) => total + cost?.planned_cost,
          0,
        ) +
        parseFloat(order?.rasxod) * parseFloat(order?.order?.quantity)
    : order?.department_real_costs?.reduce(
        (total, cost) => total + cost?.cost,
        0,
      ) +
        order?.expenses_real_costs?.reduce(
          (total, cost) => total + cost?.real_cost,
          0,
        ) +
        parseFloat(order?.rasxod) * parseFloat(order?.produced_quantity);
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
    localStorage.getItem("qSearchQuery") || "",
  );
  const [dollarRate, setDollarRate] = useState(
    localStorage.getItem("dollarRate") || 0,
  );
  const [visiblePrice, setVisiblePrice] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitValue, setLimitValue] = useState(0);

  const handleLimitSend = async () => {
    setIsEditing(true);
    try {
      await api.get(`/ceo/confirmOrder`, {
        params: {
          order_id: editingOrder?.order?.id,
          rasxod: limitValue,
        },
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Limit o'zgartirildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 2000,
      });
      setEditingOrder(null);
      setIsEditing(false);
      fetchData();
      setLimitDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Limitni o'zgartirib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const fetchDollarRate = async () => {
      try {
        const response = await axios.get(
          "https://cbu.uz/uz/arkhiv-kursov-valyut/json/",
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
          month: selectedMonth,
        });
      } else {
        await api.patch(
          `/ceo/departmentBudgets/${selectedDepartmentToEdit?.budget?.id}`,
          {
            type: budgetType,
            quantity: budgetQuantity,
          },
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
        (item) => item.expenses_real_costs || [],
      );

      // remove duplicates by expense_id
      const uniqueExpenses = Array.from(
        new Map(allExpenses.map((exp) => [exp.id, exp])).values(),
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

  const filteredData = data
    ?.filter((order) => {
      const query = searchQuery.toLowerCase();
      return (
        order?.order?.name?.toLowerCase().includes(query) ||
        order?.order?.order_model?.submodels
          ?.map((submodel) => submodel?.submodel?.name?.toLowerCase())
          .join(", ")
          .includes(query) ||
        order?.order?.order_model?.submodels
          ?.map((submodel) =>
            submodel?.group?.group?.responsible_user?.employee?.name?.toLowerCase(),
          )
          .join(", ")
          .includes(query)
      );
    })
    ?.sort((a, b) => b?.order?.name.localeCompare(a?.order?.name));

  const totalExpenses = filteredData?.reduce(
    (sum, o) => sum + calculateTotalExpenses(o, true),
    0,
  );

  const totalQuantity = filteredData?.reduce(
    (sum, o) => sum + o?.order?.quantity,
    0,
  );

  const totalRevenue = filteredData?.reduce(
    (sum, o) => sum + calculateTotalPrice(o, dollarRate, true),
    0,
  );

  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div>
      <div className="flex items-center gap-2">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVisiblePrice(!visiblePrice)}
        >
          {visiblePrice ? <EyeOff /> : <Eye />}
        </Button>
      </div>
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

      {/* Main Stats */}
      {visiblePrice && (
        <div
          className={`my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all ${
            loading ? "opacity-50" : ""
          }`}
        >
          {/* Total Orders */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm font-medium">
              Buyurtmalar soni
            </div>
            <div className="text-3xl font-semibold mt-2 text-gray-800">
              {filteredData?.length || 0}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {formatNumber(totalQuantity)} dona
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm font-medium">
              Xizmat ko'rsatildi
            </div>
            <div className="text-3xl font-semibold mt-2 text-green-600">
              {formatNumber(totalRevenue)} so'm
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ≈ {formatNumber(totalRevenue / dollarRate)} $
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatNumber(totalRevenue / totalQuantity || 0)} so'm /{" "}
              {formatNumber(totalRevenue / totalQuantity / dollarRate || 0)} $
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm font-medium">
              Jami xarajat
            </div>
            <div className="text-3xl font-semibold mt-2 text-red-600">
              {formatNumber(totalExpenses)} so'm
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ≈ {formatNumber(totalExpenses / dollarRate)} $
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatNumber(totalExpenses / totalQuantity || 0)} so'm /{" "}
              {formatNumber(totalExpenses / totalQuantity / dollarRate || 0)} $
            </div>
          </div>

          {/* Profitability */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm font-medium">Rentabillik</div>
            {(() => {
              const percent =
                totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

              return (
                <>
                  <div
                    className={`text-3xl font-semibold mt-2 ${
                      percent >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatNumber(totalProfit)} so'm
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ≈ {formatNumber(totalProfit / dollarRate)} $
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>{percent.toFixed(1)}%</span>•
                    <span>
                      {formatNumber(totalProfit / totalQuantity)} so'm
                    </span>
                    •
                    <span>
                      {formatNumber(totalProfit / totalQuantity / dollarRate)} $
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

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
              <th className="py-1 px-2 border border-gray-300">Limit</th>
              <th className="py-1 px-2 border border-gray-300">Tikilgan</th>
              {departments
                ?.filter(
                  (department) =>
                    departmentsWithBudgets?.find(
                      (budget) =>
                        budget?.budget?.department_id === department?.id,
                    )?.budget?.quantity > 0,
                )
                ?.map((department) => (
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
                  <div className="space-y-1">
                    <div>{cost.name}</div>
                    <div className="text-xs text-gray-500">
                      {cost.quantity}
                      {cost.type === "percentage_based" ? "%" : ""}
                    </div>
                  </div>
                </th>
              ))}
              <th className="py-1 px-2 border border-gray-300">
                Xizmat ko'rsatildi
              </th>
              <th className="py-1 px-2 border border-gray-300">Jami xarajat</th>
              <th className="py-1 px-2 border border-gray-300">Rentabillik</th>
              <th className="py-1 px-2 border border-gray-300">Foizda</th>
            </tr>
          </thead>
          <tbody>
            {filteredData
              ?.sort((a, b) => b?.order?.name.localeCompare(a?.order?.name))
              ?.map((order, index) => (
                <tr
                  key={index}
                  className={`text-center hover:bg-gray-200 ${
                    index % 2 === 0 ? "bg-gray-100" : ""
                  }`}
                >
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
                              ?.name,
                        )
                        .join(", ")}
                    </div>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {visiblePrice
                      ? `${formatNumber(order?.order?.price)}$`
                      : "-"}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(order?.model?.minute)}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    <div className="space-y-1">
                      <div
                        className="cursor-pointer font-semibold"
                        onClick={() => {
                          setEditingOrder(order);
                          setLimitValue(order?.rasxod);
                          setLimitDialogOpen(true);
                        }}
                      >
                        {formatNumber(order?.rasxod)}
                      </div>
                      <div
                        className={
                          (order?.rasxod * 100) /
                            (order?.order?.price * dollarRate) >
                          33
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {formatNumber(
                          (order?.rasxod * 100) /
                            (order?.order?.price * dollarRate),
                        )}
                        %
                      </div>
                      <div>
                        {formatNumber(order?.rasxod / order?.model?.minute)}
                      </div>
                    </div>
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
                    <div className="relative z-10 text-center space-y-1">
                      <div>
                        {order?.produced_quantity} / {order?.order?.quantity}
                      </div>
                      <div>
                        {formatNumber(
                          parseFloat(order?.rasxod) *
                            parseFloat(order?.order?.quantity),
                        )}
                      </div>
                    </div>
                  </td>
                  {departments
                    ?.filter(
                      (department) =>
                        departmentsWithBudgets?.find(
                          (budget) =>
                            budget?.budget?.department_id === department?.id,
                        )?.budget?.quantity > 0,
                    )
                    ?.map((department) => {
                      const realCost =
                        order?.department_real_costs?.find(
                          (cost) => cost?.id === department?.id,
                        )?.cost || 0;

                      const plannedCost =
                        order?.planned_costs?.department?.details?.find(
                          (cost) => cost?.id === department?.id,
                        )?.planned_cost || 1;

                      const percent = Math.min(
                        (realCost / plannedCost) * 100,
                        100,
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
                              {formatNumber(
                                (plannedCost * 100) /
                                  calculateTotalExpenses(order, true),
                              )}
                              %
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  {expensesCosts?.map((expense) => {
                    const realCost =
                      order?.expenses_real_costs?.find(
                        (cost) => cost.id === expense.id,
                      )?.real_cost || 0;

                    const plannedCost =
                      order?.planned_costs?.expenses?.details?.find(
                        (cost) => cost.id === expense.id,
                      )?.planned_cost || 1;

                    const percent = Math.min(
                      (realCost / plannedCost) * 100,
                      100,
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
                            {formatNumber(
                              (plannedCost * 100) /
                                calculateTotalExpenses(order, true),
                            )}
                            %
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="relative overflow-hidden border border-gray-300 text-center text-xs py-1 px-2">
                    {visiblePrice
                      ? (() => {
                          const produced = order?.produced_quantity || 0;
                          const total = order?.order?.quantity || 1;
                          const percent = Math.min(
                            (produced / total) * 100,
                            100,
                          );

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
                                    calculateTotalPrice(
                                      order,
                                      dollarRate,
                                      false,
                                    ),
                                  )}
                                </div>
                                <div className="text-gray-600">
                                  {formatNumber(
                                    calculateTotalPrice(
                                      order,
                                      dollarRate,
                                      true,
                                    ),
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
                        })()
                      : "-"}
                  </td>

                  <td className="py-1 px-2 border border-gray-300">
                    {visiblePrice ? (
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
                              100,
                          )}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {visiblePrice ? (
                      <div className="space-y-1">
                        <div
                          className={
                            calculateProfit(order, dollarRate, false) > 0
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {formatNumber(
                            calculateProfit(order, dollarRate, false),
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
                            calculateProfit(order, dollarRate, true),
                          )}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {visiblePrice ? (
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
                              100,
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
                              100,
                          )}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-center">
              {/* "Jami" label */}
              <td className="py-1 px-2 border border-gray-300">Jami</td>

              {/* Total count */}
              <td className="py-1 px-2 border border-gray-300">
                {filteredData?.length || 0}
              </td>

              {/* Total Price */}
              <td className="py-1 px-2 border border-gray-300">
                {visiblePrice ? (
                  <>
                    <div className="font-semibold">
                      {formatNumber(
                        filteredData?.reduce(
                          (sum, o) => sum + (o?.order?.price || 0),
                          0,
                        ),
                      )}{" "}
                      $
                    </div>
                    <div className="text-gray-600">
                      {formatNumber(
                        filteredData?.reduce(
                          (sum, o) => sum + (o?.order?.price || 0),
                          0,
                        ) * dollarRate,
                      )}{" "}
                      so'm
                    </div>
                  </>
                ) : (
                  "-"
                )}
              </td>

              {/* Total minutes */}
              <td className="py-1 px-2 border border-gray-300">
                {formatNumber(
                  filteredData?.reduce(
                    (sum, o) => sum + Number(o?.model?.minute),
                    0,
                  ),
                )}{" "}
                <br />
                {formatNumber(
                  filteredData?.reduce(
                    (sum, o) =>
                      sum +
                      Number(o?.model?.minute) * Number(o?.order?.quantity),
                    0,
                  ),
                )}
              </td>

              {/* Total planned costs */}
              <td className="py-1 px-2 border border-gray-300">
                <div className="space-y-1">
                  <div>
                    {formatNumber(
                      filteredData?.reduce(
                        (sum, o) => sum + Number(o?.rasxod || 0),
                        0,
                      ),
                    )}
                  </div>
                  <div
                    className={
                      (filteredData?.reduce(
                        (sum, o) => sum + Number(o?.rasxod || 0),
                        0,
                      ) *
                        100) /
                        (filteredData?.reduce(
                          (sum, o) => sum + Number(o?.order?.price || 0),
                          0,
                        ) *
                          dollarRate) >
                      33
                        ? "text-red-500"
                        : "text-green-500"
                    }
                  >
                    {formatNumber(
                      (filteredData?.reduce(
                        (sum, o) => sum + Number(o?.rasxod || 0),
                        0,
                      ) *
                        100) /
                        (filteredData?.reduce(
                          (sum, o) => sum + Number(o?.order?.price || 0),
                          0,
                        ) *
                          dollarRate),
                    )}
                    %
                  </div>
                  <div>
                    {formatNumber(
                      filteredData?.reduce(
                        (sum, o) => sum + Number(o?.rasxod || 0),
                        0,
                      ) /
                        filteredData?.reduce(
                          (sum, o) => sum + Number(o?.model?.minute || 0),
                          0,
                        ),
                    )}
                  </div>
                </div>
              </td>

              {/* Total Tikilgan */}
              <td className="py-1 px-2 border border-gray-300">
                <div className="space-y-1">
                  <div>
                    {formatNumber(
                      filteredData?.reduce(
                        (sum, o) => sum + Number(o?.produced_quantity || 0),
                        0,
                      ),
                    )}{" "}
                    /{" "}
                    {formatNumber(
                      filteredData?.reduce(
                        (sum, o) => sum + Number(o?.order?.quantity || 0),
                        0,
                      ),
                    )}
                  </div>
                  <div>
                    {formatNumber(
                      filteredData?.reduce(
                        (sum, o) =>
                          sum +
                          Number(
                            parseFloat(o?.rasxod) *
                              parseFloat(o?.order?.quantity),
                          ),
                        0,
                      ),
                    )}
                  </div>
                </div>
              </td>

              {/* Department totals */}
              {departments
                ?.filter(
                  (department) =>
                    departmentsWithBudgets?.find(
                      (budget) =>
                        budget?.budget?.department_id === department?.id,
                    )?.budget?.quantity > 0,
                )
                ?.map((department) => {
                  const real = filteredData?.reduce((sum, o) => {
                    const cost =
                      o?.department_real_costs?.find(
                        (c) => c.id === department.id,
                      )?.cost || 0;
                    return sum + cost;
                  }, 0);

                  const planned = filteredData?.reduce((sum, o) => {
                    const plan =
                      o?.planned_costs?.department?.details?.find(
                        (c) => c.id === department.id,
                      )?.planned_cost || 0;
                    return sum + plan;
                  }, 0);

                  const percent = planned ? (real / planned) * 100 : 0;

                  return (
                    <td
                      key={department.id}
                      className="py-1 px-2 border border-gray-300"
                    >
                      <div className="font-semibold text-gray-900">
                        {formatNumber(real)}
                      </div>
                      <div className="text-gray-600">
                        {formatNumber(planned)}
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
                    </td>
                  );
                })}

              {/* Expense totals */}
              {expensesCosts?.map((expense) => {
                const real = filteredData?.reduce((sum, o) => {
                  const cost =
                    o?.expenses_real_costs?.find((c) => c.id === expense.id)
                      ?.real_cost || 0;
                  return sum + cost;
                }, 0);

                const planned = filteredData?.reduce((sum, o) => {
                  const plan =
                    o?.planned_costs?.expenses?.details?.find(
                      (c) => c.id === expense.id,
                    )?.planned_cost || 0;
                  return sum + plan;
                }, 0);

                const percent = planned ? (real / planned) * 100 : 0;

                return (
                  <td
                    key={expense.id}
                    className="py-1 px-2 border border-gray-300"
                  >
                    <div className="font-semibold text-gray-900">
                      {formatNumber(real)}
                    </div>
                    <div className="text-gray-600">{formatNumber(planned)}</div>
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
                  </td>
                );
              })}

              {/* Jami xizmat ko'rsatildi */}
              <td className="py-1 px-2 border border-gray-300">
                {visiblePrice
                  ? (() => {
                      const real = filteredData?.reduce(
                        (sum, o) =>
                          sum + calculateTotalPrice(o, dollarRate, false),
                        0,
                      );
                      const planned = filteredData?.reduce(
                        (sum, o) =>
                          sum + calculateTotalPrice(o, dollarRate, true),
                        0,
                      );
                      const percent = planned ? (real / planned) * 100 : 0;
                      return (
                        <>
                          <div className="font-semibold text-gray-900">
                            {formatNumber(real)}
                          </div>
                          <div className="text-gray-600">
                            {formatNumber(planned)}
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
                        </>
                      );
                    })()
                  : "-"}
              </td>

              {/* Jami xarajat */}
              <td className="py-1 px-2 border border-gray-300">
                {visiblePrice
                  ? (() => {
                      const real = filteredData?.reduce(
                        (sum, o) => sum + calculateTotalExpenses(o, false),
                        0,
                      );
                      const planned = filteredData?.reduce(
                        (sum, o) => sum + calculateTotalExpenses(o, true),
                        0,
                      );
                      const percent = planned ? (real / planned) * 100 : 0;
                      return (
                        <>
                          <div className="font-semibold text-gray-900">
                            {formatNumber(real)}
                          </div>
                          <div className="text-gray-600">
                            {formatNumber(planned)}
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
                        </>
                      );
                    })()
                  : "-"}
              </td>

              {/* Rentabillik */}
              <td className="py-1 px-2 border border-gray-300">
                {visiblePrice
                  ? (() => {
                      const real = filteredData?.reduce(
                        (sum, o) => sum + calculateProfit(o, dollarRate, false),
                        0,
                      );
                      const planned = filteredData?.reduce(
                        (sum, o) => sum + calculateProfit(o, dollarRate, true),
                        0,
                      );
                      const percent =
                        planned > 0
                          ? (real / planned) * 100
                          : real === 0
                            ? 0
                            : 100;
                      return (
                        <>
                          <div
                            className={`font-semibold ${
                              real >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatNumber(real)}
                          </div>
                          <div
                            className={`text-gray-600 ${
                              planned >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatNumber(planned)}
                          </div>
                        </>
                      );
                    })()
                  : "-"}
              </td>

              {/* Foizda (average %) */}
              <td className="py-1 px-2 border border-gray-300">
                {visiblePrice
                  ? (() => {
                      const totalProfit = filteredData?.reduce(
                        (sum, o) => sum + calculateProfit(o, dollarRate, false),
                        0,
                      );
                      const totalRevenue = filteredData?.reduce(
                        (sum, o) =>
                          sum + calculateTotalPrice(o, dollarRate, false),
                        0,
                      );
                      const totalProfitPlan = filteredData?.reduce(
                        (sum, o) => sum + calculateProfit(o, dollarRate, true),
                        0,
                      );
                      const totalRevenuePlan = filteredData?.reduce(
                        (sum, o) =>
                          sum + calculateTotalPrice(o, dollarRate, true),
                        0,
                      );

                      const realPercent = totalRevenue
                        ? (totalProfit / totalRevenue) * 100
                        : 0;
                      const planPercent = totalRevenuePlan
                        ? (totalProfitPlan / totalRevenuePlan) * 100
                        : 0;

                      return (
                        <>
                          <div
                            className={`font-semibold ${
                              realPercent >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {realPercent.toFixed(1)}%
                          </div>
                          <div
                            className={`text-gray-600 ${
                              planPercent >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {planPercent.toFixed(1)}%
                          </div>
                        </>
                      );
                    })()
                  : "-"}
              </td>
            </tr>
            <tr>
              <th className="py-1 px-2 border border-gray-300">№</th>
              <th className="py-1 px-2 border border-gray-300">Buyurtma</th>
              <th className="py-1 px-2 border border-gray-300">Narxi</th>
              <th className="py-1 px-2 border border-gray-300">Daqiqa</th>
              <th className="py-1 px-2 border border-gray-300">Limit</th>
              <th className="py-1 px-2 border border-gray-300">Tikilgan</th>
              {departments
                ?.filter(
                  (department) =>
                    departmentsWithBudgets?.find(
                      (budget) =>
                        budget?.budget?.department_id === department?.id,
                    )?.budget?.quantity > 0,
                )
                ?.map((department) => (
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
                  <div className="space-y-1">
                    <div>{cost.name}</div>
                    <div className="text-xs text-gray-500">
                      {cost.quantity}
                      {cost.type === "percentage_based" ? "%" : ""}
                    </div>
                  </div>
                </th>
              ))}
              <th className="py-1 px-2 border border-gray-300">
                Xizmat ko'rsatildi
              </th>
              <th className="py-1 px-2 border border-gray-300">Jami xarajat</th>
              <th className="py-1 px-2 border border-gray-300">Rentabillik</th>
              <th className="py-1 px-2 border border-gray-300">Foizda</th>
            </tr>
          </tfoot>
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
              <th className="py-1 px-2 border border-gray-300">Tarix</th>
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
                      (cost) => cost?.id === department?.id,
                    ),
                  )
                  ?.reduce(
                    (total, order) =>
                      total +
                      (order?.department_real_costs?.find(
                        (cost) => cost?.id === department?.id,
                      )?.cost || 0),
                    0,
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
                  <td className="py-1 px-2 border border-gray-300 text-center">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        to={`/ceo/quantity/department-history/${department?.id}`}
                      >
                        <History />
                      </Link>
                    </Button>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(
                      department?.employees?.filter(
                        (employee) => parseFloat(employee?.percentage) > 0,
                      )?.length,
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
                          (employee) => parseFloat(employee?.percentage) > 0,
                        )?.length,
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

      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limitni tasdiqlash</DialogTitle>
            <DialogDescription>
              Buyurtma limiti: {formatNumber(limitValue)} so'm
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              placeholder="Limitni kiriting"
              value={limitValue}
              onKeyDown={(e) => e.key === "Enter" && handleLimitSend()}
              onChange={(e) => setLimitValue(e.target.value)}
            />
            <Button onClick={handleLimitSend} disabled={isEditing}>
              {isEditing ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

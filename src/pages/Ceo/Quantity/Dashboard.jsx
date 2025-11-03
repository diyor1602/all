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

const formatNumber = (number) => {
  if (!number) return "0";
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });
};

const Dashboard = () => {
  const { toast } = useToast();

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
      const response = await api.get("/ceo/dailyPayments");
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
  }, []);

  const handleDepartmentDialogOpen = (department, order) => {
    setDepartmentDialogOpen(true);
    setSelectedDepartment(department);
    setSelectedOrder(order);
  };

  return (
    <div>
      {/* Orders */}
      <div className="mt-6">Buyurtmalar</div>
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
            </tr>
          </thead>
          <tbody>
            {data?.map((order, index) => (
              <tr key={index} className="text-center">
                <td className="py-1 px-2 border border-gray-300">
                  {index + 1}
                </td>
                <td className="py-1 px-2 border border-gray-300">
                  {order?.order?.name}
                </td>
                <td className="py-1 px-2 border border-gray-300">
                  {formatNumber(order?.order?.price)}$
                </td>
                <td className="py-1 px-2 border border-gray-300">
                  {order?.model?.minute}
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

                {departments?.map((department) => (
                  <td
                    key={department.id}
                    className="py-1 px-2 border border-gray-300"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        handleDepartmentDialogOpen(department, order)
                      }
                    >
                      {formatNumber(
                        order?.department_real_costs?.find(
                          (cost) => cost?.id === department?.id
                        )?.cost
                      )}
                    </div>
                  </td>
                ))}
                {expensesCosts?.map((expense) => (
                  <td
                    key={expense.id}
                    className="py-1 px-2 border border-gray-300"
                  >
                    {formatNumber(
                      order?.expenses_real_costs?.find(
                        (cost) => cost.id === expense.id
                      )?.real_cost
                    )}
                  </td>
                ))}
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

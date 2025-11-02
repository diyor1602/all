import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DepartmetDialog from "./DepartmetDialog";

const formatNumber = (number) => {
  if (!number) return "0";
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });
};

const Quantity = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expenses_costs, setExpensesCosts] = useState([]);
  const [departmentsWithBudgets, setDepartmentsWithBudgets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/ceo/dailyPayments");
        setData(response.data);
        // collect all expense_costs into one array
        const allExpenses = response.data.flatMap(
          (item) => item.expenses_costs || []
        );

        // remove duplicates by expense_id
        const uniqueExpenses = Array.from(
          new Map(allExpenses.map((exp) => [exp.expense_id, exp])).values()
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
    fetchData();
    fetchDepartmentsWithBudgets();
  }, []);

  const handleDepartmentDialogOpen = (department, order) => {
    setDepartmentDialogOpen(true);
    setSelectedDepartment(department);
    setSelectedOrder(order);
  };

  if (loading) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div>
      {/* Orders */}
      <div className="mt-6">Buyurtmalar</div>
      <div className="mt-2 w-full overflow-auto">
        <table className="w-full whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs">
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
              {expenses_costs?.map((cost) => (
                <th
                  key={cost.expense_id}
                  className="py-1 px-2 border border-gray-300 whitespace-normal"
                >
                  {cost.expense_name}
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
                <td className="py-1 px-2 border border-gray-300">
                  {order?.produced_quantity}
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
                        order?.department_costs?.find(
                          (cost) => cost?.department_id === department?.id
                        )?.cost
                      )}
                    </div>
                  </td>
                ))}
                {expenses_costs?.map((expense) => (
                  <td
                    key={expense.expense_id}
                    className="py-1 px-2 border border-gray-300"
                  >
                    {formatNumber(
                      order?.expenses_costs?.find(
                        (cost) => cost.expense_id === expense.expense_id
                      )?.cost
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
        <table className="w-full whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs">
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
              ?.sort((a, b) => b?.employee_count - a?.employee_count)
              .map((department, index) => (
                <tr key={index} className="text-center">
                  <td className="py-1 px-2 border border-gray-300">
                    {index + 1}
                  </td>
                  <td className="py-1 px-2 border border-gray-300 text-left">
                    {department?.name}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(
                      department?.employees?.filter(
                        (employee) => parseFloat(employee?.percentage) > 0
                      )?.length
                    )}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(department?.budget?.quantity)}{" "}
                    {department?.budget?.type === "minute_based" ? "so'm" : "%"}
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    <div
                      onClick={() => handleDepartmentDialogOpen(department)}
                      className="cursor-pointer"
                    >
                      {formatNumber(
                        data
                          ?.filter(
                            (order) =>
                              order?.department_costs?.find(
                                (cost) => cost?.department_id === department?.id
                              )?.cost > 0
                          )
                          ?.reduce(
                            (total, order) =>
                              total +
                              order?.department_costs?.find(
                                (cost) => cost?.department_id === department?.id
                              )?.cost,
                            0
                          )
                      )}
                    </div>
                  </td>
                  <td className="py-1 px-2 border border-gray-300">
                    {formatNumber(
                      data
                        ?.filter(
                          (order) =>
                            order?.department_costs?.find(
                              (cost) => cost?.department_id === department?.id
                            )?.cost > 0
                        )
                        ?.reduce(
                          (total, order) =>
                            total +
                            order?.department_costs?.find(
                              (cost) => cost?.department_id === department?.id
                            )?.cost,
                          0
                        ) /
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
    </div>
  );
};

export default Quantity;

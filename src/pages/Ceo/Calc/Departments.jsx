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

const keywords = ["tikuv", "тикув"];

const pad2 = (n) => String(n).padStart(2, "0");

const formatNumber = (num) => {
  return parseFloat(num).toLocaleString("ru-RU", {
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

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={selectedDepartment}
          onValueChange={(value) => setSelectedDepartment(value)}
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Bo'lim" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={String(department.id)}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-fit bg-white"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-fit bg-white"
        />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4">
        {data?.groups
          ?.sort((a, b) => a.group_name.localeCompare(b.group_name))
          .map((item, index) => (
            <div key={index} className="bg-white p-2 rounded shadow">
              <div>{item.group_name}</div>
              <div className="flex flex-col gap-2 mt-4">
                {item.orders.map((order) => (
                  <div key={order.order_id} className="bg-gray-100 p-2 rounded">
                    <div>{order.order_name}</div>
                    <div>
                      {loadingOrders[order.order_id] ? (
                        <span className="text-gray-400">⏳ Yuklanmoqda...</span>
                      ) : orderDetails[order.order_id] ? (
                        <div>
                          <div>
                            Boshlangan sana:{" "}
                            {orderDetails[order.order_id].date_range
                              ?.split(" — ")[0]
                              ?.split("-")
                              ?.reverse()
                              ?.join(".")}
                          </div>
                          <div>
                            Yakunlangan sana:{" "}
                            {orderDetails[order.order_id].date_range
                              ?.split(" — ")[1]
                              ?.split("-")
                              ?.reverse()
                              ?.join(".")}
                          </div>
                          <div>
                            Ischilar topgan summa:{" "}
                            {formatNumber(
                              orderDetails[order.order_id].tarification_total
                            )}
                          </div>
                          <div>
                            Oylikchilar topgan jami summa, Davomati uchun:{" "}
                            {formatNumber(
                              orderDetails[order.order_id].salary_total
                            )}
                          </div>
                          <div>
                            Universallar bosgan summa:{" "}
                            {formatNumber(
                              orderDetails[order.order_id]
                                .fixed_with_tarification_total
                            )}
                          </div>
                          <div>
                            Sarflangan summa:{" "}
                            {formatNumber(
                              orderDetails[order.order_id].tarification_total +
                                orderDetails[order.order_id].salary_total -
                                orderDetails[order.order_id]
                                  .fixed_with_tarification_total
                            )}
                          </div>
                          <div>
                            Jami summa:{" "}
                            {formatNumber(
                              orderDetails[order.order_id].total_summa
                            )}
                          </div>
                          <div>
                            Foizda:{" "}
                            {formatNumber(
                              ((orderDetails[order.order_id]
                                .tarification_total +
                                orderDetails[order.order_id].salary_total -
                                orderDetails[order.order_id]
                                  .fixed_with_tarification_total) /
                                orderDetails[order.order_id].total_summa) *
                                100
                            )}{" "}
                            %
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-500">❌ Ma’lumot yo‘q</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default Departments;

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const Employees = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("selectedMonth") ||
      new Date().toISOString().slice(0, 7)
  );
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem("activeTab") || "orders"
  ); // orders, employees

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/warehouseManager/completeOrders", {
        params: {
          month: selectedMonth,
        },
      });
      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ma'lumotlar olishda xatolik yuz berish mumkin",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  return (
    <div>
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          localStorage.setItem("selectedMonth", e.target.value);
        }}
        className="bg-white w-fit mb-4"
      />
      {loading ? (
        <div className="h-[calc(100vh-100px)] flex items-center justify-center">
          <Loader2 size={40} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {data?.name}
                </h3>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                {data?.budget?.type === "minute_based" ? (
                  <span>{data?.budget?.quantity} so'm daqiqasiga</span>
                ) : (
                  <span>{data?.budget?.quantity}% komissiya</span>
                )}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>{data?.orders?.length} ta buyurtma</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-sky-500 rounded-full mr-3"></div>
                <span>
                  {formatNumber(
                    data?.orders?.reduce(
                      (acc, item) => acc + item?.produced_quantity,
                      0
                    )
                  )}{" "}
                  dona
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full mr-3"></div>
                <span>{formatNumber(data?.totals?.earned)} so'm</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 my-4">
            <Button
              variant={activeTab === "orders" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("orders");
                localStorage.setItem("activeTab", "orders");
              }}
            >
              Buyurtmalar
            </Button>
            <Button
              variant={activeTab === "employees" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("employees");
                localStorage.setItem("activeTab", "employees");
              }}
            >
              Xodimlar
            </Button>
          </div>

          {activeTab === "orders" ? (
            <OrdersTab data={data?.orders} />
          ) : (
            <EmployeesTab data={data?.employees} />
          )}
        </>
      )}
    </div>
  );
};

const OrdersTab = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data?.map((order, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                {order.order?.name}
              </h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {order.order?.id}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Daromad:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatNumber(order.earned_amount)} so'm
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Miqdor:</span>
                <span className="text-sm font-medium text-gray-900">
                  {order.produced_quantity} dona
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const EmployeesTab = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Xodim
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Foiz
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Daromad
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data
              ?.sort((a, b) => b.total_earned_share - a.total_earned_share)
              ?.map((employee, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 max-w-[120px] font-medium text-gray-900 border-r border-gray-100">
                    <div className="break-words">{employee.name}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600 border-r border-gray-100">
                    {employee.percentage}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-semibold border-r border-gray-100">
                    {formatNumber(employee.total_earned_share, 0)} so'm
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

const formatNumber = (number) => {
  if (!number) return "0";
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });
};

const DepartmentHistory = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    return (
      localStorage.getItem("departmentSelectedDay") ||
      new Date().toISOString().slice(0, 10)
    );
  });
  const [departmenDetails, setDepartmenDetails] = useState(null);

  useEffect(() => {
    fetchDepartmenDetails();
  }, [id]);

  const fetchDepartmenDetails = async () => {
    try {
      const response = await api.get(`/ceo/departments/${id}`);
      setDepartmenDetails(response.data);
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
  }, [selectedDay]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ceo/dailyPayments/daily`, {
        params: {
          date: selectedDay,
          department_id: id,
        },
      });
      setData(response.data);
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

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => {
              const date = new Date(selectedDay);
              date.setDate(date.getDate() - 1);
              setSelectedDay(date.toISOString().slice(0, 10));
              localStorage.setItem(
                "departmentSelectedDay",
                date.toISOString().slice(0, 10)
              );
            }}
          >
            <ChevronLeft />
          </Button>
          <Input
            type="date"
            value={selectedDay}
            onChange={(e) => {
              setSelectedDay(e.target.value);
              localStorage.setItem("departmentSelectedDay", e.target.value);
            }}
            disabled={loading}
            className="w-fit bg-white"
          />
          <Button
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => {
              const date = new Date(selectedDay);
              date.setDate(date.getDate() + 1);
              setSelectedDay(date.toISOString().slice(0, 10));
              localStorage.setItem(
                "departmentSelectedDay",
                date.toISOString().slice(0, 10)
              );
            }}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="text-lg font-semibold">{departmenDetails?.name}</div>
      </div>
      <div className="mt-6">
        <div className={`w-full overflow-auto ${loading ? "opacity-50" : ""}`}>
          <table className="bg-white border border-collapse w-full whitespace-nowrap">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">№</th>
                <th className="border border-gray-300 p-2">Xodim</th>
                <th className="border border-gray-300 p-2">Topgan</th>
                <th className="border border-gray-300 p-2">100%</th>
                <th className="border border-gray-300 p-2">Qoldiq</th>
              </tr>
            </thead>
            <tbody>
              {data?.payments
                ?.sort(
                  (a, b) =>
                    b.total_calculated_amount - a.total_calculated_amount
                )
                .map((payment, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {payment?.employee_name}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {formatNumber(payment.total_calculated_amount)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {formatNumber(payment.total_potential_earn)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {formatNumber(
                        payment.total_potential_earn -
                          payment.total_calculated_amount
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentHistory;

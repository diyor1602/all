import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const DepartmentMoney = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [startDate, setStartDate] = useState(
    localStorage.getItem("startDate") || new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    localStorage.getItem("endDate") || new Date().toISOString().split("T")[0],
  );
  const [departments, setDepartments] = useState([]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("departments");
      setDepartments(response.data.flatMap((item) => item.departments));
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    if (!selectedDepartment) return;
    try {
      setLoading(true);
      const response = await api.get("ceo/department-budgets/analytics", {
        params: {
          department_id: selectedDepartment,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDepartment, startDate, endDate]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Select
          value={selectedDepartment?.id}
          onValueChange={setSelectedDepartment}
        >
          <SelectTrigger className="w-fit bg-white">
            <SelectValue placeholder="Bo'limni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department, index) => (
              <SelectItem key={index} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            localStorage.setItem("startDate", e.target.value);
          }}
          className="w-fit bg-white"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            localStorage.setItem("endDate", e.target.value);
          }}
          className="w-fit bg-white"
        />
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-primary" /> Yuklanmoqda
          </div>
        ) : (
          <>
            <div>
              Davomat uchun:{" "}
              {formatNumber(data.salary_summary?.attendance_salary_uzs || 0)}{" "}
              so'm
            </div>
            <div>
              Yangi mavsum uchun:{" "}
              {formatNumber(data.salary_summary?.minute_salary_uzs || 0)} so'm
            </div>
            <div>
              Tarifikatsiya:{" "}
              {formatNumber(data.salary_summary?.tarification_uzs || 0)} so'm
            </div>
            <div>
              Jarima va bonuslar:{" "}
              {formatNumber(data.salary_summary?.money_logs_uzs || 0)} so'm
            </div>
            <div>
              Jami summa:{" "}
              {formatNumber(data.salary_summary?.total_earned_uzs || 0)} so'm
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentMoney;

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Moneys = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("otkSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bo'limlar ro'yxatini olishda xatolik yuz berdi!",
        variant: "destructive",
      });
      setDepartments([]);
    }
  };

  const fetchMoneys = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ceo/monthlyMoneyLogs", {
        params: {
          month: selectedMonth,
          deparment_id: selectedDepartment,
          group_id: selectedGroup,
        },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik yuz berdi!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoneys();
  }, [selectedMonth, selectedDepartment, selectedGroup]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const departmentOptions = (departments || []).flatMap((main) =>
    (main?.departments || []).map((dep) => ({
      id: dep?.id,
      name: dep?.name,
      mainName: main?.name,
      groups: dep?.groups || [],
    })),
  );

  const selectedDepartmentObj = departmentOptions.find(
    (d) => String(d.id) === String(selectedDepartment),
  );
  const groupOptions = selectedDepartmentObj?.groups || [];

  const formatMonthValue = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const changeMonthBy = (delta) => {
    const base = selectedMonth
      ? new Date(
          Number(selectedMonth.split("-")[0]),
          Number(selectedMonth.split("-")[1]) - 1,
          1,
        )
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const next = new Date(base.getFullYear(), base.getMonth() + delta, 1);
    setSelectedMonth(formatMonthValue(next));
  };

  return (
    <div>
      {loading ? (
        <div>Yuklanmoqda...</div>
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMonthBy(-1)}
              >
                <ArrowLeft />
              </Button>
              <Input
                type="month"
                className="w-fit bg-white"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMonthBy(1)}
              >
                <ArrowRight />
              </Button>
            </div>

            <select
              className="h-9 rounded border border-gray-300 bg-white px-2 text-xs"
              value={selectedDepartment}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedDepartment(value);
                setSelectedGroup("");
              }}
            >
              <option value="">Bo'lim (hammasi)</option>
              {departmentOptions.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded border border-gray-300 bg-white px-2 text-xs"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!selectedDepartment}
            >
              <option value="">Guruh (hammasi)</option>
              {groupOptions
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>

          <table className="whitespace-nowrap border-collapse border border-gray-300 text-xs bg-white">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Ism</th>
                <th className="border border-gray-300 p-2">Summa</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">
                    {item?.employee_name}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {formatNumber(item?.grand_total, 0)} so'm
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th className="border border-gray-300 p-2">Jami</th>
                <th className="border border-gray-300 p-2">
                  {formatNumber(
                    data?.data?.reduce(
                      (acc, item) => acc + item?.grand_total,
                      0,
                    ),
                    0,
                  )}{" "}
                  so'm
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default Moneys;

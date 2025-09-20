import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

// === Helpers ===
const getPercentageColor = (percentage) => {
  const value = Number(percentage);
  if (isNaN(value)) return "";
  if (value <= 0) return "";
  if (value < 80) return "text-red-500";
  if (value >= 90) return "";
  return "text-green-500";
};

const formatPercent = (value) =>
  value?.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) ?? "-";

const getDaysBetween = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
};

// === Component ===
const Coefficient = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [filters, setFilters] = useState({
    start_date:
      localStorage.getItem("coef_start_date") ||
      new Date().toISOString().split("T")[0],
    end_date:
      localStorage.getItem("coef_end_date") ||
      new Date().toISOString().split("T")[0],
    department_id: "",
    group_id: "",
  });

  const days = useMemo(
    () => getDaysBetween(filters.start_date, filters.end_date),
    [filters.start_date, filters.end_date]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/ceo/employeeEfficiency", {
        params: filters,
      });
      setData(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Koeffitsiyentlar olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // === Apply search filter ===
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.days.length > 0 &&
        item.employee_name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data, searchText]);

  // === Precomputed Averages (based on filtered data) ===
  const overallAverage = useMemo(() => {
    if (filteredData.length === 0) return 0;

    const total = filteredData.reduce((sum, emp) => {
      const empAvg =
        emp.days.reduce((s, d) => s + d.efficiency_percent, 0) /
        emp.days.length;
      return sum + empAvg;
    }, 0);

    return total / filteredData.length;
  }, [filteredData]);

  return (
    <div className="flex flex-col gap-2">
      {/* Date filters + Search */}
      <div className="flex gap-2 items-center">
        {["start_date", "end_date"].map((key) => (
          <Input
            key={key}
            type="date"
            value={filters[key]}
            className="w-fit bg-white"
            onChange={(e) => {
              const value = e.target.value;
              setFilters((prev) => ({ ...prev, [key]: value }));
              localStorage.setItem(`coef_${key}`, value);
            }}
          />
        ))}
        <Input
          type="text"
          placeholder="Qidirish..."
          className="bg-white"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-auto">
        <table
          className={`w-full whitespace-nowrap border border-gray-200 border-collapse text-xs bg-white ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <thead>
            <tr>
              <th className="border border-gray-200 p-2">Xodim</th>
              <th className="border border-gray-200 p-2">F.I.K</th>
              {days.map((day) => (
                <th key={day} className="border border-gray-200 p-2">
                  {day.split("-").reverse().join(".")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredData
              .sort((a, b) => b.days.length - a.days.length)
              .map((item) => {
                const empAvg =
                  item.days.reduce((s, d) => s + d.efficiency_percent, 0) /
                  item.days.length;

                return (
                  <tr key={item.employee_id}>
                    <td className="border border-gray-200 p-2">
                      {item.employee_name}
                    </td>
                    <td className="border border-gray-200 p-2">
                      <div
                        className={`${getPercentageColor(
                          empAvg
                        )} font-medium text-center`}
                      >
                        {formatPercent(empAvg)}%
                      </div>
                    </td>
                    {days.map((day) => {
                      const found = item.days.find((d) => d.date === day);
                      const val = found?.efficiency_percent ?? null;
                      return (
                        <td
                          key={day}
                          className="border border-gray-200 p-2 text-center"
                        >
                          <div
                            className={`font-medium ${getPercentageColor(val)}`}
                          >
                            {val !== null ? `${formatPercent(val)}%` : "-"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>

          {/* Footer row for daily averages */}
          <tfoot>
            <tr className="font-bold bg-gray-100">
              <td className="border border-gray-200 p-2 text-right">
                O‘rtacha %
              </td>
              <td className="border border-gray-200 p-2 text-right">
                <div
                  className={`${getPercentageColor(
                    overallAverage
                  )} text-center`}
                >
                  {formatPercent(overallAverage)}%
                </div>
              </td>
              {days.map((day) => {
                const values = filteredData
                  .map(
                    (item) =>
                      item.days.find((d) => d.date === day)?.efficiency_percent
                  )
                  .filter((v) => v !== undefined && v !== null);

                const avg =
                  values.length > 0
                    ? values.reduce((a, b) => a + b, 0) / values.length
                    : null;

                return (
                  <td
                    key={day}
                    className="border border-gray-200 p-2 text-center"
                  >
                    <div className={getPercentageColor(avg)}>
                      {avg !== null ? `${formatPercent(avg)}%` : "-"}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Coefficient;

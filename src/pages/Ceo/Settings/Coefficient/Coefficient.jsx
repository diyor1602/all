import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const getPercentageColor = (percentage) => {
  const value = Number(percentage);
  if (isNaN(value)) return "";

  switch (true) {
    case value < 80:
      return "text-red-500";
    case value >= 90:
      return "";
    case value >= 80:
      return "text-green-500";
    default:
      return "";
  }
};

const Coefficient = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ceo/employeeEfficiency", {
        params: filters,
      });
      setData(response.data);
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

  // Generate days list between start_date and end_date
  const days = Array.from(
    {
      length:
        (new Date(filters.end_date) - new Date(filters.start_date)) /
          (1000 * 60 * 60 * 24) +
        1,
    },
    (_, i) =>
      new Date(
        new Date(filters.start_date).getTime() + i * (1000 * 60 * 60 * 24)
      )
        .toISOString()
        .split("T")[0]
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Date filters */}
      <div className="flex gap-2 items-center">
        <Input
          type="date"
          value={filters.start_date}
          className="w-fit bg-white"
          onChange={(e) => {
            setFilters({ ...filters, start_date: e.target.value });
            localStorage.setItem("coef_start_date", e.target.value);
          }}
        />
        <Input
          type="date"
          value={filters.end_date}
          className="w-fit bg-white"
          onChange={(e) => {
            setFilters({ ...filters, end_date: e.target.value });
            localStorage.setItem("coef_end_date", e.target.value);
          }}
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-auto">
        <table
          className={`w-full whitespace-nowrap border border-gray-200 border-collapse text-xs ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <thead>
            <tr>
              <th className="border border-gray-200 p-2">Xodim</th>
              <th className="border border-gray-200 p-2">F.I.K</th>
              {days.map((day, index) => (
                <th key={index} className="border border-gray-200 p-2">
                  {day?.split("-")?.reverse()?.join(".")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data
              ?.filter((item) => item.days.length > 0)
              ?.sort((a, b) => b.days.length - a.days.length)
              .map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-200 p-2">
                    {item.employee_name}
                  </td>
                  <td className="border border-gray-200 p-2">
                    <div
                      className={
                        getPercentageColor(
                          item.days.reduce(
                            (sum, day) => sum + day.efficiency_percent,
                            0
                          ) / item.days.length
                        ) + " font-medium"
                      }
                    >
                      {parseFloat(
                        item.days.reduce(
                          (sum, day) => sum + day.efficiency_percent,
                          0
                        ) / item.days.length
                      ).toLocaleString("ru-RU", {
                        maximumFractionDigits: 2,
                      })}
                      %
                    </div>
                  </td>
                  {days.map((day, i) => {
                    const found = item.days.find((d) => d.date === day);
                    return (
                      <td
                        key={i}
                        className="border border-gray-200 p-2 text-center"
                      >
                        <div
                          className={`font-medium ${getPercentageColor(
                            found?.efficiency_percent
                          )}`}
                        >
                          {found
                            ? `${found.efficiency_percent.toLocaleString(
                                "ru-RU",
                                {
                                  maximumFractionDigits: 2,
                                }
                              )}%`
                            : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>

          {/* Footer row for daily averages */}
          <tfoot>
            <tr className="font-bold bg-gray-100">
              <td className="border border-gray-200 p-2 text-right" colSpan={2}>
                O‘rtacha %
              </td>
              {days.map((day, i) => {
                // Gather all percentages for this day across employees
                const values = data
                  .map(
                    (item) =>
                      item.days.find((d) => d.date === day)?.efficiency_percent
                  )
                  .filter((v) => v !== undefined);

                const avg =
                  values.length > 0
                    ? values.reduce((a, b) => a + b, 0) / values.length
                    : null;

                return (
                  <td
                    key={i}
                    className="border border-gray-200 p-2 text-center"
                  >
                    <div className={getPercentageColor(avg)}>
                      {avg !== null
                        ? `${avg.toLocaleString("ru-RU", {
                            maximumFractionDigits: 2,
                          })}%`
                        : "-"}
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

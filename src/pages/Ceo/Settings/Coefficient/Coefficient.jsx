import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

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
              <th className="border border-gray-200 p-2">F.I.Sh</th>
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
              .map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-200 p-2">
                    {item.employee_name}
                  </td>
                  {days.map((day, i) => {
                    const found = item.days.find((d) => d.date === day);
                    return (
                      <td
                        key={i}
                        className="border border-gray-200 p-2 text-center"
                      >
                        {found
                          ? `${found.efficiency_percent.toLocaleString(
                              "ru-RU",
                              {
                                maximumFractionDigits: 2,
                              }
                            )}%`
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Coefficient;

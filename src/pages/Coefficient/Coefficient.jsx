import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CoefLineChart from "./CoefLineChart";

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
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dialogActiveTab, setDialogActiveTab] = useState("day");
  const [filters, setFilters] = useState({
    start_date:
      localStorage.getItem("coef_start_date") ||
      new Date().toISOString().split("T")[0],
    end_date:
      localStorage.getItem("coef_end_date") ||
      new Date().toISOString().split("T")[0],
  });
  const [frontFilters, setFrontFilters] = useState({
    searchText: "",
  });

  const days = useMemo(
    () => getDaysBetween(filters.start_date, filters.end_date),
    [filters.start_date, filters.end_date]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/employeeEfficiency", {
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
    return data.filter((item) => {
      const matchesSearch = item.employee_name
        .toLowerCase()
        .includes(frontFilters.searchText.toLowerCase());

      return item.days.length > 0 && matchesSearch;
    });
  }, [data, frontFilters]);

  // === Precomputed Averages (based on filtered data) ===
  const overallAverage = useMemo(() => {
    if (filteredData.length === 0) return 0;

    const total = filteredData.reduce((sum, emp) => {
      const empAvg =
        emp.days.reduce((s, d) => s + d.efficiency_percent, 0) /
        emp.attended_days;
      return sum + empAvg;
    }, 0);

    return total / filteredData.length;
  }, [filteredData]);

  return (
    <div className="flex flex-col gap-2">
      {/* Date filters + Search */}
      <div className="flex gap-2 items-center flex-wrap md:flex-nowrap">
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
          value={frontFilters.searchText}
          onChange={(e) =>
            setFrontFilters((prev) => ({ ...prev, searchText: e.target.value }))
          }
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
              <th className="border border-gray-200 p-2">№</th>
              <th className="border border-gray-200 p-2">Rasmi</th>
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
              .sort(
                (a, b) =>
                  b.days.reduce((s, d) => s + d.efficiency_percent, 0) /
                    b.attended_days -
                  a.days.reduce((s, d) => s + d.efficiency_percent, 0) /
                    a.attended_days
              )
              .map((item, index) => {
                const empAvg =
                  item.days.reduce((s, d) => s + d.efficiency_percent, 0) /
                  item.attended_days;

                return (
                  <tr
                    key={item.employee_id}
                    onClick={() => {
                      setSelectedEmployee(item);
                      setOpen(true);
                    }}
                    className={`hover:bg-gray-100 ${
                      index % 2 === 0 ? "bg-gray-50" : ""
                    }`}
                  >
                    <td className="border border-gray-200 p-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-200 p-2">
                      <div className="flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.employee_name}
                            className="w-10 h-10 object-cover rounded-full shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                            {item.employee_name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
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
              <td className="border border-gray-200 p-2 text-center">
                {filteredData.length}
              </td>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={
            dialogActiveTab === "day"
              ? "md:max-w-[90vw] md:max-h-[90vh] max-w-full max-h-full overflow-auto"
              : ""
          }
        >
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.employee_name}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              variant={dialogActiveTab === "image" ? "default" : "outline"}
              onClick={() => setDialogActiveTab("image")}
            >
              Rasm
            </Button>
            <Button
              variant={dialogActiveTab === "day" ? "default" : "outline"}
              onClick={() => setDialogActiveTab("day")}
            >
              Grafik
            </Button>
            <Button
              variant={dialogActiveTab === "total" ? "default" : "outline"}
              onClick={() => setDialogActiveTab("total")}
            >
              Umumiy
            </Button>
          </div>
          {dialogActiveTab === "image" && (
            <div className="max-h-[70vh] overflow-auto w-full">
              {selectedEmployee?.image ? (
                <img
                  src={selectedEmployee.image}
                  alt={selectedEmployee.employee_name}
                />
              ) : (
                <div>Rasm mavjud emas</div>
              )}
            </div>
          )}
          {dialogActiveTab == "day" && (
            <CoefLineChart data={selectedEmployee} />
          )}

          {dialogActiveTab === "total" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div className="p-4 rounded-2xl border shadow-sm bg-white">
                <div className="text-sm text-gray-500">Keldi</div>
                <div className="text-lg font-semibold text-gray-900">
                  {parseFloat(selectedEmployee?.attended_days).toLocaleString(
                    "ru-RU",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}{" "}
                  kun
                </div>
              </div>

              <div className="p-4 rounded-2xl border shadow-sm bg-white">
                <div className="text-sm text-gray-500">
                  Kuniga o'rtacha (tarifikatsiya){" "}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {parseFloat(
                    selectedEmployee?.tarification_earned /
                      selectedEmployee?.attended_days
                  ).toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  so'm
                </div>
              </div>

              <div className="p-4 rounded-2xl border shadow-sm bg-white">
                <div className="text-sm text-gray-500">
                  Tarifikatsiyadan topdi
                </div>
                <div className="text-lg font-semibold text-emerald-600">
                  {parseFloat(
                    selectedEmployee?.tarification_earned
                  ).toLocaleString("ru-RU", { maximumFractionDigits: 0 })}{" "}
                  so'm
                </div>
              </div>

              <div className="p-4 rounded-2xl border shadow-sm bg-white">
                <div className="text-sm text-gray-500">Jami topdi</div>
                <div className="text-lg font-bold text-indigo-600">
                  {parseFloat(
                    selectedEmployee?.salary_visible
                      ? selectedEmployee?.total_earned
                      : selectedEmployee?.tarification_earned
                  ).toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  so'm
                </div>
              </div>

              {selectedEmployee?.salary_visible ? (
                <div className="p-4 rounded-2xl border shadow-sm bg-white">
                  <div className="text-sm text-gray-500">
                    Kuniga o'rtacha (jami){" "}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {parseFloat(selectedEmployee?.avg_per_day).toLocaleString(
                      "ru-RU",
                      {
                        maximumFractionDigits: 0,
                      }
                    )}{" "}
                    so'm
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coefficient;

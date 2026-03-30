import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const Moneys = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sortBy, setSortBy] = useState("employee_name");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("otkSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

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

      const params = {
        month: selectedMonth,
      };

      if (selectedDepartment) params.department_id = selectedDepartment;
      if (selectedGroup) params.group_id = selectedGroup;

      const response = await api.get("/ceo/monthlyMoneyLogs", { params });

      setData(response?.data || []);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik yuz berdi!",
        variant: "destructive",
      });
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchMoneys();
  }, [selectedMonth, selectedDepartment, selectedGroup]);

  useEffect(() => {
    localStorage.setItem("otkSelectedMonth", selectedMonth);
  }, [selectedMonth]);

  const departmentOptions = useMemo(() => {
    return (departments || []).flatMap((main) =>
      (main?.departments || []).map((dep) => ({
        id: dep?.id,
        name: dep?.name,
        mainName: main?.name,
        groups: dep?.groups || [],
      })),
    );
  }, [departments]);

  const selectedDepartmentObj = useMemo(() => {
    return departmentOptions.find(
      (d) => String(d.id) === String(selectedDepartment),
    );
  }, [departmentOptions, selectedDepartment]);

  const groupOptions = useMemo(() => {
    return selectedDepartmentObj?.groups || [];
  }, [selectedDepartmentObj]);

  const parseMoney = (value) => {
    if (typeof value === "number") return value;
    if (value === null || value === undefined) return 0;

    const cleaned = String(value).replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  const rows = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const totalAmount = useMemo(() => {
    return rows.reduce((acc, item) => acc + parseMoney(item?.grand_total), 0);
  }, [rows]);

  const sortedRows = useMemo(() => {
    const cloned = [...rows];
    const dir = sortDir === "desc" ? -1 : 1;

    cloned.sort((a, b) => {
      if (sortBy === "grand_total") {
        const av = parseMoney(a?.grand_total);
        const bv = parseMoney(b?.grand_total);
        return (av - bv) * dir;
      }

      if (sortBy === "department_name") {
        const av = String(a?.department_name || "")
          .trim()
          .toLowerCase();
        const bv = String(b?.department_name || "")
          .trim()
          .toLowerCase();
        return av.localeCompare(bv, "uz") * dir;
      }

      if (sortBy === "position_name") {
        const av = String(a?.position_name || "")
          .trim()
          .toLowerCase();
        const bv = String(b?.position_name || "")
          .trim()
          .toLowerCase();
        return av.localeCompare(bv, "uz") * dir;
      }

      const av = String(a?.employee_name || "")
        .trim()
        .toLowerCase();
      const bv = String(b?.employee_name || "")
        .trim()
        .toLowerCase();
      return av.localeCompare(bv, "uz") * dir;
    });

    return cloned;
  }, [rows, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortDir("asc");
  };

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

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-white px-3 py-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-medium text-gray-900">
              Oylik xarajatlar
            </div>
            <div className="text-[10px] text-gray-500">
              Bo'lim va guruh bo'yicha filtrlash
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-gray-500">Jami</div>
            <div className="text-xs font-semibold text-gray-900">
              {formatNumber(totalAmount, 0)} so'm
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => changeMonthBy(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Input
              type="month"
              className="h-8 w-fit border-0 bg-white px-2 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => changeMonthBy(1)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <select
            className="h-9 min-w-[180px] rounded-lg border border-gray-200 bg-white px-2 text-[11px] text-gray-900 shadow-sm outline-none focus:border-gray-300"
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
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
            className="h-9 min-w-[180px] rounded-lg border border-gray-200 bg-white px-2 text-[11px] text-gray-900 shadow-sm outline-none focus:border-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={!selectedDepartment}
          >
            <option value="">Guruh (hammasi)</option>
            {groupOptions
              .slice()
              .sort((a, b) =>
                String(a?.name || "").localeCompare(
                  String(b?.name || ""),
                  "uz",
                ),
              )
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center px-3 py-10">
            <div className="text-[11px] text-gray-500">Yuklanmoqda...</div>
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="flex items-center justify-center px-3 py-10">
            <div className="text-[11px] text-gray-500">Ma'lumot topilmadi</div>
          </div>
        ) : (
          <div className="w-full overflow-auto rounded-xl">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[11px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 text-gray-600">
                  <th className="border-b px-3 py-2 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("employee_name")}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Xodim</span>
                      {renderSortIcon("employee_name")}
                    </button>
                  </th>

                  <th className="border-b px-3 py-2 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("department_name")}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Bo'lim / Guruh</span>
                      {renderSortIcon("department_name")}
                    </button>
                  </th>

                  <th className="border-b px-3 py-2 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("position_name")}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Lavozim</span>
                      {renderSortIcon("position_name")}
                    </button>
                  </th>

                  <th className="border-b px-3 py-2 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("grand_total")}
                      className="ml-auto inline-flex items-center justify-end gap-1"
                    >
                      <span>Summa</span>
                      {renderSortIcon("grand_total")}
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedRows.map((item, index) => (
                  <tr
                    key={
                      item?.employee_id ||
                      `${item?.employee_name || "row"}-${index}`
                    }
                    className={
                      index % 2 === 0
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50/40 hover:bg-gray-50"
                    }
                  >
                    <td className="border-b px-3 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        {item?.img ? (
                          <button
                            type="button"
                            className="group h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setImgDialogOpen(true);
                            }}
                          >
                            <img
                              src={item.img}
                              alt={item?.employee_name || "employee"}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </button>
                        ) : (
                          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100 ring-1 ring-gray-200" />
                        )}

                        <div className="leading-4">
                          <div className="text-[11px] font-medium text-gray-900">
                            {item?.employee_name || "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="border-b px-3 py-2 text-gray-700">
                      <div className="leading-4">
                        <div className="text-[11px] font-medium text-gray-900">
                          {item?.department_name || "-"}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {item?.group_name || "-"}
                        </div>
                      </div>
                    </td>

                    <td className="border-b px-3 py-2 text-gray-700">
                      {item?.position_name || "-"}
                    </td>

                    <td className="border-b px-3 py-2 text-right font-semibold text-gray-900">
                      {formatNumber(parseMoney(item?.grand_total), 0)} so'm
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-gray-50">
                  <th
                    className="border-t px-3 py-2 text-left text-[11px] font-semibold text-gray-700"
                    colSpan={3}
                  >
                    Jami
                  </th>
                  <th className="border-t px-3 py-2 text-right text-xs font-semibold text-gray-900">
                    {formatNumber(totalAmount, 0)} so'm
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {selectedEmployee?.employee_name || "Xodim rasmi"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="overflow-hidden rounded-lg border bg-gray-50">
              {selectedEmployee?.img ? (
                <img
                  src={selectedEmployee.img}
                  alt={selectedEmployee?.employee_name || "employee"}
                  className="w-full object-contain"
                />
              ) : (
                <div className="flex h-[240px] items-center justify-center text-sm text-gray-500">
                  Rasm mavjud emas
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Moneys;

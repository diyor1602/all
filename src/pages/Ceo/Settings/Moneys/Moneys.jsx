import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogContent } from "@/components/ui/dialog";

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
      const response = await api.get("/ceo/monthlyMoneyLogs", {
        params: {
          month: selectedMonth,
          department_id: selectedDepartment,
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
              {formatNumber(
                data?.data?.reduce(
                  (acc, item) => acc + (item?.grand_total || 0),
                  0,
                ),
                0,
              )}{" "}
              so'm
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => changeMonthBy(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              type="month"
              className="h-8 w-fit border-0 bg-white px-2 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <Button
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
            className="h-9 min-w-[180px] rounded-lg border border-gray-200 bg-white px-2 text-[11px] text-gray-900 shadow-sm outline-none focus:border-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={!selectedDepartment}
          >
            <option value="">Guruh (hammasi)</option>
            {groupOptions
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
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
        ) : (data?.data?.length || 0) === 0 ? (
          <div className="flex items-center justify-center px-3 py-10">
            <div className="text-[11px] text-gray-500">Ma'lumot topilmadi</div>
          </div>
        ) : (
          <div className="w-full overflow-auto rounded-xl">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[11px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 text-gray-600">
                  <th className="border-b px-3 py-2 text-left font-medium">
                    Xodim
                  </th>
                  <th className="border-b px-3 py-2 text-left font-medium">
                    Bo'lim / Guruh
                  </th>
                  <th className="border-b px-3 py-2 text-left font-medium">
                    Lavozim
                  </th>
                  <th className="border-b px-3 py-2 text-right font-medium">
                    Summa
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((item, index) => (
                  <tr
                    key={index}
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
                              alt={item?.employee_name}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </button>
                        ) : (
                          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100 ring-1 ring-gray-200" />
                        )}
                        <div className="leading-4">
                          <div className="text-[11px] font-medium text-gray-900">
                            {item?.employee_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b px-3 py-2 text-gray-700">
                      <div className="leading-4">
                        <div className="text-[11px] font-medium text-gray-900">
                          {item?.department_name}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {item?.group_name}
                        </div>
                      </div>
                    </td>
                    <td className="border-b px-3 py-2 text-gray-700">
                      {item?.position_name}
                    </td>
                    <td className="border-b px-3 py-2 text-right font-semibold text-gray-900">
                      {formatNumber(item?.grand_total, 0)} so'm
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
                    {formatNumber(
                      data?.data?.reduce(
                        (acc, item) => acc + (item?.grand_total || 0),
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

      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-gray-900">
                {selectedEmployee?.employee_name}
              </div>
              <div className="overflow-hidden rounded-lg border bg-gray-50">
                <img
                  src={selectedEmployee?.img}
                  alt={selectedEmployee?.employee_name}
                  className="w-full object-contain"
                />
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Moneys;

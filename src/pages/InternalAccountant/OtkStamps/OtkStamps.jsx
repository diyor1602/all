import { useEffect, useRef, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, History, Loader2, Plus, User } from "lucide-react";

const emptyForm = {
  stamp_number: "",
  employee_id: "",
  assigned_from: "",
};

const formatDate = (value) => {
  if (!value) return "-";
  const datePart = String(value).split(/[T ]/)[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return value;
  return `${d}.${m}.${y}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OtkStamps = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const skipEmployeeSearchRef = useRef(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStamp, setHistoryStamp] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchStamps = () => {
    setLoading(true);
    api
      .get("/otkStamps")
      .then((res) => {
        setData(res.data?.data || []);
      })
      .catch(() => {
        toast({
          title: "Xatolik",
          description: "Xatolik yuz berdi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStamps();
  }, []);

  useEffect(() => {
    if (skipEmployeeSearchRef.current) {
      skipEmployeeSearchRef.current = false;
      return;
    }

    if (employeeSearch.trim().length <= 2) {
      setEmployees([]);
      return;
    }

    const handler = setTimeout(() => {
      setSearchingEmployees(true);
      api
        .get("/internalAccountant/employees", {
          params: { search: employeeSearch },
        })
        .then((res) => {
          setEmployees(res.data?.data || []);
        })
        .catch(() => {
          toast({
            title: "Xatolik",
            description: "Xodimlarni qidirishda xatolik",
            variant: "destructive",
          });
        })
        .finally(() => {
          setSearchingEmployees(false);
        });
    }, 500);

    return () => clearTimeout(handler);
  }, [employeeSearch, toast]);

  const resetForm = () => {
    setForm(emptyForm);
    setEmployeeSearch("");
    setEmployees([]);
  };

  const handleCreate = () => {
    if (!form.stamp_number || !form.employee_id || !form.assigned_from) {
      toast({
        title: "Diqqat",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    api
      .post("/otkStamps", {
        stamp_number: Number.parseInt(form.stamp_number, 10),
        employee_id: form.employee_id,
        assigned_from: form.assigned_from,
      })
      .then(() => {
        toast({
          title: "Muvaffaqiyatli",
          description: "Shtamp qo'shildi",
        });
        setCreateOpen(false);
        resetForm();
        fetchStamps();
      })
      .catch((err) => {
        toast({
          title: "Xatolik",
          description: err.response?.data?.message || "Xatolik yuz berdi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const openHistory = (stampNumber) => {
    setHistoryStamp(stampNumber);
    setHistoryOpen(true);
    setHistoryData(null);
    setHistoryLoading(true);
    api
      .get(`/otkStamps/${stampNumber}/history`)
      .then((res) => {
        setHistoryData(res.data?.data ?? res.data);
      })
      .catch(() => {
        toast({
          title: "Xatolik",
          description: "Tarixni olishda xatolik",
          variant: "destructive",
        });
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  const historyList = Array.isArray(historyData)
    ? historyData
    : historyData
      ? [historyData]
      : [];

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white p-2 shadow-sm flex items-center justify-between">
        <h1 className="text-xs font-semibold text-slate-800">OTK shtamplar</h1>
        <Button
          size="sm"
          className="gap-1"
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Yangi shtamp
        </Button>
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="border border-slate-200 text-center">
                №
              </TableHead>
              <TableHead className="border border-slate-200">
                Shtamp raqami
              </TableHead>
              <TableHead className="border border-slate-200">Xodim</TableHead>
              <TableHead className="border border-slate-200">
                Berilgan sana
              </TableHead>
              <TableHead className="border border-slate-200">
                Yaratilgan
              </TableHead>
              <TableHead className="border border-slate-200 text-center">
                Amallar
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-xs text-slate-500 py-6"
                >
                  Yuklanmoqda...
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <TableRow key={item.id ?? item.stamp_number ?? index}>
                  <TableCell className="border border-slate-200 text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell className="border border-slate-200 font-medium">
                    {item.stamp_number}
                  </TableCell>
                  <TableCell className="border border-slate-200">
                    {item.employee?.name || item.employee_id || "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200">
                    {formatDate(item.assigned_from)}
                  </TableCell>
                  <TableCell className="border border-slate-200">
                    {formatDateTime(item.created_at)}
                  </TableCell>
                  <TableCell className="border border-slate-200 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => openHistory(item.stamp_number)}
                    >
                      <History className="h-3.5 w-3.5" />
                      Tarix
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-xs text-slate-500 py-6"
                >
                  Hech narsa topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi shtamp qo'shish</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Shtamp raqami
              </label>
              <Input
                type="number"
                value={form.stamp_number}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, stamp_number: e.target.value }))
                }
                placeholder="Masalan: 101"
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-xs font-medium text-slate-600">
                Xodim
              </label>
              <Input
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Xodim ismini kiriting..."
              />
              {form.employee_id &&
                (() => {
                  const selected = employees.find(
                    (e) => String(e.id) === String(form.employee_id),
                  );
                  return (
                    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-1.5">
                      {selected?.img ? (
                        <img
                          src={selected.img}
                          alt={selected.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                      <div className="text-xs">
                        <div className="font-medium text-emerald-700">
                          {selected?.name || form.employee_id}
                        </div>
                        {selected && (
                          <div className="text-slate-500">
                            {[
                              selected.department?.name,
                              selected.group?.name,
                              selected.position,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              {searchingEmployees ? (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Qidirilmoqda...
                </div>
              ) : employees.length > 0 ? (
                <div className="max-h-56 overflow-auto rounded-md border border-slate-200">
                  {employees.map((emp) => (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, employee_id: emp.id }));
                        skipEmployeeSearchRef.current = true;
                        setEmployeeSearch(emp.name);
                        setEmployees([]);
                      }}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      {emp.img ? (
                        <img
                          src={emp.img}
                          alt={emp.name}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-800">
                          {emp.name}
                        </div>
                        <div className="text-slate-500">
                          {[emp.department?.name, emp.group?.name, emp.position]
                            .filter(Boolean)
                            .join(" • ") || "-"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Berilgan sana
              </label>
              <Input
                type="date"
                value={form.assigned_from}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    assigned_from: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shtamp #{historyStamp} tarixi</DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Yuklanmoqda...
            </div>
          ) : historyList.length > 0 ? (
            <div className="max-h-[28rem] space-y-0 overflow-auto px-1">
              {historyList.map((item, index) => {
                const isCurrent = !item.assigned_to;
                const isLast = index === historyList.length - 1;

                return (
                  <div key={item.id ?? index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          isCurrent
                            ? "bg-emerald-500 ring-4 ring-emerald-100"
                            : "bg-slate-300"
                        }`}
                      />
                      {!isLast && <div className="w-px flex-1 bg-slate-200" />}
                    </div>

                    <div className="mb-3 flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800">
                            {item.employee?.name || item.employee_id || "-"}
                          </span>
                        </div>
                        {isCurrent ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                            Joriy
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            Tugagan
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(item.assigned_from)}
                        {" — "}
                        {item.assigned_to
                          ? formatDate(item.assigned_to)
                          : "hozirgacha"}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        Yaratilgan: {formatDateTime(item.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-500">
              Tarix topilmadi
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OtkStamps;

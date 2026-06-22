import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Printer,
  Calendar,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Clock,
  MessageSquare,
  LayoutGrid,
  Table2,
  X,
  Filter,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const statusConfig = {
  taken: {
    label: "Olingan",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    row: "border-l-4 border-l-amber-400",
    card: "border-t-4 border-t-amber-400",
    icon: Clock,
  },
  returned: {
    label: "Qaytarilgan",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    row: "border-l-4 border-l-emerald-400",
    card: "border-t-4 border-t-emerald-400",
    icon: CheckCircle2,
  },
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const EmpAvatar = ({ img, name, size = "md" }) => {
  const dims =
    size === "sm"
      ? "w-7 h-7 text-xs"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-9 h-9 text-sm";
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  if (img)
    return (
      <img
        src={img}
        alt={name}
        className={`${dims} rounded-full object-cover flex-shrink-0 ring-2 ring-white`}
      />
    );
  return (
    <div
      className={`${dims} rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 font-semibold text-violet-700 ring-2 ring-white`}
    >
      {initial}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.taken;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const RentedMachines = () => {
  const { toast } = useToast();

  // List state
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [layout, setLayout] = useState("cards"); // "cards" | "table"

  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedFilterSearch = useDebounce(filterSearch, 500);

  // Add dialog
  const [typewriters, setTypewriters] = useState([]);
  const [addDialog, setAddDialog] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empResults, setEmpResults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTypewriter, setSelectedTypewriter] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [givenAt, setGivenAt] = useState("");
  const [adding, setAdding] = useState(false);
  const [empSearching, setEmpSearching] = useState(false);
  const debouncedEmpSearch = useDebounce(empSearch, 500);

  // Return dialog
  const [returnDialog, setReturnDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [returnedAt, setReturnedAt] = useState("");
  const [returnComment, setReturnComment] = useState("");
  const [returning, setReturning] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getData = async (page = 1, search = "", status = "") => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get("/superhr/home-typewriter", { params });
      setData(res.data?.data || []);
      setMeta(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeWriters = async () => {
    try {
      const res = await api.get("/superhr/typewriter");
      setTypewriters(res.data || []);
    } catch (_) {
      // non-critical, list view still works without typewriter options
    }
  };

  const searchEmployees = async () => {
    if (debouncedEmpSearch.length < 2) {
      setEmpResults([]);
      return;
    }
    setEmpSearching(true);
    try {
      const res = await api.get("/superhr/employees", {
        params: { search: debouncedEmpSearch },
      });
      setEmpResults(res.data?.data || []);
    } catch {
      setEmpResults([]);
    } finally {
      setEmpSearching(false);
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      await api.post("/superhr/home-typewriter", {
        employee_id: selectedEmployee?.id,
        type_writer_id: selectedTypewriter?.id,
        quantity,
        comment,
        given_at: givenAt,
      });
      toast({ title: "Muvaffaqiyat", description: "Mashina biriktirildi" });
      setAddDialog(false);
      getData(currentPage, debouncedFilterSearch, filterStatus);
    } catch {
      toast({
        title: "Xatolik",
        description: "Saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleReturn = async () => {
    setReturning(true);
    try {
      await api.patch(`/superhr/home-typewriter/${selectedItem?.id}/return`, {
        returned_at: returnedAt,
        comment: returnComment || undefined,
      });
      toast({ title: "Muvaffaqiyat", description: "Mashina qaytarildi" });
      setReturnDialog(false);
      getData(currentPage, debouncedFilterSearch, filterStatus);
    } catch {
      toast({
        title: "Xatolik",
        description: "Qaytarishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setReturning(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/superhr/home-typewriter/${selectedItem?.id}`);
      toast({ title: "O'chirildi", description: "Yozuv o'chirildi" });
      setDeleteDialog(false);
      const newPage =
        data.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      getData(newPage, debouncedFilterSearch, filterStatus);
    } catch {
      toast({
        title: "Xatolik",
        description: "O'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openReturnDialog = (item) => {
    setSelectedItem(item);
    setReturnedAt(new Date().toISOString().split("T")[0]);
    setReturnComment("");
    setReturnDialog(true);
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const clearFilters = () => {
    setFilterSearch("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  const isFiltered = filterSearch || filterStatus;

  // Reload when page or filters change
  useEffect(() => {
    getData(currentPage, debouncedFilterSearch, filterStatus);
  }, [currentPage, debouncedFilterSearch, filterStatus]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFilterSearch, filterStatus]);

  useEffect(() => {
    getTypeWriters();
  }, []);

  useEffect(() => {
    searchEmployees();
  }, [debouncedEmpSearch]);

  const clearAddForm = () => {
    setEmpSearch("");
    setEmpResults([]);
    setSelectedEmployee(null);
    setSelectedTypewriter(null);
    setQuantity(1);
    setComment("");
    setGivenAt(new Date().toISOString().split("T")[0]);
  };

  // Shared action buttons render
  const ActionButtons = ({ item }) => (
    <div className="flex items-center gap-1.5">
      {item.status === "taken" && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          onClick={() => openReturnDialog(item)}
        >
          <RotateCcw size={12} />
          Qaytarish
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => openDeleteDialog(item)}
      >
        <Trash2 size={12} />
        O'chirish
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Printer size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                Uy Mashinalari
              </h1>
            </div>
            <p className="text-slate-500 text-sm pl-10">
              Jami:{" "}
              <span className="font-semibold text-slate-700">
                {meta?.total ?? 0}
              </span>{" "}
              ta yozuv
            </p>
          </div>
          <Button
            onClick={() => {
              clearAddForm();
              setAddDialog(true);
            }}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 self-start sm:self-auto"
          >
            <Plus size={16} />
            Qo'shish
          </Button>
        </div>

        {/* Filters + layout toggle */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Ism bo'yicha qidirish..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 focus-visible:ring-indigo-500"
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-52">
            <Filter
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="pl-9 bg-white border-slate-200 focus:ring-indigo-500">
                <SelectValue placeholder="Barcha holatlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="taken">Olingan</SelectItem>
                <SelectItem value="returned">Qaytarilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-slate-500 hover:text-slate-700 self-center"
            >
              <X size={14} />
              Tozalash
            </Button>
          )}

          {/* Layout toggle */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 self-start sm:self-auto ml-auto">
            <button
              onClick={() => setLayout("cards")}
              className={`p-1.5 rounded-md transition-colors ${
                layout === "cards"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Kartalar ko'rinishi"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setLayout("table")}
              className={`p-1.5 rounded-md transition-colors ${
                layout === "table"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Jadval ko'rinishi"
            >
              <Table2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        layout === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-52 bg-white/80 animate-pulse rounded-xl border border-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-14 border-b border-slate-100 animate-pulse bg-slate-50 last:border-b-0"
              />
            ))}
          </div>
        )
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Printer size={28} className="opacity-40" />
          </div>
          <p className="text-base font-medium text-slate-500">
            Ma'lumotlar topilmadi
          </p>
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : layout === "cards" ? (
        /* ── Card layout ── */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((item) => {
              const cfg = statusConfig[item.status] || statusConfig.taken;
              return (
                <Card
                  key={item.id}
                  className={`border shadow-sm hover:shadow-md transition-all overflow-hidden bg-white ${cfg.card}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-slate-400 font-mono">
                        #{item.id}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Printer size={15} className="text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Mashina</p>
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {item.type_writer?.name || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 bg-violet-50 rounded-lg">
                      <EmpAvatar
                        img={item.employee?.img}
                        name={item.employee?.name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Xodim</p>
                        <p className="font-medium text-slate-700 text-sm truncate">
                          {item.employee?.name || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <p className="text-slate-400 mb-0.5">Berilgan</p>
                        <p className="font-medium">
                          {formatDate(item.given_at)}
                        </p>
                      </div>
                      {item.status === "returned" && item.returned_at && (
                        <div>
                          <p className="text-slate-400 mb-0.5">Qaytarilgan</p>
                          <p className="font-medium text-emerald-600">
                            {formatDate(item.returned_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {item.comment && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 italic">
                        <MessageSquare
                          size={12}
                          className="mt-0.5 flex-shrink-0 text-slate-400"
                        />
                        <span className="line-clamp-2">{item.comment}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100">
                      <ActionButtons item={item} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* ── Table layout ── */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider opacity-80 w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider opacity-80">
                    Mashina
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider opacity-80">
                    Xodim
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider opacity-80">
                    Berilgan sana
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider opacity-80">
                    Qaytarilgan sana
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider opacity-80">
                    Holat
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider opacity-80">
                    Izoh
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider opacity-80">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => {
                  const cfg = statusConfig[item.status] || statusConfig.taken;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${cfg.row} ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        {item.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Printer size={13} className="text-indigo-600" />
                          </div>
                          <span className="font-medium text-slate-800 truncate max-w-[140px]">
                            {item.type_writer?.name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <EmpAvatar
                            img={item.employee?.img}
                            name={item.employee?.name}
                            size="sm"
                          />
                          <span className="text-slate-700 truncate max-w-[140px]">
                            {item.employee?.name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {formatDate(item.given_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.returned_at ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <CheckCircle2 size={13} />
                            {formatDate(item.returned_at)}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {item.comment ? (
                          <span
                            className="text-xs text-slate-500 italic truncate block"
                            title={item.comment}
                          >
                            {item.comment}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <ActionButtons item={item} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && meta?.last_page > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="border-slate-200"
          >
            <ChevronFirst size={15} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="border-slate-200"
          >
            <ChevronLeft size={15} />
          </Button>
          <span className="text-sm font-medium px-4 py-1.5 bg-white rounded-lg border border-slate-200 min-w-[72px] text-center text-slate-700">
            {meta?.current_page} / {meta?.last_page}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === meta?.last_page}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="border-slate-200"
          >
            <ChevronRight size={15} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === meta?.last_page}
            onClick={() => setCurrentPage(meta?.last_page)}
            className="border-slate-200"
          >
            <ChevronLast size={15} />
          </Button>
        </div>
      )}

      {/* ── Add Dialog ── */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                <Plus size={15} className="text-white" />
              </div>
              Mashina biriktirish
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Xodim
              </p>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Xodimni qidirish..."
                  value={empSearch}
                  onChange={(e) => {
                    setEmpSearch(e.target.value);
                    setSelectedEmployee(null);
                  }}
                  className="pl-9"
                />
              </div>

              {empSearching && (
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <Loader2 size={13} className="animate-spin" />
                  Qidirilmoqda...
                </div>
              )}

              {selectedEmployee && (
                <div className="mt-2 flex items-center gap-2.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <EmpAvatar
                    img={selectedEmployee.img}
                    name={selectedEmployee.name}
                    size="sm"
                  />
                  <p className="text-sm font-medium text-slate-800 truncate flex-1">
                    {selectedEmployee.name}
                  </p>
                  <CheckCircle2
                    size={16}
                    className="text-indigo-600 flex-shrink-0"
                  />
                </div>
              )}

              {!selectedEmployee && empResults.length > 0 && (
                <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto shadow-sm">
                  {empResults.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setEmpResults([]);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-indigo-50 border-b last:border-b-0 transition-colors"
                    >
                      <EmpAvatar img={emp.img} name={emp.name} size="sm" />
                      <p className="text-sm text-slate-800">{emp.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Mashina
              </p>
              <Select
                value={selectedTypewriter ? String(selectedTypewriter.id) : ""}
                onValueChange={(val) => {
                  const tw = typewriters.find((t) => String(t.id) === val);
                  setSelectedTypewriter(tw || null);
                }}
              >
                <SelectTrigger className="focus:ring-indigo-500">
                  <SelectValue placeholder="Mashina tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {typewriters.map((tw) => (
                    <SelectItem key={tw.id} value={String(tw.id)}>
                      {tw.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Berilgan sana *
                </p>
                <Input
                  type="date"
                  value={givenAt}
                  onChange={(e) => setGivenAt(e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Miqdor
                </p>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Izoh (ixtiyoriy)
              </p>
              <Input
                placeholder="Izoh..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddDialog(false)}
                disabled={adding}
              >
                Bekor qilish
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={
                  !selectedEmployee || !selectedTypewriter || !givenAt || adding
                }
                onClick={handleAdd}
              >
                {adding ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  "Saqlash"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Return Dialog ── */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center">
                <RotateCcw size={14} className="text-white" />
              </div>
              Mashinani qaytarish
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
              <EmpAvatar
                img={selectedItem?.employee?.img}
                name={selectedItem?.employee?.name}
                size="lg"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {selectedItem?.employee?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {selectedItem?.type_writer?.name}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Qaytarilgan sana *
              </p>
              <Input
                type="date"
                value={returnedAt}
                onChange={(e) => setReturnedAt(e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Izoh (ixtiyoriy)
              </p>
              <Input
                placeholder="Izoh..."
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReturnDialog(false)}
                disabled={returning}
              >
                Bekor qilish
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!returnedAt || returning}
                onClick={handleReturn}
              >
                {returning ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Qaytarilmoqda...
                  </>
                ) : (
                  "Qaytarish"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <div className="w-7 h-7 rounded-md bg-red-100 flex items-center justify-center">
                <Trash2 size={14} className="text-red-600" />
              </div>
              O'chirishni tasdiqlang
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
              <EmpAvatar
                img={selectedItem?.employee?.img}
                name={selectedItem?.employee?.name}
                size="lg"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {selectedItem?.employee?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {selectedItem?.type_writer?.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Bu yozuv butunlay o'chiriladi va tiklab bo'lmaydi.
            </p>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteDialog(false)}
                disabled={deleting}
              >
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    O'chirilmoqda...
                  </>
                ) : (
                  "O'chirish"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentedMachines;

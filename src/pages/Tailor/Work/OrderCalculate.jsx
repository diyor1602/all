import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "react-router-dom";
import {
  Loader2,
  Calendar,
  Clock3,
  ChevronDown,
  ChevronUp,
  Package,
  Hash,
  Layers3,
  Plus,
  Save,
  X,
  FolderOpen,
  BadgePlus,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const OrderCalculate = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(
    localStorage.getItem("orderCalculateTab") || "today",
  );
  const [openDates, setOpenDates] = useState({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("");
  const [selectedTarificationId, setSelectedTarificationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingLogId, setEditingLogId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState("");
  const [updating, setUpdating] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tailor/starter/${id}`);
      setData(response.data?.data);
      setEmployeeId(response.data?.employee_id);
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
    getData();
  }, [id]);

  const todayString = useMemo(() => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  }, []);

  const allTarifications = useMemo(() => {
    return (
      data?.submodels?.flatMap((submodel) =>
        (submodel.tarification_categories || []).flatMap((category) =>
          (category.tarifications || []).map((tarification) => ({
            id: tarification.id,
            name: tarification.name,
            code: tarification.code,
            summa: tarification.summa,
            second: tarification.second,
            category_id: category.id,
            category_name: category.name,
            submodel_name: submodel.name,
            category_key: `${submodel.name}__${category.id}`,
          })),
        ),
      ) || []
    );
  }, [data]);

  const categoryOptions = useMemo(() => {
    const map = new Map();

    (data?.submodels || []).forEach((submodel) => {
      (submodel.tarification_categories || []).forEach((category) => {
        const key = `${submodel.name}__${category.id}`;

        if (!map.has(key)) {
          map.set(key, {
            key,
            id: category.id,
            name: category.name,
            submodel_name: submodel.name,
            label: `${category.name}`,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [data]);

  const filteredTarifications = useMemo(() => {
    if (!selectedCategoryKey) return [];
    return allTarifications.filter(
      (item) => item.category_key === selectedCategoryKey,
    );
  }, [allTarifications, selectedCategoryKey]);

  const allOwnLogs = useMemo(() => {
    return (
      data?.submodels
        ?.flatMap((submodel) =>
          (submodel.tarification_categories || []).flatMap((category) =>
            (category.tarifications || []).flatMap((tarification) =>
              (tarification.tarification_logs || []).map((log) => ({
                ...log,
                tarification_id: tarification.id,
                tarification_name: tarification.name,
                tarification_code: tarification.code,
                tarification_summa: tarification.summa,
                category_name: category.name,
                submodel_name: submodel.name,
              })),
            ),
          ),
        )
        .filter((log) => log.employee_id === employeeId) || []
    );
  }, [data, employeeId]);

  const sortedAllOwnLogs = useMemo(() => {
    return [...allOwnLogs].sort((a, b) => {
      if (a.date === b.date) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return new Date(b.date) - new Date(a.date);
    });
  }, [allOwnLogs]);

  const todayLogs = useMemo(() => {
    return sortedAllOwnLogs.filter((log) => log.date === todayString);
  }, [sortedAllOwnLogs, todayString]);

  const totalEarned = useMemo(() => {
    return sortedAllOwnLogs.reduce(
      (sum, log) => sum + Number(log.amount_earned || 0),
      0,
    );
  }, [sortedAllOwnLogs]);

  const todayEarned = useMemo(() => {
    return todayLogs.reduce(
      (sum, log) => sum + Number(log.amount_earned || 0),
      0,
    );
  }, [todayLogs]);

  const todayTotalQuantity = useMemo(() => {
    return todayLogs.reduce((sum, log) => sum + Number(log.quantity || 0), 0);
  }, [todayLogs]);

  const historyGroupedByDate = useMemo(() => {
    const grouped = sortedAllOwnLogs.reduce((acc, log) => {
      const date = log.date || "Noma'lum sana";

      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          quantity: 0,
          items: [],
        };
      }

      acc[date].items.push(log);
      acc[date].total += Number(log.amount_earned || 0);
      acc[date].quantity += Number(log.quantity || 0);

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }, [sortedAllOwnLogs]);

  useEffect(() => {
    if (!historyGroupedByDate.length) return;

    setOpenDates((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      return { [historyGroupedByDate[0].date]: true };
    });
  }, [historyGroupedByDate]);

  useEffect(() => {
    setSelectedTarificationId("");
  }, [selectedCategoryKey]);

  const toggleDate = (date) => {
    setOpenDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const handleAddWork = async () => {
    if (!selectedCategoryKey) {
      toast({
        title: "Kategoriya tanlanmagan",
        description: "Avval kategoriyani tanlang",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTarificationId) {
      toast({
        title: "Tarifikatsiya tanlanmagan",
        description: "Iltimos, tarifikatsiyani tanlang",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/tailor/tarificationLog", {
        tarification_id: Number(selectedTarificationId),
        quantity: Number(quantity),
      });

      toast({
        title: "Saqlandi",
        description: "Yangi ish muvaffaqiyatli qo'shildi",
      });

      setSelectedCategoryKey("");
      setSelectedTarificationId("");
      setQuantity("");
      setShowAddForm(false);
      await getData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Ishni qo'shib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (log) => {
    if (log.date !== todayString) return;
    setEditingLogId(log.id);
    setEditingQuantity(0);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditingQuantity("");
  };

  const handleUpdateTodayLog = async (log) => {
    if (log.date !== todayString) {
      toast({
        title: "Ruxsat yo'q",
        description: "Faqat bugungi ishlarni o'zgartirish mumkin",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);

      await api.post("/tailor/tarificationLog", {
        quantity: Number(editingQuantity),
        tarification_id: log.tarification_id,
      });

      toast({
        title: "Yangilandi",
        description: "Bugungi ish yangilandi",
      });

      setEditingLogId(null);
      setEditingQuantity("");
      await getData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Bugungi ishni yangilab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const renderLogCard = (log, isToday = false) => {
    const isEditing = editingLogId === log.id;

    return (
      <div
        key={log.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-slate-900 leading-5">
              {log.tarification_name || "Nomsiz tarifikatsiya"}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 whitespace-nowrap">
                <Layers3 size={13} />
                {log.category_name || "Kategoriya yo'q"}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 whitespace-nowrap">
                <Package size={13} />
                {log.submodel_name || "Submodel yo'q"}
              </span>

              {log.tarification_code ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                  <Hash size={13} />
                  {log.tarification_code}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2 col-span-2">
            <div className="text-xs text-slate-500">Jami</div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatNumber(log.amount_earned || 0)} so'm
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-500">Soni</div>

            {isToday && isEditing ? (
              <>
                <div className="mt-1 font-semibold text-slate-900">
                  {log.quantity || 0}
                </div>
                <input
                  type="number"
                  min="1"
                  value={editingQuantity}
                  onChange={(e) => setEditingQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-semibold text-slate-900 outline-none focus:border-blue-500"
                />
              </>
            ) : (
              <div className="mt-1 font-semibold text-slate-900">
                {log.quantity || 0}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-500">1 dona narxi</div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatNumber(log.tarification_summa || 0)}
            </div>
          </div>
        </div>

        {isToday && (
          <div className="mt-4 flex justify-end gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <X size={16} />
                  Bekor qilish
                </button>
                <button
                  onClick={() => handleUpdateTodayLog(log)}
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={16} />
                  {updating ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleStartEdit(log)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <BadgePlus size={16} />
                Qo'shish
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="flex h-[85vh] flex-col items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Loader2
              className="mx-auto animate-spin text-slate-700"
              size={28}
            />
            <div className="mt-4 text-center text-base font-medium text-slate-700">
              Yuklanmoqda...
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-bold text-white sm:text-2xl">
                    {data?.order_name}
                  </h1>
                  <p className="mt-1 text-sm text-white/70">
                    {data?.submodels[0]?.name}{" "}
                    <span className="font-bold">{data?.order_quantity}</span>{" "}
                    dona
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="inline-flex rounded-2xl bg-slate-100 p-1.5">
                <button
                  onClick={() => {
                    setSelectedTab("today");
                    localStorage.setItem("orderCalculateTab", "today");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    selectedTab === "today"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Calendar size={18} />
                  Bugun
                </button>

                <button
                  onClick={() => {
                    setSelectedTab("history");
                    localStorage.setItem("orderCalculateTab", "history");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    selectedTab === "history"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Clock3 size={18} />
                  Tarix
                </button>
              </div>
            </div>
          </div>

          {selectedTab === "today" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">
                  Bugungi topilgan summa
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {formatNumber(todayEarned)} so'm
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <FolderOpen size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Yangi ish qo'shish
                      </h2>
                      <p className="text-sm text-slate-500">
                        Formani ochib, kategoriya va tarifikatsiyani tanlang
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddForm((prev) => !prev)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {showAddForm ? <X size={16} /> : <Plus size={16} />}
                    {showAddForm ? "Yopish" : "Ish qo'shish"}
                  </button>
                </div>

                {showAddForm && (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Kategoriya
                        </label>
                        <select
                          value={selectedCategoryKey}
                          onChange={(e) =>
                            setSelectedCategoryKey(e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        >
                          <option value="">Kategoriyani tanlang</option>
                          {categoryOptions.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Tarifikatsiya
                        </label>
                        <select
                          value={selectedTarificationId}
                          onChange={(e) =>
                            setSelectedTarificationId(e.target.value)
                          }
                          disabled={!selectedCategoryKey}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">
                            {!selectedCategoryKey
                              ? "Avval kategoriyani tanlang"
                              : "Tarifikatsiyani tanlang"}
                          </option>
                          {filteredTarifications.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                              {item.code ? ` | ${item.code}` : ""}
                              {item.summa
                                ? ` | ${formatNumber(item.summa)} so'm`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Soni
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-end">
                        <button
                          onClick={handleAddWork}
                          disabled={submitting}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          <Save size={17} />
                          {submitting ? "Saqlanmoqda..." : "Qo'shish"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {todayLogs.length > 0 ? (
                <div className="space-y-3">
                  {todayLogs.map((log) => renderLogCard(log, true))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Calendar className="text-slate-500" size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Bugun hali ish qilinmagan
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Yuqoridagi tugma orqali forma ochib, yangi ish kiriting.
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedTab === "history" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
                <div className="text-sm text-slate-500">
                  Umumiy topilgan summa
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {formatNumber(totalEarned)} so'm
                </div>
              </div>

              {historyGroupedByDate.length > 0 ? (
                <div className="space-y-4">
                  {historyGroupedByDate.map((group) => {
                    const isOpen = !!openDates[group.date];

                    return (
                      <div
                        key={group.date}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleDate(group.date)}
                          className="w-full p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-slate-100 p-2">
                                  <Calendar
                                    size={16}
                                    className="text-slate-700"
                                  />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-slate-900">
                                    {group.date?.split("-").reverse().join(".")}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">
                                  {formatNumber(group.total)} so'm
                                </div>
                              </div>

                              <div className="rounded-xl bg-slate-100 p-2">
                                {isOpen ? (
                                  <ChevronUp
                                    size={18}
                                    className="text-slate-700"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={18}
                                    className="text-slate-700"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                            <div className="space-y-3">
                              {group.items.map((log) =>
                                renderLogCard(log, false),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Clock3 className="text-slate-500" size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Tarix mavjud emas
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Hozircha ushbu xodim uchun hech qanday tarix topilmadi.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCalculate;

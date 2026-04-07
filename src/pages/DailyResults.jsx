import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import {
  ChartColumnIncreasing,
  ChartNoAxesCombined,
  Medal,
  NotepadText,
  Trophy,
  Users,
  CalendarDays,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import YesterdayAbsence from "./SuperHR/Stats/YesterdayAbsence";
import ModelImages from "@/components/ModelImages";

const DailyResults = () => {
  const [outputs, setOutputs] = useState([]);
  const [exampleOutputs, setExampleOutputs] = useState([]);
  const [groupEarnings, setGroupEarnings] = useState([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [aupCount, setAupCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = localStorage.getItem("selectedDate");
    if (savedDate) return savedDate;

    const date = new Date();
    date.setHours(date.getHours() + 5);
    return date.toISOString().split("T")[0];
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const dataIntervalRef = useRef(null);
  const dateTimerRef = useRef(null);

  const role = localStorage.getItem("role");

  const initializeApp = () => {
    dateTimerRef.current = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchData();
  };

  useEffect(() => {
    if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);

    dataIntervalRef.current = setInterval(fetchData, 60000);

    return () => {
      if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
    };
  }, [selectedDate]);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    return () => {
      if (dateTimerRef.current) clearInterval(dateTimerRef.current);
      if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem("selectedDate", selectedDate);
    }
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/sewingOutputs", {
        params: { start_date: selectedDate },
      });

      const data = response.data;

      processOutputData(data.sewing_outputs || []);
      processExampleOutputData(data.example_outputs || []);
      setEmployeeCount(data.simple || 0);
      setAupCount(data.aup || 0);
      setGroupEarnings(data.group_earnings || []);
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Ma'lumotlarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (id) => {
    if (role === "supervisor") {
      navigate("/supervisor/orders/" + id);
    }
  };

  const processOutputData = (outputsData) => {
    const sortedOutputs = [...outputsData]
      .map((output) => {
        const progressPercentage =
          output.today_plan > 0
            ? Math.round((output.today_quantity / output.today_plan) * 100)
            : 0;

        return { ...output, progressPercentage };
      })
      .sort((a, b) => b.progressPercentage - a.progressPercentage);

    setOutputs(sortedOutputs);
  };

  const processExampleOutputData = (outputsData) => {
    const sortedOutputs = [...outputsData]
      .map((output) => {
        const progressPercentage =
          output.today_plan > 0
            ? Math.round((output.today_quantity / output.today_plan) * 100)
            : 0;

        return { ...output, progressPercentage };
      })
      .sort((a, b) => b.progressPercentage - a.progressPercentage);

    setExampleOutputs(sortedOutputs);
  };

  const formattedTime = currentDateTime.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("ru-RU", {
      maximumFractionDigits: 0,
    });
  };

  const allOutputs = useMemo(
    () => [...outputs, ...exampleOutputs],
    [outputs, exampleOutputs],
  );

  const totalPlan = useMemo(
    () =>
      outputs.reduce((total, output) => total + (output.today_plan || 0), 0),
    [outputs],
  );

  const totalTodayQuantity = useMemo(
    () =>
      outputs.reduce(
        (total, output) => total + (output.today_quantity || 0),
        0,
      ),
    [outputs],
  );

  const totalQuantity = useMemo(
    () =>
      outputs.reduce(
        (total, output) => total + (output.total_quantity || 0),
        0,
      ),
    [outputs],
  );

  const averageProgress = useMemo(() => {
    if (!outputs.length) return 0;

    return Math.round(
      outputs.reduce((sum, output) => {
        const progress =
          output.today_plan > 0
            ? (output.today_quantity / output.today_plan) * 100
            : 0;
        return sum + progress;
      }, 0) / outputs.length,
    );
  }, [outputs]);

  const getMedalForRank = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={16} />;
      case 2:
        return <Medal className="text-slate-400" size={16} />;
      case 3:
        return <Medal className="text-amber-700" size={16} />;
      default:
        return (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {rank}
          </span>
        );
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 70) return "bg-sky-500";
    return "bg-amber-500";
  };

  const getTextColor = (percentage) => {
    if (percentage >= 100) return "text-emerald-600";
    if (percentage >= 70) return "text-sky-600";
    return "text-amber-600";
  };

  const getProgressStyle = (percentage) => {
    if (percentage >= 100) {
      return {
        bg: "from-emerald-500 to-green-600",
        soft: "from-emerald-50 to-green-50",
        text: "text-emerald-600",
        ring: "ring-emerald-100",
      };
    }
    if (percentage >= 70) {
      return {
        bg: "from-sky-500 to-blue-600",
        soft: "from-sky-50 to-blue-50",
        text: "text-sky-600",
        ring: "ring-sky-100",
      };
    }
    return {
      bg: "from-amber-500 to-orange-500",
      soft: "from-amber-50 to-orange-50",
      text: "text-amber-600",
      ring: "ring-amber-100",
    };
  };

  const progressStyle = getProgressStyle(averageProgress);

  const StatCard = ({
    title,
    value,
    icon,
    iconBg,
    subtitle,
    valueClassName = "",
  }) => (
    <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-slate-100/40 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <div
            className={`mt-1 text-xl font-bold tracking-tight text-slate-900 ${valueClassName}`}
          >
            {value}
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${iconBg} text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  const TableProgress = ({ percentage }) => (
    <div className="flex min-w-[120px] items-center gap-3">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`${getProgressColor(percentage)} h-full rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span
        className={`min-w-[44px] text-right text-xs font-bold ${getTextColor(percentage)}`}
      >
        {percentage}%
      </span>
    </div>
  );

  const renderOutputRow = (output, index, isExample = false) => {
    const rank = index + 1;

    return (
      <tr
        key={`${isExample ? "example" : "main"}-${output.order_id}-${index}`}
        className={`border-b border-slate-100 transition-colors hover:bg-slate-50/80 ${
          output.hasChanged ? "animate-pulse" : ""
        } ${role === "supervisor" ? "cursor-pointer" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          handleNavigate(output.order_id);
        }}
      >
        <td className="px-4 py-4 text-center">{getMedalForRank(rank)}</td>

        <td className="px-4 py-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
            <span>{output?.model?.name}</span>
            {!isExample && <ModelImages modelCode={output?.model?.name} />}
          </div>
        </td>

        <td className="px-4 py-4 text-slate-700">
          <div className="flex flex-col gap-1">
            <p className="text-sm">{output?.group?.name}</p>
            <p className="text-xs">{output?.responsibleUser}</p>
          </div>
        </td>

        <td className="px-4 py-4 text-center">
          <span className="inline-flex rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
            {output.employee_count}
          </span>
        </td>

        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-sm">
          {formatNumber(output.today_plan)}
        </td>

        <td
          className={`px-4 py-4 text-center font-bold text-sm ${
            output.today_quantity >= output.today_plan
              ? "text-emerald-600"
              : "text-sky-600"
          }`}
        >
          {formatNumber(output.today_quantity)}
        </td>

        <td className="px-4 py-4 text-center font-bold text-violet-600 text-sm">
          {formatNumber(output.total_quantity)}
        </td>

        <td className="px-4 py-4">
          <TableProgress percentage={output.progressPercentage} />
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-600">
              Ma'lumotlar yuklanmoqda...
            </p>
          </div>
        </div>
      )}

      {role === "superhr" && (
        <div className="mb-5">
          <YesterdayAbsence />
        </div>
      )}

      <div className="mb-6 overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Sparkles size={16} className="text-indigo-500" />
              <span className="text-xs font-medium">
                Kunlik natijalar paneli
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Reja, bajarilgan ishlar va guruhlar bo‘yicha statistikalar
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <CalendarDays size={18} className="text-slate-500" />
              <Input
                type="date"
                className="h-auto border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 px-2 py-1 shadow-sm">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Kiritilgan reja"
          value={formatNumber(totalPlan)}
          icon={<NotepadText size={24} />}
          iconBg="from-indigo-500 to-sky-500"
          subtitle="Bugungi umumiy reja"
        />

        <StatCard
          title="Real natija"
          value={formatNumber(totalTodayQuantity)}
          icon={<ChartColumnIncreasing size={24} />}
          iconBg={
            totalTodayQuantity >= totalPlan
              ? "from-emerald-500 to-green-600"
              : "from-rose-500 to-red-600"
          }
          subtitle="Bugungi bajarilgan ish"
        />

        <StatCard
          title="Jami natija"
          value={formatNumber(totalQuantity)}
          icon={<ChartNoAxesCombined size={24} />}
          iconBg="from-fuchsia-500 to-violet-600"
          subtitle="Umumiy yig‘ilgan natija"
        />

        <StatCard
          title="Jami ishchilar"
          value={
            <span>
              <span className="text-emerald-600">{employeeCount}</span>
              <span className="mx-1 text-slate-400">/</span>
              <span>{employeeCount + aupCount}</span>
            </span>
          }
          icon={<Users size={24} />}
          iconBg="from-violet-500 to-indigo-600"
          subtitle="Ishchi / umumiy"
        />

        <StatCard
          title="AUP"
          value={formatNumber(aupCount)}
          icon={<Users size={24} />}
          iconBg="from-amber-500 to-orange-600"
          subtitle="Administrativ boshqaruv xodimlari"
        />

        <div
          className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${progressStyle.soft} p-5 shadow-sm ring-1 ${progressStyle.ring}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Bajarilgan o‘rtacha plan
              </p>
              <p className={`mt-1 text-xl font-bold ${progressStyle.text}`}>
                {averageProgress}%
              </p>
            </div>
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${progressStyle.bg} text-white shadow-lg`}
            >
              <ChartColumnIncreasing size={24} />
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressStyle.bg} transition-all duration-700`}
              style={{ width: `${Math.min(averageProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Model natijalari
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Reyting, reja va bajarilish ko‘rsatkichlari
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Guruh
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Ishchilar
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Reja
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Natija
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Jami natija
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Progress
                </th>
              </tr>
            </thead>

            <tbody>
              {allOutputs.length ? (
                <>
                  {outputs.map((output, index) =>
                    renderOutputRow(output, index, false),
                  )}
                  {exampleOutputs.map((output, index) =>
                    renderOutputRow(output, index, true),
                  )}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-xs text-slate-500"
                  >
                    Bu sana uchun ma'lumot topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Guruhlar bo‘yicha topilgan summa
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Har bir guruhning davomat va daromad ko‘rsatkichlari
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Guruh
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Davomat
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Qilgan ishi
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  O‘rtacha summa
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Jami topilgan
                </th>
              </tr>
            </thead>

            <tbody>
              {groupEarnings?.length ? (
                [...groupEarnings]
                  .sort(
                    (a, b) =>
                      parseFloat(b.per_employee_earning || 0) -
                      parseFloat(a.per_employee_earning || 0),
                  )
                  .map((groupEarning, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-4 text-xs font-semibold text-slate-800">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm">
                            {groupEarning.group_name}
                          </div>
                          <div className="text-xs">
                            {groupEarning.responsibleUser}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center text-xs font-bold text-indigo-600">
                        {formatNumber(groupEarning.attendance_count)}
                      </td>

                      <td className="px-4 py-4 text-center text-xs font-bold text-slate-700">
                        {formatNumber(groupEarning.quantity)}
                      </td>

                      <td className="px-4 py-4 text-center text-xs font-bold text-violet-600">
                        {formatNumber(groupEarning.per_employee_earning)}
                      </td>

                      <td className="px-4 py-4 text-center text-xs font-bold text-emerald-600">
                        {formatNumber(groupEarning.today_earning)}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-14 text-center text-xs text-slate-500"
                  >
                    Guruhlar bo‘yicha ma'lumot topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyResults;

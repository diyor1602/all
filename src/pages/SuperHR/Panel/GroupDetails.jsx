import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  TrendingUp,
  Package,
  Clock,
  UserCheck,
  UserX,
  Trophy,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const TODAY = new Date().toISOString().split("T")[0];

const getShortName = (name) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}.${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? "").toUpperCase();
};

const formatSeconds = (sec) => {
  return `${formatNumber(sec / 60)} daqiqa`;
};

const LEVEL_CONFIG = {
  gold: {
    label: "Gold",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  bronze: {
    label: "Bronze",
    cls: "bg-orange-100 text-orange-700 border-orange-200",
  },
  silver: {
    label: "Silver",
    cls: "bg-slate-100  text-slate-600  border-slate-200",
  },
};

const COLOR_MAP = {
  blue: { bg: "bg-blue-50", icon: "text-blue-500", value: "text-blue-700" },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-500",
    value: "text-violet-700",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    value: "text-emerald-700",
  },
  amber: { bg: "bg-amber-50", icon: "text-amber-500", value: "text-amber-700" },
  red: { bg: "bg-red-50", icon: "text-red-500", value: "text-red-700" },
  slate: { bg: "bg-slate-50", icon: "text-slate-500", value: "text-slate-700" },
};

// ── Sub-components ────────────────────────────────────────────

function EmployeeAvatar({ img, name }) {
  return img ? (
    <img
      src={img}
      alt={name}
      className="h-10 w-10 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
      {getShortName(name)}
    </div>
  );
}

function LevelBadge({ level }) {
  const cfg = LEVEL_CONFIG[level];
  if (!cfg) return null;
  return (
    <span
      className={`rounded border px-1 py-0.5 text-[9px] font-semibold leading-none ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, color = "slate" }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate;
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border p-3 ${c.bg}`}>
      <div className={`flex items-center gap-1.5 ${c.icon}`}>
        {icon}
        <span className="text-[11px] font-medium leading-tight text-gray-500">
          {label}
        </span>
      </div>
      <p className={`text-xl font-bold leading-none ${c.value}`}>{value}</p>
    </div>
  );
}

function coefCls(coef) {
  if (coef == null) return "bg-gray-100 text-gray-400";
  if (coef >= 80) return "bg-emerald-100 text-emerald-700";
  if (coef >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

// onOpen is a stable callback (useCallback); emp is a stable object reference from groupData
const EmployeeCard = memo(function EmployeeCard({ emp, level, coef, onOpen }) {
  const handleClick = useCallback(() => onOpen(emp), [emp, onOpen]);
  return (
    <button
      onClick={handleClick}
      className="flex w-16 flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-bold ${coefCls(coef)}`}
      >
        {coef != null ? `${formatNumber(coef, 0)}%` : "—"}
      </div>
      <span className="w-full truncate text-[10px] font-medium leading-tight text-gray-700">
        {getShortName(emp.name)}
      </span>
      <LevelBadge level={level} />
    </button>
  );
});

const EfficiencyRow = memo(function EfficiencyRow({
  rank,
  emp,
  value,
  onOpen,
}) {
  const handleClick = useCallback(() => onOpen(emp), [emp, onOpen]);
  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold text-gray-400">
        {rank}
      </span>
      <img
        src={emp.img}
        alt={emp.name}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
        {emp.name}
      </span>
      <span className="shrink-0 text-xs font-bold text-emerald-600">
        {value}
      </span>
    </button>
  );
});

// ── Main component ────────────────────────────────────────────

const GroupDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem("panelDate") || TODAY,
  );
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employeeDetailTarget, setEmployeeDetailTarget] = useState(null);
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [worksMap, setWorksMap] = useState(new Map());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, earnersRes] = await Promise.all([
        api.get(`/tv-dashboard/${id}`, { params: { date: selectedDate } }),
        api.get("/topEarners", { params: { date: selectedDate } }),
      ]);
      setGroupData(res.data);
      const m = new Map();
      (earnersRes.data?.top_earners ?? []).forEach((e) =>
        m.set(e.employee_id, e.works ?? []),
      );
      setWorksMap(m);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    setSelectedDate(val);
    localStorage.setItem("panelDate", val);
  };

  // Memoized so they're not rebuilt on every render (e.g. when dialog opens)
  const levelMap = useMemo(
    () =>
      new Map(
        (groupData?.levels ?? []).flatMap((l) =>
          l.employees.map((e) => [e.employee_id, l.level]),
        ),
      ),
    [groupData],
  );

  const effMap = useMemo(() => {
    const m = new Map();
    [
      ...(groupData?.efficiency?.today?.top7_best ?? []),
      ...(groupData?.efficiency?.today?.top7_earners ?? []),
      ...(groupData?.efficiency?.today?.top7_worst ?? []),
    ].forEach((e) => {
      if (!m.has(e.employee_id)) m.set(e.employee_id, e);
    });
    return m;
  }, [groupData]);

  // Stable reference — doesn't change unless effMap changes (i.e. groupData changes)
  const openDetail = useCallback(
    (emp) => {
      setEmployeeDetailTarget({
        ...emp,
        _eff: effMap.get(emp.employee_id) ?? null,
        _works: worksMap.get(emp.employee_id) ?? [],
      });
      setEmpDialogOpen(true);
    },
    [effMap, worksMap],
  );

  const sewing = groupData?.sewing_output;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">
                {groupData?.group_name || "Guruh"}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{groupData?.responsible_user || "—"}</span>
              </div>
            </>
          )}
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="w-44 bg-white"
        />
      </div>

      {/* ── Stats ── */}
      {loading && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}
      {!loading && groupData && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={<Package className="h-4 w-4" />}
            label="Bugungi ishlab chiqarish"
            value={sewing?.today_quantity ?? "—"}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Bugungi reja"
            value={sewing?.today_plan ?? "—"}
            color="violet"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Reja bajarilishi"
            value={
              sewing?.plan_completion_percent != null
                ? `${sewing.plan_completion_percent}%`
                : "—"
            }
            color={
              (sewing?.plan_completion_percent ?? 0) >= 80
                ? "green"
                : (sewing?.plan_completion_percent ?? 0) >= 50
                  ? "amber"
                  : "red"
            }
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Ish vaqti"
            value={formatSeconds(sewing?.work_seconds)}
            color="slate"
          />
          <StatCard
            icon={<UserCheck className="h-4 w-4" />}
            label="Kelganlar"
            value={groupData.present?.length ?? 0}
            color="green"
          />
          <StatCard
            icon={<UserX className="h-4 w-4" />}
            label="Kelmaganlar"
            value={groupData.absent?.length ?? 0}
            color="red"
          />
        </div>
      )}

      {/* ── Main content ── */}
      {!loading && groupData && (
        <div className="space-y-4">
          {/* Attendance */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Present */}
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-gray-700">
                  Kelganlar
                </span>
                <Badge className="ml-auto bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {groupData.present?.length ?? 0}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 p-4">
                {(groupData.present ?? []).map((emp) => (
                  <EmployeeCard
                    key={emp.employee_id}
                    emp={emp}
                    level={levelMap.get(emp.employee_id)}
                    coef={
                      effMap.get(emp.employee_id)?.efficiency_percent ?? null
                    }
                    onOpen={openDetail}
                  />
                ))}
              </div>
            </div>

            {/* Absent */}
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="text-sm font-semibold text-gray-700">
                  Kelmaganlar
                </span>
                <Badge className="ml-auto bg-red-100 text-red-600 hover:bg-red-100">
                  {groupData.absent?.length ?? 0}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 p-4">
                {(groupData.absent ?? []).map((emp) => (
                  <EmployeeCard
                    key={emp.employee_id}
                    emp={emp}
                    level={levelMap.get(emp.employee_id)}
                    coef={
                      effMap.get(emp.employee_id)?.efficiency_percent ?? null
                    }
                    onOpen={openDetail}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Efficiency today */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Best */}
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Eng samaralilar
                </span>
              </div>
              <div className="divide-y">
                {(groupData.efficiency?.today?.top7_best ?? []).map(
                  (emp, i) => (
                    <EfficiencyRow
                      key={emp.employee_id}
                      rank={i + 1}
                      emp={emp}
                      value={`${emp.efficiency_percent}%`}
                      onOpen={openDetail}
                    />
                  ),
                )}
              </div>
            </div>

            {/* Top earners */}
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <Trophy className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Ko'p ishlab olganlar
                </span>
              </div>
              <div className="divide-y">
                {(groupData.efficiency?.today?.top7_earners ?? []).map(
                  (emp, i) => (
                    <EfficiencyRow
                      key={emp.employee_id}
                      rank={i + 1}
                      emp={emp}
                      value={formatNumber(emp.total_earned)}
                      onOpen={openDetail}
                    />
                  ),
                )}
              </div>
            </div>

            {/* Worst */}
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <Trophy className="h-4 w-4 text-red-400" />
                <span className="text-sm font-semibold text-gray-700">
                  Eng past samaralilar
                </span>
              </div>
              <div className="divide-y">
                {(groupData.efficiency?.today?.top7_worst ?? []).map(
                  (emp, i) => (
                    <EfficiencyRow
                      key={emp.employee_id}
                      rank={i + 1}
                      emp={emp}
                      value={`${emp.efficiency_percent}%`}
                      onOpen={openDetail}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Employee Detail Dialog ── */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-2xl">
          {employeeDetailTarget && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <EmployeeAvatar
                    img={employeeDetailTarget.img || employeeDetailTarget.image}
                    name={employeeDetailTarget.name}
                  />
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-base leading-tight">
                      {employeeDetailTarget.name}
                    </DialogTitle>
                    {employeeDetailTarget.position?.name && (
                      <p className="mt-0.5 text-sm text-gray-400">
                        {employeeDetailTarget.position.name}
                      </p>
                    )}
                    <div className="mt-1">
                      <LevelBadge
                        level={levelMap.get(employeeDetailTarget.employee_id)}
                      />
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {employeeDetailTarget._eff ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-emerald-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Samaradorlik</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {employeeDetailTarget._eff.efficiency_percent}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Ish vaqti</p>
                    <p className="text-base font-bold text-blue-600">
                      {Math.round(employeeDetailTarget._eff.total_seconds / 60)}{" "}
                      min
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Summa</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatNumber(employeeDetailTarget._eff.total_earned)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="py-3 text-center text-sm text-gray-400">
                  Bugun ma'lumot yo'q
                </p>
              )}

              {employeeDetailTarget._works?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Bajarilgan ishlar
                  </p>
                  <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {employeeDetailTarget._works.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-gray-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-400">
                            {w.tarification_category?.name} · {w.code}
                          </p>
                          <p className="truncate text-xs font-medium text-gray-700">
                            {w.operation}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {w.quantity} dona · {Math.round(+w.second)}s/dona
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-emerald-600">
                          {formatNumber(+w.earned)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetails;

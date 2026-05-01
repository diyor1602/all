import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import {
  BarChart3,
  Clock,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

/* ─── thresholds ────────────────────────────────────────────── */
const lostPctColor = (pct) => {
  if (pct >= 25) return "#ef4444";
  if (pct >= 15) return "#f97316";
  if (pct >= 8) return "#eab308";
  return "#22c55e";
};

const coefColor = (coef) => {
  if (coef >= 130) return "#ef4444";
  if (coef >= 115) return "#f97316";
  if (coef >= 107) return "#eab308";
  return "#22c55e";
};

const lostPctBg = (pct) => {
  if (pct >= 25) return "rgba(239,68,68,0.1)";
  if (pct >= 15) return "rgba(249,115,22,0.08)";
  if (pct >= 8) return "rgba(234,179,8,0.08)";
  return "rgba(34,197,94,0.08)";
};

/* ─── stat card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, accent, icon: Icon }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      minWidth: 160,
      flex: 1,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 2,
      }}
    >
      {Icon && <Icon size={13} color={accent || "#64748b"} />}
      <span
        style={{
          fontSize: 11,
          color: "#64748b",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
    <span
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: accent || "#f1f5f9",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "-0.03em",
      }}
    >
      {value}
    </span>
    {sub && <span style={{ fontSize: 11, color: "#475569" }}>{sub}</span>}
  </div>
);

/* ─── badge ──────────────────────────────────────────────────── */
const PctBadge = ({ pct }) => {
  const color = lostPctColor(pct);
  const bg = lostPctBg(pct);
  const Icon = pct >= 15 ? AlertTriangle : CheckCircle2;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${color}33`,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <Icon size={11} />
      {formatNumber(Math.abs(pct))}%
    </span>
  );
};

/* ─── sort icon ──────────────────────────────────────────────── */
const SortIcon = ({ colKey, sortConfig }) => {
  if (sortConfig.key !== colKey)
    return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
  return sortConfig.direction === "asc" ? (
    <ArrowUp size={12} style={{ color: "#f59e0b" }} />
  ) : (
    <ArrowDown size={12} style={{ color: "#f59e0b" }} />
  );
};

/* ─── main ───────────────────────────────────────────────────── */
const CoefStat = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("selectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("technologist/sewing-groups-analysis", {
        params: { month: selectedMonth },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const sorted = useMemo(() => {
    if (!data) return [];
    const base = [...data].sort((a, b) =>
      a.group_name.localeCompare(b.group_name),
    );
    if (!sortConfig.key) return base;
    return base.sort((a, b) => {
      const get = (item) => {
        switch (sortConfig.key) {
          case "group":
            return item.group_name;
          case "qty":
            return item.total_quantity;
          case "produced":
            return item.total_produced_minutes;
          case "days":
            return item.total_present_days;
          case "expected":
            return item.expected_minutes;
          case "diff":
            return item.total_produced_minutes - item.expected_minutes;
          case "lost_per_day":
            return item.lost_minutes / item.total_present_days;
          case "lost_pct":
            return item.lost_percentage;
          case "coef":
            return 100 + (item.lost_minutes / item.expected_minutes) * 100;
          case "per_person":
            return item.avg_production_per_person_day;
          default:
            return 0;
        }
      };
      const av = get(a),
        bv = get(b);
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  /* summary stats */
  const stats = useMemo(() => {
    if (!sorted.length) return null;
    const avgLostPct =
      sorted.reduce((s, i) => s + (i.lost_percentage || 0), 0) / sorted.length;
    const worstGroup = [...sorted].sort(
      (a, b) => b.lost_percentage - a.lost_percentage,
    )[0];
    const totalLost = sorted.reduce((s, i) => s + (i.lost_minutes || 0), 0);
    const redGroups = sorted.filter((i) => i.lost_percentage >= 25).length;
    return { avgLostPct, worstGroup, totalLost, redGroups };
  }, [sorted]);

  /* th helper */
  const Th = ({ col, label, hint, right }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: "11px 13px",
        cursor: "pointer",
        userSelect: "none",
        textAlign: right ? "right" : "left",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          justifyContent: right ? "flex-end" : "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: sortConfig.key === col ? "#f59e0b" : "#64748b",
            }}
          >
            {label}
          </div>
          {hint && (
            <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>
              {hint}
            </div>
          )}
        </div>
        <SortIcon colKey={col} sortConfig={sortConfig} />
      </div>
    </th>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Golos+Text:wght@400;500;600;700&display=swap');
        .coef-page * { box-sizing: border-box; }
        .coef-row:hover td { background: rgba(245,158,11,0.04) !important; }
        .coef-row td { transition: background 0.15s; }
        .month-input::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        ::-webkit-scrollbar { height: 5px; width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.25); border-radius: 9px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-red { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <div
        className="coef-page"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #0d1117 50%, #0a0f1e 100%)",
          fontFamily: "'Golos Text', sans-serif",
          color: "#e2e8f0",
          padding: "28px 24px",
        }}
      >
        {/* ── header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart3 size={17} color="#0a0e1a" />
              </div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Guruhlar tahlili
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
              Tikuv guruhlari bo'yicha vaqt yo'qotish va koeffitsient tahlili
            </p>
          </div>

          {/* month picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 10,
                color: "#475569",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Oy
            </span>
            <input
              className="month-input"
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                localStorage.setItem("selectedMonth", e.target.value);
              }}
              style={{
                padding: "8px 12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "'Golos Text', sans-serif",
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>
        </div>

        {/* ── stat cards ── */}
        {stats && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <StatCard
              label="Guruhlar soni"
              value={sorted.length}
              sub="joriy oy uchun"
              accent="#e2e8f0"
              icon={Users}
            />
            <StatCard
              label="O'rtacha yo'qotish"
              value={`${formatNumber(stats.avgLostPct)}%`}
              sub="barcha guruhlar bo'yicha"
              accent={lostPctColor(stats.avgLostPct)}
              icon={TrendingDown}
            />
            <StatCard
              label="Jami yo'qotilgan vaqt"
              value={`${formatNumber(stats.totalLost / 60)} s`}
              sub="daqiqadan soatga"
              accent="#94a3b8"
              icon={Clock}
            />
            <StatCard
              label="Muammoli guruhlar"
              value={stats.redGroups}
              sub="yo'qotish ≥ 25%"
              accent={stats.redGroups > 0 ? "#ef4444" : "#22c55e"}
              icon={AlertTriangle}
            />
          </div>
        )}

        {/* ── table ── */}
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 320,
              gap: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid rgba(245,158,11,0.15)",
                borderTop: "3px solid #f59e0b",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "#475569", fontSize: 13 }}>
              Ma'lumotlar yuklanmoqda…
            </p>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  {/* group header */}
                  <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                    <th
                      colSpan={2}
                      style={{
                        padding: "8px 13px",
                        color: "#475569",
                        fontSize: 10,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Guruh
                    </th>
                    <th
                      colSpan={5}
                      style={{
                        padding: "8px 13px",
                        color: "#64748b",
                        fontSize: 10,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      Vaqt ko'rsatkichlari
                    </th>
                    <th
                      colSpan={2}
                      style={{
                        padding: "8px 13px",
                        color: "#ef4444",
                        fontSize: 10,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(239,68,68,0.04)",
                      }}
                    >
                      Yo'qotish tahlili
                    </th>
                    <th
                      colSpan={1}
                      style={{
                        padding: "8px 13px",
                        color: "#f59e0b",
                        fontSize: 10,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(245,158,11,0.04)",
                      }}
                    >
                      Samaradorlik
                    </th>
                  </tr>

                  {/* column headers */}
                  <tr
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <th
                      style={{
                        padding: "11px 13px",
                        color: "#334155",
                        fontSize: 11,
                        textAlign: "left",
                        width: 36,
                      }}
                    >
                      №
                    </th>
                    <Th col="group" label="Guruh nomi" />
                    <th
                      style={{
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        padding: 0,
                      }}
                    >
                      <div style={{ padding: "11px 13px" }}>
                        <Th col="qty" label="Tikilgan" hint="mahsulot" right />
                      </div>
                    </th>
                    <Th col="produced" label="Sarflangan vaqt" hint="daqiqada" right />
                    <Th col="days" label="Davomat" hint="kun" right />
                    <Th col="expected" label="Umumiy vaqt" hint="daqiqada" right />
                    <Th col="diff" label="Sarflangan − Umumiy" hint="daqiqada" right />
                    <th
                      style={{
                        padding: 0,
                        background: "rgba(239,68,68,0.02)",
                      }}
                    >
                      <div style={{ padding: "11px 13px" }}>
                        <Th col="lost_per_day" label="Kunda yo'qotish" hint="ishchi/kun" right />
                      </div>
                    </th>
                    <th
                      style={{
                        padding: 0,
                        background: "rgba(239,68,68,0.02)",
                      }}
                    >
                      <div style={{ padding: "11px 13px" }}>
                        <Th col="lost_pct" label="Yo'qotish %" hint="foizda" right />
                      </div>
                    </th>
                    <th
                      style={{
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        padding: 0,
                        background: "rgba(245,158,11,0.02)",
                      }}
                    >
                      <div style={{ padding: "11px 13px" }}>
                        <Th col="coef" label="Koeffitsient" hint="har bir ishchi" right />
                      </div>
                    </th>
                    <th style={{ padding: 0 }}>
                      <div style={{ padding: "11px 13px" }}>
                        <Th col="per_person" label="Kishi boshiga" hint="kun/odam" right />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, idx) => {
                    const lostPerDay =
                      item.lost_minutes / item.total_present_days;
                    const coef =
                      100 +
                      (item.lost_minutes / item.expected_minutes) * 100;
                    const pct = item.lost_percentage || 0;
                    const isRed = pct >= 25;
                    const isOrange = pct >= 15 && pct < 25;

                    return (
                      <tr
                        key={idx}
                        className="coef-row"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.04)",
                          background: isRed
                            ? "rgba(239,68,68,0.03)"
                            : "transparent",
                        }}
                      >
                        {/* index */}
                        <td
                          style={{
                            padding: "12px 13px",
                            color: "#334155",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                          }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </td>

                        {/* group name */}
                        <td style={{ padding: "12px 13px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isRed && (
                              <AlertTriangle
                                size={13}
                                color="#ef4444"
                                style={{ animation: "pulse-red 2s infinite", flexShrink: 0 }}
                              />
                            )}
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: isRed
                                  ? "#fca5a5"
                                  : isOrange
                                  ? "#fdba74"
                                  : "#e2e8f0",
                              }}
                            >
                              {item.group_name}
                            </span>
                          </div>
                        </td>

                        {/* total quantity */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "#94a3b8",
                          }}
                        >
                          {formatNumber(item.total_quantity)}
                        </td>

                        {/* produced minutes */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "#64748b",
                          }}
                        >
                          {formatNumber(item.total_produced_minutes)}
                          <span style={{ fontSize: 10, color: "#334155", marginLeft: 3 }}>
                            daq
                          </span>
                        </td>

                        {/* attendance */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "#64748b",
                          }}
                        >
                          {formatNumber(item.total_present_days)}
                          <span style={{ fontSize: 10, color: "#334155", marginLeft: 3 }}>
                            kun
                          </span>
                        </td>

                        {/* expected minutes */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "#64748b",
                          }}
                        >
                          {formatNumber(item.expected_minutes)}
                          <span style={{ fontSize: 10, color: "#334155", marginLeft: 3 }}>
                            daq
                          </span>
                        </td>

                        {/* sarflangan - umumiy */}
                        {(() => {
                          const diff = item.total_produced_minutes - item.expected_minutes;
                          const isNeg = diff < 0;
                          return (
                            <td
                              style={{
                                padding: "12px 13px",
                                textAlign: "right",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 12,
                                fontWeight: isNeg ? 700 : 400,
                                color: isNeg ? "#ef4444" : "#22c55e",
                                background: isNeg ? "rgba(239,68,68,0.06)" : "transparent",
                              }}
                            >
                              {isNeg ? "−" : "+"}{formatNumber(Math.abs(diff))}
                              <span style={{ fontSize: 10, color: isNeg ? "#ef444488" : "#22c55e88", marginLeft: 3 }}>
                                daq
                              </span>
                            </td>
                          );
                        })()}

                        {/* lost per day */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            background: "rgba(239,68,68,0.02)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12,
                              color: lostPerDay < 0 ? "#22c55e" : lostPerDay >= 30 ? "#ef4444" : lostPerDay >= 20 ? "#f97316" : "#64748b",
                              fontWeight: lostPerDay < 0 || lostPerDay >= 30 ? 700 : 400,
                            }}
                          >
                            {formatNumber(Math.abs(lostPerDay))}
                          </span>
                          <span style={{ fontSize: 10, color: "#334155", marginLeft: 3 }}>
                            daq
                          </span>
                        </td>

                        {/* lost percentage badge */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            background: "rgba(239,68,68,0.02)",
                          }}
                        >
                          <PctBadge pct={pct} />
                        </td>

                        {/* coefficient */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                            background: "rgba(245,158,11,0.02)",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 13,
                                fontWeight: 700,
                                color: coefColor(coef),
                              }}
                            >
                              {formatNumber(coef)}
                            </span>
                            <div
                              style={{
                                height: 3,
                                width: Math.min(60, ((coef - 100) / 50) * 60),
                                background: coefColor(coef),
                                borderRadius: 2,
                                opacity: 0.6,
                              }}
                            />
                          </div>
                        </td>

                        {/* per person */}
                        <td
                          style={{
                            padding: "12px 13px",
                            textAlign: "right",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "#94a3b8",
                          }}
                        >
                          {formatNumber(item.avg_production_per_person_day)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* empty state */}
            {sorted.length === 0 && !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 24px",
                  color: "#475569",
                }}
              >
                <Clock
                  size={40}
                  style={{ opacity: 0.3, marginBottom: 12 }}
                  color="#64748b"
                />
                <p style={{ fontSize: 14, margin: "0 0 4px" }}>
                  Ma'lumot topilmadi
                </p>
                <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
                  Boshqa oyni tanlang
                </p>
              </div>
            )}

            {/* footer */}
            {sorted.length > 0 && (
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                  color: "#334155",
                  background: "rgba(0,0,0,0.15)",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span>
                  Jami{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                    {sorted.length}
                  </span>{" "}
                  ta guruh
                </span>
                <div style={{ display: "flex", gap: 16 }}>
                  {[
                    { color: "#22c55e", label: "< 8% — yaxshi" },
                    { color: "#eab308", label: "8–15% — o'rtacha" },
                    { color: "#f97316", label: "15–25% — yuqori" },
                    { color: "#ef4444", label: "≥ 25% — kritik" },
                  ].map(({ color, label }) => (
                    <span
                      key={label}
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: color,
                          display: "inline-block",
                        }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CoefStat;

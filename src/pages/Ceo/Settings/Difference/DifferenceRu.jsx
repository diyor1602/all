import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  BarChart3,
  Snowflake,
  Flower2,
  X,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import ModelImages from "@/components/ModelImages";

/* ─── tiny helpers ─────────────────────────────────────────── */
const diffColor = (val) => {
  if (val > 0) return "#22c55e";
  if (val < 0) return "#ef4444";
  return "#94a3b8";
};

const DiffCell = ({ value, unit = "UZS", minutes, percentage }) => {
  const color = diffColor(minutes);
  const Icon = minutes > 0 ? TrendingUp : minutes < 0 ? TrendingDown : Minus;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        <Icon size={12} />
        {formatNumber(minutes)} мин
      </span>
      {value !== undefined && (
        <span
          style={{
            color: diffColor(value),
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {formatNumber(value)} {unit}
        </span>
      )}
      {percentage !== undefined && (
        <span
          style={{
            color: diffColor(percentage),
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
          }}
        >
          ({percentage > 0 ? "+" : ""}
          {percentage.toFixed(1)}%)
        </span>
      )}
    </div>
  );
};

const SortIcon = ({ colKey, sortConfig }) => {
  if (sortConfig.key !== colKey)
    return <ArrowUpDown size={13} style={{ opacity: 0.35 }} />;
  return sortConfig.direction === "asc" ? (
    <ArrowUp size={13} style={{ color: "#f59e0b" }} />
  ) : (
    <ArrowDown size={13} style={{ color: "#f59e0b" }} />
  );
};

/* ─── stat card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, accent }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      minWidth: 160,
      flex: 1,
    }}
  >
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

/* ─── season badge ──────────────────────────────────────────── */
const SeasonBadge = ({ type }) => {
  const isWinter = type === "winter";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: isWinter
          ? "rgba(96,165,250,0.12)"
          : "rgba(134,239,172,0.12)",
        color: isWinter ? "#60a5fa" : "#4ade80",
        border: `1px solid ${isWinter ? "rgba(96,165,250,0.25)" : "rgba(74,222,128,0.25)"}`,
      }}
    >
      {isWinter ? <Snowflake size={11} /> : <Flower2 size={11} />}
      {isWinter ? "Зима" : "Весна"}
    </span>
  );
};

/* ─── main component ────────────────────────────────────────── */
const DifferenceRu = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterSeason, setFilterSeason] = useState("winter"); // "all" | "winter" | "spring"
  const [filterYear, setFilterYear] = useState("2026");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/ceo/new/orders")
      .then((res) => setData(res.data?.data || []))
      .catch(() =>
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при загрузке",
          variant: "destructive",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const set = new Set(data.map((d) => d.order?.season_year).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => b - a)];
  }, [data]);

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const processedData = useMemo(() => {
    let out = [...data];

    // Filter for orders with all 3 tariffs: rasxod, uz, and ru
    // and where UZ tariff > RU tariff AND UZ tariff > Rasxod
    out = out.filter((item) => {
      const rasxod = item.group_limit;
      const uzTariff = item.submodels?.[0]?.tarification_sum?.uz?.summa;
      const ruTariff = item.submodels?.[0]?.tarification_sum?.ru?.summa;

      return rasxod && uzTariff && ruTariff && uzTariff > ruTariff;
    });

    if (search) {
      const q = search.toLowerCase();
      out = out.filter((item) => {
        const o = item.order || {};
        const s = item.submodels?.[0]?.submodel || {};
        return (
          o.name?.toLowerCase().includes(q) ||
          String(o.quantity || "").includes(q) ||
          String(o.season_year || "").includes(q) ||
          (o.season_type === "winter" ? "зима" : "весна").includes(q) ||
          s.model_name?.toLowerCase().includes(q) ||
          s.submodel_name?.toLowerCase().includes(q)
        );
      });
    }
    if (filterSeason !== "all")
      out = out.filter((i) => i.order?.season_type === filterSeason);
    if (filterYear !== "all")
      out = out.filter(
        (i) => String(i.order?.season_year) === String(filterYear),
      );

    if (sortConfig.key) {
      out.sort((a, b) => {
        const get = (item) => {
          const o = item.order || {};
          const s = item.submodels?.[0] || {};
          switch (sortConfig.key) {
            case "quantity":
              return o.quantity || 0;
            case "year":
              return o.season_year || 0;
            case "season":
              return o.season_type || "";
            case "model":
              return s.submodel?.model_name || "";
            case "group_limit":
              return item.group_limit || 0;
            case "uz":
              return s.tarification_sum?.uz?.summa || 0;
            case "ru":
              return s.tarification_sum?.ru?.summa || 0;
            case "group_limit_diff":
              return (
                (item.group_limit || 0) - (s.tarification_sum?.uz?.summa || 0)
              );
            case "ru_uz_diff":
              return (
                (s.tarification_sum?.ru?.summa || 0) -
                (s.tarification_sum?.uz?.summa || 0)
              );
            default:
              return "";
          }
        };
        const av = get(a),
          bv = get(b);
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return out;
  }, [data, search, sortConfig, filterSeason, filterYear]);

  /* stats */
  const stats = useMemo(() => {
    const total = processedData.length;
    const ruHigh = processedData.filter(
      (i) =>
        (i.submodels?.[0]?.tarification_sum?.ru?.summa || 0) >
        (i.submodels?.[0]?.tarification_sum?.uz?.summa || 0),
    ).length;
    const uzHigh = total - ruHigh;
    return { total, ruHigh, uzHigh };
  }, [processedData]);

  const activeFilters =
    (filterSeason !== "all" ? 1 : 0) + (filterYear !== "all" ? 1 : 0);

  /* ─── column header ─────────────────────────────────────────── */
  const Th = ({ col, label, hint }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: "12px 14px",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        textAlign: "left",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: sortConfig.key === col ? "#f59e0b" : "#94a3b8",
            }}
          >
            {label}
          </div>
          {hint && (
            <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>
              {hint}
            </div>
          )}
        </div>
        <SortIcon colKey={col} sortConfig={sortConfig} />
      </div>
    </th>
  );

  /* ─── render ─────────────────────────────────────────────────── */
  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Golos+Text:wght@400;500;600;700&display=swap');
        .diff-page * { box-sizing: border-box; }
        .diff-row:hover td { background: rgba(245,158,11,0.04) !important; }
        .diff-row td { transition: background 0.15s; }
        .filter-chip { transition: background 0.15s, border-color 0.15s, color 0.15s; }
        .filter-chip:hover { filter: brightness(1.15); }
        .sort-th:hover > div { opacity: 0.85; }
        ::-webkit-scrollbar { height: 5px; width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.25); border-radius: 9px; }
      `}</style>

      <div
        className="diff-page"
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
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
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
                  Сравнение тарифов
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                UZ · RU · Прайс — сводка по заказам и моделям
              </p>
            </div>

            {/* search + filter toggle */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#475569",
                    pointerEvents: "none",
                  }}
                />
                <input
                  placeholder="Поиск по модели, заказу, сезону…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    paddingLeft: 32,
                    paddingRight: search ? 30 : 14,
                    paddingTop: 9,
                    paddingBottom: 9,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 10,
                    color: "#e2e8f0",
                    fontSize: 13,
                    outline: "none",
                    width: 280,
                    fontFamily: "'Golos Text', sans-serif",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      position: "absolute",
                      right: 9,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#475569",
                      padding: 0,
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  background: showFilters
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(255,255,255,0.05)",
                  border: showFilters
                    ? "1px solid rgba(245,158,11,0.35)"
                    : "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 10,
                  color: showFilters ? "#f59e0b" : "#94a3b8",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'Golos Text', sans-serif",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <SlidersHorizontal size={14} />
                Фильтры
                {activeFilters > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      background: "#f59e0b",
                      color: "#0a0e1a",
                      borderRadius: 999,
                      width: 17,
                      height: 17,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── filter panel ── */}
          {showFilters && (
            <div
              style={{
                marginTop: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                flexWrap: "wrap",
                gap: 20,
                alignItems: "center",
              }}
            >
              {/* season filter */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Сезон
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { val: "all", label: "Все" },
                    {
                      val: "winter",
                      label: "Зима",
                      icon: <Snowflake size={11} />,
                    },
                    {
                      val: "spring",
                      label: "Весна",
                      icon: <Flower2 size={11} />,
                    },
                  ].map(({ val, label, icon }) => (
                    <button
                      key={val}
                      className="filter-chip"
                      onClick={() => setFilterSeason(val)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1px solid",
                        fontFamily: "'Golos Text', sans-serif",
                        background:
                          filterSeason === val
                            ? "rgba(245,158,11,0.15)"
                            : "transparent",
                        borderColor:
                          filterSeason === val
                            ? "rgba(245,158,11,0.4)"
                            : "rgba(255,255,255,0.1)",
                        color: filterSeason === val ? "#f59e0b" : "#64748b",
                      }}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* year filter */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Год сезона
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {years.map((y) => (
                    <button
                      key={y}
                      className="filter-chip"
                      onClick={() => setFilterYear(String(y))}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1px solid",
                        fontFamily: "'Golos Text', sans-serif",
                        background:
                          filterYear === String(y)
                            ? "rgba(245,158,11,0.15)"
                            : "transparent",
                        borderColor:
                          filterYear === String(y)
                            ? "rgba(245,158,11,0.4)"
                            : "rgba(255,255,255,0.1)",
                        color: filterYear === String(y) ? "#f59e0b" : "#64748b",
                      }}
                    >
                      {y === "all" ? "Все годы" : y}
                    </button>
                  ))}
                </div>
              </div>

              {/* reset */}
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setFilterSeason("all");
                    setFilterYear("all");
                  }}
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.08)",
                    color: "#ef4444",
                    fontFamily: "'Golos Text', sans-serif",
                  }}
                >
                  <X size={12} /> Сбросить
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── stat cards ── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <StatCard
            label="Заказов"
            value={stats.total}
            sub="в текущей выборке"
            accent="#e2e8f0"
          />
          <StatCard
            label="RU выше UZ"
            value={stats.ruHigh}
            sub="тариф RU дороже"
            accent="#f59e0b"
          />
          <StatCard
            label="UZ выше RU"
            value={stats.uzHigh}
            sub="тариф UZ дороже"
            accent="#60a5fa"
          />
          <StatCard
            label="Без разницы"
            value={
              stats.total - stats.ruHigh - stats.uzHigh < 0
                ? 0
                : stats.total - stats.ruHigh - stats.uzHigh
            }
            sub="тарифы равны"
            accent="#94a3b8"
          />
        </div>

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
            <p style={{ color: "#475569", fontSize: 13 }}>Загружаем данные…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
                  {/* group header row */}
                  <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                    <th
                      colSpan={3}
                      style={{
                        padding: "8px 14px",
                        color: "#475569",
                        fontSize: 11,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Заказ
                    </th>
                    <th
                      colSpan={3}
                      style={{
                        padding: "8px 14px",
                        color: "#475569",
                        fontSize: 11,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      Параметры
                    </th>
                    <th
                      colSpan={3}
                      style={{
                        padding: "8px 14px",
                        color: "#f59e0b",
                        fontSize: 11,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(245,158,11,0.04)",
                      }}
                    >
                      Тарифы
                    </th>
                    <th
                      colSpan={3}
                      style={{
                        padding: "8px 14px",
                        color: "#22c55e",
                        fontSize: 11,
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(34,197,94,0.04)",
                      }}
                    >
                      Разница
                    </th>
                  </tr>

                  {/* column header row */}
                  <tr
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px 14px",
                        color: "#475569",
                        fontSize: 12,
                        textAlign: "left",
                        width: 42,
                      }}
                    >
                      №
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        color: "#475569",
                        fontSize: 12,
                        textAlign: "left",
                        width: 60,
                      }}
                    ></th>
                    <Th col="model" label="Модель" hint="модель" />
                    <th
                      style={{
                        padding: "12px 14px",
                        color: "#475569",
                        fontSize: 12,
                        textAlign: "left",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <Th col="quantity" label="Кол-во" hint="шт" />
                    </th>
                    <Th col="year" label="Год" hint="сезонный год" />
                    <Th col="season" label="Сезон" />
                    <th
                      style={{
                        padding: "12px 14px",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(245,158,11,0.02)",
                      }}
                    >
                      <Th col="group_limit" label="Прайс" />
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        background: "rgba(245,158,11,0.02)",
                      }}
                    >
                      <Th col="ru" label="Тариф RU" hint="Россия" />
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        background: "rgba(245,158,11,0.02)",
                      }}
                    >
                      <Th col="uz" label="Тариф UZ" hint="Узбекистан" />
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(34,197,94,0.02)",
                      }}
                    >
                      <Th
                        col="Прайс_ru_diff"
                        label="Прайс-RU"
                        hint="отклонение с %"
                      />
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        background: "rgba(34,197,94,0.02)",
                      }}
                    >
                      <Th
                        col="group_limit_diff"
                        label="Прайс-UZ"
                        hint="отклонение с %"
                      />
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        background: "rgba(34,197,94,0.02)",
                      }}
                    >
                      <Th
                        col="ru_uz_diff"
                        label="RU − UZ"
                        hint="разрыв тарифов с %"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((item, idx) => {
                    const order = item.order || {};
                    const sub = item.submodels?.[0] || {};
                    const uzSum = sub.tarification_sum?.uz?.summa || 0;
                    const ruSum = sub.tarification_sum?.ru?.summa || 0;
                    const uzMin = (sub.tarification_sum?.uz?.seconds || 0) / 60;
                    const ruMin = (sub.tarification_sum?.ru?.seconds || 0) / 60;
                    const ownMin = sub.submodel?.minute || 0;

                    return (
                      <tr
                        key={idx}
                        className="diff-row"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {/* index */}
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "#334155",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                          }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            textAlign: "center",
                          }}
                        >
                          <ModelImages modelCode={sub.submodel?.model_name} />
                        </td>

                        {/* model */}
                        <td style={{ padding: "12px 14px", maxWidth: 200 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#e2e8f0",
                            }}
                          >
                            {sub.submodel?.model_name || "—"}
                          </div>
                          {sub.submodel?.submodel_name && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#475569",
                                marginTop: 2,
                              }}
                            >
                              {sub.submodel.submodel_name}
                            </div>
                          )}
                        </td>

                        {/* quantity */}
                        <td
                          style={{
                            padding: "12px 14px",
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: "rgba(255,255,255,0.05)",
                              padding: "3px 9px",
                              borderRadius: 6,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            <Package size={11} style={{ color: "#475569" }} />
                            {order.quantity || "—"}
                          </span>
                        </td>

                        {/* year */}
                        <td
                          style={{
                            padding: "12px 14px",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "#64748b",
                          }}
                        >
                          {order.season_year || "—"}
                        </td>

                        {/* season */}
                        <td style={{ padding: "12px 14px" }}>
                          {order.season_type ? (
                            <SeasonBadge type={order.season_type} />
                          ) : (
                            <span style={{ color: "#334155" }}>—</span>
                          )}
                        </td>

                        {/* Прайс */}
                        <td
                          style={{
                            padding: "12px 14px",
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                            background: "rgba(245,158,11,0.015)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12,
                              color: "#cbd5e1",
                            }}
                          >
                            {formatNumber(ownMin)} мин
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: "#475569",
                              marginTop: 2,
                            }}
                          >
                            {formatNumber(item.group_limit)}{" "}
                            <span style={{ fontSize: 10 }}>UZS</span>
                          </div>
                        </td>

                        {/* RU */}
                        <td
                          style={{
                            padding: "12px 14px",
                            background: "rgba(245,158,11,0.015)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12,
                              color: "#93c5fd",
                            }}
                          >
                            {formatNumber(ruMin)} мин
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: "#374a6a",
                              marginTop: 2,
                            }}
                          >
                            {formatNumber(ruSum)}{" "}
                            <span style={{ fontSize: 10 }}>UZS</span>
                          </div>
                        </td>

                        {/* UZ */}
                        <td
                          style={{
                            padding: "12px 14px",
                            background: "rgba(245,158,11,0.015)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12,
                              color: "#fbbf24",
                            }}
                          >
                            {formatNumber(uzMin)} мин
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: "#57534e",
                              marginTop: 2,
                            }}
                          >
                            {formatNumber(uzSum)}{" "}
                            <span style={{ fontSize: 10 }}>UZS</span>
                          </div>
                        </td>

                        {/* Прайс - RU */}
                        <td
                          style={{
                            padding: "12px 14px",
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                            background: "rgba(34,197,94,0.015)",
                          }}
                        >
                          <DiffCell
                            value={(item.group_limit || 0) - ruSum}
                            minutes={ownMin - ruMin}
                            percentage={
                              ruSum !== 0
                                ? (((item.group_limit || 0) - ruSum) / ruSum) *
                                  100
                                : 0
                            }
                          />
                        </td>

                        {/* Прайс − UZ */}
                        <td
                          style={{
                            padding: "12px 14px",
                            background: "rgba(34,197,94,0.015)",
                          }}
                        >
                          <DiffCell
                            value={(item.group_limit || 0) - uzSum}
                            minutes={ownMin - uzMin}
                            percentage={
                              uzSum !== 0
                                ? (((item.group_limit || 0) - uzSum) / uzSum) *
                                  100
                                : 0
                            }
                          />
                        </td>

                        {/* RU − UZ */}
                        <td
                          style={{
                            padding: "12px 14px",
                            background: "rgba(34,197,94,0.015)",
                          }}
                        >
                          <DiffCell
                            value={ruSum - uzSum}
                            minutes={ruMin - uzMin}
                            percentage={
                              uzSum !== 0 ? ((ruSum - uzSum) / uzSum) * 100 : 0
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* empty state */}
            {processedData.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ color: "#475569", fontSize: 14 }}>
                  Ничего не найдено
                </p>
                <p style={{ color: "#334155", fontSize: 12, marginTop: 4 }}>
                  Попробуйте изменить поисковый запрос или сбросить фильтры
                </p>
              </div>
            )}

            {/* table footer */}
            {processedData.length > 0 && (
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
                }}
              >
                <span>
                  Показано{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                    {processedData.length}
                  </span>{" "}
                  из{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                    {
                      data.filter((item) => {
                        const rasxod = item.group_limit;
                        const uzTariff =
                          item.submodels?.[0]?.tarification_sum?.uz?.summa;
                        const ruTariff =
                          item.submodels?.[0]?.tarification_sum?.ru?.summa;
                        return (
                          rasxod && uzTariff && ruTariff && uzTariff > ruTariff
                        );
                      }).length
                    }
                  </span>{" "}
                  заказов
                </span>
                <div style={{ display: "flex", gap: 16 }}>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: "#22c55e",
                        display: "inline-block",
                      }}
                    />
                    RU дороже
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: "#ef4444",
                        display: "inline-block",
                      }}
                    />
                    RU дешевле
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DifferenceRu;

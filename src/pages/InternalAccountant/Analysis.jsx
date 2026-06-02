import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import {
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { statuses } from "@/lib/status";
import { Link } from "react-router-dom";

const months = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

const AlertMessage = ({ message }) => {
  return <Badge variant="red">{message}</Badge>;
};

const getMonthLabel = (monthValue) => {
  if (!monthValue) return "";
  const date = new Date(monthValue);
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  return `${monthName}, ${year}`;
};

const getMonthValue = (monthValue) => {
  if (!monthValue) return "";
  const date = new Date(monthValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const SortIcon = ({ field, sortConfig }) => {
  if (sortConfig.key !== field) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
  }

  return sortConfig.direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
  );
};

const LS_KEY = "analysis_filter_state";

const defaultFilters = {
  name: "",
  group: "",
  month: "",
  status: "",
  seasonType: "",
  seasonYear: "",
  technologistStatus: "",
  limitStatus: "",
  sewingOutputCompare: "",
  exceededStatus: "",
  recipeStatus: "",
};

const loadState = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    //ignore
  }
  return null;
};

const Analysis = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const saved = loadState();

  const [globalSearch, setGlobalSearch] = useState(saved?.globalSearch ?? "");
  const [filters, setFilters] = useState(saved?.filters ?? defaultFilters);

  const [sortConfig, setSortConfig] = useState(
    saved?.sortConfig ?? { key: "", direction: "asc" },
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ globalSearch, filters, sortConfig }),
      );
    } catch (e) {
      //ignore
    }
  }, [globalSearch, filters, sortConfig]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/internalAccountant/new/orders")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        toast({
          title: "Xatolik",
          description: "Xatolik yuz berdi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [toast]);

  const normalizedData = useMemo(() => {
    return (data?.data || []).map((item, index) => {
      const orderId = item?.order?.id || "";
      const orderName = item?.order?.name || "";
      const submodelName = item?.submodels?.[0]?.submodel?.submodel_name || "";
      const quantity = item?.order?.quantity || 0;
      const sewingOutputQuantity =
        item?.submodels?.[0]?.sewing_output_quantity || 0;
      const groups = item?.groups?.length
        ? item.groups.map((g) => g.name).join(", ")
        : "";
      const selectedMonths = item?.selected_months || [];
      const monthsText = selectedMonths.length
        ? selectedMonths.map((m) => getMonthLabel(m.month)).join(", ")
        : "";
      const monthValues = selectedMonths.map((m) => getMonthValue(m.month));
      const tarificationSum =
        item?.submodels?.[0]?.tarification_sum?.uz?.summa || 0;
      const groupLimit = item?.group_limit || 0;
      const exceededCount =
        item?.submodels?.[0]?.exceeded_tarifications?.length || 0;
      const hasRecipe = !!item?.has_recipe;

      return {
        raw: item,
        index: index + 1,
        orderId: String(orderId),
        orderName,
        submodelName,
        quantity,
        sewingOutputQuantity,
        groups,
        monthsText,
        monthValues,
        tarificationSum,
        groupLimit,
        difference: tarificationSum - groupLimit,
        exceededCount,
        hasRecipe,
        technologistStatus: tarificationSum > 0 ? "Bor" : "Yoq",
        groupStatus: groups ? "Bor" : "Yoq",
        monthStatus: monthsText ? "Bor" : "Yoq",
        exceededStatus: exceededCount > 0 ? "Bor" : "Joyida",
        recipeStatus: hasRecipe ? "Bor" : "Yoq",
      };
    });
  }, [data]);

  const uniqueGroups = useMemo(() => {
    const groupSet = new Set();
    normalizedData.forEach((item) => {
      if (item.groups) {
        item.groups.split(", ").forEach((g) => groupSet.add(g));
      }
    });
    const sortedGroups = [...groupSet].sort();
    return [...sortedGroups, "Guruhsiz"];
  }, [normalizedData]);

  const filteredData = useMemo(() => {
    let result = normalizedData.filter((item) => {
      const fullName = `${item.orderName} ${item.submodelName}`.toLowerCase();
      const global = globalSearch.toLowerCase();

      const matchesGlobal =
        !global ||
        item.orderId.toLowerCase().includes(global) ||
        fullName.includes(global) ||
        item.groups.toLowerCase().includes(global) ||
        item.monthsText.toLowerCase().includes(global);

      const matchesName =
        !filters.name || fullName.includes(filters.name.toLowerCase());

      const matchesGroup =
        !filters.group ||
        (filters.group === "Guruhsiz" && !item.groups) ||
        (filters.group !== "Guruhsiz" &&
          item.groups.toLowerCase().includes(filters.group.toLowerCase()));

      const matchesMonth =
        !filters.month || item.monthValues.includes(filters.month);

      const matchesStatus =
        !filters.status ||
        (item.raw?.order?.status && item.raw.order.status === filters.status);

      const matchesSeasonType =
        !filters.seasonType ||
        (item.raw?.order?.season_type &&
          item.raw.order.season_type === filters.seasonType);

      const matchesSeasonYear =
        !filters.seasonYear ||
        (item.raw?.order?.season_year &&
          String(item.raw.order.season_year) === filters.seasonYear);

      const matchesTechnologist =
        !filters.technologistStatus ||
        item.technologistStatus === filters.technologistStatus;

      const matchesLimit =
        !filters.limitStatus ||
        (filters.limitStatus === "Oshgan" &&
          item.tarificationSum > item.groupLimit) ||
        (filters.limitStatus === "Joyida" &&
          item.tarificationSum <= item.groupLimit);

      const matchesSewingOutput =
        !filters.sewingOutputCompare ||
        (filters.sewingOutputCompare === "greater" &&
          item.sewingOutputQuantity > item.quantity) ||
        (filters.sewingOutputCompare === "not_greater" &&
          item.sewingOutputQuantity <= item.quantity);

      const matchesExceeded =
        !filters.exceededStatus ||
        (filters.exceededStatus === "Bor" && item.exceededCount > 0) ||
        (filters.exceededStatus === "Joyida" && item.exceededCount === 0);

      const matchesRecipe =
        !filters.recipeStatus || item.recipeStatus === filters.recipeStatus;

      return (
        matchesGlobal &&
        matchesName &&
        matchesGroup &&
        matchesMonth &&
        matchesStatus &&
        matchesSeasonType &&
        matchesSeasonYear &&
        matchesTechnologist &&
        matchesLimit &&
        matchesSewingOutput &&
        matchesExceeded &&
        matchesRecipe
      );
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "name") {
          aValue = `${a.orderName} ${a.submodelName}`.toLowerCase();
          bValue = `${b.orderName} ${b.submodelName}`.toLowerCase();
        }

        if (sortConfig.key === "month") {
          aValue = a.monthValues?.[0] || "";
          bValue = b.monthValues?.[0] || "";
        }

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [normalizedData, globalSearch, filters, sortConfig]);

  const resetFilters = () => {
    setGlobalSearch("");
    setFilters(defaultFilters);
    setSortConfig({ key: "", direction: "asc" });
    localStorage.removeItem(LS_KEY);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: "asc",
      };
    });
  };

  const stickyBase =
    "sticky bg-inherit backdrop-blur supports-[backdrop-filter]:bg-white/95";
  const stickyHeader =
    "sticky top-0 z-30 bg-slate-100 supports-[backdrop-filter]:bg-slate-100/95";
  const stickyFilterRow =
    "sticky top-[33px] z-20 bg-white supports-[backdrop-filter]:bg-white/95";

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xs font-semibold text-slate-800">
              Buyurtmalar tahlili
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Jami{" "}
              <span className="font-semibold text-slate-800">
                {filteredData.length}
                {filteredData?.reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0,
                ) > 0
                  ? ` (${formatNumber(
                      filteredData?.reduce(
                        (sum, item) => sum + (item.quantity || 0),
                        0,
                      ),
                    )})`
                  : ""}
              </span>{" "}
              ta buyurtma
              {data?.count ? (
                <span className="text-slate-400">
                  {" "}
                  / umumiy {data.count} ta
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex h-8 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Tozalash
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="overflow-auto max-h-[85vh]">
          <table className="min-w-[1550px] w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="h-8 bg-slate-100 text-slate-700">
                <th
                  className={`${stickyHeader} ${stickyBase} left-0 z-40 border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                  style={{ width: 70, minWidth: 70 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("index")}
                    className="flex items-center gap-1"
                  >
                    №
                    <SortIcon field="index" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} ${stickyBase} left-[70px] z-40 border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                  style={{ width: 280, minWidth: 280 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1"
                  >
                    Nomi
                    <SortIcon field="name" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("quantity")}
                    className="flex items-center gap-1"
                  >
                    Miqdori
                    <SortIcon field="quantity" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("sewingOutputQuantity")}
                    className="flex items-center gap-1"
                  >
                    Tikuv chiq.
                    <SortIcon
                      field="sewingOutputQuantity"
                      sortConfig={sortConfig}
                    />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("groups")}
                    className="flex items-center gap-1"
                  >
                    Guruh
                    <SortIcon field="groups" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1"
                  >
                    Holati
                    <SortIcon field="status" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("month")}
                    className="flex items-center gap-1"
                  >
                    Oy
                    <SortIcon field="month" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("seasonYear")}
                    className="flex items-center gap-1"
                  >
                    Yil
                    <SortIcon field="seasonYear" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("seasonType")}
                    className="flex items-center gap-1"
                  >
                    Fasl
                    <SortIcon field="seasonType" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("tarificationSum")}
                    className="flex items-center gap-1"
                  >
                    Texnolog
                    <SortIcon field="tarificationSum" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("groupLimit")}
                    className="flex items-center gap-1"
                  >
                    Limit
                    <SortIcon field="groupLimit" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("difference")}
                    className="flex items-center gap-1"
                  >
                    Farq
                    <SortIcon field="difference" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("exceededCount")}
                    className="flex items-center gap-1"
                  >
                    Qozixona
                    <SortIcon field="exceededCount" sortConfig={sortConfig} />
                  </button>
                </th>

                <th
                  className={`${stickyHeader} border-b border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("hasRecipe")}
                    className="flex items-center gap-1"
                  >
                    Detallar
                    <SortIcon field="hasRecipe" sortConfig={sortConfig} />
                  </button>
                </th>
              </tr>

              <tr className="h-[40px] bg-white">
                <th
                  className={`${stickyFilterRow} ${stickyBase} left-0 z-30 border-b border-r border-slate-200 px-1.5 py-1.5`}
                  style={{ width: 70, minWidth: 70 }}
                />

                <th
                  className={`${stickyFilterRow} ${stickyBase} left-[70px] z-30 border-b border-r border-slate-200 px-1.5 py-1.5`}
                  style={{ width: 280, minWidth: 280 }}
                >
                  <input
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    placeholder="Nomi..."
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  />
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                />

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.sewingOutputCompare}
                    onChange={(e) =>
                      handleFilterChange("sewingOutputCompare", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    <option value="greater">Ko'p</option>
                    <option value="not_greater">Kam/teng</option>
                  </select>
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.group}
                    onChange={(e) =>
                      handleFilterChange("group", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    {uniqueGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    {Object.entries(statuses).map(([key, status]) => (
                      <option key={key} value={key}>
                        {status.text}
                      </option>
                    ))}
                  </select>
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <input
                    type="month"
                    value={filters.month}
                    onChange={(e) =>
                      handleFilterChange("month", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  />
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <input
                    type="number"
                    placeholder="Yil..."
                    value={filters.seasonYear}
                    onChange={(e) =>
                      handleFilterChange("seasonYear", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  />
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.seasonType}
                    onChange={(e) =>
                      handleFilterChange("seasonType", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    <option value="winter">Qish</option>
                    <option value="summer">Bahor</option>
                  </select>
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.technologistStatus}
                    onChange={(e) =>
                      handleFilterChange("technologistStatus", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    <option value="Bor">Bor</option>
                    <option value="Yoq">Yo'q</option>
                  </select>
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.limitStatus}
                    onChange={(e) =>
                      handleFilterChange("limitStatus", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    <option value="Oshgan">Oshgan</option>
                    <option value="Joyida">Joyida</option>
                  </select>
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                />

                <th
                  className={`${stickyFilterRow} border-b border-r border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.exceededStatus}
                    onChange={(e) =>
                      handleFilterChange("exceededStatus", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    <option value="Bor">Bor</option>
                    <option value="Joyida">Joyida</option>
                  </select>
                </th>

                <th
                  className={`${stickyFilterRow} border-b border-slate-200 px-1.5 py-1.5`}
                >
                  <select
                    value={filters.recipeStatus}
                    onChange={(e) =>
                      handleFilterChange("recipeStatus", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Barchasi</option>
                    <option value="Bor">Bor</option>
                    <option value="Yoq">Yo'q</option>
                  </select>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-3 py-6 text-center text-xs text-slate-500"
                  >
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, rowIndex) => {
                  const order = item.raw;
                  const exceeded = item.tarificationSum > item.groupLimit;
                  const rowBg =
                    rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60";

                  return (
                    <tr
                      key={`${item.orderId}-${rowIndex}`}
                      className="hover:bg-blue-50/40 transition"
                    >
                      <td
                        className={`${stickyBase} left-0 z-20 border-b border-r border-slate-200 px-2 py-2 font-medium text-slate-600 ${rowBg} text-center`}
                        style={{ width: 70, minWidth: 70 }}
                      >
                        {rowIndex + 1}
                      </td>

                      <td
                        className={`${stickyBase} left-[70px] z-20 border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                        style={{ width: 280, minWidth: 280 }}
                      >
                        <div className="space-y-1">
                          <Link
                            to={`/internalAccountant/manual/work/${item.orderId}`}
                            className="font-medium text-slate-800"
                          >
                            <span className="text-slate-500">
                              #{item.orderId}{" "}
                            </span>
                            - {item.orderName || "-"}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {item.submodelName || "-"}
                          </div>
                        </div>
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 font-medium text-slate-700 ${rowBg}`}
                      >
                        {formatNumber(item.quantity)}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 font-medium ${rowBg} ${item.sewingOutputQuantity > item.quantity ? "text-red-600" : ` text-slate-700`}`}
                      >
                        {formatNumber(item.sewingOutputQuantity)}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        <Link to={`/internalAccountant/work/${item.orderId}`}>
                          {item.groups ? (
                            <div className="whitespace-nowrap">
                              {item.groups.split(", ").map((group) => (
                                <Badge key={group} variant="gray">
                                  {group}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <AlertMessage message="Yo'q" />
                          )}
                        </Link>
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {item.raw?.order?.status ? (
                          <span
                            className={`text-white px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                              statuses[item.raw.order.status]?.color
                            }`}
                          >
                            {statuses[item.raw.order.status]?.text || "-"}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {order.selected_months?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {order.selected_months.map((month, idx) => (
                              <Badge key={idx} variant="blue">
                                {getMonthLabel(month.month)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <AlertMessage message="Yo'q" />
                        )}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {item.raw?.order?.season_year ? (
                          <span className="font-medium text-slate-700">
                            {item.raw.order.season_year}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {item.raw?.order?.season_type ? (
                          <Badge
                            variant={
                              item.raw.order.season_type === "winter"
                                ? "blue"
                                : "green"
                            }
                          >
                            {item.raw.order.season_type === "winter"
                              ? "Qish"
                              : "Bahor"}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {item.tarificationSum > 0 ? (
                          <Badge variant="green">
                            {formatNumber(item.tarificationSum)}
                          </Badge>
                        ) : (
                          <AlertMessage message="Yo'q" />
                        )}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 font-medium text-slate-700 ${rowBg}`}
                      >
                        {formatNumber(item.groupLimit)}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {exceeded ? (
                          <AlertMessage
                            message={formatNumber(item.difference)}
                          />
                        ) : (
                          <Badge variant="green">
                            {formatNumber(item.tarificationSum)}
                          </Badge>
                        )}
                      </td>

                      <td
                        className={`border-b border-r border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {item.exceededCount > 0 ? (
                          <AlertMessage message={item.exceededCount} />
                        ) : (
                          <Badge variant="green">Joyida</Badge>
                        )}
                      </td>

                      <td
                        className={`border-b border-slate-200 px-2 py-2 ${rowBg}`}
                      >
                        {item.hasRecipe ? (
                          <Badge variant="green">Bor</Badge>
                        ) : (
                          <AlertMessage message="Yo'q" />
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={14}
                    className="px-3 py-6 text-center text-xs text-slate-500"
                  >
                    Hech narsa topilmadi
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

export default Analysis;

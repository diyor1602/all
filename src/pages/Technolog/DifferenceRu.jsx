import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import formatNumber from "@/utils/formatNumber";

const DifferenceRu = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    setLoading(true);
    api
      .get("/technologist/new/orders")
      .then((res) => {
        setData(res.data?.data || []);
      })
      .catch(() => {
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при загрузке",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const processedData = useMemo(() => {
    let filtered = [...data];

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((item) => {
        const order = item.order || {};
        const sub = item.submodels?.[0]?.submodel || {};

        return (
          order.name?.toLowerCase().includes(lower) ||
          String(order.quantity || "").includes(lower) ||
          String(order.season_year || "").includes(lower) ||
          (order.season_type === "winter" ? "зима" : "весна").includes(lower) ||
          sub.model_name?.toLowerCase().includes(lower) ||
          sub.submodel_name?.toLowerCase().includes(lower)
        );
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const getValue = (item) => {
          const order = item.order || {};
          const sub = item.submodels?.[0] || {};

          switch (sortConfig.key) {
            case "quantity":
              return order.quantity || 0;
            case "year":
              return order.season_year || 0;
            case "season":
              return order.season_type || "";
            case "model":
              return sub.submodel?.model_name || "";
            case "group_limit":
              return item.group_limit || 0;
            case "uz":
              return sub.tarification_sum?.uz?.summa || 0;
            case "ru":
              return sub.tarification_sum?.ru?.summa || 0;
            case "group_limit_diff":
              return (
                (item.group_limit || 0) - (sub.tarification_sum?.uz?.summa || 0)
              );
            case "ru_uz_diff":
              return (
                (sub.tarification_sum?.ru?.summa || 0) -
                (sub.tarification_sum?.uz?.summa || 0)
              );
            default:
              return "";
          }
        };

        const aVal = getValue(a);
        const bVal = getValue(b);

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, search, sortConfig]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Сравнение тарифов</h1>
        <Input
          placeholder="Поиск (заказ, модель, сезон...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-80"
        />
      </div>

      {loading ? (
        <div className="w-full h-[70vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <div className="overflow-auto border rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">№</th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("model")}
                >
                  Модель <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("quantity")}
                >
                  Кол-во <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("year")}
                >
                  Год <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("season")}
                >
                  Сезон <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("group_limit")}
                >
                  Расход <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("uz")}
                >
                  UZ <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("ru")}
                >
                  RU <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("group_limit_diff")}
                >
                  Расход - UZ <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th
                  className="p-3 cursor-pointer"
                  onClick={() => handleSort("ru_uz_diff")}
                >
                  RU - UZ <ArrowUpDown size={14} className="inline ml-1" />
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((item, index) => {
                const order = item.order || {};
                const sub = item.submodels?.[0] || {};

                return (
                  <tr key={index} className="border-t hover:bg-muted/40">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      {sub.submodel?.model_name || "-"}{" "}
                      {sub.submodel?.submodel_name || ""}
                    </td>
                    <td className="p-3">{order.quantity || "-"}</td>
                    <td className="p-3">{order.season_year || "-"}</td>
                    <td className="p-3">
                      {order.season_type ? (
                        <Badge
                          variant={
                            order.season_type === "winter" ? "blue" : "green"
                          }
                        >
                          {order.season_type === "winter" ? "Зима" : "Весна"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3">{formatNumber(item.group_limit)}</td>
                    <td className="p-3">
                      {formatNumber(sub.tarification_sum?.uz?.summa)}
                    </td>
                    <td className="p-3">
                      {formatNumber(sub.tarification_sum?.ru?.summa)}
                    </td>
                    <td className="p-3">
                      {formatNumber(
                        (item.group_limit || 0) -
                          (sub.tarification_sum?.uz?.summa || 0),
                      )}
                    </td>
                    <td className="p-3">
                      {formatNumber(
                        (sub.tarification_sum?.ru?.summa || 0) -
                          (sub.tarification_sum?.uz?.summa || 0),
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {processedData.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DifferenceRu;

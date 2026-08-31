import { useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import formatNumber from "@/utils/formatNumber";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Calendar, RefreshCcw, Package, Diff, Image } from "lucide-react";

const seasonTypes = [
  { value: "summer", label: "Bahor" },
  { value: "winter", label: "Qish" },
];

const getSeasonLabel = (year, type) => {
  const typeLabel = type === "summer" ? "Bahor" : "Qish";
  return `${year} ${typeLabel}`;
};

const getSimilarityStyle = (percent) => {
  if (percent >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (percent >= 60) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
};

const OrderColumn = ({ title, order, badgeClass }) => {
  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-400 border border-dashed rounded-lg">
        Ma'lumot yo'q
      </div>
    );
  }

  const images = order.images || [];

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
          {title}
        </Badge>
      </div>

      <div className="p-3 rounded-lg border bg-white">
        <p className="text-sm font-semibold text-slate-800">
          {order.order_name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          ID: {order.order_id} · {formatNumber(order.quantity)} dona
        </p>

        {images.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img?.image || img}
                alt="-"
                className="w-12 h-12 object-cover rounded border"
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {order.models?.map((model) => (
          <div
            key={model.order_model_id}
            className="rounded-lg border overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b">
              <p className="text-xs font-medium text-slate-600">
                Model #{model.model_id}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Reja: {formatNumber(model.planned_minute)} daq
                </span>
                <span className="text-xs text-slate-500">
                  Rasxod: {formatNumber(model.rasxod)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Guruh</TableHead>
                    <TableHead className="text-xs text-right">
                      Kunlik o'rtacha
                    </TableHead>
                    <TableHead className="text-xs text-right">Jami</TableHead>
                    <TableHead className="text-xs text-right">
                      Ish kuni
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      O'rtacha ishchi
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      Sekund
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      Summa
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {model.submodels?.map((sub) => (
                    <TableRow key={sub.submodel_id}>
                      <TableCell className="text-xs font-medium text-slate-700">
                        {sub.group_name}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {formatNumber(sub.avg_daily_quantity)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {formatNumber(sub.total_quantity)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {formatNumber(sub.production_days)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {sub.avg_worker_count != null
                          ? formatNumber(sub.avg_worker_count)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {sub.actual_seconds != null
                          ? formatNumber(sub.actual_seconds)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {sub.actual_summa != null
                          ? formatNumber(sub.actual_summa)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SeasonDifference = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [oldYear, setOldYear] = useState(() => {
    const saved = localStorage.getItem("seasonDiffOldYear");
    return saved || "2025";
  });
  const [oldType, setOldType] = useState(() => {
    const saved = localStorage.getItem("seasonDiffOldType");
    return saved || "winter";
  });
  const [newYear, setNewYear] = useState(() => {
    const saved = localStorage.getItem("seasonDiffNewYear");
    return saved || "2026";
  });
  const [newType, setNewType] = useState(() => {
    const saved = localStorage.getItem("seasonDiffNewType");
    return saved || "winter";
  });
  const [minSimilarity, setMinSimilarity] = useState(() => {
    const saved = localStorage.getItem("seasonDiffMinSimilarity");
    return saved || "55";
  });

  const persist = (key, value) => localStorage.setItem(key, value);

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("ceo/seasonOrderComparison", {
        params: {
          old_season_year: oldYear,
          old_season_type: oldType,
          new_season_year: newYear,
          new_season_type: newType,
          min_similarity: minSimilarity,
        },
      });
      setData(res.data?.data || []);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const handleSearch = () => {
    persist("seasonDiffOldYear", oldYear);
    persist("seasonDiffOldType", oldType);
    persist("seasonDiffNewYear", newYear);
    persist("seasonDiffNewType", newType);
    persist("seasonDiffMinSimilarity", minSimilarity);
    getData();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTERS */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Diff size={18} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Mavsum farqi</h2>
        </div>

        <div className="flex flex-wrap items-end gap-4 bg-white shadow-sm border p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Eski mavsum:
            </span>
            <Input
              type="number"
              value={oldYear}
              onChange={(e) => setOldYear(e.target.value)}
              className="w-24 h-9 text-xs"
              min="2000"
              max="2100"
            />
            <Select value={oldType} onValueChange={setOldType}>
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="Mavsum" />
              </SelectTrigger>
              <SelectContent>
                {seasonTypes.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Yangi mavsum:
            </span>
            <Input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="w-24 h-9 text-xs"
              min="2000"
              max="2100"
            />
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="Mavsum" />
              </SelectTrigger>
              <SelectContent>
                {seasonTypes.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">
              Min. o'xshashlik (%):
            </span>
            <Input
              type="number"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(e.target.value)}
              className="w-20 h-9 text-xs"
              min="0"
              max="100"
            />
          </div>

          <Button
            size="sm"
            onClick={handleSearch}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 px-3 text-xs h-9"
          >
            <RefreshCcw
              size={14}
              className={`${loading ? "animate-spin" : ""} mr-1`}
            />
            {loading ? "Yuklanmoqda..." : "Qidirish"}
          </Button>
        </div>
      </header>

      {/* RESULTS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">
            Ma'lumotlar yuklanmoqda...
          </p>
        </div>
      ) : data.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {data.length} ta o'xshash buyurtma juftligi topildi
          </p>
          {data.map((item, idx) => (
            <Card key={idx} className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package size={16} className="text-indigo-600" />
                    Buyurtma taqqoslash
                  </CardTitle>
                  <Badge
                    className={`text-xs border ${getSimilarityStyle(
                      item.similarity_percent,
                    )}`}
                  >
                    O'xshashlik: {item.similarity_percent?.toFixed
                      ? item.similarity_percent.toFixed(1)
                      : item.similarity_percent}
                    %
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {getSeasonLabel(oldYear, oldType)} → {getSeasonLabel(newYear, newType)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  <OrderColumn
                    title="Eski"
                    order={item.old}
                    badgeClass="bg-slate-100 text-slate-600 border-slate-200"
                  />
                  <Separator
                    orientation="vertical"
                    className="hidden lg:block h-auto"
                  />
                  <OrderColumn
                    title="Yangi"
                    order={item.new}
                    badgeClass="bg-indigo-100 text-indigo-700 border-indigo-200"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 space-y-3">
          <Image size={32} className="text-slate-300" />
          <p className="text-slate-500 font-medium text-sm">
            {hasSearched
              ? "Mos buyurtmalar topilmadi"
              : "Filtrlarni tanlab qidiring"}
          </p>
        </div>
      )}
    </div>
  );
};

export default SeasonDifference;

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import formatNumber from "@/utils/formatNumber";
import ModelImages from "@/components/ModelImages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Calendar,
  Package,
  Diff,
  Sparkles,
  Search,
  ArrowRight,
  Percent,
  Clock,
  Wallet,
  TrendingUp,
  Lightbulb,
  SearchX,
  Users,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const seasonTypes = [
  { value: "summer", label: "Bahor" },
  { value: "winter", label: "Qish" },
];

const getSeasonLabel = (year, type) => {
  const typeLabel = type === "summer" ? "Bahor" : "Qish";
  return `${year} ${typeLabel}`;
};

const getSimilarityStyle = (percent) => {
  if (percent >= 80)
    return {
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      border: "border-l-emerald-400",
      ring: "from-emerald-500/10",
    };
  if (percent >= 60)
    return {
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      border: "border-l-amber-400",
      ring: "from-amber-500/10",
    };
  return {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    border: "border-l-rose-400",
    ring: "from-rose-500/10",
  };
};

const columnThemes = {
  old: {
    badge: "bg-slate-200 text-slate-700 border-slate-300",
    card: "border-slate-200 bg-slate-50/70",
    modelHeader: "bg-slate-100 border-slate-200",
    tableHead: "bg-slate-50",
    rowHover: "hover:bg-slate-50/80",
    accent: "text-slate-500",
  },
  new: {
    badge: "bg-indigo-600 text-white border-indigo-600",
    card: "border-indigo-200 bg-indigo-50/50",
    modelHeader: "bg-indigo-50 border-indigo-100",
    tableHead: "bg-indigo-50/60",
    rowHover: "hover:bg-indigo-50/60",
    accent: "text-indigo-500",
  },
};

const ModelImagesToggle = ({ modelCode }) => {
  const [show, setShow] = useState(false);

  if (!modelCode) return null;

  if (show) {
    return <ModelImages modelCode={modelCode} />;
  }

  return (
    <button
      onClick={() => setShow(true)}
      title="Rasmlarni yuklash"
      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
    >
      <ImageIcon size={12} />
      Rasm
    </button>
  );
};

const OrderColumn = ({ title, order, theme }) => {
  const t = columnThemes[theme];

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const images = order?.images || [];
  const getImageSrc = (img) => img?.image || img;

  const openGalleryAt = (idx) => {
    setSelectedIndex(idx);
    setGalleryOpen(true);
  };

  const nextImage = () =>
    setSelectedIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    if (!galleryOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextImage();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "Escape") setGalleryOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen, images.length]);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/40">
        <Package size={22} className="text-slate-300" />
        Ma'lumot yo'q
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <Badge className={`text-xs border ${t.badge}`}>{title}</Badge>
      </div>

      <div className={`p-3 rounded-xl border ${t.card}`}>
        <p className="text-sm font-semibold text-slate-800">
          {order.order_name}
        </p>
        <p className={`text-xs mt-0.5 ${t.accent}`}>
          ID: {order.order_id} · {formatNumber(order.quantity)} dona
          {order.price != null && (
            <>
              {" "}
              ·{" "}
              <span className="font-semibold text-emerald-600">
                {formatNumber(order.price)} $
              </span>
            </>
          )}
        </p>

        {images.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={getImageSrc(img)}
                alt="-"
                onClick={() => openGalleryAt(idx)}
                className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
              />
            ))}
          </div>
        )}

        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogContent className="max-w-3xl w-full p-0 bg-white rounded-2xl overflow-hidden flex flex-col items-center justify-center pb-6">
            <DialogHeader className="p-4 border-b border-gray-200 w-full">
              <DialogTitle className="text-lg font-semibold text-center">
                {order.order_name}
              </DialogTitle>
            </DialogHeader>

            <div className="relative flex items-center justify-center bg-gray-50 w-full h-[500px]">
              {images.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={getImageSrc(images[selectedIndex])}
                alt="-"
                className="max-h-full max-w-full object-contain rounded-md shadow-md"
              />

              {images.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 bg-black/40 text-white text-sm px-3 py-1 rounded-full">
                  {selectedIndex + 1} / {images.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-2">
          <ModelImagesToggle modelCode={order.order_name} />
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {order.models?.map((model) => (
          <div
            key={model.order_model_id}
            className="rounded-xl border border-slate-200 overflow-hidden shadow-sm"
          >
            <div
              className={`flex items-center justify-between px-3 py-2 border-b ${t.modelHeader}`}
            >
              <p className="text-xs font-semibold text-slate-700">
                Model #{model.model_id}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Daqiqa: {formatNumber(model.planned_minute)} daq
                </span>
                <span className="text-xs text-slate-500">
                  Chok: {formatNumber(model.rasxod)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={`text-xs ${t.tableHead}`}>
                      Guruh
                    </TableHead>
                    <TableHead className={`text-xs text-right ${t.tableHead}`}>
                      Kunlik o'rtacha
                    </TableHead>
                    <TableHead className={`text-xs text-right ${t.tableHead}`}>
                      Jami
                    </TableHead>
                    <TableHead className={`text-xs text-right ${t.tableHead}`}>
                      Ish kuni
                    </TableHead>
                    <TableHead className={`text-xs text-right ${t.tableHead}`}>
                      O'rtacha ishchi
                    </TableHead>
                    <TableHead className={`text-xs text-right ${t.tableHead}`}>
                      Sekund
                    </TableHead>
                    <TableHead className={`text-xs text-right ${t.tableHead}`}>
                      Summa
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {model.submodels?.map((sub) => (
                    <TableRow key={sub.submodel_id} className={t.rowHover}>
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
                      <TableCell className="text-xs text-right font-medium text-slate-700">
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

  const [aiRecommendations, setAiRecommendations] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  const [modelSearch, setModelSearch] = useState("");

  const [groups, setGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState(() => {
    try {
      const saved = localStorage.getItem("seasonDiffGroupIds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persist = (key, value) => localStorage.setItem(key, value);

  const fetchGroups = async () => {
    try {
      const res = await api.get("ceo/departments");
      const departments = res.data?.flatMap((item) => item?.departments) || [];
      const allGroups = departments.flatMap((dept) => dept?.groups || []);
      const uniqueGroups = Array.from(
        new Map(allGroups.map((g) => [g.id, g])).values(),
      ).sort((a, b) => a.name.localeCompare(b.name));
      setGroups(uniqueGroups);
    } catch {
      // guruhlar ro'yxati ixtiyoriy filtr, xatolik bo'lsa filtr ko'rsatilmaydi
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleGroup = (id) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const clearGroups = () => setSelectedGroupIds([]);

  const getAiRecommendation = async (idx, item) => {
    const old_order_id = item.old?.order_id;
    const new_order_id = item.new?.order_id;
    if (!old_order_id || !new_order_id) return;

    setAiLoading((prev) => ({ ...prev, [idx]: true }));
    try {
      const res = await api.post("ceo/seasonOrderComparison/ai-recommend", {
        old_order_id,
        new_order_id,
      });
      setAiRecommendations((prev) => ({
        ...prev,
        [idx]: res.data?.data ?? res.data,
      }));
    } catch {
      toast({
        title: "Xatolik",
        description: "AI tavsiyasini olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setAiLoading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const aiSections = [
    {
      key: "oxshashlik_bahosi",
      label: "O'xshashlik bahosi",
      icon: Percent,
      color: "text-blue-600 bg-blue-100",
    },
    {
      key: "vaqt_tahlili",
      label: "Vaqt tahlili",
      icon: Clock,
      color: "text-amber-600 bg-amber-100",
    },
    {
      key: "xarajat_tahlili",
      label: "Xarajat tahlili",
      icon: Wallet,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      key: "unumdorlik_ozgarishi",
      label: "Unumdorlik o'zgarishi",
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-100",
    },
    {
      key: "tavsiya",
      label: "Tavsiya",
      icon: Lightbulb,
      color: "text-white bg-amber-500",
    },
  ];

  const formatAiValue = (value) =>
    value === "malumot_yetarli_emas" ? "Ma'lumot yetarli emas" : value;

  const orderHasSelectedGroup = (order) =>
    (order?.models || []).some((model) =>
      (model.submodels || []).some((sub) =>
        selectedGroupIds.includes(sub.group_id),
      ),
    );

  const filteredData = data.filter((item) => {
    const query = modelSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.old?.order_name?.toLowerCase().includes(query) ||
      item.new?.order_name?.toLowerCase().includes(query);

    const matchesGroup =
      selectedGroupIds.length === 0 ||
      orderHasSelectedGroup(item.old) ||
      orderHasSelectedGroup(item.new);

    return matchesSearch && matchesGroup;
  });

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
    persist("seasonDiffGroupIds", JSON.stringify(selectedGroupIds));
    getData();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 shadow-lg shadow-indigo-200">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-6 -bottom-10 w-40 h-40 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
            <Diff size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mavsum farqi</h2>
            <p className="text-indigo-100 text-sm mt-0.5">
              Ikki mavsumdagi o'xshash buyurtmalarni solishtiring va AI
              tahlilidan foydalaning
            </p>
          </div>
        </div>
      </header>

      {/* FILTERS */}
      <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <Calendar size={16} className="text-slate-400 shrink-0" />
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
              Eski mavsum:
            </span>
            <Input
              type="number"
              value={oldYear}
              onChange={(e) => setOldYear(e.target.value)}
              className="w-24 h-9 text-xs bg-white"
              min="2000"
              max="2100"
            />
            <Select value={oldType} onValueChange={setOldType}>
              <SelectTrigger className="w-28 h-9 text-xs bg-white">
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

          <ArrowRight size={18} className="text-slate-300 hidden md:block" />

          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <Calendar size={16} className="text-indigo-400 shrink-0" />
            <span className="text-sm font-medium text-indigo-700 whitespace-nowrap">
              Yangi mavsum:
            </span>
            <Input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="w-24 h-9 text-xs bg-white"
              min="2000"
              max="2100"
            />
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-28 h-9 text-xs bg-white">
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

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Percent size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm font-medium text-amber-700 whitespace-nowrap">
              Min. o'xshashlik:
            </span>
            <Input
              type="number"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(e.target.value)}
              className="w-20 h-9 text-xs bg-white"
              min="0"
              max="100"
            />
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Model nomi bo'yicha qidirish..."
              className="h-11 text-xs pl-9 bg-slate-50 border-slate-200"
            />
            {modelSearch && (
              <button
                onClick={() => setModelSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleSearch}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-4 text-xs h-11 shadow-md shadow-indigo-200"
          >
            <Search size={14} className="mr-1.5" />
            {loading ? "Yuklanmoqda..." : "Qidirish"}
          </Button>
        </div>

        {groups.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Users size={14} className="text-slate-400" />
                Guruhlar
                {selectedGroupIds.length > 0 && (
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] h-4 px-1.5">
                    {selectedGroupIds.length}
                  </Badge>
                )}
              </div>
              {selectedGroupIds.length > 0 && (
                <button
                  onClick={clearGroups}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={12} />
                  Tozalash
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => {
                const active = selectedGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {group.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RESULTS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">
            Ma'lumotlar yuklanmoqda...
          </p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="space-y-5">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-100">
            <Package size={13} />
            {filteredData.length} ta o'xshash buyurtma juftligi topildi
            {(modelSearch.trim() || selectedGroupIds.length > 0) &&
              filteredData.length !== data.length &&
              ` (jami ${data.length} tadan)`}
          </div>
          {filteredData.map((item, idx) => {
            const sim = getSimilarityStyle(item.similarity_percent);
            return (
              <Card
                key={idx}
                className={`shadow-sm border-slate-200 border-l-4 ${sim.border} rounded-xl overflow-hidden`}
              >
                <CardHeader
                  className={`pb-3 bg-gradient-to-r ${sim.ring} to-transparent`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
                      <Package size={16} className="text-indigo-600" />
                      Buyurtma taqqoslash
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs border font-semibold ${sim.badge}`}
                      >
                        O'xshashlik:{" "}
                        {item.similarity_percent?.toFixed
                          ? item.similarity_percent.toFixed(1)
                          : item.similarity_percent}
                        %
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => getAiRecommendation(idx, item)}
                        disabled={!item.old || !item.new || aiLoading[idx]}
                        className="h-7 px-2.5 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm"
                      >
                        <Sparkles
                          size={12}
                          className={`mr-1 ${aiLoading[idx] ? "animate-pulse" : ""}`}
                        />
                        {aiLoading[idx] ? "Tahlil qilinmoqda..." : "AI tavsiya"}
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1.5">
                    <span className="font-medium text-slate-500">
                      {getSeasonLabel(oldYear, oldType)}
                    </span>
                    <ArrowRight size={11} className="text-slate-400" />
                    <span className="font-medium text-indigo-600">
                      {getSeasonLabel(newYear, newType)}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-4 mt-3">
                    <OrderColumn title="Eski" order={item.old} theme="old" />

                    <div className="hidden lg:flex items-center justify-center">
                      <div className="p-1.5 rounded-full bg-slate-100 border border-slate-200">
                        <ArrowRight size={14} className="text-slate-400" />
                      </div>
                    </div>

                    <OrderColumn title="Yangi" order={item.new} theme="new" />
                  </div>

                  {aiRecommendations[idx] && (
                    <div className="mt-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-violet-50/60 to-white p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                          AI tahlili
                        </span>
                      </div>
                      {aiSections.map(({ key, label, icon: Icon, color }) => {
                        const value = aiRecommendations[idx]?.[key];
                        if (!value) return null;
                        const isTavsiya = key === "tavsiya";
                        return (
                          <div
                            key={key}
                            className={
                              isTavsiya
                                ? "rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3"
                                : ""
                            }
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`p-1 rounded-md ${color} flex items-center justify-center`}
                              >
                                <Icon size={11} />
                              </span>
                              <p className="text-xs font-semibold text-slate-700">
                                {label}
                              </p>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                              {formatAiValue(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 space-y-3">
          <div className="p-4 rounded-full bg-slate-100">
            <SearchX size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-sm">
            {hasSearched
              ? data.length > 0
                ? "Filtrga mos buyurtma topilmadi"
                : "Mos buyurtmalar topilmadi"
              : "Filtrlarni tanlab qidiring"}
          </p>
        </div>
      )}
    </div>
  );
};

export default SeasonDifference;

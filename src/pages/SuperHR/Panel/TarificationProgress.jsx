import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Users, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const getColors = (pct) => {
  if (pct > 100)
    return {
      bar: "bg-purple-500",
      border: "border-purple-200",
      bg: "bg-purple-50",
      text: "text-purple-700",
    };
  if (pct >= 100)
    return {
      bar: "bg-green-500",
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
    };
  if (pct >= 80)
    return {
      bar: "bg-lime-400",
      border: "border-lime-200",
      bg: "bg-lime-50",
      text: "text-lime-700",
    };
  if (pct >= 50)
    return {
      bar: "bg-amber-400",
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-700",
    };
  if (pct > 0)
    return {
      bar: "bg-red-400",
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-600",
    };
  return {
    bar: "bg-gray-300",
    border: "border-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-400",
  };
};

const TarificationProgress = ({ orderId, submodelId }) => {
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [selectedSubmodel, setSelectedSubmodel] = useState(null);
  const [region, setRegion] = useState(
    localStorage.getItem("tarifLang") || "uz",
  );
  const [tarifications, setTarifications] = useState([]);
  const [tarifLogs, setTarifLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    setOrderLoading(true);
    api
      .get(`/superhr/orders/${orderId}`)
      .then((res) => {
        setOrder(res.data);
        setSelectedSubmodel(res.data?.order_model?.submodels?.[0] || null);
      })
      .catch(() =>
        toast({
          title: "Xatolik",
          description: "Buyurtma topilmadi",
          variant: "destructive",
        }),
      )
      .finally(() => setOrderLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!selectedSubmodel?.id) return;
    setSelectedCategory(null);
    setDataLoading(true);
    Promise.all([
      api.get(`/superhr/tarifications`, {
        params: { submodel_id: selectedSubmodel.id, region },
      }),
      api.get(`/superhr/tarificationLogs`, {
        params: { submodel_id: selectedSubmodel.id, region },
      }),
      api.get(`/superhr/tarification/category/${submodelId}`),
    ])
      .then(([tarRes, logRes, catRes]) => {
        setTarifications(tarRes.data.tarifications || []);
        setTarifLogs(logRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch(() =>
        toast({
          title: "Xatolik",
          description: "Tariflar topilmadi",
          variant: "destructive",
        }),
      )
      .finally(() => setDataLoading(false));
  }, [selectedSubmodel, region]);

  const enriched = useMemo(() => {
    const grouped = {};
    tarifLogs.forEach((log) => {
      const id = log.tarification?.id;
      if (!id) return;
      if (!grouped[id]) grouped[id] = {};
      const name = log.employee?.name || "Noma'lum";
      grouped[id][name] = (grouped[id][name] || 0) + Number(log.quantity || 0);
    });

    const qty = order?.quantity || 0;
    return tarifications
      .map((t) => {
        const done = t.total_quantity || 0;
        const pct = qty > 0 ? (done / qty) * 100 : 0;
        const employees = Object.entries(grouped[t.id] || {})
          .sort(([, a], [, b]) => b - a)
          .map(([name, quantity]) => ({ name, quantity }));
        return { ...t, done, pct, employees };
      })
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
  }, [tarifications, tarifLogs, order]);

  const enrichedCategories = useMemo(() => {
    const enrichedById = Object.fromEntries(enriched.map((t) => [t.id, t]));
    return categories.map((cat) => {
      const tarifs = cat.tarifications
        .map((t) => enrichedById[t.id])
        .filter(Boolean)
        .sort((a, b) =>
          a.code.localeCompare(b.code, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );
      const avgPct =
        tarifs.length > 0
          ? tarifs.reduce((sum, t) => sum + t.pct, 0) / tarifs.length
          : 0;
      return { ...cat, tarifs, avgPct };
    });
  }, [categories, enriched]);

  const displayTarifs = selectedCategory ? selectedCategory.tarifs : [];

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedTarif?.code} — {selectedTarif?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {selectedTarif?.done} / {order?.quantity} ta (
              {Math.round(selectedTarif?.pct || 0)}%)
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto">
            {selectedTarif?.employees?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-400 text-xs">
                    <th className="pb-2 font-medium">Xodim</th>
                    <th className="pb-2 font-medium text-right">Miqdor</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTarif.employees.map((emp, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{emp.name}</td>
                      <td className="py-2 text-right font-semibold">
                        {emp.quantity} ta
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                <Users className="w-8 h-8" />
                <p className="text-sm">Hali hech kim bajarmagan</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {order?.order_model?.submodels?.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {order.order_model.submodels.map((sub) => (
              <Button
                key={sub.submodel?.id}
                size="sm"
                variant={
                  selectedSubmodel?.submodel?.id === sub.submodel?.id
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedSubmodel(sub)}
              >
                {sub.submodel?.name}
              </Button>
            ))}
          </div>
        )}

        {dataLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : selectedCategory ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 px-2"
                onClick={() => setSelectedCategory(null)}
              >
                <ChevronLeft className="w-4 h-4" />
                Orqaga
              </Button>
              <span className="text-sm font-semibold text-gray-700">
                {selectedCategory.name}
              </span>
              <span className="text-xs text-gray-400">
                ({displayTarifs.length} tarif)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayTarifs.length > 0 ? (
                displayTarifs
                  .sort((a, b) => b.number - a.number)
                  .map((tarif) => {
                    const pct = Math.round(tarif.pct);
                    const colors = getColors(pct);
                    return (
                      <div
                        key={tarif.id}
                        className={cn(
                          "rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow select-none",
                          colors.bg,
                          colors.border,
                        )}
                        onClick={() => {
                          setSelectedTarif(tarif);
                          setDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1 gap-1">
                          <span className="font-mono text-xs font-semibold text-gray-600 truncate">
                            {tarif.code}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold shrink-0",
                              colors.text,
                            )}
                          >
                            {pct}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mb-2 leading-tight">
                          {tarif.name}
                        </p>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              colors.bar,
                            )}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {tarif.done} / {order?.quantity} ta
                        </p>
                      </div>
                    );
                  })
              ) : (
                <p className="col-span-full text-center text-gray-400 py-8">
                  Bu kategoriyada tariflar topilmadi
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {enrichedCategories.length > 0 ? (
              enrichedCategories.map((cat) => {
                const pct = Math.round(cat.avgPct);
                const colors = getColors(pct);
                const doneTarifs = cat.tarifs.filter(
                  (t) => t.pct >= 100,
                ).length;
                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow select-none",
                      colors.bg,
                      colors.border,
                    )}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className="flex items-center justify-between mb-1 gap-1">
                      <span
                        className={cn(
                          "text-xs font-bold shrink-0",
                          colors.text,
                        )}
                      >
                        {pct}%
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {doneTarifs}/{cat.tarifs.length} tarif
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate mb-2 leading-tight">
                      {cat.name}
                    </p>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          colors.bar,
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                      o'rtacha {pct}% bajarilgan
                    </p>
                  </div>
                );
              })
            ) : enriched.length > 0 ? (
              // fallback: categories not available, show all tarifs
              <p className="col-span-full text-center text-gray-400 py-4 text-sm">
                Kategoriyalar topilmadi
              </p>
            ) : (
              <p className="col-span-full text-center text-gray-400 py-8">
                Tariflar topilmadi
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1 text-xs text-gray-500">
          {[
            { label: "Boshlanmagan", bar: "bg-gray-300" },
            { label: "1–49%", bar: "bg-red-400" },
            { label: "50–79%", bar: "bg-amber-400" },
            { label: "80–99%", bar: "bg-lime-400" },
            { label: "100%", bar: "bg-green-500" },
            { label: "Limitdan o'tgan", bar: "bg-purple-500" },
          ].map(({ label, bar }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={cn("inline-block w-3 h-3 rounded-full", bar)} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default TarificationProgress;

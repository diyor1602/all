import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Info,
  Hash,
  Tag,
  Clock,
  DollarSign,
  Folder,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TarifSearch = () => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [tarif, setTarif] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const fetchTarifs = async () => {
    if (!searchQuery.trim()) {
      setTarif({});
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get("/internalAccountant/tarifSearch", {
        params: { code: searchQuery },
      });
      setTarif(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error.response?.data?.message || "Tarif topilmadi",
        duration: 1000,
      });
      setTarif({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchTarifs();
    }
  };

  useEffect(() => {
    // Focus the input on component mount
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            placeholder="Tarif kodi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            className="pl-10 py-6 text-base bg-white border-gray-300 focus-visible:ring-2 focus-visible:ring-primary/50"
          />
        </div>
        <Button
          onClick={fetchTarifs}
          className="py-6 px-6 text-base"
          disabled={isLoading}
        >
          {isLoading ? "Izlanyapti..." : "Qidirish"}
        </Button>
      </div>

      {tarif.tarification ? (
        <Card className="shadow-lg border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-white p-6">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-6 w-6" />
              <span>Tarif ma'lumotlari</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(tarif.model.name);
                  toast({
                    title: "Muvaffaqiyatli",
                    description: "Model nomidan nusxa olindi",
                    duration: 1000,
                  });
                }}
              >
                <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{tarif.model.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Submodel</p>
                  <p className="font-mono font-medium">
                    {tarif.submodel?.name || "—"}
                  </p>
                </div>
              </div>
              <div
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(tarif.tarification?.code);
                  toast({
                    title: "Muvaffaqiyatli",
                    description: "Kodi nusxa olindi",
                    duration: 1000,
                  });
                }}
              >
                <Hash className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Kodi</p>
                  <p className="font-mono font-medium">
                    {tarif.tarification?.code || "—"}
                  </p>
                </div>
              </div>
              <div
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(tarif.tarification?.name);
                  toast({
                    title: "Muvaffaqiyatli",
                    description: "Nomi nusxa olindi",
                    duration: 1000,
                  });
                }}
              >
                <Tag className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Nomi</p>
                  <p className="font-medium">
                    {tarif.tarification?.name || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Sekund</p>
                  <p className="font-mono font-medium">
                    {tarif.tarification?.second
                      ? parseFloat(tarif.tarification.second).toFixed(2)
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Summa</p>
                  <p className="font-mono font-medium">
                    {tarif.tarification?.summa
                      ? parseFloat(tarif.tarification.summa).toFixed(2)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {tarif.tarification?.tarification_category?.name && (
              <div className="mt-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary-dark">
                <p className="font-medium">Kategoriya:</p>
                <p>{tarif.tarification.tarification_category.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : searchQuery ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Info className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Ushbu kod bo'yicha tarif topilmadi</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Tarif kodini kiriting</p>
        </div>
      )}
    </div>
  );
};

export default TarifSearch;
